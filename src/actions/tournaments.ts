'use server';

// ============================================================
// src/actions/tournaments.ts
// Server Actions para gestión de torneos, participantes y brackets
// ============================================================

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  fail,
  fromRpcError,
  fromZodError,
  ok,
  uuidSchema,
  type ActionResult,
} from '@/lib/action-result';
import { generateSingleElimination } from '@/lib/engine/formats/single-elimination';
import { generateDoubleElimination } from '@/lib/engine/formats/double-elimination';
import { toBracketRows } from '@/lib/engine/bracket-rows';
import { DEFAULT_FINISH_POINTS, type StageConfig } from '@/lib/engine/types';

const CreateTournamentSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'Slug inválido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  description: z.string().optional(),
  stadium: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  seedingMethod: z.enum(['manual', 'random', 'ranking', 'elo']).default('manual'),
});

export async function createTournament(formData: FormData): Promise<ActionResult<{ id: string; slug: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('UNAUTHENTICATED', 'Debes iniciar sesión para crear un torneo');

  const parsed = CreateTournamentSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    stadium: formData.get('stadium') || undefined,
    maxParticipants: formData.get('maxParticipants') ? Number(formData.get('maxParticipants')) : undefined,
    seedingMethod: formData.get('seedingMethod') || 'manual',
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      stadium: parsed.data.stadium,
      max_participants: parsed.data.maxParticipants,
      seeding_method: parsed.data.seedingMethod,
      created_by: user.id,
      status: 'draft',
      visibility: 'public',
    })
    .select('id, slug')
    .single();

  if (error) {
    // 42501 = política RLS: el usuario no es admin ni organizador
    if (error.code === '42501') return fail('FORBIDDEN', 'Solo un organizador o admin puede crear torneos');
    if (error.code === '23505') return fail('CONFLICT', 'Ya existe un torneo con ese slug', 'slug');
    return fail('INTERNAL', 'No se pudo crear el torneo');
  }

  revalidatePath('/tournaments');
  return ok({ id: data.id as string, slug: data.slug as string });
}

const AddParticipantsSchema = z.object({
  tournamentId: uuidSchema,
  names: z.array(z.string().trim().min(1).max(60)).min(1, 'Escribe al menos un nombre').max(128),
});

// Carga en bloque. Las semillas se asignan en el servidor (dentro de una transacción)
// y se respeta el cupo máximo del torneo.
export async function addParticipantsAction(input: unknown): Promise<ActionResult<{ added: number }>> {
  const parsed = AddParticipantsSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('UNAUTHENTICATED', 'Inicia sesión para agregar participantes');

  const { data, error } = await supabase.rpc('add_participants', {
    p_tournament: parsed.data.tournamentId,
    p_names: parsed.data.names,
  });
  if (error) return fromRpcError(error);

  revalidatePath('/tournaments/[slug]', 'page');
  return ok({ added: Number(data) });
}

const GenerateBracketSchema = z.object({
  stageId: uuidSchema,
  // Solo un admin puede resetear un bracket que ya tiene resultados.
  force: z.boolean().default(false),
});

type StageRow = {
  id: string;
  tournament_id: string;
  format: string;
  match_type: StageConfig['matchType'];
  points_to_win: number;
  best_of: number;
  tiebreakers: StageConfig['tiebreakers'];
  grand_finals_modifier: StageConfig['grandFinalsModifier'] | null;
};

const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;

// Genera el bracket con el motor y lo guarda de forma atómica (función SQL replace_bracket).
export async function generateBracketAction(input: unknown): Promise<ActionResult<{ matches: number }>> {
  const parsed = GenerateBracketSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const { stageId, force } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('UNAUTHENTICATED', 'Inicia sesión para generar el bracket');

  const { data: stage } = await supabase
    .from('stages')
    .select('id, tournament_id, format, match_type, points_to_win, best_of, tiebreakers, grand_finals_modifier')
    .eq('id', stageId)
    .single<StageRow>();
  if (!stage) return fail('NOT_FOUND', 'La etapa no existe');

  if (stage.format !== 'single_elimination' && stage.format !== 'double_elimination') {
    return fail('UNPROCESSABLE', 'Por ahora solo se pueden generar etapas de eliminación simple o doble');
  }

  const { data: rows } = await supabase
    .from('participants')
    .select('id, display_name, seed, status')
    .eq('tournament_id', stage.tournament_id)
    .not('status', 'in', '(disqualified,withdrawn)')
    .order('seed', { ascending: true });

  const players = (rows ?? []).map((p) => ({
    id: p.id as string,
    displayName: p.display_name as string,
    seed: p.seed as number,
  }));
  if (players.length < 2) return fail('UNPROCESSABLE', 'Se necesitan al menos 2 participantes para generar el cuadro');

  // La doble eliminación con byes deja la llave de perdedores sin resolver; se habilita cuando esté cubierta.
  if (stage.format === 'double_elimination' && !isPowerOfTwo(players.length)) {
    return fail('UNPROCESSABLE', 'La doble eliminación requiere 4, 8, 16 o 32 participantes por ahora');
  }

  const config: StageConfig = {
    id: stage.id,
    format: stage.format,
    pointsToWin: stage.points_to_win,
    bestOf: stage.best_of,
    matchType: stage.match_type,
    tiebreakers: stage.tiebreakers,
    finishPoints: DEFAULT_FINISH_POINTS,
    grandFinalsModifier: stage.grand_finals_modifier ?? 'none',
  };

  const matches =
    stage.format === 'double_elimination'
      ? generateDoubleElimination(players, stage.id, config)
      : generateSingleElimination(players, stage.id, config);

  const { data, error } = await supabase.rpc('replace_bracket', {
    p_stage: stage.id,
    p_rows: toBracketRows(matches),
    p_force: force,
  });
  if (error) return fromRpcError(error);

  revalidatePath('/tournaments/[slug]', 'page');
  return ok({ matches: Number(data) });
}

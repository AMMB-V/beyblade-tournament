'use server';

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

export type MatchSnapshot = {
  id: string;
  status: string;
  winnerId: string | null;
  p1Points: number;
  p2Points: number;
  p1Sets: number;
  p2Sets: number;
  version: number;
};

type MatchRow = {
  id: string;
  status: string;
  winner_id: string | null;
  p1_match_points: number;
  p2_match_points: number;
  p1_sets: number;
  p2_sets: number;
  version: number;
};

function toSnapshot(row: MatchRow): MatchSnapshot {
  return {
    id: row.id,
    status: row.status,
    winnerId: row.winner_id,
    p1Points: row.p1_match_points,
    p2Points: row.p2_match_points,
    p1Sets: row.p1_sets,
    p2Sets: row.p2_sets,
    version: row.version,
  };
}

function refresh(matchId: string) {
  revalidatePath(`/referee/${matchId}`);
  revalidatePath('/tournaments/[slug]', 'page');
}

const BattleSchema = z.object({
  matchId: uuidSchema,
  scorerId: uuidSchema,
  finish: z.enum(['spin', 'over', 'burst', 'xtreme']),
  expectedVersion: z.number().int().min(1),
});

// Registra una batalla en una sola transacción (función SQL record_battle):
// suma puntos, cierra set o match y avanza al ganador al cruce siguiente.
export async function recordBattleAction(input: unknown): Promise<ActionResult<MatchSnapshot>> {
  const parsed = BattleSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const { matchId, scorerId, finish, expectedVersion } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('UNAUTHENTICATED', 'Inicia sesión para registrar batallas');

  const { data, error } = await supabase.rpc('record_battle', {
    p_match: matchId,
    p_scorer: scorerId,
    p_finish: finish,
    p_expected_version: expectedVersion,
  });
  if (error) return fromRpcError(error);

  refresh(matchId);
  return ok(toSnapshot(data as MatchRow));
}

const PenaltySchema = z.object({
  matchId: uuidSchema,
  offenderId: uuidSchema,
  card: z.enum(['yellow', 'red']),
  isFoul: z.boolean(),
  reason: z.string().trim().max(200).optional(),
  expectedVersion: z.number().int().min(1),
});

// Registra una tarjeta o falta. Cada N faltas del mismo participante en el match
// (N = fouls_per_point del torneo, 3 por defecto) suman foul_points al rival.
export async function recordPenaltyAction(input: unknown): Promise<ActionResult<MatchSnapshot>> {
  const parsed = PenaltySchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const { matchId, offenderId, card, isFoul, reason, expectedVersion } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('UNAUTHENTICATED', 'Inicia sesión para registrar faltas');

  const { data, error } = await supabase.rpc('record_penalty', {
    p_match: matchId,
    p_offender: offenderId,
    p_card: card,
    p_is_foul: isFoul,
    p_reason: reason ?? null,
    p_expected_version: expectedVersion,
  });
  if (error) return fromRpcError(error);

  refresh(matchId);
  return ok(toSnapshot(data as MatchRow));
}

'use server';

// ============================================================
// src/actions/tournaments.ts
// Server Actions para gestión de torneos y participantes
// ============================================================

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreateTournamentSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'Slug inválido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  description: z.string().optional(),
  stadium: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  seedingMethod: z.enum(['manual', 'random', 'ranking', 'elo']).default('manual'),
});

export async function createTournament(formData: FormData) {
  const supabase = await createClient();

  // Validar auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Debes iniciar sesión para crear un torneo');
  }

  const rawData = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    stadium: formData.get('stadium') || undefined,
    maxParticipants: formData.get('maxParticipants') ? Number(formData.get('maxParticipants')) : undefined,
    seedingMethod: formData.get('seedingMethod') || 'manual',
  };

  const parsed = CreateTournamentSchema.parse(rawData);

  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description,
      stadium: parsed.stadium,
      max_participants: parsed.maxParticipants,
      seeding_method: parsed.seedingMethod,
      created_by: user.id,
      status: 'draft',
      visibility: 'public',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear torneo: ${error.message}`);
  }

  revalidatePath('/tournaments');
  return { success: true, tournament: data };
}

export async function addParticipant(tournamentId: string, displayName: string, seed?: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('participants')
    .insert({
      tournament_id: tournamentId,
      display_name: displayName,
      seed: seed || null,
      status: 'registered',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error al registrar participante: ${error.message}`);
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true, participant: data };
}

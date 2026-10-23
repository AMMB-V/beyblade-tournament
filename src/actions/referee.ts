'use server';

// ============================================================
// src/actions/referee.ts
// Server Actions para arbitraje: captura de batallas y faltas
// ============================================================

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { applyBattle, applyDefault } from '@/lib/engine/scoring';
import type { BattleResult, FinishType, MatchState } from '@/lib/engine/types';

export async function recordBattleAction({
  matchId,
  scorerId,
  finish,
  pointsToWin = 4,
}: {
  matchId: string;
  scorerId: string;
  finish: FinishType;
  pointsToWin?: number;
}) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Debes estar autenticado para arbitrar');
  }

  // 1. Obtener match actual
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*, battles(*)')
    .eq('id', matchId)
    .single();

  if (matchError || !match) {
    throw new Error('Match no encontrado');
  }

  // 2. Mapear a MatchState del motor
  const engineMatch: MatchState = {
    id: match.id,
    player1Id: match.participant1_id,
    player2Id: match.participant2_id,
    p1Points: match.p1_match_points,
    p2Points: match.p2_match_points,
    battles: (match.battles || []).map((b: any) => ({
      battleNumber: b.battle_number,
      scorerId: b.scorer_id,
      finish: b.finish as FinishType,
      points: b.points_scored,
    })),
    winnerId: match.winner_id,
    status: match.status as any,
    nextMatchId: match.next_match_id,
    nextMatchSlot: match.next_match_slot as any,
    loserNextMatchId: match.loser_next_match_id,
    loserNextSlot: match.loser_next_slot as any,
    bracketSide: match.bracket_side as any,
    round: match.round,
    matchNumber: match.match_number,
  };

  const nextBattleNumber = engineMatch.battles.length + 1;
  const newBattle: BattleResult = {
    battleNumber: nextBattleNumber,
    scorerId,
    finish,
    points: finish === 'xtreme' ? 3 : finish === 'spin' ? 1 : 2,
  };

  // 3. Ejecutar regla de negocio pura
  const updatedMatch = applyBattle(engineMatch, newBattle, undefined, pointsToWin);

  // 4. Persistir batalla
  const { error: battleInsertError } = await supabase.from('battles').insert({
    match_id: matchId,
    battle_number: nextBattleNumber,
    scorer_id: scorerId,
    finish: finish,
    points_scored: newBattle.points,
    recorded_by: user.id,
  });

  if (battleInsertError) {
    throw new Error(`Error al registrar batalla: ${battleInsertError.message}`);
  }

  // 5. Actualizar match
  const { error: matchUpdateError } = await supabase
    .from('matches')
    .update({
      p1_match_points: updatedMatch.p1Points,
      p2_match_points: updatedMatch.p2Points,
      winner_id: updatedMatch.winnerId,
      status: updatedMatch.status,
      completed_at: updatedMatch.status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', matchId);

  if (matchUpdateError) {
    throw new Error(`Error al actualizar match: ${matchUpdateError.message}`);
  }

  revalidatePath(`/matches/${matchId}`);
  return { success: true, match: updatedMatch };
}

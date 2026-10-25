import type { MatchState } from './types';

// Convierte los matches del motor en las filas que espera la función SQL replace_bracket.
export function toBracketRows(matches: MatchState[]) {
  return matches.map((m) => ({
    id: m.id,
    round: m.round,
    match_number: m.matchNumber,
    bracket_side: m.bracketSide,
    participant1_id: m.player1Id,
    participant2_id: m.player2Id,
    winner_id: m.winnerId,
    next_match_id: m.nextMatchId,
    next_match_slot: m.nextMatchSlot,
    loser_next_match_id: m.loserNextMatchId,
    loser_next_slot: m.loserNextSlot,
    status: m.status,
  }));
}

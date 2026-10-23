// ============================================================
// src/lib/engine/__tests__/double-elimination.test.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import { generateDoubleElimination, advanceDoubleElimination } from '../formats/double-elimination';
import type { Player, StageConfig } from '../types';
import { DEFAULT_FINISH_POINTS } from '../types';

const mockConfig: StageConfig = {
  id: 'stage-de',
  format: 'double_elimination',
  pointsToWin: 4,
  bestOf: 1,
  matchType: '1on1',
  tiebreakers: ['wins', 'point_diff'],
  finishPoints: DEFAULT_FINISH_POINTS,
  grandFinalsModifier: 'reset',
};

const makePlayers = (count: number): Player[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    displayName: `Player ${i + 1}`,
    seed: i + 1,
  }));

describe('generateDoubleElimination', () => {
  it('genera estructura completa para 4 jugadores', () => {
    const players = makePlayers(4);
    const matches = generateDoubleElimination(players, 'stage-de', mockConfig);

    const winnersMatches = matches.filter((m) => m.bracketSide === 'winners');
    const losersMatches = matches.filter((m) => m.bracketSide === 'losers');
    const gfMatches = matches.filter((m) => m.bracketSide === 'grand_finals');

    // 4 jugadores: WB R1 (2) + WB Finals (1) = 3
    expect(winnersMatches).toHaveLength(3);
    // LB R1 (1) + LB Finals (1) = 2
    expect(losersMatches).toHaveLength(2);
    // GF + Reset = 2
    expect(gfMatches).toHaveLength(2);
  });

  it('avanza ganador a Winners y perdedor a Losers', () => {
    const players = makePlayers(4);
    let matches = generateDoubleElimination(players, 'stage-de', mockConfig);

    const wbR1M1 = matches[0];
    wbR1M1.winnerId = 'p1';
    wbR1M1.status = 'completed';

    matches = advanceDoubleElimination(matches, wbR1M1.id);

    // Ganador 'p1' debe estar en WB Finals
    const nextWb = matches.find((m) => m.id === wbR1M1.nextMatchId);
    expect(nextWb?.player1Id).toBe('p1');

    // Perdedor 'p4' debe estar en LB R1
    const nextLb = matches.find((m) => m.id === wbR1M1.loserNextMatchId);
    expect(nextLb?.player1Id).toBe('p4');
  });
});

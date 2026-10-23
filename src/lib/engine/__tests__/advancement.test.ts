// ============================================================
// src/lib/engine/__tests__/advancement.test.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import { selectAdvancingPlayers, advanceToNextStage } from '../advancement';
import type { Player, PlayerStanding, StageConfig } from '../types';
import { DEFAULT_FINISH_POINTS } from '../types';

describe('selectAdvancingPlayers', () => {
  it('selecciona los primeros top N jugadores ordenados por posición', () => {
    const players: Player[] = [
      { id: 'p1', displayName: 'Blader One' },
      { id: 'p2', displayName: 'Blader Two' },
      { id: 'p3', displayName: 'Blader Three' },
    ];
    const playersMap = new Map(players.map((p) => [p.id, p]));

    const standings: PlayerStanding[] = [
      { playerId: 'p2', wins: 2, losses: 1, draws: 0, pointsFor: 6, pointsAgainst: 2, pointDiff: 4, buchholzScore: 0, position: 1, advanced: false },
      { playerId: 'p1', wins: 2, losses: 1, draws: 0, pointsFor: 5, pointsAgainst: 3, pointDiff: 2, buchholzScore: 0, position: 2, advanced: false },
      { playerId: 'p3', wins: 0, losses: 3, draws: 0, pointsFor: 1, pointsAgainst: 8, pointDiff: -7, buchholzScore: 0, position: 3, advanced: false },
    ];

    const top2 = selectAdvancingPlayers(standings, 2, playersMap);
    expect(top2).toHaveLength(2);
    expect(top2[0].id).toBe('p2');
    expect(top2[0].seed).toBe(1);
    expect(top2[1].id).toBe('p1');
    expect(top2[1].seed).toBe(2);
  });
});

describe('advanceToNextStage', () => {
  it('genera bracket de eliminación simple a partir de clasificados', () => {
    const players: Player[] = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i + 1}`,
      displayName: `Player ${i + 1}`,
    }));

    const standings: PlayerStanding[] = players.map((p, idx) => ({
      playerId: p.id,
      wins: 8 - idx,
      losses: idx,
      draws: 0,
      pointsFor: 20 - idx,
      pointsAgainst: 10 + idx,
      pointDiff: 10 - 2 * idx,
      buchholzScore: 0,
      position: idx + 1,
      advanced: false,
    }));

    const nextConfig: StageConfig = {
      id: 'stage-playoffs',
      format: 'single_elimination',
      pointsToWin: 7,
      bestOf: 1,
      matchType: '3on3',
      tiebreakers: ['wins'],
      finishPoints: DEFAULT_FINISH_POINTS,
    };

    const result = advanceToNextStage({
      currentStandings: standings,
      nextStageConfig: nextConfig,
      advanceCount: 4,
      players,
    });

    expect(result.qualifiedPlayers).toHaveLength(4);
    // Para 4 jugadores en eliminación simple son 2 semis + 1 final = 3 matches
    expect(result.nextMatches).toHaveLength(3);
    // Verificar cruce de siembra: Seed 1 (p1) vs Seed 4 (p4)
    expect(result.nextMatches[0].player1Id).toBe('p1');
    expect(result.nextMatches[0].player2Id).toBe('p4');
  });
});

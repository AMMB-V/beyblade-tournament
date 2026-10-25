import { describe, it, expect } from 'vitest';
import { generateSingleElimination } from '../formats/single-elimination';
import { toBracketRows } from '../bracket-rows';
import { DEFAULT_FINISH_POINTS, type Player, type StageConfig } from '../types';

const config: StageConfig = {
  id: 'stage',
  format: 'single_elimination',
  pointsToWin: 4,
  bestOf: 3,
  matchType: '1on1',
  tiebreakers: ['wins', 'point_diff'],
  finishPoints: DEFAULT_FINISH_POINTS,
  grandFinalsModifier: 'none',
};

const players = (n: number): Player[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, displayName: `P${i + 1}`, seed: i + 1 }));

let counter = 0;
const idGen = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`;

describe('toBracketRows', () => {
  it('todas las referencias next_match_id apuntan a filas existentes', () => {
    const rows = toBracketRows(generateSingleElimination(players(8), 'stage', config, idGen));
    const ids = new Set(rows.map((r) => r.id));
    expect(rows).toHaveLength(7);
    rows.forEach((r) => {
      if (r.next_match_id) expect(ids.has(r.next_match_id)).toBe(true);
    });
    expect(rows.filter((r) => r.next_match_id === null)).toHaveLength(1);
  });

  it('incluye winner_id para los byes', () => {
    const rows = toBracketRows(generateSingleElimination(players(5), 'stage', config, idGen));
    const byes = rows.filter((r) => r.status === 'bye');
    expect(byes).toHaveLength(3);
    byes.forEach((b) => expect(b.winner_id).toBe(b.participant1_id));
  });
});

describe('byes avanzan solos', () => {
  it('con 5 jugadores, los ganadores por bye ya están en la ronda 2', () => {
    const matches = generateSingleElimination(players(5), 'stage', config, idGen);
    const round2 = matches.filter((m) => m.round === 2);
    const seated = round2.flatMap((m) => [m.player1Id, m.player2Id]).filter(Boolean);
    // 3 byes (seeds 1, 2 y 3) llegan a la ronda 2 sin jugar
    expect(seated.sort()).toEqual(['p1', 'p2', 'p3']);
  });

  it('con 8 jugadores no hay byes y la ronda 2 empieza vacía', () => {
    const matches = generateSingleElimination(players(8), 'stage', config, idGen);
    expect(matches.filter((m) => m.status === 'bye')).toHaveLength(0);
    matches.filter((m) => m.round === 2).forEach((m) => {
      expect(m.player1Id).toBeNull();
      expect(m.player2Id).toBeNull();
    });
  });
});

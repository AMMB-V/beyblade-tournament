// ============================================================
// src/lib/engine/__tests__/scoring.test.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import { applyBattle, applyDefault, determineWinner } from '../scoring';
import type { MatchState, BattleResult } from '../types';
import { DEFAULT_FINISH_POINTS } from '../types';

const baseMatch: MatchState = {
  id: 'match-1',
  player1Id: 'p1',
  player2Id: 'p2',
  p1Points: 0,
  p2Points: 0,
  battles: [],
  winnerId: null,
  status: 'pending',
  nextMatchId: null,
  nextMatchSlot: null,
  loserNextMatchId: null,
  loserNextSlot: null,
  bracketSide: 'winners',
  round: 1,
  matchNumber: 1,
};

describe('determineWinner', () => {
  it('devuelve null si nadie llegó a la meta', () => {
    expect(determineWinner('p1', 'p2', 2, 1, 4)).toBeNull();
  });
  it('devuelve p1 cuando alcanza pointsToWin', () => {
    expect(determineWinner('p1', 'p2', 4, 0, 4)).toBe('p1');
  });
  it('devuelve p2 cuando alcanza pointsToWin', () => {
    expect(determineWinner('p1', 'p2', 1, 7, 7)).toBe('p2');
  });
});

describe('applyBattle', () => {
  it('acumula puntos correctamente tras un Xtreme (3 pts)', () => {
    const battle: BattleResult = { battleNumber: 1, scorerId: 'p1', finish: 'xtreme', points: 3 };
    const updated = applyBattle(baseMatch, battle, DEFAULT_FINISH_POINTS, 4);
    expect(updated.p1Points).toBe(3);
    expect(updated.p2Points).toBe(0);
    expect(updated.status).toBe('in_progress');
    expect(updated.winnerId).toBeNull();
  });

  it('determina ganador al alcanzar 4 puntos', () => {
    const b1: BattleResult = { battleNumber: 1, scorerId: 'p1', finish: 'burst', points: 2 };
    const b2: BattleResult = { battleNumber: 2, scorerId: 'p1', finish: 'burst', points: 2 };
    let m = applyBattle(baseMatch, b1, DEFAULT_FINISH_POINTS, 4);
    m = applyBattle(m, b2, DEFAULT_FINISH_POINTS, 4);
    expect(m.p1Points).toBe(4);
    expect(m.winnerId).toBe('p1');
    expect(m.status).toBe('completed');
  });

  it('lanza error si se intenta añadir batalla a match completado', () => {
    const battle: BattleResult = { battleNumber: 1, scorerId: 'p1', finish: 'xtreme', points: 3 };
    let m = applyBattle(baseMatch, battle, DEFAULT_FINISH_POINTS, 3);
    expect(() => applyBattle(m, { ...battle, battleNumber: 2 }, DEFAULT_FINISH_POINTS, 3)).toThrow();
  });

  it('lanza error en match con BYE', () => {
    const byeMatch: MatchState = { ...baseMatch, player2Id: null };
    const battle: BattleResult = { battleNumber: 1, scorerId: 'p1', finish: 'spin', points: 1 };
    expect(() => applyBattle(byeMatch, battle, DEFAULT_FINISH_POINTS, 4)).toThrow();
  });
});

describe('applyDefault', () => {
  it('da 1 punto al rival cuando p1 falta', () => {
    const m = applyDefault(baseMatch, 'p1', 1, 4);
    expect(m.p2Points).toBe(1);
    expect(m.p1Points).toBe(0);
  });

  it('da 1 punto al rival cuando p2 falta', () => {
    const m = applyDefault(baseMatch, 'p2', 1, 4);
    expect(m.p1Points).toBe(1);
    expect(m.p2Points).toBe(0);
  });
});

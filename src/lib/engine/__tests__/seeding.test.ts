// ============================================================
// src/lib/engine/__tests__/seeding.test.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  nextPowerOfTwo,
  calculateByes,
  sortBySeed,
  generateSEPairs,
  snakeSeedGroups,
} from '../seeding';
import type { Player } from '../types';

const makePlayer = (id: string, seed?: number): Player => ({
  id,
  displayName: `Player ${id}`,
  seed,
});

describe('nextPowerOfTwo', () => {
  it('retorna 1 para n=1', () => expect(nextPowerOfTwo(1)).toBe(1));
  it('retorna 8 para n=5', () => expect(nextPowerOfTwo(5)).toBe(8));
  it('retorna 16 para n=16', () => expect(nextPowerOfTwo(16)).toBe(16));
  it('retorna 32 para n=17', () => expect(nextPowerOfTwo(17)).toBe(32));
});

describe('calculateByes', () => {
  it('0 byes para 8 jugadores', () => expect(calculateByes(8)).toBe(0));
  it('3 byes para 5 jugadores', () => expect(calculateByes(5)).toBe(3));
  it('1 bye para 7 jugadores', () => expect(calculateByes(7)).toBe(1));
});

describe('sortBySeed', () => {
  it('ordena por seed ascendente', () => {
    const players = [makePlayer('c', 3), makePlayer('a', 1), makePlayer('b', 2)];
    const sorted = sortBySeed(players);
    expect(sorted.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('jugadores sin seed van al final', () => {
    const players = [makePlayer('b'), makePlayer('a', 1)];
    const sorted = sortBySeed(players);
    expect(sorted.map((p) => p.id)).toEqual(['a', 'b']);
  });
});

describe('generateSEPairs', () => {
  it('genera 4 pares para 8 jugadores (sin byes)', () => {
    const players = Array.from({ length: 8 }, (_, i) =>
      makePlayer(String(i + 1), i + 1),
    );
    const pairs = generateSEPairs(players);
    expect(pairs).toHaveLength(4);
    // Par clásico: #1 vs #8, #2 vs #7, ...
    expect(pairs[0][0].seed).toBe(1);
    expect(pairs[0][1]?.seed).toBe(8);
    expect(pairs[1][0].seed).toBe(2);
    expect(pairs[1][1]?.seed).toBe(7);
  });

  it('genera byes para 6 jugadores', () => {
    const players = Array.from({ length: 6 }, (_, i) =>
      makePlayer(String(i + 1), i + 1),
    );
    const pairs = generateSEPairs(players);
    expect(pairs).toHaveLength(4); // bracket de 8
    const byeCount = pairs.filter(([, p2]) => p2 === null).length;
    expect(byeCount).toBe(2);
  });
});

describe('snakeSeedGroups', () => {
  it('divide 8 jugadores en 2 grupos balanceados', () => {
    const players = Array.from({ length: 8 }, (_, i) =>
      makePlayer(String(i + 1), i + 1),
    );
    const groups = snakeSeedGroups(players, 2);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveLength(4);
    expect(groups[1]).toHaveLength(4);
    // Snake: G1=[1,4,5,8], G2=[2,3,6,7]
    expect(groups[0].map((p) => p.seed)).toEqual([1, 4, 5, 8]);
    expect(groups[1].map((p) => p.seed)).toEqual([2, 3, 6, 7]);
  });

  it('divide 9 jugadores en 3 grupos (3,3,3)', () => {
    const players = Array.from({ length: 9 }, (_, i) =>
      makePlayer(String(i + 1), i + 1),
    );
    const groups = snakeSeedGroups(players, 3);
    expect(groups.every((g) => g.length === 3)).toBe(true);
  });
});

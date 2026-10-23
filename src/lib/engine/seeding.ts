// ============================================================
// src/lib/engine/seeding.ts
// Siembra y generación de byes
// ============================================================

import type { Player } from './types';

/**
 * Devuelve la siguiente potencia de 2 >= n.
 * Necesaria para calcular el tamaño del bracket.
 */
export function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Calcula cuántos byes se necesitan para llenar un bracket de N.
 */
export function calculateByes(playerCount: number): number {
  return nextPowerOfTwo(playerCount) - playerCount;
}

/**
 * Ordena jugadores por seed (ascendente). Jugadores sin seed van al final.
 */
export function sortBySeed(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (a.seed == null && b.seed == null) return 0;
    if (a.seed == null) return 1;
    if (b.seed == null) return -1;
    return a.seed - b.seed;
  });
}

/**
 * Genera pares de siembra para Single Elimination.
 * El jugador #1 enfrenta al #N, #2 al #N-1, etc.
 * Retorna pares [top, bottom] donde null = bye.
 */
export function generateSEPairs(players: Player[]): Array<[Player, Player | null]> {
  const sorted = sortBySeed(players);
  const size = nextPowerOfTwo(sorted.length);
  const padded: Array<Player | null> = [
    ...sorted,
    ...Array(size - sorted.length).fill(null),
  ];

  const pairs: Array<[Player, Player | null]> = [];
  for (let i = 0; i < size / 2; i++) {
    pairs.push([padded[i]!, padded[size - 1 - i]]);
  }
  return pairs;
}

/**
 * Divide jugadores en N grupos balanceados (snake seeding).
 * Ej: 8 jugadores en 2 grupos:
 *   Ronda 1 (→): 1→G1, 2→G2
 *   Ronda 2 (←): 3→G2, 4→G1
 */
export function snakeSeedGroups(players: Player[], groupCount: number): Player[][] {
  const sorted = sortBySeed(players);
  const groups: Player[][] = Array.from({ length: groupCount }, () => []);

  sorted.forEach((player, index) => {
    const round = Math.floor(index / groupCount);
    const posInRound = index % groupCount;
    const groupIndex = round % 2 === 0 ? posInRound : groupCount - 1 - posInRound;
    groups[groupIndex].push(player);
  });

  return groups;
}

/**
 * Genera siembra aleatoria (shuffles in place usando Fisher-Yates).
 */
export function randomSeed(players: Player[]): Player[] {
  const arr = [...players];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.map((p, i) => ({ ...p, seed: i + 1 }));
}

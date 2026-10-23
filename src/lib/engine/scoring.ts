// ============================================================
// src/lib/engine/scoring.ts
// Lógica de puntuación por batalla y determinación de ganador
// ============================================================

import type { BattleResult, FinishPointRules, MatchState } from './types';
import { DEFAULT_FINISH_POINTS } from './types';

/**
 * Calcula los puntos de una batalla dado el finish y las reglas.
 */
export function calcBattlePoints(
  finish: BattleResult['finish'],
  rules: FinishPointRules = DEFAULT_FINISH_POINTS,
): number {
  return rules[finish];
}

/**
 * Agrega los puntos de todas las batallas de un match.
 * Retorna { p1Points, p2Points }.
 */
export function aggregateMatchPoints(
  battles: BattleResult[],
  player1Id: string,
  player2Id: string,
  rules: FinishPointRules = DEFAULT_FINISH_POINTS,
): { p1Points: number; p2Points: number } {
  let p1Points = 0;
  let p2Points = 0;

  for (const battle of battles) {
    const pts = calcBattlePoints(battle.finish, rules);
    if (battle.scorerId === player1Id) {
      p1Points += pts;
    } else if (battle.scorerId === player2Id) {
      p2Points += pts;
    }
  }

  return { p1Points, p2Points };
}

/**
 * Determina si un match tiene ganador dado los puntos actuales y la meta.
 * Retorna el id del ganador o null si el match sigue.
 */
export function determineWinner(
  p1Id: string,
  p2Id: string,
  p1Points: number,
  p2Points: number,
  pointsToWin: number,
): string | null {
  if (p1Points >= pointsToWin) return p1Id;
  if (p2Points >= pointsToWin) return p2Id;
  return null;
}

/**
 * Aplica una nueva batalla a un MatchState y retorna el estado actualizado.
 * Inmutable: no muta el estado original.
 */
export function applyBattle(
  match: MatchState,
  battle: BattleResult,
  rules: FinishPointRules = DEFAULT_FINISH_POINTS,
  pointsToWin: number,
): MatchState {
  if (!match.player1Id || !match.player2Id) {
    throw new Error('No se puede registrar una batalla en un match con BYE');
  }
  if (match.status === 'completed') {
    throw new Error('No se puede añadir batallas a un match ya completado');
  }

  const newBattles = [...match.battles, battle];
  const { p1Points, p2Points } = aggregateMatchPoints(
    newBattles,
    match.player1Id,
    match.player2Id,
    rules,
  );

  const winnerId = determineWinner(
    match.player1Id,
    match.player2Id,
    p1Points,
    p2Points,
    pointsToWin,
  );

  return {
    ...match,
    battles: newBattles,
    p1Points,
    p2Points,
    winnerId,
    status: winnerId ? 'completed' : 'in_progress',
  };
}

/**
 * Registra una falta: el rival recibe 1 punto por defecto.
 * El jugador que falta es el `defaultingPlayerId`.
 */
export function applyDefault(
  match: MatchState,
  defaultingPlayerId: string,
  battleNumber: number,
  pointsToWin: number,
): MatchState {
  if (!match.player1Id || !match.player2Id) {
    throw new Error('Match con BYE no puede tener falta');
  }

  const rivalId =
    defaultingPlayerId === match.player1Id ? match.player2Id : match.player1Id;

  const defaultBattle: BattleResult = {
    battleNumber,
    scorerId: rivalId,
    finish: 'spin', // Por convención, "falta" se registra como spin del rival
    points: 1,
  };

  return applyBattle(match, defaultBattle, DEFAULT_FINISH_POINTS, pointsToWin);
}

// ============================================================
// src/lib/engine/formats/double-elimination.ts
// Generador de bracket de doble eliminación
// ============================================================

import { generateSEPairs, nextPowerOfTwo } from '../seeding';
import type { MatchState, Player, StageConfig } from '../types';

/**
 * Genera el cuadro completo de Doble Eliminación:
 * - Winners Bracket
 * - Losers Bracket
 * - Grand Finals (+ posible Reset)
 */
export function generateDoubleElimination(
  players: Player[],
  stageId: string,
  config: StageConfig,
  idGen: () => string = crypto.randomUUID.bind(crypto)
): MatchState[] {
  const size = nextPowerOfTwo(players.length);
  const wbRounds = Math.log2(size);
  const lbRounds = (wbRounds - 1) * 2;
  const matches: MatchState[] = [];

  // 1. Pre-generar IDs de Winners Bracket
  const wbMatchIds: string[][] = Array.from({ length: wbRounds }, () => []);
  for (let r = 0; r < wbRounds; r++) {
    const count = size / Math.pow(2, r + 1);
    for (let m = 0; m < count; m++) {
      wbMatchIds[r].push(idGen());
    }
  }

  // 2. Pre-generar IDs de Losers Bracket
  const lbMatchIds: string[][] = Array.from({ length: lbRounds }, () => []);
  for (let r = 0; r < lbRounds; r++) {
    const count = size / Math.pow(2, Math.floor(r / 2) + 2);
    for (let m = 0; m < count; m++) {
      lbMatchIds[r].push(idGen());
    }
  }

  const grandFinalsId = idGen();
  const resetId = config.grandFinalsModifier === 'reset' ? idGen() : null;

  // 3. Crear Ronda 1 de Winners
  const pairs = generateSEPairs(players);
  pairs.forEach((pair, idx) => {
    const [p1, p2] = pair;
    const isBye = p2 === null;
    const matchId = wbMatchIds[0][idx];
    const nextMatchId = wbRounds > 1 ? wbMatchIds[1][Math.floor(idx / 2)] : grandFinalsId;
    const nextSlot: 1 | 2 = idx % 2 === 0 ? 1 : 2;

    // Perdedores de WB R1 van a LB R1
    const loserNextMatchId = lbRounds > 0 ? lbMatchIds[0][Math.floor(idx / 2)] : null;
    const loserNextSlot: 1 | 2 = idx % 2 === 0 ? 1 : 2;

    matches.push({
      id: matchId,
      player1Id: p1.id,
      player2Id: isBye ? null : p2.id,
      p1Points: 0,
      p2Points: 0,
      battles: [],
      winnerId: isBye ? p1.id : null,
      status: isBye ? 'bye' : 'pending',
      nextMatchId,
      nextMatchSlot: nextSlot,
      loserNextMatchId,
      loserNextSlot,
      bracketSide: 'winners',
      round: 1,
      matchNumber: idx + 1,
    });
  });

  // 4. Crear Rondas 2..N de Winners
  for (let r = 1; r < wbRounds; r++) {
    const count = wbMatchIds[r].length;
    for (let m = 0; m < count; m++) {
      const matchId = wbMatchIds[r][m];
      const isWbFinals = r === wbRounds - 1;
      const nextMatchId = isWbFinals ? grandFinalsId : wbMatchIds[r + 1][Math.floor(m / 2)];
      const nextSlot: 1 | 2 = isWbFinals ? 1 : (m % 2 === 0 ? 1 : 2);

      // Perdedor de WB cae a Losers Bracket
      const lbTargetRound = (r - 1) * 2 + 1;
      const loserNextMatchId = lbTargetRound < lbRounds ? lbMatchIds[lbTargetRound][m] : lbMatchIds[lbRounds - 1][0];

      matches.push({
        id: matchId,
        player1Id: null,
        player2Id: null,
        p1Points: 0,
        p2Points: 0,
        battles: [],
        winnerId: null,
        status: 'pending',
        nextMatchId,
        nextMatchSlot: nextSlot,
        loserNextMatchId: loserNextMatchId || null,
        loserNextSlot: 2,
        bracketSide: 'winners',
        round: r + 1,
        matchNumber: m + 1,
      });
    }
  }

  // 5. Crear Losers Bracket
  for (let r = 0; r < lbRounds; r++) {
    const count = lbMatchIds[r].length;
    const isLbFinals = r === lbRounds - 1;

    for (let m = 0; m < count; m++) {
      const matchId = lbMatchIds[r][m];
      let nextMatchId: string;
      let nextSlot: 1 | 2;

      if (isLbFinals) {
        nextMatchId = grandFinalsId;
        nextSlot = 2; // Ganador de LB entra como retador en GF
      } else if (r % 2 === 0) {
        // Ronda impar de LB (mismo número de matches)
        nextMatchId = lbMatchIds[r + 1][m];
        nextSlot = 1;
      } else {
        // Ronda de reducción (mitad de matches)
        nextMatchId = lbMatchIds[r + 1][Math.floor(m / 2)];
        nextSlot = m % 2 === 0 ? 1 : 2;
      }

      matches.push({
        id: matchId,
        player1Id: null,
        player2Id: null,
        p1Points: 0,
        p2Points: 0,
        battles: [],
        winnerId: null,
        status: 'pending',
        nextMatchId,
        nextMatchSlot: nextSlot,
        loserNextMatchId: null,
        loserNextSlot: null,
        bracketSide: 'losers',
        round: r + 1,
        matchNumber: m + 1,
      });
    }
  }

  // 6. Grand Finals
  matches.push({
    id: grandFinalsId,
    player1Id: null,
    player2Id: null,
    p1Points: 0,
    p2Points: 0,
    battles: [],
    winnerId: null,
    status: 'pending',
    nextMatchId: resetId,
    nextMatchSlot: 1,
    loserNextMatchId: null,
    loserNextSlot: null,
    bracketSide: 'grand_finals',
    round: wbRounds + 1,
    matchNumber: 1,
  });

  // 7. Bracket Reset (si aplica)
  if (resetId) {
    matches.push({
      id: resetId,
      player1Id: null,
      player2Id: null,
      p1Points: 0,
      p2Points: 0,
      battles: [],
      winnerId: null,
      status: 'pending',
      nextMatchId: null,
      nextMatchSlot: null,
      loserNextMatchId: null,
      loserNextSlot: null,
      bracketSide: 'grand_finals',
      round: wbRounds + 2,
      matchNumber: 1,
    });
  }

  return matches;
}

/**
 * Avanza al ganador y al perdedor en un bracket de doble eliminación.
 */
export function advanceDoubleElimination(
  matches: MatchState[],
  completedMatchId: string
): MatchState[] {
  const completed = matches.find((m) => m.id === completedMatchId);
  if (!completed || !completed.winnerId) return matches;

  const loserId =
    completed.winnerId === completed.player1Id
      ? completed.player2Id
      : completed.player1Id;

  return matches.map((m) => {
    let match = { ...m };

    // Avanza ganador
    if (completed.nextMatchId && m.id === completed.nextMatchId) {
      if (completed.nextMatchSlot === 1) {
        match.player1Id = completed.winnerId;
      } else if (completed.nextMatchSlot === 2) {
        match.player2Id = completed.winnerId;
      }
    }

    // Avanza perdedor a Losers Bracket
    if (completed.loserNextMatchId && loserId && m.id === completed.loserNextMatchId) {
      if (completed.loserNextSlot === 1) {
        match.player1Id = loserId;
      } else if (completed.loserNextSlot === 2) {
        match.player2Id = loserId;
      }
    }

    return match;
  });
}

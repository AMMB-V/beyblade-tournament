'use client';

// ============================================================
// src/components/referee/ScorePad.tsx
// Panel táctil mobile-first para árbitros de Beyblade X
// ============================================================

import React, { useState, useTransition } from 'react';
import { recordBattleAction, recordPenaltyAction, type MatchSnapshot } from '@/actions/referee';
import type { FinishType } from '@/lib/engine/types';

interface ScorePadProps {
  matchId: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  initialMatch: MatchSnapshot;
  targetPoints: number;
  bestOf: number;
}

export default function ScorePad({ matchId, player1, player2, initialMatch, targetPoints, bestOf }: ScorePadProps) {
  const [match, setMatch] = useState<MatchSnapshot>(initialMatch);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const finished = match.status === 'completed';
  const ready = Boolean(player1.id && player2.id);

  const run = (action: () => ReturnType<typeof recordBattleAction>) => {
    if (finished || isPending || !ready) return;
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok) setMatch(res.data);
      else setError(res.error.message);
    });
  };

  const handleScore = (scorerId: string, finish: FinishType) =>
    run(() => recordBattleAction({ matchId, scorerId, finish, expectedVersion: match.version }));

  const handleFoul = (offenderId: string) =>
    run(() =>
      recordPenaltyAction({ matchId, offenderId, card: 'yellow', isFoul: true, expectedVersion: match.version })
    );

  const finishButtons: { type: FinishType; label: string; pts: number; color: string }[] = [
    { type: 'spin', label: 'Spin Finish', pts: 1, color: 'bg-emerald-600 hover:bg-emerald-500' },
    { type: 'burst', label: 'Burst Finish', pts: 2, color: 'bg-amber-600 hover:bg-amber-500' },
    { type: 'over', label: 'Over Finish', pts: 2, color: 'bg-orange-600 hover:bg-orange-500' },
    { type: 'xtreme', label: 'Xtreme Finish', pts: 3, color: 'bg-rose-600 hover:bg-rose-500' },
  ];

  const winnerName = match.winnerId === player1.id ? player1.name : player2.name;

  const column = (player: { id: string; name: string }, label: string) => (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-bold text-center text-slate-400 uppercase">{label}</div>
      {finishButtons.map((btn) => (
        <button
          key={`${player.id}-${btn.type}`}
          disabled={isPending}
          onClick={() => handleScore(player.id, btn.type)}
          className={`${btn.color} text-white font-bold py-3 px-2 rounded-lg text-xs flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50`}
        >
          <span>{btn.label}</span>
          <span className="text-[10px] opacity-80">+{btn.pts} pt</span>
        </button>
      ))}
      <button
        disabled={isPending}
        onClick={() => handleFoul(player.id)}
        className="bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold py-2 px-2 rounded-lg text-[11px] disabled:opacity-50"
      >
        Falta de {player.name}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-4 max-w-md mx-auto select-none">
      <div className="text-center py-2 border-b border-slate-800">
        <span className="text-xs uppercase tracking-wider text-slate-400">
          Set a {targetPoints} pts{bestOf > 1 ? ` · mejor de ${bestOf}` : ''}
        </span>
        <div className="text-sm font-semibold">
          {finished ? (
            <span className="text-emerald-400 font-bold">MATCH FINALIZADO</span>
          ) : ready ? (
            <span className="text-amber-400 animate-pulse">EN VIVO</span>
          ) : (
            <span className="text-slate-400">Esperando a los dos participantes</span>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 my-4">
        {[
          { p: player1, pts: match.p1Points, sets: match.p1Sets },
          { p: player2, pts: match.p2Points, sets: match.p2Sets },
        ].map(({ p, pts, sets }) => (
          <div
            key={p.id || p.name}
            className={`p-4 rounded-xl border text-center transition-all ${
              match.winnerId === p.id ? 'bg-emerald-950/40 border-emerald-500' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="text-sm text-slate-400 truncate">{p.name}</div>
            <div className="text-5xl font-black my-2">{pts}</div>
            {bestOf > 1 && <div className="text-xs text-slate-400">Sets: {sets}</div>}
          </div>
        ))}
      </div>

      {!finished && ready ? (
        <div className="grid grid-cols-2 gap-4 flex-1">
          {column(player1, 'Punto P1')}
          {column(player2, 'Punto P2')}
        </div>
      ) : finished ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h2 className="text-xl font-bold">Ganador: {winnerName}</h2>
          <p className="text-slate-400 text-sm mt-1">El ganador ya avanzó al siguiente cruce del bracket.</p>
        </div>
      ) : null}
    </div>
  );
}

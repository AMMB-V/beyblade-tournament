'use client';

// ============================================================
// src/components/referee/ScorePad.tsx
// Panel táctil mobile-first para árbitros de Beyblade X
// ============================================================

import React, { useState, useTransition } from 'react';
import { recordBattleAction } from '@/actions/referee';
import type { FinishType } from '@/lib/engine/types';

interface ScorePadProps {
  matchId: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  initialP1Score: number;
  initialP2Score: number;
  targetPoints: number;
  initialStatus: string;
}

export default function ScorePad({
  matchId,
  player1,
  player2,
  initialP1Score,
  initialP2Score,
  targetPoints,
  initialStatus,
}: ScorePadProps) {
  const [p1Score, setP1Score] = useState(initialP1Score);
  const [p2Score, setP2Score] = useState(initialP2Score);
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleScore = (scorerId: string, finish: FinishType) => {
    if (status === 'completed' || isPending) return;

    startTransition(async () => {
      try {
        const res = await recordBattleAction({
          matchId,
          scorerId,
          finish,
          pointsToWin: targetPoints,
        });

        if (res.success && res.match) {
          setP1Score(res.match.p1Points);
          setP2Score(res.match.p2Points);
          setStatus(res.match.status);
        }
      } catch (err: any) {
        alert(err.message || 'Error al registrar la batalla');
      }
    });
  };

  const finishButtons: { type: FinishType; label: string; pts: number; color: string }[] = [
    { type: 'spin', label: 'Spin Finish', pts: 1, color: 'bg-emerald-600 hover:bg-emerald-500' },
    { type: 'burst', label: 'Burst Finish', pts: 2, color: 'bg-amber-600 hover:bg-amber-500' },
    { type: 'over', label: 'Over Finish', pts: 2, color: 'bg-orange-600 hover:bg-orange-500' },
    { type: 'xtreme', label: 'Xtreme Finish', pts: 3, color: 'bg-rose-600 hover:bg-rose-500' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-4 max-w-md mx-auto select-none">
      {/* Header del match */}
      <div className="text-center py-2 border-b border-slate-800">
        <span className="text-xs uppercase tracking-wider text-slate-400">Objetivo: {targetPoints} Pts</span>
        <div className="text-sm font-semibold">
          {status === 'completed' ? (
            <span className="text-emerald-400 font-bold">MATCH FINALIZADO</span>
          ) : (
            <span className="text-amber-400 animate-pulse">EN VIVO</span>
          )}
        </div>
      </div>

      {/* Marcador principal */}
      <div className="grid grid-cols-2 gap-3 my-4">
        {/* Jugador 1 */}
        <div className={`p-4 rounded-xl border text-center transition-all ${
          p1Score >= targetPoints ? 'bg-emerald-950/40 border-emerald-500' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="text-sm text-slate-400 truncate">{player1.name}</div>
          <div className="text-5xl font-black my-2">{p1Score}</div>
        </div>

        {/* Jugador 2 */}
        <div className={`p-4 rounded-xl border text-center transition-all ${
          p2Score >= targetPoints ? 'bg-emerald-950/40 border-emerald-500' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="text-sm text-slate-400 truncate">{player2.name}</div>
          <div className="text-5xl font-black my-2">{p2Score}</div>
        </div>
      </div>

      {/* Botones de acción táctiles para árbitros */}
      {status !== 'completed' ? (
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* Columna P1 */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold text-center text-slate-400 uppercase">Punto P1</div>
            {finishButtons.map((btn) => (
              <button
                key={`p1-${btn.type}`}
                disabled={isPending}
                onClick={() => handleScore(player1.id, btn.type)}
                className={`${btn.color} text-white font-bold py-3 px-2 rounded-lg text-xs flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50`}
              >
                <span>{btn.label}</span>
                <span className="text-[10px] opacity-80">+{btn.pts} pt</span>
              </button>
            ))}
          </div>

          {/* Columna P2 */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold text-center text-slate-400 uppercase">Punto P2</div>
            {finishButtons.map((btn) => (
              <button
                key={`p2-${btn.type}`}
                disabled={isPending}
                onClick={() => handleScore(player2.id, btn.type)}
                className={`${btn.color} text-white font-bold py-3 px-2 rounded-lg text-xs flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50`}
              >
                <span>{btn.label}</span>
                <span className="text-[10px] opacity-80">+{btn.pts} pt</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h2 className="text-xl font-bold">
            Ganador: {p1Score >= targetPoints ? player1.name : player2.name}
          </h2>
          <p className="text-slate-400 text-sm mt-1">El resultado se sincronizó con el bracket.</p>
        </div>
      )}
    </div>
  );
}

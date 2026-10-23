'use client';

// ============================================================
// src/components/bracket/BracketViewer.tsx
// Visualizador interactivo de bracket estilo Challonge
// ============================================================

import React from 'react';

export interface BracketMatch {
  id: string;
  round: number;
  matchNumber: number;
  p1Name: string;
  p2Name: string;
  p1Score: number;
  p2Score: number;
  winnerId: string | null;
  status: string;
}

interface BracketViewerProps {
  matches: BracketMatch[];
}

export default function BracketViewer({ matches }: BracketViewerProps) {
  // Agrupar matches por ronda
  const rounds = matches.reduce((acc, match) => {
    acc[match.round] = acc[match.round] || [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, BracketMatch[]>);

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  return (
    <div className="w-full overflow-x-auto p-6 bg-slate-950 text-slate-100 min-h-[500px]">
      <div className="flex gap-12 min-w-max items-center">
        {roundNumbers.map((rNum) => (
          <div key={`round-${rNum}`} className="flex flex-col gap-6 w-64">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center pb-2 border-b border-slate-800">
              Ronda {rNum}
            </h3>

            <div className="flex flex-col justify-around gap-8 flex-1">
              {rounds[rNum].map((m) => {
                const isCompleted = m.status === 'completed';

                return (
                  <div
                    key={m.id}
                    className="flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md hover:border-slate-700 transition-colors"
                  >
                    {/* Jugador 1 */}
                    <div className={`flex items-center justify-between px-3 py-2 text-sm border-b border-slate-800/60 ${
                      isCompleted && m.p1Score > m.p2Score ? 'bg-slate-800/80 font-bold text-emerald-400' : 'text-slate-300'
                    }`}>
                      <span className="truncate max-w-[140px]">{m.p1Name || 'TBD'}</span>
                      <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-xs">
                        {m.p1Score}
                      </span>
                    </div>

                    {/* Jugador 2 */}
                    <div className={`flex items-center justify-between px-3 py-2 text-sm ${
                      isCompleted && m.p2Score > m.p1Score ? 'bg-slate-800/80 font-bold text-emerald-400' : 'text-slate-300'
                    }`}>
                      <span className="truncate max-w-[140px]">{m.p2Name || 'TBD'}</span>
                      <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-xs">
                        {m.p2Score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// src/app/tournaments/[slug]/page.tsx
// Vista pública del torneo con visualizador de bracket
// ============================================================

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import BracketViewer, { BracketMatch } from '@/components/bracket/BracketViewer';
import { notFound } from 'next/navigation';

interface TournamentPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Obtener torneo
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select(`
      id,
      name,
      stadium,
      status,
      stages(
        id,
        name,
        format,
        matches(
          id,
          round,
          match_number,
          p1_match_points,
          p2_match_points,
          winner_id,
          status,
          participant1:participants!matches_participant1_id_fkey(display_name),
          participant2:participants!matches_participant2_id_fkey(display_name)
        )
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !tournament) {
    notFound();
  }

  const stage = tournament.stages?.[0];
  const rawMatches = stage?.matches || [];

  const bracketMatches: BracketMatch[] = rawMatches.map((m: any) => ({
    id: m.id,
    round: m.round,
    matchNumber: m.match_number,
    p1Name: m.participant1?.display_name || 'TBD',
    p2Name: m.participant2?.display_name || 'TBD',
    p1Score: m.p1_match_points,
    p2Score: m.p2_match_points,
    winnerId: m.winner_id,
    status: m.status,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="p-6 border-b border-slate-800 bg-slate-900/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{tournament.name}</h1>
            <p className="text-xs text-slate-400 mt-1">Estadio: {tournament.stadium || 'Estándar Takara Tomy'}</p>
          </div>
          <div className="flex gap-2 items-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {tournament.status}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        <h2 className="text-lg font-bold mb-4">{stage?.name || 'Cuadro Principal'}</h2>
        {bracketMatches.length > 0 ? (
          <BracketViewer matches={bracketMatches} />
        ) : (
          <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            El bracket aún no ha sido generado para este torneo.
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================
// src/app/referee/[matchId]/page.tsx
// Página de arbitraje para un match en vivo
// ============================================================

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ScorePad from '@/components/referee/ScorePad';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface RefereePageProps {
  params: Promise<{ matchId: string }>;
}

export default async function RefereePage({ params }: RefereePageProps) {
  const { matchId } = await params;
  const supabase = await createClient();

  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      id,
      p1_match_points,
      p2_match_points,
      p1_sets,
      p2_sets,
      version,
      winner_id,
      status,
      participant1:participants!matches_participant1_id_fkey(id, display_name),
      participant2:participants!matches_participant2_id_fkey(id, display_name),
      stage:stages(points_to_win, best_of)
    `)
    .eq('id', matchId)
    .single();

  if (error || !match) {
    notFound();
  }

  type PlayerRow = { id: string; display_name: string } | null;
  const p1 = (match.participant1 as unknown as PlayerRow) ?? { id: '', display_name: 'Por definir' };
  const p2 = (match.participant2 as unknown as PlayerRow) ?? { id: '', display_name: 'Por definir' };
  const stage = match.stage as unknown as { points_to_win: number; best_of: number } | null;

  return (
    <main className="min-h-screen bg-slate-950">
      <ScorePad
        matchId={match.id}
        player1={{ id: p1.id, name: p1.display_name }}
        player2={{ id: p2.id, name: p2.display_name }}
        initialMatch={{
          id: match.id,
          status: match.status,
          winnerId: match.winner_id,
          p1Points: match.p1_match_points,
          p2Points: match.p2_match_points,
          p1Sets: match.p1_sets,
          p2Sets: match.p2_sets,
          version: match.version,
        }}
        targetPoints={stage?.points_to_win ?? 4}
        bestOf={stage?.best_of ?? 1}
      />
    </main>
  );
}

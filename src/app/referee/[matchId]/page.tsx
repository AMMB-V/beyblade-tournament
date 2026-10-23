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
      status,
      participant1:participants!matches_participant1_id_fkey(id, display_name),
      participant2:participants!matches_participant2_id_fkey(id, display_name),
      stage:stages(points_to_win)
    `)
    .eq('id', matchId)
    .single();

  if (error || !match) {
    notFound();
  }

  const p1 = match.participant1 as any || { id: 'p1', display_name: 'Blader 1' };
  const p2 = match.participant2 as any || { id: 'p2', display_name: 'Blader 2' };
  const target = (match.stage as any)?.points_to_win || 4;

  return (
    <main className="min-h-screen bg-slate-950">
      <ScorePad
        matchId={match.id}
        player1={{ id: p1.id, name: p1.display_name }}
        player2={{ id: p2.id, name: p2.display_name }}
        initialP1Score={match.p1_match_points}
        initialP2Score={match.p2_match_points}
        targetPoints={target}
        initialStatus={match.status}
      />
    </main>
  );
}

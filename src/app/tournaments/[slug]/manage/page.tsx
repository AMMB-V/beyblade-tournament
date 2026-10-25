'use client';

// ============================================================
// src/app/tournaments/[slug]/manage/page.tsx
// Panel de gestión y generación de brackets estilo Challonge
// Permite añadir participantes en bloque y generar el cuadro
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { addParticipantsAction, generateBracketAction } from '@/actions/tournaments';

export default function ManageTournamentPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [tournament, setTournament] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkNames, setBulkNames] = useState('');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  // Cargar datos
  const loadData = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data: tour } = await supabase
        .from('tournaments')
        .select('*, stages(*)')
        .eq('slug', slug)
        .single();

      if (tour) {
        setTournament(tour);
        const { data: parts } = await supabase
          .from('participants')
          .select('*')
          .eq('tournament_id', tour.id)
          .order('seed', { ascending: true });

        setParticipants(parts || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) loadData();
  }, [slug]);

  // Agregar participantes en bloque (las semillas y el cupo los controla el servidor)
  const handleAddBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkNames.trim() || !tournament) return;

    const names = bulkNames
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const res = await addParticipantsAction({ tournamentId: tournament.id, names });
    if (!res.ok) {
      setMessage({ kind: 'error', text: res.error.message });
      return;
    }

    setBulkNames('');
    setMessage({ kind: 'ok', text: `${res.data.added} participantes agregados` });
    await loadData();
  };

  // Generar bracket: el servidor usa la configuración real de la etapa y lo guarda de forma atómica
  const handleGenerateBracket = async () => {
    const stage = tournament?.stages?.[0];
    if (!stage) {
      setMessage({ kind: 'error', text: 'No se encontró una etapa configurada para este torneo.' });
      return;
    }
    if (participants.length < 2) {
      setMessage({ kind: 'error', text: 'Se necesitan al menos 2 participantes para generar el cuadro.' });
      return;
    }

    setGenerating(true);
    setMessage(null);
    try {
      let res = await generateBracketAction({ stageId: stage.id, force: false });

      // Si ya hay resultados, resetear exige confirmación explícita (y rol admin)
      if (!res.ok && res.error.code === 'CONFLICT' && res.error.message.includes('resultados')) {
        const confirmed = window.confirm(
          'El bracket ya tiene resultados. Resetearlo borra todas las batallas registradas y solo lo puede hacer un admin. ¿Continuar?'
        );
        if (!confirmed) return;
        res = await generateBracketAction({ stageId: stage.id, force: true });
      }

      if (!res.ok) {
        setMessage({ kind: 'error', text: res.error.message });
        return;
      }

      router.push(`/tournaments/${slug}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-slate-400 p-8">Cargando gestión...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col font-sans">
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href={`/tournaments/${slug}`} className="text-xs text-indigo-400 hover:underline">
              ← Ver Torneo / Bracket
            </Link>
            <h1 className="text-2xl font-black mt-1">Gestionar Participantes y Cuadro</h1>
            <p className="text-xs text-slate-400">{tournament?.name} ({tournament?.stages?.[0]?.format})</p>
          </div>

          <button
            onClick={handleGenerateBracket}
            disabled={generating || participants.length < 2}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {generating ? 'Generando...' : '⚡ Generar / Resetear Bracket'}
          </button>
        </div>

        {message && (
          <div
            role={message.kind === 'error' ? 'alert' : 'status'}
            className={`p-3 mb-4 rounded-lg text-xs border ${
              message.kind === 'error'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Añadir participantes en bloque */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-2">
              Añadir en Bloque (1 por línea)
            </h2>
            <form onSubmit={handleAddBulk} className="flex flex-col gap-3">
              <textarea
                rows={6}
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                placeholder="Kamen X&#10;Bird Kazami&#10;Multi Nanairo&#10;Ekusu Kurosu"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg text-xs"
              >
                + Añadir Participantes
              </button>
            </form>
          </div>

          {/* Lista actual de participantes */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Participantes Registrados
              </h2>
              <span className="text-xs font-mono bg-slate-950 px-2 py-0.5 rounded text-indigo-400">
                {participants.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-64 flex flex-col gap-1.5 pr-1">
              {participants.length > 0 ? (
                participants.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded border border-slate-800/80 text-xs"
                  >
                    <span className="text-slate-400 font-mono">#{idx + 1}</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                      {p.display_name}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">{p.status}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-8 text-xs">
                  Sin participantes registrados. Añade algunos a la izquierda.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

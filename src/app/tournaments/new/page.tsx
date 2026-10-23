'use client';

// ============================================================
// src/app/tournaments/new/page.tsx
// Formulario de creación de torneo estilo Challonge
// ============================================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewTournamentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const slug = (formData.get('slug') as string) || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const stadium = formData.get('stadium') as string;
    const format = formData.get('format') as string;
    const maxParticipants = Number(formData.get('maxParticipants')) || 8;

    try {
      // Import dynamic client
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // 1. Crear torneo
      const { data: tournament, error: tourError } = await supabase
        .from('tournaments')
        .insert({
          name,
          slug,
          stadium,
          max_participants: maxParticipants,
          status: 'draft',
          visibility: 'public',
        })
        .select()
        .single();

      if (tourError) throw tourError;

      // 2. Crear etapa inicial
      const { error: stageError } = await supabase.from('stages').insert({
        tournament_id: tournament.id,
        position: 0,
        name: format === 'swiss' ? 'Fase Suiza' : 'Cuadro Principal',
        format: format as any,
        match_type: '3on3',
        points_to_win: 4,
      });

      if (stageError) throw stageError;

      router.push(`/tournaments/${slug}`);
    } catch (err: any) {
      setError(err.message || 'Error al crear torneo');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="mb-6">
          <Link href="/" className="text-xs text-indigo-400 hover:underline">
            ← Volver al inicio
          </Link>
          <h1 className="text-2xl font-black mt-2">Crear Nuevo Torneo</h1>
          <p className="text-xs text-slate-400 mt-1">Configura las reglas y parámetros de arbitraje</p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Torneo</label>
            <input
              required
              name="name"
              placeholder="Ej: Torneo Regional Beyblade X"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Slug (URL amigable)</label>
            <input
              name="slug"
              placeholder="ej: torneo-regional-2025"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Formato</label>
              <select
                name="format"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="single_elimination">Eliminación Simple</option>
                <option value="double_elimination">Doble Eliminación</option>
                <option value="swiss">Sistema Suizo (Swiss)</option>
                <option value="round_robin">Round Robin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cupo Máximo</label>
              <input
                type="number"
                name="maxParticipants"
                defaultValue={16}
                min={2}
                max={128}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Estadio Oficial</label>
            <input
              name="stadium"
              defaultValue="Xtreme Stadium Standard (BX-07)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-all text-sm disabled:opacity-50"
          >
            {loading ? 'Creando torneo...' : 'Crear Torneo'}
          </button>
        </form>
      </div>
    </div>
  );
}

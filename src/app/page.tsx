import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, slug, description, status, stadium, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <span className="font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400">
              BEYBLADE X TOURNAMENTS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/tournaments/new"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-md hover:shadow-indigo-500/20 transition-all"
            >
              + Crear Torneo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6 text-center max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
          <span>🎮</span> Plataforma Oficial de Arbitraje y Brackets
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-4">
          Crea, Diseña y Arbitra Torneos de{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500">
            Beyblade X
          </span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-2xl mb-8">
          Formatos completos: Eliminación Simple, Doble Eliminación, Suizo y Round Robin con arbitraje en vivo para Spin, Burst, Over y Xtreme Finish.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/tournaments/beyblade-x-cup-2025"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm"
          >
            Ver Bracket Demo en Vivo →
          </Link>
          <Link
            href="/referee/22222222-0000-0000-0000-000000000001"
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold px-6 py-3 rounded-xl transition-all text-sm flex items-center gap-2"
          >
            <span>📱</span> Probar Panel Árbitro
          </Link>
        </div>
      </section>

      {/* Lista de Torneos */}
      <section className="max-w-6xl w-full mx-auto px-6 py-8 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold tracking-tight">Torneos Activos y Recientes</h2>
          <span className="text-xs text-slate-500 font-mono">
            {tournaments?.length || 0} torneo(s)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments && tournaments.length > 0 ? (
            tournaments.map((t) => (
              <div
                key={t.id}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-all group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {t.status}
                    </span>
                    <span className="text-xs text-slate-500">{t.stadium || 'Estadio Estándar'}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-100 group-hover:text-indigo-400 transition-colors mb-2">
                    {t.name}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-2 mb-4">
                    {t.description || 'Sin descripción'}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
                  <Link
                    href={`/tournaments/${t.slug}`}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-center py-2 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
                  >
                    Ver Bracket
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No hay torneos registrados todavía.
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        Beyblade Tournament Platform • Compatible con reglas oficiales WBO & Takara Tomy
      </footer>
    </div>
  );
}

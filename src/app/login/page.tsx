import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/validations/auth';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(nextPath);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <span className="text-3xl">⚡</span>
          <h1 className="mt-2 font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400">
            BEYBLADE X TOURNAMENTS
          </h1>
          <p className="text-slate-400 text-sm mt-1">Acceso para organizadores, árbitros y admins</p>
        </div>
        <LoginForm next={nextPath} />
      </div>
    </main>
  );
}

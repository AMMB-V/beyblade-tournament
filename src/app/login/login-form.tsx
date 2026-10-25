'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/actions/auth';

const initialState: LoginState = { error: null };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Usuario
        <input
          name="identifier"
          type="text"
          autoComplete="username"
          required
          className="bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm normal-case tracking-normal text-slate-100"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm normal-case tracking-normal text-slate-100"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-sm uppercase tracking-wider px-4 py-3 rounded-lg transition-all"
      >
        {pending ? 'Ingresando…' : 'Iniciar sesión'}
      </button>
    </form>
  );
}

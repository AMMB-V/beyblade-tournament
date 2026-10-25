'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { identifierToEmail, loginSchema, safeNextPath } from '@/lib/validations/auth';

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get('identifier'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: identifierToEmail(parsed.data.identifier),
    password: parsed.data.password,
  });
  if (error) {
    return { error: 'Usuario o contraseña incorrectos' };
  }

  redirect(safeNextPath(formData.get('next')));
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

import { z } from 'zod';

/** Dominio interno: Supabase Auth exige correo, así que el usuario "nalo-24" se guarda como "nalo-24@webbey.local". */
export const AUTH_EMAIL_DOMAIN = 'webbey.local';

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Ingresa tu usuario')
    .max(64)
    .regex(/^[a-z0-9_.@-]+$/, 'Usuario con caracteres no válidos'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(72),
});

export function identifierToEmail(identifier: string): string {
  return identifier.includes('@') ? identifier : `${identifier}@${AUTH_EMAIL_DOMAIN}`;
}

/** Solo permite redirecciones internas (evita open redirect). */
export function safeNextPath(value: unknown): string {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  return value;
}

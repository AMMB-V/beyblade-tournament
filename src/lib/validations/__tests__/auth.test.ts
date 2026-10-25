import { describe, expect, it } from 'vitest';
import { identifierToEmail, loginSchema, safeNextPath } from '../auth';

describe('loginSchema', () => {
  it('normaliza el usuario a minúsculas y sin espacios', () => {
    const r = loginSchema.safeParse({ identifier: '  NALO-24 ', password: 'nalo-24' });
    expect(r.success && r.data.identifier).toBe('nalo-24');
  });

  it('rechaza contraseñas cortas y caracteres no válidos', () => {
    expect(loginSchema.safeParse({ identifier: 'nalo-24', password: '123' }).success).toBe(false);
    expect(loginSchema.safeParse({ identifier: 'nalo 24;', password: 'nalo-24' }).success).toBe(false);
  });
});

describe('identifierToEmail', () => {
  it('convierte un usuario en el correo interno', () => {
    expect(identifierToEmail('nalo-24')).toBe('nalo-24@webbey.local');
  });
  it('respeta un correo completo', () => {
    expect(identifierToEmail('a@b.com')).toBe('a@b.com');
  });
});

describe('safeNextPath', () => {
  it('acepta rutas internas', () => {
    expect(safeNextPath('/tournaments/new')).toBe('/tournaments/new');
  });
  it('bloquea redirecciones externas', () => {
    expect(safeNextPath('//evil.com')).toBe('/');
    expect(safeNextPath('https://evil.com')).toBe('/');
    expect(safeNextPath(undefined)).toBe('/');
  });
});

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { fail, fromRpcError, fromZodError, ok, uuidSchema } from '../action-result';

describe('ActionResult', () => {
  it('ok y fail producen la forma esperada', () => {
    expect(ok(5)).toEqual({ ok: true, data: 5 });
    expect(fail('FORBIDDEN', 'no', 'campo')).toEqual({
      ok: false,
      error: { code: 'FORBIDDEN', message: 'no', field: 'campo' },
    });
  });

  it.each([
    ['version_conflict', 'CONFLICT'],
    ['match_closed', 'CONFLICT'],
    ['bracket_has_results', 'CONFLICT'],
    ['tournament_full', 'CONFLICT'],
    ['forbidden', 'FORBIDDEN'],
    ['match_not_found', 'NOT_FOUND'],
    ['invalid_scorer', 'UNPROCESSABLE'],
    ['match_not_ready', 'UNPROCESSABLE'],
  ])('traduce la excepción SQL %s a %s', (message, code) => {
    const res = fromRpcError({ message: `ERROR: ${message}` });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe(code);
  });

  it('no expone el mensaje interno en errores desconocidos', () => {
    const res = fromRpcError({ message: 'relation "x" does not exist' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('INTERNAL');
      expect(res.error.message).not.toContain('relation');
    }
  });

  it('fromZodError indica el campo afectado', () => {
    const parsed = z.object({ finish: z.enum(['spin', 'over']) }).safeParse({ finish: 'x' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const res = fromZodError(parsed.error);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.code).toBe('VALIDATION');
        expect(res.error.field).toBe('finish');
      }
    }
  });

  it('uuidSchema acepta UUID válidos y rechaza texto libre', () => {
    expect(uuidSchema.safeParse('aaaaaaaa-0000-0000-0000-000000000001').success).toBe(true);
    expect(uuidSchema.safeParse('no-es-uuid').success).toBe(false);
  });
});

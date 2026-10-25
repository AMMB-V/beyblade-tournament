import { z } from 'zod';

export type ErrorCode =
  | 'VALIDATION'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE'
  | 'INTERNAL';

export type ActionError = { code: ErrorCode; message: string; field?: string };

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(code: ErrorCode, message: string, field?: string): ActionResult<never> {
  return { ok: false, error: { code, message, ...(field ? { field } : {}) } };
}

// Acepta cualquier UUID con formato válido (z.uuid() de Zod 4 exige versión RFC estricta).
export const uuidSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Identificador no válido');

export function fromZodError(error: z.ZodError): ActionResult<never> {
  const issue = error.issues[0];
  const field = issue?.path.length ? String(issue.path[0]) : undefined;
  return fail('VALIDATION', issue?.message ?? 'Datos no válidos', field);
}

// Mensajes de las excepciones que lanzan las funciones SQL (raise exception '<codigo>').
const RPC_ERRORS: Array<[string, ErrorCode, string]> = [
  ['forbidden', 'FORBIDDEN', 'No tienes permiso para esta acción'],
  ['match_not_found', 'NOT_FOUND', 'El match no existe'],
  ['stage_not_found', 'NOT_FOUND', 'La etapa no existe'],
  ['tournament_not_found', 'NOT_FOUND', 'El torneo no existe'],
  ['match_closed', 'CONFLICT', 'El match ya terminó'],
  ['version_conflict', 'CONFLICT', 'Otro árbitro actualizó este match. Recarga e inténtalo de nuevo'],
  ['bracket_has_results', 'CONFLICT', 'El bracket ya tiene resultados. Resetearlo requiere confirmación de un admin'],
  ['tournament_full', 'CONFLICT', 'El torneo alcanzó el cupo máximo de participantes'],
  ['match_not_ready', 'UNPROCESSABLE', 'El match todavía no tiene a sus dos participantes'],
  ['invalid_scorer', 'UNPROCESSABLE', 'El anotador no pertenece a este match'],
  ['invalid_participant', 'UNPROCESSABLE', 'El participante no pertenece a este match'],
];

export function fromRpcError(error: { message: string }): ActionResult<never> {
  const hit = RPC_ERRORS.find(([key]) => error.message.includes(key));
  if (hit) return fail(hit[1], hit[2]);
  return fail('INTERNAL', 'No se pudo completar la operación. Intenta de nuevo');
}

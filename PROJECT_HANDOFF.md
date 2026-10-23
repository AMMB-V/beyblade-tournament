# ESTADO DEL PROYECTO Y RESUMEN PARA CONTINUIDAD (CLAUDE / ANTHROPIC)

## 📌 Enlaces Directos del Proyecto
- **Repositorio GitHub:** [https://github.com/AMMB-V/beyblade-tournament](https://github.com/AMMB-V/beyblade-tournament)
- **Despliegue Producción en Vercel:** [https://beyblade-tournament.vercel.app](https://beyblade-tournament.vercel.app)
- **Dashboard Vercel:** [https://vercel.com/alexander-6034/beyblade-tournament](https://vercel.com/alexander-6034/beyblade-tournament)
- **Dashboard Supabase (Proyecto WebBey):** [https://supabase.com/dashboard/project/nqxfimqnoabwssfquyjo](https://supabase.com/dashboard/project/nqxfimqnoabwssfquyjo)

---

## 🛠️ Stack y Entorno
- **Framework:** Next.js 16 (App Router, Turbopack, TypeScript strict)
- **Base de Datos & Auth:** Supabase Postgres con RLS activado
- **Hosting:** Vercel (Production branch: `main`)
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`) ejecutando:
  1. Lint y verificación de tipos (`npx tsc --noEmit`)
  2. Tests unitarios con Vitest y reporte de cobertura
  3. Compilación de Next.js (`npm run build`)
  4. Migraciones automáticas de base de datos con Supabase CLI

---

## 🚀 Lo Realizado Hasta el Momento

### 1. Etapa 1: Infraestructura y Base de Datos (100% Completada)
- `CLAUDE.md`: Archivo de contexto persistente con reglas de negocio oficiales WBO/Takara Tomy.
- **Migraciones SQL aplicadas en Supabase:**
  - `001_initial_schema.sql`: 15 tablas para torneos, etapas, grupos, participantes, matches, batallas, decks (3on3), penalizaciones, bey checks y bitácora de auditoría.
  - `002_rls_policies.sql`: Políticas de Row-Level Security y funciones helper de permisos.
  - `003_nullable_created_by.sql`: Ajuste para permitir seeding inicial de torneos del sistema.
  - `seed.sql`: Torneo demo poblado con participantes oficiales y matches en vivo.
- Tipos de TypeScript estrictos generados desde Postgres (`src/types/supabase.ts`).
- Clientes Supabase para Client y Server Components (`src/lib/supabase/client.ts`, `server.ts`).

### 2. Etapa 2: Motor de Torneos (Core Business Logic Puro)
- `src/lib/engine/types.ts`: Tipos del motor independientes de I/O y DB.
- `src/lib/engine/seeding.ts`: Potencias de 2, cálculo de byes, pares de siembra y snake seeding para grupos.
- `src/lib/engine/scoring.ts`: Finishes oficiales (Spin=1pt, Burst=2pts, Over=2pts, Xtreme=3pts), acumulación y gestión de faltas.
- `src/lib/engine/tiebreakers.ts`: Desempates (Victorias, Δpts, Head-to-head, Buchholz).
- **Formatos Implementados:**
  - `src/lib/engine/formats/single-elimination.ts`: Eliminación Simple con avance inmutable.
  - `src/lib/engine/formats/double-elimination.ts`: Doble Eliminación con Winners, Losers, Grand Finals y Reset.
  - `src/lib/engine/formats/round-robin.ts`: Todos contra todos y fase de grupos con rotación circular.
  - `src/lib/engine/formats/swiss.ts`: Sistema Suizo con emparejamientos por puntos evitando rematches.
- **Tests unitarios:** 24 tests con Vitest pasando exitosamente (`npm test`).

### 3. Server Actions & UI Previa
- `src/actions/referee.ts`: Captura de batallas por árbitro y sincronización atómica con Supabase.
- `src/actions/tournaments.ts`: Creación de torneos y participantes con validación Zod.
- `src/components/referee/ScorePad.tsx`: Panel táctil mobile-first para árbitros de pista.
- `src/components/bracket/BracketViewer.tsx`: Visualizador de brackets responsivo estilo Challonge.
- `src/app/page.tsx`: Página de inicio interactiva con listado en vivo de torneos.
- `src/app/referee/[matchId]/page.tsx`: Ruta de arbitraje en tiempo real.
- `src/app/tournaments/[slug]/page.tsx`: Vista pública de torneo con bracket.

---

## 🎯 Próximos Pasos (Continuación de Fase 2 y Fase 3)
1. Completar el módulo de avance inter-etapas (`advancement.ts`) para encadenar fases (ej: Suizo -> Top 8 -> Eliminación Simple).
2. Manejo de autenticación / permisos RLS para creación de torneos desde la web.

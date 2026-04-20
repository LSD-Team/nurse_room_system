# Nurse Room System – Copilot Instructions

**Project:** Vue 3 + NestJS fullstack app for hospital nurse room medical supply borrowing workflows.

**Tech Stack:** Vue 3, Vite, TypeScript, TailwindCSS, PrimeVue | NestJS, TypeScript, MSSQL, Stored Procedures  
**Package Manager:** pnpm (use `pnpm install`, not npm/yarn)  
**Base Path:** `/nurse-room-system/`

---

## Build & Run Commands

```bash
# VS Code task (runs both):
"start-dev"

# Client (Vite dev server)
cd client && pnpm dev        # --host mode, port from env
pnpm build                   # vue-tsc type-check + vite build
pnpm lint                    # ESLint + Prettier

# Server (NestJS watch mode)
cd server && pnpm dev        # nest start --watch, port from APP_PORT env
pnpm build                   # nest build → dist/
pnpm start:prod              # node dist/src/main
pnpm test                    # jest (configured but no specs yet)
```

**Environment:** `.env.development` / `.env.production` in both client/ and server/ (no `.env.example` exists).  
**Swagger:** `http://localhost:{APP_PORT}/api`

---

## Architecture

### Client (`client/src/`)
- **Entry:** `main.ts` – Vue app bootstrap, Axios config, global state
- **Routing:** Hash-based, lazy-loaded routes in `router/index.ts` (many routes are placeholder `Empty.vue`)
- **State:** Pinia store `stores/main.store.ts` – `userInfo`, `loading`, `employees` (Options API)
- **API Layer:** `services/api.service.ts` wraps Axios – handles token injection, loading overlay, error alerts (SweetAlert2)
- **Components:** PrimeVue auto-imported via resolver (no manual imports needed)
- **Utils:** `utils/format.utils.ts` (13 Thai-locale formatters), `utils/employee-image.utils.ts`
- **Interfaces:** `interfaces/` folder – `api`, `borrow`, `approval`, `stock`, `jwt`, `lsds`
- **Layout:** PrimeVue Sakai template (`layout/` – Aura preset, emerald primary)

### Server (`server/src/`)
- **Modules:** Auth, Database, Borrow, Approval, Stock, Employees
- **Auth:** JWT + Passport strategy, `global.jwtPayload` middleware, guards: `AppGuard` (global), `AdminGuard`, `UserGuard`
- **Database:** MSSQL connection pool (max 10, 30s timeout) via `DatabaseService`
- **Shared Types:** `server/shared/` – cross-project interfaces imported by client via `@/shared/*` path alias

### Database
- **MSSQL:** Main DB (name from `DATABASE_NAME` env, default `TEMPLATE_WEB_STACK_2025`) + optional `LSD_SYSTEM_CENTER` (auth)
- **Stored Procedures:** `sp_MODULE_##_Action` (e.g., `sp_BR_01_Create`)
- **Schema Docs:** See [PRD/](PRD/) – [Tables.md](PRD/Tables.md), [Views.md](PRD/Views.md), [Functions.md](PRD/Functions.md), [Metadata.md](PRD/Metadata.md) and their `_summary.md` counterparts

---

## Coding Conventions

### Naming
| What | Convention | Example |
|------|-----------|---------|
| Interfaces | `IInterfaceName` | `IBorrowHeader` |
| Vue components | `PascalCase.vue` | `BorrowMedicines.vue` |
| Routes | kebab-case | `/borrow-medicines` |
| Services | camelCase methods | `getBorrowHeaders()` |
| Stored Procedures | `sp_MODULE_##_Action` | `sp_BR_01_Create` |
| Constants | UPPER_SNAKE_CASE | `DATABASE_NAME` |

### Vue 3 Patterns
- Use `<script setup lang="ts">` – ESLint enforces `<script>` before `<template>` order
- PrimeVue components: auto-imported, never import manually
- Store access: `import { useMainStore } from '@/stores/main.store'`
- Error handling: let Axios interceptor handle it (401→login, 403→error route, else→SweetAlert2)

### NestJS Module Pattern
```
server/src/apis/feature/
  feature.controller.ts    # REST endpoints + @Api* Swagger decorators
  feature.service.ts       # Business logic, injects DatabaseService
  feature.interface.ts     # Request/response types
  feature.module.ts        # Module registration → import in app.module.ts
```

### API Communication
- **Client:** Always use `Api` service (never raw Axios)
  ```typescript
  import Api from '@/services/api.service';
  const data = await Api.get('/endpoint');
  ```
- **Server:** Inject `DatabaseService`, use `query()` or `executeStoredProcedure()`

### Path Aliases
| Alias | Resolves To |
|-------|------------|
| `@/` (client) | `client/src/` |
| `@/shared/*` (client) | `server/shared/*` |
| `@/*` (server) | `server/*` |

### TypeScript
- Client: `strict: false`, `noImplicitAny` not enforced  
- Server: `noImplicitAny: false`, `strictNullChecks: true`  
- Prefer typed parameters; avoid `any` where practical

### Auth
- JWT Bearer token in `localStorage['token']` → `Authorization: Bearer <token>`
- Server middleware extracts user ID + department code → `global.jwtPayload`
- Dev bypass: `VITE_DEV_TOKEN` in client `.env.development`

---

## Common Pitfalls

- ❌ Don't use `npm`/`yarn` – always `pnpm`
- ❌ Don't bypass `Api` service – always use centralized Axios
- ❌ Don't create custom global state – use Pinia store
- ❌ Don't import PrimeVue components manually – auto-import resolver handles it
- ❌ Don't create custom error UI – let Axios interceptor handle it
- ❌ Don't hardcode env variables – read from `.env.*` files

---

## Quick Start: New Feature

1. **Server module** → `server/src/apis/feature/` (controller + service + interface + module) → register in `app.module.ts`
2. **Client service** → `client/src/services/feature.service.ts` using `Api.get/post/put/delete`
3. **Vue page** → `client/src/views/pages/Feature.vue` with `<script setup>` + add lazy route in `router/index.ts`
4. **Run** → VS Code task `start-dev` → test at `http://localhost:{port}/nurse-room-system/`

Reference implementation: [BorrowMedicines.vue](client/src/views/pages/BorrowMedicines.vue)

---

## Language & Context

- Thai-language UI, comments, and stored procedure parameter names throughout
- Hospital nurse room operations – medical supply borrowing, approval workflows, stock management

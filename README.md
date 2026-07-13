# ObraFlow

Plataforma de gestión de operaciones de construcción y mantenimiento (multi-tenant).

Monorepo Turbo:

- **`apps/api`** — API REST en NestJS 10 (Prisma + PostgreSQL, JWT, Swagger, Stripe billing, mailer, tareas programadas). Sirve además el frontend compilado desde `apps/api/public`.
- **`packages/shared`** — tipos, enums, schemas Zod y utilidades compartidas (`@obraflow/shared`).

## Requisitos

- Node.js >= 20
- PostgreSQL (o SQLite en desarrollo, ajustando `datasource` en `prisma/schema.prisma`)

## Puesta en marcha

```bash
npm install
cp .env.example .env          # completar variables
npm run build                 # compila shared + api

# Base de datos
cd apps/api
npm run db:generate           # prisma generate
npm run db:push               # o db:migrate
npm run db:seed               # datos de ejemplo (opcional)

# Desarrollo
cd ../..
npm run dev                   # turbo: shared en watch + nest start --watch
```

La API queda en `http://localhost:3000/api/v1` y la doc Swagger en `http://localhost:3000/api/docs` (solo fuera de producción).

## Despliegue

`Dockerfile` (raíz) hace build multi-stage del monorepo y ejecuta `node dist/main`. Es el que usa Railway (servicio `obraflow-api` + Postgres).

---

## ⚠️ Nota sobre esta copia (reconstrucción)

El código de este repositorio fue **recuperado desde el contenedor desplegado en Railway** (el fuente original ya no existía en disco). Detalle:

- **`packages/shared/src`**, `apps/api/prisma` (schema + seed), `package.json`, `apps/api/public` (frontend compilado): **originales**, recuperados tal cual.
- **`apps/api/src`**: **reconstruido** a TypeScript a partir del compilado (`apps/api/dist`, `.js` + `.d.ts`). Es funcionalmente equivalente y de altísima fidelidad, pero no byte-a-byte idéntico al original (nombres de variables locales, comentarios y algunas anotaciones de tipo inferidas pueden diferir). Los tipos de retorno de Prisma se dejaron inferidos a propósito.
- **No recuperable:** el **código fuente del frontend** (solo existe su build en `public/`), y los archivos de configuración de raíz (`Dockerfile`, `turbo.json`, `tsconfig*.json`, `nest-cli.json`, `.env`) que **fueron recreados** según la configuración observada.

Ver `apps/api/dist` como referencia del comportamiento desplegado.

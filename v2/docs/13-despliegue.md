# 13 · Desarrollo, despliegue y operación

## Desarrollo local

```bash
cd v2
npm install
cp server/.env.example server/.env
npm run dev:server
npm run dev:web
npm run seed -w @manifiest/server
```

- `server/.env` se carga automáticamente (`--env-file-if-exists`).
- API en `http://localhost:4000` y web en `http://localhost:5173`, con Vite reenviando `/api` a la API.
- Sin `SMTP_URL`, los códigos de verificación se imprimen en la consola del servidor (`[mail:dev]`).
- El *seed* crea 60 usuarios `demo{0..59}@manifiest.local` con la contraseña `manifiesto-demo-2026`, 4 causas, pasos de 30 días, unidades de los 19 roles (con veteranía, efectos y paletas) y pancartas. `demo0`–`demo9` son veteranos de nivel 12 a 30 con dragones, mosaicos, ballenas y carrozas.
- Las bases de datos existentes se migran solas al arrancar (columnas nuevas de economía y servicio).

## Tests

```bash
cd v2
npm test
```

`shared` (reglas puras) y `server` (integración con SQLite en memoria, `supertest`, proveedores simulados).

## Variables de entorno (`server/.env.example`)

| Variable | Obligatoria en prod | Descripción |
|---|---|---|
| `NODE_ENV` | sí | `production` |
| `API_URL`, `WEB_URL` | sí | Orígenes públicos (redirecciones OAuth y correos) |
| `CORS_ORIGINS` | si la web está en otro origen | Lista separada por comas |
| `JWT_SECRET` | **sí** | ≥ 32 caracteres aleatorios (`openssl rand -base64 48`) |
| `TOKEN_ENCRYPTION_KEY` | **sí** | 32 bytes en base64 (`openssl rand -base64 32`). Si se pierde, hay que reconectar todos los relojes |
| `SMTP_URL`, `MAIL_FROM` | **sí** | Envío de códigos |
| `DATABASE_PATH` | — | Por defecto `./data/manifiest.db` |
| `GOOGLE_CLIENT_ID` | — | Acceso con Google |
| `FITBIT_*`, `WITHINGS_*`, `GARMIN_*` | — | Proveedores de relojes |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | — | Pagos |

## Docker

```bash
cd v2
docker build -t manifiest .
docker run -d --name manifiest -p 4000:4000 -v manifiest-data:/data --env-file server/.env manifiest
```

La imagen compila la web y el servidor la sirve desde el mismo origen: sin CORS, con cookies `SameSite=Strict` y CSP `'self'`. Corre como usuario `node` e incluye `HEALTHCHECK`.

## Producción recomendada (bajo coste)

1. Un VPS pequeño (2 vCPU, 4 GB) detrás de Caddy o Nginx con TLS automático.
2. Volumen persistente para `/data` y **Litestream** replicando SQLite a un almacenamiento S3 compatible (copias continuas).
3. Registrar en cada proveedor las URLs de *callback* y *webhook* ([03-relojes](03-relojes.md)).
4. Monitorizar `GET /api/health` y alertar sobre `integrity_flags` y `auth.refresh_reuse_detected` en `audit_log`.

## Escalar

| Umbral | Cambio |
|---|---|
| > 1 nodo | Redis para `express-rate-limit` y para `ctx.events` (pub/sub del directo) |
| Escrituras sostenidas altas | Migrar a PostgreSQL: el SQL es estándar salvo `INSERT OR IGNORE` (→ `ON CONFLICT DO NOTHING`) y `strftime` |
| Escenas > 5.000 figuras | Agregación por bloques en el servidor e impostores o partículas en el cliente |
| Sincronización masiva | Cola de trabajos (BullMQ) para los *pulls* de webhooks |

# 01 · Arquitectura

## Visión general

```
┌─────────────┐  OAuth + webhooks   ┌──────────────────────────────┐
│ Fitbit      │◄───────────────────►│                              │
│ Withings    │                     │   server/  (Node 22, Express 5)
│ Garmin      │                     │   ├─ auth        registro/sesiones
└─────────────┘                     │   ├─ providers   relojes en la nube
┌─────────────┐  Ed25519 firmado    │   ├─ devices     móvil compañero
│ mobile/     │────────────────────►│   ├─ steps       libro mayor
│ HealthKit / │                     │   ├─ causes      causas
│ HealthConn. │                     │   ├─ units       unidades únicas
└─────────────┘                     │   ├─ placards    pancartas
┌─────────────┐  REST + SSE         │   ├─ protests    escena + directo
│ web/        │◄───────────────────►│   ├─ game        Eco, taller, frentes, hitos
                                    │   └─ shop        cosméticos + Stripe
│ React+Three │                     │        │
└─────────────┘                     │     SQLite (WAL)
        ▲                           └──────────────────────────────┘
        └────── shared/ (reglas de juego puras, idénticas en cliente y servidor)
```

## Paquetes (npm workspaces)

| Paquete | Ruta | Responsabilidad |
|---|---|---|
| `@manifiest/shared` | `v2/shared` | Reglas puras sin dependencias: reparto de pasos, progresión, roles de unidad, genoma procedural, catálogo cosmético. Probado con `node:test`. |
| `@manifiest/server` | `v2/server` | API REST, webhooks, SSE, persistencia SQLite, seguridad. |
| `@manifiest/web` | `v2/web` | SPA React 19 + Vite 7, escena 3D con three.js / react-three-fiber. |
| `manifiest-companion` | `v2/mobile` | App Expo para leer Apple Health / Health Connect y enviar pasos firmados. Fuera de los workspaces porque tiene su propio toolchain. |

## Decisiones clave

- **Reglas en `shared/`**: el cliente previsualiza lo mismo que el servidor calcula, por ejemplo el genoma de una unidad a partir de su semilla, sin duplicar la lógica. La autoridad siempre es el servidor.
- **SQLite con WAL**: un único nodo aguanta decenas de miles de usuarios activos con coste mínimo, y los backups son triviales (Litestream o copia de fichero). El acceso está encapsulado en consultas preparadas por módulo. La migración a PostgreSQL se describe en [Despliegue](13-despliegue.md).
- **Contexto inyectable**: `createContext(config, overrides)` construye `db`, `cipher`, `mailer`, `ledger`, `providers`, `events` y `fetch`. Los tests sustituyen `db` (memoria), `mailer` (bandeja local) y `fetch` (proveedores simulados).
- **Eventos en proceso**: `ctx.events` emite `steps` tras cada abono del libro mayor y alimenta el directo (SSE). Para escalar a varios nodos habría que sustituirlo por Redis pub/sub.
- **Express 5**: los errores de los manejadores asíncronos se propagan solos a `errorHandler`.

## Mapa de módulos del servidor

| Módulo | Fichero principal | Documento |
|---|---|---|
| Configuración | `server/src/config.js` | [13-despliegue](13-despliegue.md) |
| Esquema de datos | `server/src/db/schema.sql` | [12-api](12-api.md) |
| Autenticación | `server/src/auth/` | [02-registro-y-autenticacion](02-registro-y-autenticacion.md) |
| Relojes en la nube | `server/src/providers/` | [03-relojes](03-relojes.md) |
| Móvil compañero | `server/src/devices/routes.js` | [03-relojes](03-relojes.md), [14-app-movil](14-app-movil.md) |
| Libro mayor | `server/src/steps/ledger.js` | [04-libro-mayor](04-libro-mayor.md) |
| Unidades | `server/src/units/routes.js` | [05-progresion-y-unidades](05-progresion-y-unidades.md) |
| Juego de gestión (Eco, taller, frentes, hitos) | `server/src/game/` | [17-juego-de-gestion](17-juego-de-gestion.md) |
| Causas y pancartas | `server/src/causes/`, `server/src/placards/` | [08-causas-y-pancartas](08-causas-y-pancartas.md) |
| Escena y directo | `server/src/protests/routes.js` | [19-experiencia-de-mani](19-experiencia-de-mani.md) |
| Tienda | `server/src/shop/routes.js` | [09-monetizacion](09-monetizacion.md) |
| Seguridad transversal | `server/src/security/`, `server/src/middleware/` | [10-seguridad](10-seguridad.md) |
| Usuarios y RGPD | `server/src/users/` | [11-privacidad](11-privacidad.md) |

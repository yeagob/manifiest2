# 12 · Referencia de la API

Base: `/api`. JSON UTF-8. Errores: `{ "error": "mensaje", "code": "codigo_maquina" }`.
🔒 = requiere `Authorization: Bearer <accessToken>` de un usuario con email verificado.
🍪 = usa la cookie `mf_rt` y requiere `X-Requested-With: manifiest`.

## Autenticación (`/auth`)

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/auth/register` | `{email, password, displayName}` | `202` |
| POST | `/auth/verify-email` | `{email, code}` | `201 {accessToken, expiresIn}` + 🍪 |
| POST | `/auth/resend-code` | `{email}` | `202` |
| POST | `/auth/login` | `{email, password}` | `{accessToken, expiresIn}` + 🍪 |
| POST | `/auth/google` | `{idToken}` | `{accessToken, expiresIn}` + 🍪 |
| POST | `/auth/refresh` 🍪 | — | `{accessToken, expiresIn}` + 🍪 rotada |
| POST | `/auth/logout` 🍪 | — | `204` |
| POST | `/auth/logout-all` 🔒 | — | `204` |
| POST | `/auth/password/forgot` | `{email}` | `202` |
| POST | `/auth/password/reset` | `{email, code, password}` | `204` |
| POST | `/auth/password/change` 🔒 | `{currentPassword, newPassword}` | `204` |
| GET | `/auth/me` 🔒 | — | Perfil: `progress`, `capacity`, `usedCapacity`, `pattern`, `totalSteps`, `unallocatedSteps`… |

## Usuario (`/users`) 🔒

`PATCH /users/me {displayName}` · `GET /users/me/export` · `DELETE /users/me {password?, confirm:"BORRAR"}`

## Pasos (`/steps`) 🔒

`GET /steps/summary` · `PUT /steps/pattern {pattern: string[≤20]}` · `POST /steps/reserve/allocate`

## Relojes en la nube (`/connections`)

| Método | Ruta | Notas |
|---|---|---|
| GET | `/connections` 🔒 | Estado de Fitbit, Withings y Garmin |
| POST | `/connections/:provider/start` 🔒 | `{authorizeUrl}` |
| GET | `/connections/:provider/callback` | Redirección del proveedor → `303` a `WEB_URL/dispositivos?connected=…` o `?error=…` |
| POST | `/connections/:provider/sync` 🔒 | `{days, credited}` |
| DELETE | `/connections/:provider` 🔒 | `204` |

## Móvil compañero (`/devices`)

| Método | Ruta | Notas |
|---|---|---|
| GET | `/devices` 🔒 | Dispositivos activos |
| POST | `/devices/pairing-code` 🔒 | `201 {code, expiresInSeconds}` |
| POST | `/devices/pair` | `{code, publicKey(base64 32B), name, platform: ios\|android}` → `201 {deviceId}` |
| POST | `/devices/ingest` | Cuerpo en texto JSON `{deviceId, timestamp, nonce, days:[{date, steps}]}` + `X-Device-Signature` (Ed25519, base64) |
| DELETE | `/devices/:id` 🔒 | Revoca |

## Webhooks (`/webhooks`)

`GET|POST /webhooks/fitbit` · `HEAD|GET|POST /webhooks/withings` · `POST /webhooks/garmin` · `POST /webhooks/stripe`

## Causas (`/causes`)

`GET /causes` · `GET /causes/:id` · `POST /causes` 🔒 `{title, description, demand, target, category, icon, color, goalPeople?, deadline?}` · `PATCH /causes/:id` 🔒 `{status?, theme?, description?}` · `POST /causes/:id/join` 🔒

Categorías: `medio-ambiente`, `animales`, `paz`, `derechos-humanos`, `vivienda`, `sanidad`, `educacion`, `igualdad`, `trabajo`, `otra`.

## Unidades (`/units`) 🔒

`GET /units` → `{roles, units[]}` (cada unidad incluye su `genome` derivado) · `POST /units/mint {role}` · `DELETE /units/:id` · `POST /units/deploy {unitIds[], causeId|null}` · `PUT /units/:id/loadout {placardStyle?, palette?, effect?, frame?}`

## Juego (`/game`) 🔒

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/game/state` | — | `{eco:{balance,pending,ratePerHour,storageHours}, progress, capacity, usedCapacity, upgrades[], roles[], fronts[], reserve, categorySteps, track[], categoryUnits[]}` |
| POST | `/game/collect` | — | `{balance, collected, state}` |
| POST | `/game/upgrades/:id` | — | `state` |
| POST | `/game/fronts/:causeId/send` | `{role, count}` | `state` |
| POST | `/game/fronts/:causeId/recall` | `{role, count}` | `state` |
| POST | `/game/auto-deploy` | — (nivel 10) | `state` |

Cada unidad de `/units` incluye `rank {id, label, mult, hours, nextAtHours}`. `POST /units/mint` cobra Eco (`mintCost`) y comprueba los requisitos de categoría.

## Pancartas (`/placards`)

`GET /placards/cause/:causeId` · `POST /placards` 🔒 `{causeId, text, style?}` · `POST /placards/:id/vote` 🔒 · `POST /placards/:id/report` 🔒 · `DELETE /placards/:id` 🔒

## Protestas (`/protests`)

`GET /protests/world` · `GET /protests/:causeId/scene` → `{cause, stats:{uniquePeople,totalSteps,deployedUnits,figures,blocks}, blocks[], placards[], milestones[]}` (Bearer opcional para marcar `mine`). Cada bloque es `{key, type:'unit'|'citizens', owner:{displayName,level}|null, placard, steps, units:[{id,s,r,q,n,k,l}] | citizens:[{s,steps}], power}` · `GET /protests/:causeId/live` (SSE: `steps {steps, at}`, `milestone {kind, threshold, at}`, `deploy {delta, at}`)

## Tienda (`/shop`) 🔒

`GET /shop` → `{paymentsEnabled, items[]}` · `POST /shop/checkout {itemId}` → `{url}`

## Salud

`GET /health` → `{ok: true}`

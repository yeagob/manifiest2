# 03 · Interconexión con smartwatches

Código: `server/src/providers/*`, `server/src/devices/routes.js`, `web/src/pages/DevicesPage.jsx`, `mobile/`.

## Cobertura

| Reloj | Vía | Tipo | Estado |
|---|---|---|---|
| Fitbit, Google Pixel Watch | Fitbit Web API | OAuth2 + PKCE, webhook firmado | Implementado |
| Withings (ScanWatch, Steel HR…) | Withings Public API | OAuth2, notificación → *pull* | Implementado |
| Garmin | Garmin Connect Developer Program (Health API) | OAuth2 + PKCE, webhook *ping* → *pull* | Implementado; requiere que Garmin apruebe la app como partner |
| Apple Watch | Apple Health (HealthKit) | App móvil compañera, envío firmado Ed25519 | Implementado en `mobile/` |
| Wear OS, Samsung Galaxy Watch, Xiaomi, Oppo, Polar o Garmin vía Android | Health Connect | App móvil compañera | Implementado en `mobile/` |

Apple Health y Health Connect **no tienen API en la nube**: los datos viven en el teléfono. Por eso existe la app compañera.

## Reloj en la nube (OAuth)

```
Web ──POST /connections/:p/start──► server genera state + PKCE (verifier cifrado, 10 min)
  ◄── authorizeUrl ───────────────
Navegador ──► proveedor (consentimiento) ──► GET /connections/:p/callback?code&state
server: valida state (un solo uso) → intercambia code (+ verifier) → cifra tokens (AES-256-GCM)
      → suscribe webhook → importa los últimos 7 días → redirige a /dispositivos?connected=p
```

- **Una cuenta de reloj solo puede pertenecer a un usuario** (`UNIQUE(provider, external_user_id)`). Así se evita que varias personas compartan un reloj para multiplicarse.
- **Refresco de tokens** automático cuando falta menos de un minuto para que caduquen. Fitbit rota el refresh token, así que se persiste siempre el nuevo. Un **cerrojo por conexión** (`withLock`) evita que dos sincronizaciones concurrentes gasten el mismo refresh token.
- Si el proveedor responde 401/403, la conexión pasa a `reauth_required` y la web muestra "Reconecta".

### Webhooks

| Proveedor | Ruta | Verificación |
|---|---|---|
| Fitbit | `GET /api/webhooks/fitbit?verify=` | Compara con `FITBIT_SUBSCRIBER_VERIFY` (204 u 404). |
| Fitbit | `POST /api/webhooks/fitbit` | `X-Fitbit-Signature` = HMAC-SHA1(body, `client_secret&`), comparado en tiempo constante. Responde 204 al instante y sincroniza en segundo plano. |
| Withings | `POST /api/webhooks/withings` | Sin firma: la notificación solo **dispara un pull** con nuestro propio token, así que no se confía en el contenido. |
| Garmin | `POST /api/webhooks/garmin` | Modo *ping*: solo se sigue `callbackURL` si es `https://apis.garmin.com` (**protección anti-SSRF**, ver `isTrustedGarminCallback`), y siempre con el token del usuario. |

## Móvil compañero (Apple Watch / Wear OS)

```
Web ─POST /devices/pairing-code─► código de 8 caracteres (10 min, un uso)
Móvil: genera par Ed25519 (clave privada en Keychain/Keystore)
Móvil ─POST /devices/pair {code, publicKey, name, platform}─► deviceId
Móvil ─POST /devices/ingest  body={deviceId,timestamp,nonce,days[]}
       cabecera X-Device-Signature = Ed25519(body)
server: verifica firma sobre los bytes exactos → |ahora−timestamp| ≤ 5 min → nonce no repetido
      → libro mayor (fuente device:ios | device:android)
```

- Máximo 5 dispositivos por cuenta. Se revocan desde la web (`DELETE /api/devices/:id`).
- La firma demuestra que *ese dispositivo emparejado* envió *ese cuerpo*. No demuestra que los pasos sean reales frente a una app modificada; eso se mitiga con las reglas de integridad del [libro mayor](04-libro-mayor.md) y, en la hoja de ruta, con App Attest y Play Integrity.

## Varias fuentes, sin doble conteo

Cada fuente informa **totales diarios** (`source_daily`). El día abonado es el **máximo entre fuentes**, nunca la suma. Así, conectar el Fitbit y el iPhone a la vez no duplica pasos. Ver [04-libro-mayor](04-libro-mayor.md).

## Configuración

Variables en `server/.env.example`: `FITBIT_*`, `WITHINGS_*`, `GARMIN_*`. Un proveedor sin credenciales aparece como "No disponible en este servidor". Las URLs de retorno que hay que registrar en cada consola son:

- `https://TU_API/api/connections/{fitbit|withings|garmin}/callback`
- Webhooks: `https://TU_API/api/webhooks/{fitbit|withings|garmin}`

## Tests

`server/test/providers.test.js` (flujo OAuth completo con `fetch` simulado, state falsificado, reutilización de state, cifrado de tokens, firma del webhook, anti-SSRF de Garmin) y `server/test/devices.test.js` (emparejamiento, firma válida o manipulada, clave ajena, marca temporal vieja, repetición y revocación).

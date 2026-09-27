# 02 · Registro y autenticación

Código: `server/src/auth/service.js`, `server/src/auth/routes.js`, `server/src/security/{passwords,tokens}.js`, `web/src/pages/AuthPages.jsx`.

## Flujos

### Registro con email

1. `POST /api/auth/register {email, password, displayName}` valida la contraseña (mínimo 10 caracteres, no común, no repetitiva y sin contener el email).
2. Se crea el usuario **no verificado** y se envía un **código de 6 dígitos** que caduca a los 15 minutos.
3. `POST /api/auth/verify-email {email, code}` marca el email como verificado y abre sesión.

**Anti-enumeración**: si el email ya existe, la respuesta es idéntica (`202`). El dueño recibe un correo "ya tienes cuenta" o un código nuevo si seguía sin verificar. Además se gasta el mismo tiempo de CPU (`burnPasswordTime`), así que la cuenta no se revela ni por el mensaje ni por el tiempo de respuesta.

### Login

`POST /api/auth/login`. Tras 8 fallos seguidos, la cuenta se bloquea 15 minutos. Una cuenta sin verificar recibe un código nuevo y un `403 email_unverified`, y la web redirige a `/verificar`.

### Google (opcional)

`POST /api/auth/google {idToken}` verifica el ID token con `google-auth-library` y la audiencia `GOOGLE_CLIENT_ID`. Exige `email_verified`. Vincula por `google_sub` o por email.

### Recuperación y cambio de contraseña

- `POST /api/auth/password/forgot` → código `reset` (15 minutos).
- `POST /api/auth/password/reset {email, code, password}` → nueva contraseña, **revoca todas las sesiones** y avisa por email.
- `POST /api/auth/password/change` (autenticado) → igual, pero exige la contraseña actual.

## Sesiones

| Elemento | Detalle |
|---|---|
| Access token | JWT HS256, **15 minutos**, `iss=manifiest`, `aud=manifiest-app`. Vive solo en memoria en la web (nunca en `localStorage`). |
| Refresh token | 48 bytes aleatorios. En la base de datos solo se guarda su **SHA-256**. Cookie `mf_rt` `HttpOnly; Secure (prod); SameSite=Strict; Path=/api/auth`, 30 días. |
| Rotación | Cada `POST /api/auth/refresh` emite un token nuevo y revoca el anterior (`replaced_by`). |
| Detección de robo | Reutilizar un refresh ya rotado **revoca toda la familia** de sesiones y queda en `audit_log` como `auth.refresh_reuse_detected`. |
| Cierre | `logout` revoca la familia actual y `logout-all` revoca todas. |

La web llama a `/auth/refresh` al arrancar (`useSession.boot`). Ante un `401`, `lib/api.js` intenta **una** renovación *single-flight* y repite la petición.

## Códigos de email

Se guarda `HMAC-SHA256(JWT_SECRET, userId:code)`, nunca el código. Como máximo hay 5 intentos por código, y emitir uno nuevo invalida el anterior.

## Protección CSRF

El refresh viaja en cookie, así que:
- La cookie es `SameSite=Strict` y su `Path` está limitado a `/api/auth`.
- Todo método no seguro bajo `/api/auth` exige la cabecera `X-Requested-With: manifiest`, que un formulario de otro origen no puede enviar sin pasar por CORS.
- El resto de la API usa `Authorization: Bearer`, que no se adjunta sola.

## Límites de peticiones

`server/src/security/rateLimits.js`: `auth` (20 cada 15 min), `refresh` (120 cada 15 min), `email` (6 por hora), `write` (40 por minuto), `ingest` (30 por minuto) y `global` (300 por minuto). Detrás de un proxy, `trust proxy` = 1 en producción.

## Tests

`server/test/auth.test.js`: registro, verificación, cookie segura, CSRF, anti-enumeración, rotación y reutilización, bloqueo, recuperación y token manipulado.

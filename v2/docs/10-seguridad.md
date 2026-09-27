# 10 · Seguridad

Resumen del modelo de amenazas y los controles aplicados. Código principal: `server/src/security/`, `server/src/middleware/`, `server/src/app.js`.

## Activos

1. **Legitimidad de las cifras** (pasos y personas): el activo político.
2. Cuentas de usuario y sesiones.
3. Tokens OAuth de relojes (dan acceso a datos de salud en terceros).
4. Datos personales: email, historial de pasos.
5. Pagos.

## Amenazas y controles

| Amenaza | Control |
|---|---|
| **Inflar cifras con cuentas falsas** | Email verificado obligatorio; una cuenta de reloj por usuario (`UNIQUE(provider, external_user_id)`); una clave de dispositivo por dispositivo; límites de peticiones. Hoja de ruta: prueba de persona única. |
| **Inflar pasos** | Tope diario de 70.000 con `integrity_flags`; máximo entre fuentes (nunca suma); sin entrada manual; ventana de 30 días; fechas futuras rechazadas; totales monótonos por fuente. |
| **Falsificar lecturas del móvil** | Ed25519 por dispositivo (clave privada en Keychain/Keystore, `THIS_DEVICE_ONLY`); firma sobre los bytes exactos; ventana de ±5 min; *nonce* único anti-replay; revocación. |
| **Webhooks falsos** | Fitbit: HMAC-SHA1 en tiempo constante. Withings: solo dispara *pull* con nuestro token. Garmin: solo sigue `https://apis.garmin.com` (**anti-SSRF**). Stripe: firma oficial y comprobación de importe. |
| **Robo de contraseñas** | scrypt (N=2¹⁷, r=8, p=1, 64 bytes, sal de 16 bytes); política mínima; bloqueo tras 8 fallos; tiempo constante ante usuario inexistente. |
| **Enumeración de cuentas** | Respuestas idénticas en registro, recuperación y reenvío; correo "ya tienes cuenta" al dueño real. |
| **Robo de sesión** | Access token de 15 min solo en memoria; refresh en cookie `HttpOnly`, `SameSite=Strict`, `Path=/api/auth`, `Secure` en producción; rotación con detección de reutilización que revoca toda la familia. |
| **CSRF** | `SameSite=Strict` + cabecera `X-Requested-With: manifiest` obligatoria en métodos no seguros de `/api/auth`; la API de datos usa `Bearer`. |
| **XSS** | React escapa por defecto (sin `dangerouslySetInnerHTML`); CSP estricta (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`); fuentes autoalojadas. |
| **Tokens OAuth filtrados desde la base de datos** | AES-256-GCM con `TOKEN_ENCRYPTION_KEY` (32 bytes) fuera de la base de datos; `code_verifier` PKCE también cifrado; `state` guardado solo como hash. |
| **Robo del flujo OAuth** | PKCE S256 (Fitbit, Garmin); `state` aleatorio de un solo uso con 10 minutos de caducidad; `redirect: 'error'` en las llamadas salientes. |
| **Inyección SQL** | Solo consultas preparadas con parámetros. El único SQL dinámico usa placeholders generados o nombres de tabla constantes. |
| **Validación de entrada** | `zod` con `.strict()` en cada endpoint de escritura; límites de tamaño (64 KB JSON, 32 KB ingestión, 256 KB webhooks). |
| **Abuso o DoS** | `express-rate-limit` por ruta; SSE limitado por causa; `AbortSignal.timeout` de 10 s en llamadas a proveedores. |
| **Contenido de odio** | Normalización, lista de bloqueo, sin enlaces, denuncias con ocultación automática. |
| **Cabeceras** | `helmet`: HSTS 2 años con *preload* en producción, `noSniff`, `referrerPolicy`, `x-powered-by` desactivado. |
| **Secretos** | En producción el arranque **falla** si faltan `JWT_SECRET`, `TOKEN_ENCRYPTION_KEY` o `SMTP_URL`. En desarrollo se usan secretos efímeros con aviso. |
| **Dependencias** | `npm audit` sin vulnerabilidades conocidas en el momento de la V2 (se actualizaron `nodemailer` y `google-auth-library`). |
| **Auditoría** | `audit_log`: registros, inicios de sesión, bloqueos, reutilización de refresh, vinculaciones, dispositivos, compras y borrados. |

## Seguridad de quien protesta

Protestar puede ser peligroso en muchos países. Por diseño:

- No se recoge **ubicación** en ningún punto: ni GPS, ni ciudad, ni IP persistida más allá del registro de auditoría.
- Nombre público seudónimo; el email nunca se expone en la API pública (lo cubren los tests).
- El evento en directo no incluye identidad.
- Exportación y borrado de cuenta en autoservicio.

## Riesgos conocidos y siguientes pasos

1. **Apps móviles modificadas**: añadir Apple App Attest y Google Play Integrity al emparejamiento y a la ingestión.
2. **Granjas de cuentas con relojes reales**: detección de patrones coordinados, prueba de persona única preservando la privacidad y reputación por antigüedad.
3. **Moderación**: panel de moderación para las pancartas ocultas (hoy solo existe `admin` para ocultar o borrar).
4. **Varios nodos**: mover los límites de peticiones y los eventos a Redis.
5. **2FA** opcional (TOTP o *passkeys*) para creadores de causas grandes.
6. Auditoría de seguridad externa antes de campañas de alto perfil.

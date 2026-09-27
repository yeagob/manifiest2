# 11 · Privacidad y RGPD

Código: `server/src/users/routes.js`, `web/src/pages/ProfilePage.jsx`.

## Datos que se tratan

| Dato | Para qué | Dónde |
|---|---|---|
| Email | Acceso y avisos de seguridad | `users.email` (nunca público) |
| Nombre público | Firma de pancartas y escena | `users.display_name` |
| Totales diarios de pasos por fuente | Libro mayor | `source_daily`, `daily_credit`, `step_ledger` |
| Tokens OAuth de relojes | Leer pasos | `connections` (cifrados) |
| Clave pública del móvil | Verificar lecturas | `devices` |
| Compras | Entregar cosméticos | `payments`, `entitlements` |
| IP en eventos de seguridad | Detección de abuso | `audit_log` |

**No se tratan**: ubicación, rutas, frecuencia cardiaca, sueño ni ningún otro dato de salud. Los *scopes* solicitados son los mínimos: `activity` (Fitbit), `user.activity` (Withings) y lectura de `Steps` (HealthKit / Health Connect).

## Derechos en autoservicio

- **Acceso y portabilidad**: `GET /api/users/me/export` descarga un JSON con todo (perfil, pasos, asientos, reparto, unidades, pancartas, conexiones y dispositivos).
- **Rectificación**: `PATCH /api/users/me`.
- **Supresión**: `DELETE /api/users/me {password, confirm: "BORRAR"}`. Borra pasos, asientos, unidades, pancartas, conexiones, dispositivos, sesiones y derechos de compra; resta sus pasos de las causas; anonimiza la fila de usuario (email `deleted-…@invalid`, sin contraseña). Las causas creadas se conservan sin nombre.
- **Desvincular relojes**: revoca el token en el proveedor cuando este lo permite (Fitbit) y lo borra.

## Pendiente para producción

- Política de privacidad y aviso legal redactados por un profesional.
- Registro de actividades de tratamiento y evaluación de impacto (los datos de actividad física pueden considerarse datos de salud, de categoría especial). Base jurídica: consentimiento explícito al conectar cada reloj.
- Retención del `audit_log` (propuesta: 90 días).

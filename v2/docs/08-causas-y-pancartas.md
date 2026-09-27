# 08 · Causas y pancartas

Código: `server/src/causes/routes.js`, `server/src/placards/routes.js`, `server/src/lib/text.js`, `web/src/pages/{CausesPage,CreateCausePage}.jsx`.

## Causa

Una causa es una **demanda concreta a un destinatario concreto**:

| Campo | Ejemplo |
|---|---|
| `title` | No a la guerra |
| `demand` | Destinar el aumento de gasto militar a cooperación |
| `target` | Gobierno de España |
| `goalPeople` | 100.000 personas (opcional, con barra de progreso) |
| `deadline` | Fecha límite (opcional) |
| `status` | `active` → `delivered` → `won` / `lost`, o `archived` |
| `theme` | Tema de avenida (cosmético del creador) |

- Métricas públicas: `uniquePeople` (usuarios con pasos abonados > 0), `totalSteps` y `deployedUnits`.
- Antifragmentación: un título duplicado se rechaza con "súmate a ella", y hay un máximo de 3 causas nuevas por usuario y día.
- `POST /api/causes/:id/join` añade la causa al patrón del usuario (una posición).
- Solo el creador o un `admin` puede cambiar estado, tema o descripción.
- Al pasar a `won`/`lost` el patrón deja de abonar a esa causa (solo se reparte entre causas `active`).

## Pancartas

- Entre 2 y 80 caracteres, normalizadas (NFC, sin caracteres de control ni *bidi overrides*, espacios colapsados).
- Prohibidos los enlaces y una lista de términos de odio o violencia (`placardProblem`).
- Estilo cosmético (`placard_carton`, `placard_riso`, `placard_neon`…), que hay que poseer.
- Máximo 3 pancartas activas por usuario y causa.
- **Voto**: 1 por persona (`placard_votes` con clave primaria compuesta), alternable.
- **Denuncia**: 1 por persona. Con 5 denuncias, la pancarta se oculta automáticamente a la espera de moderación.
- La pancarta más votada se imprime en la **pancarta de cabecera** gigante de la escena 3D.

# 04 · Libro mayor de pasos y patrón de reparto

Código: `server/src/steps/ledger.js`, `server/src/steps/routes.js`, `shared/src/distribution.js`, `shared/src/progression.js`.

## Modelo de datos

| Tabla | Rol |
|---|---|
| `source_daily` | Último total diario informado por cada fuente (`fitbit`, `garmin`, `device:ios`…). Solo crece. |
| `daily_credit` | Pasos **abonados** por día (máximo entre fuentes) y XP de ese día. |
| `step_ledger` | Asiento **append-only** por cada incremento: fecha, fuente, delta y reparto aplicado (JSON). Es la fuente de auditoría. |
| `allocations` | Total acumulado por usuario y causa. |
| `causes.total_steps` | Caché del total por causa, actualizada en la misma transacción. |
| `users.unallocated_steps` | Reserva: pasos abonados sin patrón o con todas sus causas cerradas. |

## Algoritmo `recordDailyTotal(user, source, date, steps)`

Todo ocurre en **una transacción SQLite**:

1. Validación: fuente conocida, fecha `YYYY-MM-DD`, no más de 1 día en el futuro. Las fechas de hace más de 30 días se ignoran.
2. Tope diario de **70.000** pasos: el exceso se recorta y queda en `integrity_flags`.
3. Si el nuevo total no supera el anterior de esa fuente, no se hace nada (idempotente).
4. `credited = MAX(source_daily.steps)` del día y `delta = credited − abonado previo`.
5. Si `delta > 0`:
   - Se recalcula el XP del día (con racha) y el nivel.
   - Si el día supera 2.000 pasos por primera vez, suma un día activo.
   - Se **reparte `delta`** según el patrón y el cursor del usuario.
   - Se escribe el asiento en `step_ledger` y se actualizan usuario, causas y asignaciones.
6. Tras el commit se emite `events.emit('steps', {causeId, steps})` para el directo.

**Invariante**: `Σ step_ledger.delta = users.total_steps = Σ allocations.steps + users.unallocated_steps`, y `Σ allocations` por causa = `causes.total_steps`.

## Patrón de reparto (la mecánica "1 animales, 1 clima, 3 guerra")

El patrón es un **ciclo ordenado** de hasta 20 posiciones. Cada posición apunta a una causa:

```
[animales, clima, guerra, guerra, guerra]   ← 20 % · 20 % · 60 %
```

`allocateSteps(pattern, cursor, n)` recorre el ciclo paso a paso desde `cursor`:

- `floor(n / len)` vueltas completas reparten exactamente según las proporciones.
- El resto `n % len` avanza el cursor, que **se conserva entre lotes**. Nada se redondea ni se pierde: repartir 3 + 7 + 11 pasos da exactamente lo mismo que repartir 21 de una vez (lo cubre `shared/test/rules.test.js`).
- Si una causa del patrón se cierra, ese abono se reparte con las causas activas restantes y el cursor se reinicia.
- Sin patrón activo, los pasos van a la **reserva**. `POST /api/steps/reserve/allocate` la reparte cuando el usuario configure uno.

Editor en la web: `web/src/pages/MovementPage.jsx` → `PatternEditor`. Eliges un "pincel" (una causa) y pintas posiciones del ciclo.

## Progresión derivada

`shared/src/progression.js`:

- XP del día = `floor(pasos / 100)` + 20 si es día activo (≥ 2.000 pasos) + 5 por día de racha, hasta un máximo de +30.
- Nivel = `floor(sqrt(xp / 100)) + 1`.
- Solo cuentan pasos **abonados** por el libro mayor, así que las correcciones de integridad también afectan al XP.

## API

- `GET /api/steps/summary` → últimos 30 días abonados, fuentes y reparto por causa.
- `PUT /api/steps/pattern {pattern: string[]}` → valida que las causas existan y estén activas, y reinicia el cursor.
- `POST /api/steps/reserve/allocate`.

## Tests

`server/test/ledger.test.js`: patrón 1-1-3 con dos fuentes solapadas (sin doble conteo y con totales exactos), reserva, integridad (tope, futuro, antigüedad, fuente inválida) y subida de nivel.

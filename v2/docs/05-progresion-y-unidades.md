# 05 · Progresión, capacidad y unidades

Código: `shared/src/progression.js`, `shared/src/units.js`, `server/src/units/routes.js`, `web/src/pages/MovementPage.jsx`.

## Idea

Cuanto más caminas y más días vuelves, **más recursos tienes para hacerte ver**, pero tu voto no se multiplica:

| Se multiplica con el nivel | No cambia nunca |
|---|---|
| Capacidad de unidades | Personas únicas (siempre 1 por usuario) |
| Roles especiales desbloqueados | Pasos por causa (salen del libro mayor) |
| Probabilidad de rareza al acuñar | Votos de pancarta (1 por persona) |
| Cosméticos desbloqueables | |

## Capacidad

```
capacidad(nivel, díasActivos) = floor(3 + 1,5·(nivel−1) + 0,1·nivel²) + floor(díasActivos / 30)
```

| Nivel | 1 | 5 | 10 | 20 | 30 |
|---|---|---|---|---|---|
| Capacidad base | 3 | 11 | 26 | 71 | 136 |

El término de **antigüedad** (+1 cada 30 días activos) premia la constancia, no el tiempo delante de la pantalla. Es deliberado: no se optimiza por minutos de uso.

## Roles de unidad

| Rol | Coste | Nivel | Figuras en la escena |
|---|---|---|---|
| Manifestante | 1 | 1 | 1 |
| Abanderada | 2 | 3 | 1 (bandera alta) |
| Batucada | 3 | 5 | 3 |
| Megáfono | 3 | 7 | 1 |
| Humo de colores | 4 | 9 | 1 + partículas |
| Pancarta de cabecera | 6 | 11 | 6 + pancarta gigante con la pancarta más votada |
| Gigante | 8 | 14 | 1 figura ×2,4 |
| Carroza | 20 | 20 | 1 carroza |

La suma de costes de tus unidades nunca puede superar tu capacidad (`canMint`).

## Ciclo de vida

- **Acuñar**: `POST /api/units/mint {role}`. El servidor genera una semilla con HMAC(secreto, usuario:serie:uuid), tira la rareza con `rollRarity(seed, nivel, rol)` y guarda semilla, rol, rareza y nombre. El genoma completo se **deriva** de la semilla (ver [06](06-estetica-y-unidades-unicas.md)).
- **Desplegar**: `POST /api/units/deploy {unitIds[], causeId|null}`. Puedes poner **todas tus unidades en una sola causa**. `null` las devuelve a la reserva.
- **Equipar**: `PUT /api/units/:id/loadout {placardStyle, palette, effect, frame}`. Solo con cosméticos que poseas, por nivel o por compra.
- **Jubilar**: `DELETE /api/units/:id` libera capacidad. Es irreversible, y la semilla no se reutiliza jamás.

## Fidelidad en la escena

`GET /api/protests/:causeId/scene` devuelve:

- `stats.uniquePeople`, `stats.totalSteps`: salen del libro mayor.
- `stats.deployedUnits`, `stats.figures`: representación visual.

La interfaz **siempre** muestra "personas reales" junto a "figuras en la calle" y ofrece el interruptor *Vista fiel*.

## Tests

`server/test/game.test.js`: unicidad de semillas, límite de capacidad, bloqueo por nivel, despliegue ajeno prohibido, cosmético no poseído y un veterano que llena la avenida sin alterar las cifras.

# 17 · Juego de gestión e incremental

Código: `shared/src/economy.js`, `shared/src/units.js`, `server/src/game/{service,deploy,routes}.js`, `web/src/pages/CuartelPage.jsx`, `web/src/components/game/*`.

## Qué tipo de juego es

No hay personaje que controlar. El juego consiste en **organizar tus recursos entre las manis** y **hacer crecer tu movimiento** con mejoras incrementales. La mani es el escaparate; el **Cuartel** es donde se juega.

## Recursos

| Recurso | Origen | Uso | ¿Afecta a las cifras reales? |
|---|---|---|---|
| **Pasos** | Relojes verificados | Se reparten entre causas según tu patrón | **Son** las cifras reales |
| **XP / Nivel** | Pasos y días activos | Capacidad, desbloqueos | No |
| **Capacidad** | Nivel + antigüedad + Furgoneta | Cuántas unidades puedes tener | No |
| **Eco** 📣 | 1 por cada 100 pasos reales + generación pasiva de las unidades desplegadas + hitos | Acuñar unidades, comprar mejoras | No |
| **Unidades** | Se acuñan con Eco | Se despliegan en causas: presencia visual y Eco/h | No |

El Eco **nunca se compra con dinero** (la tienda solo vende estética) y nunca altera pasos, personas ni votos.

## Bucle principal

```
caminar ─► pasos reales ─► Eco (por pasos) ─┐
                                              ├─► acuñar unidades ─► desplegar en frentes ─► Eco/h ─┐
volver al cuartel ◄── caja de resistencia llena ◄──────────────────────────────────────────────────┘
                     └─► taller de mejoras (multiplicadores)
```

## Generación de Eco

```
Eco/h = Σ unidades desplegadas [ ecoRate(rol) × rango × necesidadEfectiva(causa) ]
        × (1 + 0,15 · Imprenta) × (1 + 0,03 · Red · causasDistintas)
```

- **Almacenamiento**: la caja de resistencia acumula como máximo `8 h + 4 h × Caja`. Hay que volver a «Recoger» (bucle de retorno clásico de los incrementales, sin castigo por ausencia).
- **Liquidación**: toda acción (desplegar, acuñar, mejorar) liquida antes el Eco pendiente al ritmo anterior, así que cambiar la estrategia nunca hace perder Eco.

## Estrategia: la necesidad de cada mani

```
ratio(causa)   = unidades desplegadas / personas
ratioGlobal    = Σ unidades / Σ personas (mín. 0,5)
necesidad      = clamp(ratioGlobal / ratio, 0,5, 3)    (una mani sin unidades = 3)
                 + 0,3 si la causa tiene menos de 7 días
efectiva       = 1 + (necesidad − 1) × (1 + 0,25 · Asamblea)   si necesidad > 1
```

Resultado: **reforzar manis olvidadas rinde más Eco**, y concentrarse en manis saturadas rinde menos. El sistema reparte la presencia visual de forma natural sin tocar las cifras reales, y ninguna causa se queda vacía.

Hay dos tensiones estratégicas:

- **Concentrar** en la mani más necesitada, potenciada por la Asamblea.
- **Diversificar** entre varias causas, con la Red de apoyo mutuo (+3 % por causa distinta y nivel).

La interfaz muestra un sello en cada frente: «¡REFUERZOS! x2,4», «NECESITA APOYO», «EQUILIBRADA», «BIEN CUBIERTA». Se ve a partir del nivel 4 (Mapa de necesidad).

## Taller de mejoras

| Mejora | Efecto por nivel | Coste base | Crecimiento | Máx. | Nivel mínimo |
|---|---|---|---|---|---|
| Imprenta de pancartas | +15 % Eco de unidades | 50 | ×1,6 | 20 | 2 |
| Caja de resistencia | +4 h de almacenamiento | 80 | ×1,8 | 10 | 2 |
| Zapatillas gastadas | +10 % Eco por pasos | 60 | ×1,55 | 25 | 3 |
| Furgoneta del colectivo | +1 capacidad | 200 | ×2,1 | 15 | 4 |
| Asamblea de coordinación | +25 % del bonus por necesidad | 150 | ×1,9 | 10 | 5 |
| Escuela de activismo | −8 % horas para subir de rango | 120 | ×1,7 | 10 | 6 |
| Red de apoyo mutuo | +3 % por causa distinta | 250 | ×2 | 10 | 8 |
| Taller de cartonería | −5 % coste de especiales | 300 | ×1,8 | 10 | 10 |

Coste del nivel *n*: `round(base × crecimiento^n)`.

## Unidades: coste, rendimiento y veteranía

| Rol | Capacidad | Eco/h | Acuñado (Eco) | Desbloqueo |
|---|---|---|---|---|
| Manifestante | 1 | 1 | 20 (las 3 primeras gratis) | Nv 1 |
| Abanderada | 2 | 2,2 | 60 | Nv 3 |
| Batucada (3 figuras) | 3 | 3,5 | 120 | Nv 5 |
| Megáfono | 3 | 3,5 | 120 | Nv 7 |
| Humo de colores | 4 | 4,5 | 180 | Nv 9 |
| Pancarta de cabecera (6) | 6 | 7 | 320 | Nv 11 |
| Coro (4) | 4 | 5 | 220 | Nv 12 |
| Gigante | 8 | 9,5 | 450 | Nv 14 |
| Bicicletada (3) | 5 | 6 | 300 | Nv 16 |
| Charanga (4) | 7 | 8 | 420 | Nv 18 |
| Carroza | 20 | 24 | 1.500 | Nv 20 |
| Farolillos de papel (2) | 6 | 7 | 380 | Nv 22 |
| Dragón de papel (8) | 24 | 30 | 2.400 | Nv 25 |
| Mosaico humano (12) | 28 | 36 | 3.200 | Nv 30 |
| Bandada de palomas | 8 | 11 | 700 | Nv 6 + 50.000 pasos a causas de **Paz** |
| Árbol andante | 8 | 11 | 700 | Nv 6 + 50.000 pasos a **Medio ambiente** |
| Ballena de papel (4) | 12 | 16 | 1.100 | Nv 6 + 80.000 pasos a **Animales** |
| Casa a cuestas | 8 | 11 | 700 | Nv 6 + 50.000 pasos a **Vivienda** |
| Arcoíris gigante (5) | 10 | 13 | 900 | Nv 6 + 60.000 pasos a **Igualdad / Derechos humanos** |

**Veteranía**: las horas en la calle se acumulan aunque la unidad cambie de causa.

| Rango | Horas | Multiplicador de Eco | Insignia |
|---|---|---|---|
| Novata | 0 | ×1 | — |
| Curtida | 24 | ×1,25 | Estrella |
| Veterana | 168 (1 semana) | ×1,6 | Escarapela |
| Histórica | 720 (1 mes) | ×2,2 | Sello dorado con corona |

Jubilar una unidad libera capacidad, pero pierde su veteranía para siempre: una decisión con peso.

## Hitos de causa

Cuando una causa cruza un umbral de personas (10, 25, 50, 100, 250… 1.000.000) o de pasos (100.000 … 1.000 millones):

- Se registra una vez en `milestones`.
- Quien tenga unidades desplegadas allí **recibe 25 Eco por unidad** (máximo 500): recompensa por *estar* cuando pasó.
- Se emite por SSE: en la mani salta una **viñeta de cómic** y la sugerencia de «Momento épico» para el modo foto.

## Despliegue estratégico (nivel 10)

`POST /api/game/auto-deploy` reparte toda la reserva entre las tres manis con mayor necesidad (≥ 1), de forma proporcional a su necesidad.

## API

`GET /api/game/state` · `POST /api/game/collect` · `POST /api/game/upgrades/:id` · `POST /api/game/fronts/:causeId/send {role, count}` · `POST /api/game/fronts/:causeId/recall {role, count}` · `POST /api/game/auto-deploy`.

## Tests

`shared/test/economy.test.js` (fórmulas) y `server/test/economy.test.js`: acumulación y tope, recogida, Eco por pasos, coste creciente del taller, acuñado con Eco, unidades de causa, veteranía que sobrevive a la retirada, despliegue estratégico, hitos con recompensa y migración de bases de datos antiguas.

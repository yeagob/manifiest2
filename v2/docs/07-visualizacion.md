# 07 · Visualización de la manifestación

Código: `web/src/components/ProtestCanvas.jsx`, `web/src/pages/MarchPage.jsx`, `web/src/pages/WorldPage.jsx`, `server/src/protests/routes.js`.

## Dos escalas

### Mundo (`/mundo`) · vista global

- Plaza central rosa de la que salen **avenidas radiales**, una por causa.
- **Longitud de la avenida ∝ √(pasos reales)** de la causa: la comparación entre causas es siempre fiel.
- Densidad de figuras = personas + figuras de unidades (máximo 400 por avenida), en el color de la causa.
- Etiqueta con título, **personas** y **pasos**. Al hacer clic se entra en la marcha.

### Avenida (`/marcha/:id`) · detalle

- Calle con asfalto, marcas viales y edificios procedurales en tintas Riso. El tema viene de la causa (`theme_plaza`, `theme_litoral`, `theme_neon`, `theme_bosque`).
- **Multitud instanciada** (`InstancedMesh`): cuerpo, cabeza, pelo y pancarta son 4 draw calls para hasta 5.000 figuras. Color por instancia desde el genoma y animación de balanceo desfasada por figura.
- **Unidades especiales**: pancarta de cabecera gigante con el texto de la pancarta más votada, carrozas, gigantes ×2,4 y humo de colores con partículas.
- **Pancartas flotantes** (`Billboard` + `Text` con Anton autoalojada) con las 8 más votadas.
- **Directo**: `EventSource` sobre `GET /api/protests/:id/live`. Cada abono de pasos a la causa hace que la multitud se agite más durante 2,5 s, lanza confeti y suma el contador "+N en directo".

### Cámaras

| Preset | Uso |
|---|---|
| 🚁 Dron | Plano cenital. Se aleja según la profundidad de la marcha para verla entera. |
| 🚶 A pie de calle | Lateral a la altura de los ojos, dentro del río de gente. |
| 🪧 Cabecera | Frente a la pancarta principal: la "foto de portada". |

Transición suave (`lerp`). `OrbitControls` permite explorar libremente, y tocar la escena cancela la transición.

## Fidelidad visual

- El HUD muestra siempre **personas reales**, **pasos** y **figuras en la calle**.
- *Vista fiel* dibuja exactamente **una figura por persona**, con independencia de sus unidades.
- La escena ordena primero las unidades de mayor coste, para que la cabecera tenga sus pancartas y carrozas.

## Rendimiento

- `three` va en su propio *chunk*, y Marcha y Mundo se cargan con `lazy()`, así que la portada no descarga three.js.
- `dpr` limitado a [1, 1,75], sombras de 1024², niebla para recortar la distancia visible.
- El servidor limita la escena a 3.000 unidades y 1.500 personas. Para marchas mayores, el siguiente paso es agregar por bloques en el servidor y mostrar impostores o partículas a distancia (ver [15-hoja-de-ruta](15-hoja-de-ruta.md)).
- Directo: máximo 2.000 espectadores SSE por causa y nodo, con latido cada 25 s. El evento no incluye identidad del usuario.

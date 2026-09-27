# 16 · Dirección de arte: «Papel y Cartón» con acentos de Serigrafía

Código: `web/src/styles/tokens.css`, `web/src/styles/app.css`, `web/src/styles/game.css`, `web/src/styles/march.css`, `web/src/components/UnitSVG.jsx`, `web/src/march/paper.js`, `web/src/march/textures.js`, `web/src/march/photo.js`.

## Idea en una frase

> Una manifestación hecha a mano: cartulina, cartón de caja, cinta de carrocero y rotulador. Cuando la marcha alcanza un momento culminante, el mundo se **imprime en serigrafía**: tinta gruesa, trama de semitono, viñeta de cómic y onomatopeyas.

## Por qué

| Objetivo | Cómo lo resuelve el estilo |
|---|---|
| Relación directa entre carta y mani | La carta **es** la figura: el mismo SVG recortable sirve para la colección y como textura en 3D. |
| Multitudes enormes a bajo coste | Cada figura son dos triángulos con textura. Con agrupación por distancia, miles de personas funcionan en móvil. |
| ADN de protesta | La cultura de la pancarta casera (cartón, rotulador, cinta) y la del cartel serigrafiado son el lenguaje visual real de la calle. |
| Identidad propia | Lejos del 3D genérico de consola: se reconoce en una captura de un vistazo. |

## Principios

1. **Todo es un recorte.** Personajes, edificios, árboles, nubes, pancartas y dragones tienen **borde troquelado blanco** y una **sombra de grosor** desplazada (2,5 px, 3 px), como si estuvieran cortados y apoyados.
2. **Materiales reconocibles.** Papel crudo `#EFE7D8` con fibras y grano, cartulina blanca `#FFFDF6`, cartón kraft `#C9A26B` y cinta adhesiva translúcida.
3. **Tintas planas, sin degradados.** Doce tintas de risografía (Fluo Pink, Blue, Yellow, Green, Orange, Teal, Purple, Red, Mint, Sunflower, Navy e Ink). Los degradados se reservan para el cielo y las auras legendarias.
4. **La tinta es un acento, no la norma.** El contorno negro grueso (Serigrafía) aparece en botones, sellos, títulos y **momentos culminantes**. El resto es papel sin contorno.
5. **Movimiento de papel.** Las figuras se balancean y giran hacia la cámara con un retardo (como un recortable que se voltea) y los edificios se despliegan como un libro *pop-up*.

## Sistema de color

| Uso | Token | Valor |
|---|---|---|
| Fondo | `--paper` | `#EFE7D8` (noche: `#17142B`) |
| Hoja | `--sheet` | `#FFFDF6` |
| Cartón | `--kraft` | `#C9A26B` |
| Tinta | `--ink` | `#1D1B2F` |
| Acción principal | `--pink` | `#FF48B0` |
| Acción secundaria | `--blue` | `#0078BF` |
| Resalte / botón base | `--yellow` | `#FFE800` |
| Rarezas | `--rarity-*` | gris tinta · azul · púrpura · dorado |

Los títulos `h1` llevan **desregistro de serigrafía**: la sombra rosa se desplaza (3, 2) y la azul (−2, −1), como dos pasadas mal alineadas.

## Tipografía

| Rol | Fuente | Por qué |
|---|---|---|
| Titulares, pancartas, cifras | **Anton** | Condensada y gritona: la letra del cartel de protesta. |
| Interfaz | **Bricolage Grotesque** | Cálida, con carácter; legible en tamaños pequeños. |
| Números técnicos | **JetBrains Mono** | Cifras tabulares en contadores y tiempos. |

Todas se sirven desde el propio dominio (`@fontsource`): no hay dependencia de Google Fonts, la CSP es estricta y el texto 3D (troika) y los carteles en canvas usan exactamente la misma Anton.

## Componentes de interfaz

| Componente | Tratamiento |
|---|---|
| `.card` | Hoja de papel con grano y sombra de papel apoyado. Variantes `.kraft`, `.taped` (cinta arriba), `.tilt-l` y `.tilt-r` (ligera inclinación). |
| `.btn` | Pastilla de cartulina con contorno de tinta y sombra dura: el único elemento siempre entintado, porque es lo que se pulsa. |
| `.stamp` | Sello de goma: doble borde, Anton, girado −5°, textura de tinta irregular. Se usa para necesidad de las manis, estados y bloqueos. |
| `.tabs` / `.tab` | Pestañas de carpeta de cartón. |
| Barra superior | Tira de kraft con borde inferior rasgado. |
| `.onomatopeya` | Anton amarilla con contorno de tinta de 3 px y doble sombra (rosa y tinta): el sello de los momentos culminantes. |

## Personajes: identidad recortable

- El genoma (`shared/src/genome.js`) no cambia: cuerpo, piel, peinado, prenda, estampado, tocado, cara, expresión, objeto y aura.
- `UnitSVG` envuelve la figura en un filtro SVG `cut`: dilatación del alfa (borde blanco de 3,4 px), sombra desplazada y grano de papel.
- **Insignias de veteranía** en el pecho: estrella (Curtida), escarapela (Veterana), sello dorado con laurel y corona (Histórica).
- **Objetos de los roles nuevos**: cancionero (Coro), bicicleta (Bicicletada), trompeta (Charanga), farolillo, vara de porteador (dragón, ballena, arcoíris), cartulina de mosaico, paloma, disfraz de árbol y casa a la espalda.
- Las pancartas individuales llevan un lema corto determinista (`¡YA!`, `¡BASTA!`, `JUNTAS`…), derivado de la semilla.

## Mundo 3D

| Elemento | Tratamiento |
|---|---|
| Calle | Cartón gris azulado con marcas viales pintadas y bordillo kraft. La textura se desplaza: la mani camina sin fin. |
| Edificios | Recortes *pop-up* generados por semilla (plantas, ventanas, persiana y rótulo de comercio: BAR, FARMACIA, IMPRENTA…). Crecen desde el suelo al entrar en cuadro. |
| Segunda fila | Edificios más grandes tintados en lavanda: perspectiva aérea sin niebla gris. |
| Aceras | Árboles y farolas recortados. Por la noche, las farolas tienen halo aditivo. |
| Cielo | Degradado pintado según la hora: día (celeste → crema), atardecer (azul → naranja → girasol), noche (tinta → morado). Nubes recortadas. |
| Iluminación | Hemisférica + direccional con `MeshLambertMaterial`: sombreado plano que respeta el papel. |

## Momentos culminantes (Serigrafía)

Se activan cuando pasa un bloque épico (dragón, ballena, mosaico, arcoíris, pancarta de cabecera, carroza, gigante o unidad legendaria) o cuando la causa alcanza un hito.

1. **Plano de viñeta.** Marco de tinta de 14 px con filete de papel, líneas de acción radiales, trama de semitono en los bordes y contraste y saturación aumentados.
2. **Cámara de cómic.** La cámara se acerca al bloque con plano holandés (inclinación de ±0,14 rad).
3. **Cartela.** Caja amarilla entintada con el titular («¡LLEGA EL DRAGÓN DE PAPEL DE LUCÍA!»).
4. **Onomatopeya.** «¡BOOM!», «¡ZAS!», «¡AQUÍ ESTAMOS!» a toda pantalla con animación de impacto.
5. El HUD se retira para que el plano sea limpio y fotografiable.

Además, **cada sonido de unidad genera su onomatopeya en 3D** sobre el bloque: «¡PAM PAM!» (batucada), «¡FIU FIU!» (silbato), «¡TARARÍ!» (charanga), «¡GONG!» (dragón), «¡CURRUCÚ!» (palomas)… Los cánticos aparecen como el propio lema en letras de cómic.

## Qué no hacer

- Degradados o brillos plásticos en personajes.
- Contornos de tinta en todo: pierden su fuerza de acento.
- Fotografías o texturas realistas.
- Más de tres tintas protagonistas en una misma pantalla.
- Texto sobre figuras sin fondo de cartulina.

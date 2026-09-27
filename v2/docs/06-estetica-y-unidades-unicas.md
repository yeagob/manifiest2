# 06 · Propuesta estética y unidades únicas

> La dirección de arte vigente es **«Papel y Cartón» con acentos de Serigrafía**: ver [16 · Dirección de arte](16-direccion-de-arte.md). Este documento describe el genoma de las unidades, que no cambia. La paleta Riso sigue siendo el sistema de tintas; lo que cambia es el material (recortables de papel) y el uso de la tinta como acento.

Código: `shared/src/genome.js`, `web/src/components/UnitSVG.jsx`, `web/src/components/UnitCard.jsx`, `web/src/styles/tokens.css`.

## Dirección de arte: *Riso Street*

Inspirada en la **risografía** y la cartelería de protesta hecha a mano: tintas planas fluorescentes sobre papel crudo, ligero desregistro entre capas, grano de impresión, tipografía condensada gritona.

| Elemento | Decisión |
|---|---|
| Papel | `#F4EFE6` crudo, con grano SVG superpuesto al 18 % en modo *multiply* |
| Tintas | 12 tintas Riso reales: Fluo Pink `#FF48B0`, Blue `#0078BF`, Yellow `#FFE800`, Green `#00A95C`, Orange `#FF6C2F`, Teal, Purple, Red, Mint, Sunflower, Federal Navy e Ink `#1D1B2F` |
| Desregistro | Cada figura tiene una sombra de su silueta desplazada (3, 2) en su tinta secundaria al 30 % *multiply*, como dos pasadas de impresión mal alineadas |
| Tipografía | **Anton** para pancartas y titulares (grito de cartel), **Bricolage Grotesque** para la interfaz (cálida, con carácter) y **JetBrains Mono** para cifras. Servidas desde el propio dominio con `@fontsource` (sin Google Fonts: privacidad y CSP estricta) |
| Formas | Contornos de 2 px en tinta, sombras duras desplazadas (`4px 4px 0`), sin degradados salvo en rarezas altas |
| Personajes | *Chibi* tipo figura de vinilo: cabeza grande, cuerpo simple y expresivo, legible a 40 px |
| Modo oscuro | Papel `#16142A` con tintas intactas: una "manifestación nocturna" de neón |
| 3D | `meshToonMaterial` (sombreado plano por bandas), edificios en tintas Riso y temas de avenida (Plaza, Litoral, Neón, Bosque) |
| Accesibilidad | Contraste AA en texto, foco visible de 3 px y `prefers-reduced-motion` desactiva las animaciones |

## Unidades únicas: genoma procedural

Cada unidad nace de una **semilla** (32 hex) y un generador determinista (`createRng`, mulberry32 sobre FNV-1a). El mismo `generateGenome(seed, {rarity, role})` corre en servidor y cliente, así que la unidad es idéntica en todas partes sin guardar sus rasgos.

| Rasgo | Variantes |
|---|---|
| Cuerpo | redondo, alto, cuadrado, pera |
| Piel | 8 tonos inclusivos |
| Pelo | 12 peinados: corto, rizado, moño, largo, cresta, trenzas, afro, bob, rapado, coleta, calvo, ondas |
| Color de pelo | 6 naturales + 6 de fantasía (solo raras o superiores) |
| Prenda | sudadera, chubasquero, peto, chaqueta, camiseta, poncho, jersey, chaleco |
| Paleta de prenda | 12 combinaciones de dos tintas Riso diseñadas para contrastar |
| Estampado | liso, lunares, rayas, trama de semitono, cuadros · épicas y legendarias: holográfico, estrellas, llamas, olas |
| Cabeza | nada, gorra, gorro, cinta, corona de flores, casco, sombrero de pescador |
| Cara | nada, gafas, gafas redondas, pañuelo, pintura, corazón |
| Expresión | decidida, cantando, sonriente, gritando, serena, guiño |
| Objeto | según el rol: pancarta, bandera, flor, puño, bandera grande, tambor, megáfono, bengala de humo, pancarta de cabecera, gigante, carroza |
| Aura | común: nada · rara: brillo · épica: destellos · legendaria: halo dorado |
| Nombre | "Sustantivo + Adjetivo" en castellano (*Brisa Tenaz*, *Colibrí Indomable*). Las legendarias llevan título (*…del Último Kilómetro*) |

Espacio combinatorio de rasgos distintos: 4 cuerpos × 8 pieles × 12 peinados × 12 colores × 8 prendas × 12 paletas × 9 estampados × 7 tocados × 6 accesorios × 6 expresiones ≈ **1.000 millones** de combinaciones, antes de contar objeto, aura, altura e inclinación. La **semilla es única** en base de datos (`UNIQUE(seed)`), así que no hay dos unidades con la misma identidad.

### Rareza

`rollRarity(seed, level, role)` con probabilidades que crecen con el nivel:

| Nivel | Legendaria | Épica | Rara |
|---|---|---|---|
| 1 | 0,6 % | 3,4 % | 16 % |
| 10 | 1,5 % | 7 % | 25 % |
| 25+ | 3 % | 12 % | 35 % |

Los roles de coste ≥ 6 (pancarta de cabecera, gigante, carroza) son como mínimo raros.

### Personalización sobre la unidad

El genoma es la identidad; el **loadout** es la ropa que se puede cambiar:

- `palette`: sustituye las dos tintas (Bosque, Marea, Noche).
- `placardStyle`: cartón, risografía, serigrafía, neón o bordado.
- `effect`: confeti, pétalos, farolillos o aurora.
- `frame`: marco de colección para la carta (sello postal u holográfico).

## Recortable y veteranía

`UnitSVG` dibuja cada unidad como **recortable de papel** (borde troquelado blanco, sombra de grosor, grano opcional) y añade la insignia de su **rango de veteranía** en el pecho. El mismo SVG, sin grano para rasterizar más rápido, es la textura de la figura en la mani 3D: carta y figura son idénticas.

## Cartas de colección

`UnitCard` presenta cada unidad como una carta numerada (`#001`), con etiqueta de rareza, nombre y rol, y un fondo con degradado para épicas y legendarias. Está pensada para compartirse como imagen en redes: la unidad es a la vez identidad y orgullo.

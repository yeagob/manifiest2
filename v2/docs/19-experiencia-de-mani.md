# 19 · La experiencia de la mani

Código: `web/src/march/*`, `web/src/pages/MarchPage.jsx`, `server/src/protests/routes.js`.

## Manis infinitas

No hay destino. La calle se desplaza sin fin bajo los pies de la marcha (textura de la calzada y edificios reciclados), y la marcha camina para siempre. El traveling recorre la procesión de cabecera a cola y, al terminar, **vuelve a la cabecera** («la mani no termina nunca»). Las unidades nuevas se incorporan en directo.

## Estructura: bloques

`GET /api/protests/:id/scene` devuelve la marcha como **bloques**:

- Un **bloque por persona** con unidades desplegadas: su nombre público, nivel, pancarta más votada y unidades en formato compacto (`s` semilla, `r` rol, `q` rareza, `k` rango, `l` loadout). El genoma se deriva en el cliente, así que 150 unidades ocupan ~30 KB.
- **Bloques ciudadanos** de 24 personas que caminan con sus pasos pero sin unidades desplegadas (siguen siendo visibles: una persona, una figura).
- Orden: los bloques más potentes primero, intercalando un bloque ciudadano cada tres.
- `mine: true` marca el bloque de quien mira (si va autenticado) para «⭐ Mi bloque».

`buildMarch` (`march/layout.js`) coloca cada figura en 7 carriles y aplica **formaciones** por rol:

| Formación | Roles | Colocación |
|---|---|---|
| `banner` | Pancarta de cabecera | 6 porteadores en fila, pancarta gigante delante |
| `dragon` | Dragón de papel | 4 filas × 2 porteadores, dragón de 10 segmentos serpenteando encima |
| `mosaic` | Mosaico humano | 3 × 4 figuras bajo un plano horizontal de cartulinas que dibuja el icono de la causa (visible desde el dron) |
| `carriers` | Ballena, arcoíris | Porteadores con varas y el objeto flotando |
| `center` | Gigante, carroza | Centrados, a escala ×2,4 y ×2,2 |
| `row` | Batucada, coro, bici, charanga, farolillos | El grupo junto en la misma fila |
| `free` | El resto | Relleno por carriles |

Cada bloque abre con un **cartel de cartón** de su pancarta, con el estilo comprado o desbloqueado (cartón, riso, neón, bordado, serigrafía, collage o linograbado) y el crédito «BLOQUE DE LUCÍA · NV 30». La marcha abre con la **pancarta de cabecera de la causa** (título + exigencia).

## Niveles de detalle (LOD) por agrupación

No se dibujan 100.000 figuras sueltas. Se evalúa cada 200 ms la distancia de la cámara a cada bloque, con histéresis para evitar parpadeos:

| Nivel | Distancia | Qué se dibuja |
|---|---|---|
| **Cerca** | < 30 u | Cada figura como recortable con su textura única, animada (balanceo, vaivén, giro hacia cámara), cartel, especiales completos y efectos del loadout (confeti, pétalos…). |
| **Media** | < 150 u | **Un panel de cartón por bloque** con siluetas en los colores reales de sus figuras + cartel + especiales grandes (dragón, ballena, arcoíris, mosaico, pancarta) + **alfombra aérea** (cabezas vistas desde arriba en su posición real). |
| **Lejos** | ≥ 150 u | Un `InstancedMesh` para toda la marcha: cada bloque es una baldosa y una franja en sus colores dominantes. Dos draw calls en total. |

Con la cámara alta (y > 11), los bloques cercanos pasan a modo aéreo (alfombra + cartel horizontal) porque un recortable vertical visto desde arriba no se lee.

**Texturas**: `FigureTextures` rasteriza el SVG de cada unidad a 176×230 en una cola con 6 en paralelo, priorizando los bloques cercanos y con caché LRU de 900. Mientras llega, se muestra un **boceto instantáneo** en canvas con los colores del genoma (sin saltos visuales).

## Traveling de cámara

El modo por defecto. La cámara recorre **todas** las unidades a velocidad de paseo (1,7 u/s, un bloque cada 4–6 s), desde la acera y a la altura de los ojos, mirando ligeramente hacia la cola.

- Velocidades ×0,5 · ×1 · ×2 · ×4, pausa, y reanudación donde se dejó.
- **Se frena al 55 %** en bloques épicos para poder verlos.
- **Ficha del bloque** en la parte inferior: título, nivel, pancarta, unidades por rol y la unidad más rara con su recortable.
- **Barra de progreso** con marcas doradas en cada bloque épico y el tiempo total del recorrido (varios minutos en manis grandes).
- Otros modos: 🚁 **Dron** (aéreo siguiendo la marcha) y 🖐 **Libre** (órbita y zoom: al alejarse se ve el LOD por grupos).
- ⚖️ **Vista fiel**: reconstruye la marcha con **una figura por persona real** (cada bloque se reduce a un manifestante con la identidad de su unidad principal). El contador pasa a «figuras: 1 por persona».
- Tocar una figura abre su **ficha de identidad** (nombre único, rareza, rol, rango, bloque).
- **Marcadores de hito** a un lado de la calle: «100 PERSONAS HASTA AQUÍ», «1.000»…

## Sonido

Motor procedural en Web Audio (`march/audio.js`), sin ficheros de audio. Se activa con un toque (política de autoplay).

- **Espacial**: cada bloque cercano (hasta 6) es una fuente `PannerNode` HRTF en su posición. Al pasar la cámara, el sonido se acerca, pasa por un lado y se aleja.
- **Ambiente**: rumor de ciudad y multitud cuyo volumen crece con el logaritmo de las personas reales.
- **Reloj rítmico** común a 104 bpm con programación anticipada: todos los bloques suenan a tempo.
- **La cantidad importa**: la ganancia escala con √n de cada rol y los cánticos suman voces (hasta 8) según los manifestantes del bloque.

| Unidad | Sonido | Onomatopeya |
|---|---|---|
| Manifestante / ciudadanía | Murmullo + **cántico sintetizado del lema de la pancarta** (sílabas con formantes vocales, voces desafinadas) cada 16 compases | «¡NO A LA GUERRA!» |
| Megáfono | Acople + voz de líder distorsionada que canta el lema + respuesta coral del bloque | el lema |
| Batucada | Surdo en 2 y 4, caja en semicorcheas, repique | «¡PAM PAM!» |
| Abanderada | Silbato de samba con trino | «¡FIU FIU!» |
| Gigante | Bombo grave | «¡BOOM!» |
| Coro | Acordes sostenidos con vocales cambiantes | — |
| Bicicletada | Timbres | «¡RING RING!» |
| Charanga | Riff de metales | «¡TARARÍ!» |
| Carroza | Bombo a negras + línea de bajo | «¡UNTS UNTS!» |
| Farolillos | Campanitas pentatónicas | «¡CLIN!» |
| Dragón | Gong, platillos y tambores | «¡GONG!» |
| Mosaico | Oleada de cartulinas volteándose | «¡FLAP FLAP!» |
| Palomas | Aleteo y arrullo | «¡CURRUCÚ!» |
| Árbol andante | Pájaros y hojas | «¡PÍO PÍO!» |
| Ballena | Canto de ballena con reverberación | «¡UUUUUH!» |
| Casa a cuestas | Golpes de madera | «¡TOC TOC!» |
| Humo | Siseo | «¡FSSSHH!» |

Opcional **🗣 Voces**: lee en voz alta (síntesis del navegador, es-ES) la pancarta del bloque que tienes delante, una vez por bloque.

## Momentos épicos y viñetas

Detalle en [16 · Dirección de arte](16-direccion-de-arte.md#momentos-culminantes-serigrafía). Se disparan al pasar bloques épicos y con los hitos que llegan en directo por SSE. Las viñetas se desbloquean en el nivel 15; visitantes anónimos las ven siempre, como escaparate. Cada momento épico ofrece «📷 Capturar».

## Modo foto

Pensado para generar imágenes **bonitas y a la vez impactantes por las cifras**.

| Opción | Valores |
|---|---|
| Encuadre | Plano actual (congela el traveling), Río de gente (aéreo a lo largo de la calle), Cabecera, Retrato de bloque, Pancarta, Contrapicado, Libre |
| Hora | Día, Atardecer, Noche (nivel 8) |
| Filtro | Papel, Riso (bicromía rosa/azul con desregistro, nivel 6), Serigrafía (trama de semitono, nivel 12), Farolillos (nivel 8) |
| Formato | Historia 9:16 (1080×1920), Cuadrado 1:1, Panorámica 16:9 |
| Composición | Cifra épica (personas gigantes), Kilómetros, Mi bloque, Mínima |
| **Datos en el cartel** (activables por separado) | **Causa**, **Fecha**, **Personas que la apoyan**, Exigencia y destinatario, Pasos y figuras |

El cartel se compone en canvas: la foto pegada con cinta y ligeramente girada, el título de la causa en banda de color, la fecha en banda de tinta, «N PERSONAS APOYAN ESTA CAUSA» en banda rosa, cifra gigante con contorno de serigrafía, el sello «CIFRAS REALES» y la firma MANIFIEST. Todas las cifras salen del libro mayor. Se comparte con la Web Share API (con archivo) o se descarga.

## Rendimiento

- Unas 300 figuras cercanas como máximo y paneles agrupados a media distancia: la escena funciona en el renderizado por software de las pruebas automáticas.
- Geometrías compartidas por tamaño y materiales liberados al desmontar.
- La escena ocupa unos 30 KB para 150 unidades y se recarga con retardo cuando llegan despliegues en directo.

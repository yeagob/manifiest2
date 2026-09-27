# 18 · Progresión y experiencia de usuario por niveles

Código: `shared/src/progression.js` (`unlockTrack`, `FEATURES`, curva), `web/src/components/game/ProgressTrack.jsx`, `web/src/components/game/LevelUpModal.jsx`.

## Principios

1. **Cada nivel desbloquea algo.** Del 1 al 30 no hay ningún nivel vacío (lo comprueba un test).
2. **Revelación progresiva.** La complejidad aparece cuando el jugador ya domina lo anterior: primero desplegar, luego el taller, luego la estrategia de necesidad y al final el despliegue automático.
3. **El nivel mide compromiso real.** Solo sube con pasos verificados y días activos. No se compra ni se consigue sin moverse.
4. **Nunca se limita la voz política.** El reparto de pasos (hasta 20 posiciones en el patrón) está disponible desde el nivel 1. Se desbloquea juego, no derechos.
5. **Ritmo de los incrementales.** Muy rápido al principio (nivel 2 el primer día, nivel 5 en una semana), sostenido después: el nivel 30 llega hacia los 8 meses de constancia.

## Curva

`xpForLevel(n) = 60 · (n − 1)^1,8`. XP diaria típica con 8.000 pasos y racha: ~110 (80 por pasos + 20 por día activo + hasta 30 de racha).

| Nivel | XP acumulada | Días aprox. | Capacidad | Desbloqueos |
|---|---|---|---|---|
| 1 | 0 | ~0 | 3 | 🧍 Manifestante · 🎨 Cartón reciclado · 🎨 Plaza Mayor · ✨ Traveling de cámara · ✨ Modo foto |
| 2 | 60 | ~1 | 4 | 🛠️ Imprenta de pancartas · 🛠️ Caja de resistencia · ✨ Taller de mejoras |
| 3 | 209 | ~2 | 6 | 🧍 Abanderada · 🛠️ Zapatillas gastadas |
| 4 | 433 | ~4 | 9 | 🛠️ Furgoneta del colectivo · 🎨 Risografía · ✨ Mapa de necesidad |
| 5 | 728 | ~7 | 11 | 🧍 Batucada · 🛠️ Asamblea de coordinación |
| 6 | 1087 | ~10 | 14 | 🛠️ Escuela de activismo · 🎨 Confeti · ✨ Filtro Riso |
| 7 | 1509 | ~14 | 16 | 🧍 Megáfono |
| 8 | 1992 | ~19 | 19 | 🛠️ Red de apoyo mutuo · 🎨 Paleta Bosque · ✨ Hora nocturna |
| 9 | 2533 | ~24 | 23 | 🧍 Humo de colores |
| 10 | 3132 | ~29 | 26 | 🛠️ Taller de cartonería · 🎨 Marco sello postal · ✨ Despliegue estratégico |
| 11 | 3786 | ~35 | 30 | 🧍 Pancarta de cabecera |
| 12 | 4494 | ~41 | 33 | 🧍 Coro · 🎨 Serigrafía · ✨ Filtro Serigrafía |
| 13 | 5256 | ~48 | 37 | 🎨 Serpentinas |
| 14 | 6071 | ~56 | 42 | 🧍 Gigante |
| 15 | 6937 | ~64 | 46 | 🎨 Lluvia de pétalos · ✨ Viñetas épicas |
| 16 | 7854 | ~72 | 51 | 🧍 Bicicletada |
| 17 | 8822 | ~81 | 55 | 🎨 Marco kraft cosido |
| 18 | 9839 | ~90 | 60 | 🧍 Charanga · 🎨 Sendero del Bosque |
| 19 | 10.905 | ~100 | 66 | 🎨 Collage de recortes |
| 20 | 12.020 | ~110 | 71 | 🧍 Carroza |
| 21 | 13.183 | ~120 | 77 | 🎨 Paleta Atardecer |
| 22 | 14.393 | ~131 | 82 | 🧍 Farolillos de papel |
| 23 | 15.650 | ~143 | 88 | 🎨 Estrellas de papel |
| 24 | 16.954 | ~155 | 95 | 🎨 Linograbado |
| 25 | 18.303 | ~167 | 101 | 🧍 Dragón de papel |
| 26 | 19.699 | ~180 | 108 | 🎨 Pan de oro |
| 27 | 21.140 | ~193 | 114 | 🎨 Marco de serigrafía |
| 28 | 22.626 | ~206 | 121 | 🎨 Salpicadura de tinta |
| 29 | 24.157 | ~220 | 129 | 🎨 Verbena de barrio |
| 30 | 25.732 | ~234 | 136 | 🧍 Mosaico humano |

🧍 unidad · 🛠️ mejora del taller · 🎨 accesorio estético · ✨ función.

## Unidades de causa (vía temática)

Además de la vía por nivel, hay cinco unidades que se ganan **aportando pasos reales a causas de una categoría** (a partir del nivel 6): Bandada de palomas (Paz), Árbol andante (Medio ambiente), Ballena de papel (Animales), Casa a cuestas (Vivienda) y Arcoíris gigante (Igualdad y derechos). Premian el compromiso sostenido con un tema. El Cuartel muestra una barra de progreso por cada una.

## Viaje del jugador

| Momento | Qué vive | Diseño |
|---|---|---|
| **Minuto 1** | Se registra, conecta el reloj, entra en una mani. | Traveling automático con su causa. Recibe 3 manifestantes gratis. |
| **Día 1** | Sus primeros pasos se reparten; sube al nivel 2. | Modal «¡NIVEL 2!» con lo desbloqueado. Abre el taller y compra la primera Imprenta. |
| **Semana 1** | Nivel 5: batucada. Descubre el Mapa de necesidad. | Empieza la estrategia: mover unidades a manis que necesitan refuerzos. Sus unidades pasan a Curtidas. |
| **Mes 1** | Nivel 10: despliegue estratégico, marco de sello. Primeras unidades Veteranas. | Colección con identidad; primeras fotos compartidas con filtro Riso. |
| **Mes 3** | Nivel 15–18: gigante, viñetas épicas, charanga. | Su bloque protagoniza momentos de cómic en la mani. |
| **Mes 6+** | Nivel 20–25: carroza, farolillos, dragón. Unidades Históricas. | Su bloque es un espectáculo reconocible en cualquier traveling. |
| **Mes 8+** | Nivel 30: mosaico humano. | Dibuja el símbolo de la causa visto desde el dron: la foto aérea definitiva. |

## Momentos de interfaz

- **Subida de nivel**: modal de papel con «¡NIVEL N!» en onomatopeya de serigrafía y la lista ilustrada de desbloqueos (las unidades se muestran con su recortable). Se detecta comparando con el último nivel visto (`localStorage`, solo como comodidad).
- **Próximo desbloqueo**: tarjeta kraft con los XP que faltan, los días estimados y la unidad que viene.
- **Bloqueos visibles**: todo lo bloqueado se ve (en gris, con candado y el motivo concreto). Saber qué viene genera deseo.
- **Nueva unidad**: carta con sello de rareza y el nombre único («¡Se une Brisa Tenaz!»).

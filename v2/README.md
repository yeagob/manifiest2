# ✊ Manifiest V2 · Protesta 2.0

Videojuego y red social de manifestaciones: **conecta tu reloj, camina y reparte tus pasos entre las causas en las que crees**. Cuanto más constante eres, más unidades únicas despliegas y más espectacular se ve tu presencia en la avenida. Las cifras que llegan a los gobiernos, en cambio, son siempre reales: **una persona, una voz**.

## Qué incluye

- **Registro seguro**: email + código de verificación, Google opcional, sesiones rotatorias con detección de robo, recuperación, exportación y borrado de cuenta.
- **Smartwatches**: Fitbit / Pixel Watch, Withings y Garmin por OAuth y webhooks; Apple Watch y Wear OS / Samsung mediante la app móvil compañera con lecturas firmadas Ed25519.
- **Libro mayor fiel**: varias fuentes sin doble conteo, tope de integridad y el **patrón de reparto** ("de cada 5 pasos: 1 animales, 1 clima, 3 contra la guerra").
- **Juego de gestión incremental** (el Cuartel): Eco, taller de 8 mejoras, necesidad estratégica de cada mani, veteranía de las unidades, hitos con recompensa y despliegue estratégico.
- **Progresión**: 30 niveles con desbloqueos en cada uno (unidades, mejoras, accesorios y funciones) y 5 unidades ligadas a categorías de causa.
- **Unidades únicas**: genoma procedural determinista, 4 rarezas y 19 roles (del manifestante al dragón de papel y el mosaico humano), como recortables de papel.
- **Dirección de arte «Papel y Cartón»** con acentos de Serigrafía para los momentos culminantes.
- **Mani infinita**: LOD por grupos, traveling de cámara por toda la marcha, sonido procedural espacial por tipo y cantidad de unidades, onomatopeyas, viñetas de cómic, *Vista fiel* y directo por SSE.
- **Modo foto** con encuadres, horas, filtros (Papel, Riso, Serigrafía, Farolillos), formatos para redes y datos opcionales (causa, fecha, personas que la apoyan).
- **Tienda solidaria** solo estética con Stripe, para cubrir servidores sin vender poder.

## Arranque rápido

```bash
cd v2
npm install
npm test
npm run dev:server
npm run dev:web
npm run seed -w @manifiest/server
```

Abre `http://localhost:5173` y entra con `demo0@manifiest.local` (nivel 30) o `demo30@manifiest.local` (principiante), contraseña `manifiesto-demo-2026`. Detalles en [Despliegue](docs/13-despliegue.md).

## Estructura

```
v2/
├── shared/   reglas de juego puras (reparto, progresión, unidades, genoma, cosméticos)
├── server/   API Express 5 + SQLite, auth, relojes, libro mayor, escena, tienda
├── web/      React 19 + Vite + three.js (react-three-fiber)
├── mobile/   app Expo para Apple Health / Health Connect
└── docs/     documentación por feature y módulo
```

## 📚 Índice de documentación

| # | Documento | Contenido |
|---|---|---|
| 00 | [Visión y principios](docs/00-vision.md) | Problema, principios no negociables, bucle de juego |
| 01 | [Arquitectura](docs/01-arquitectura.md) | Paquetes, decisiones, mapa de módulos |
| 02 | [Registro y autenticación](docs/02-registro-y-autenticacion.md) | Flujos, sesiones, CSRF, límites |
| 03 | [Smartwatches](docs/03-relojes.md) | Fitbit, Withings, Garmin, Apple Watch, Wear OS, webhooks |
| 04 | [Libro mayor y patrón de reparto](docs/04-libro-mayor.md) | Algoritmo, invariantes, reserva |
| 05 | [Progresión y unidades](docs/05-progresion-y-unidades.md) | XP, niveles, capacidad, roles, despliegue |
| 06 | [Estética y unidades únicas](docs/06-estetica-y-unidades-unicas.md) | *Riso Street*, genoma procedural, rarezas |
| 07 | [Visualización de la marcha](docs/07-visualizacion.md) | Escena 3D, cámaras, directo, rendimiento |
| 08 | [Causas y pancartas](docs/08-causas-y-pancartas.md) | Demanda, destinatario, moderación |
| 09 | [Monetización y sostenibilidad](docs/09-monetizacion.md) | Catálogo, Stripe, modelo económico, licencias |
| 10 | [Seguridad](docs/10-seguridad.md) | Modelo de amenazas y controles |
| 11 | [Privacidad y RGPD](docs/11-privacidad.md) | Datos tratados, derechos, pendientes |
| 12 | [Referencia de la API](docs/12-api.md) | Todos los endpoints |
| 13 | [Desarrollo y despliegue](docs/13-despliegue.md) | Entorno, Docker, producción, escalado |
| 14 | [App móvil compañera](docs/14-app-movil.md) | HealthKit, Health Connect, compilación |
| 15 | [Hoja de ruta](docs/15-hoja-de-ruta.md) | Próximos pasos |
| 16 | [Dirección de arte](docs/16-direccion-de-arte.md) | «Papel y Cartón» + Serigrafía: materiales, color, tipografía, componentes, mundo, momentos culminantes |
| 17 | [Juego de gestión e incremental](docs/17-juego-de-gestion.md) | Recursos, Eco, necesidad estratégica, taller, unidades, veteranía, hitos |
| 18 | [Progresión y UX por niveles](docs/18-progresion-ux.md) | Curva, desbloqueos nivel a nivel, viaje del jugador |
| 19 | [La experiencia de la mani](docs/19-experiencia-de-mani.md) | Bloques, formaciones, LOD, traveling, sonido, viñetas, modo foto |

## Licencia

MIT (ver `LICENSE` en la raíz). Consulta la recomendación sobre AGPL para el servidor en [Monetización](docs/09-monetizacion.md#licencias).

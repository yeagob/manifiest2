# ✊ Manifiest V2 · Protesta 2.0

Videojuego y red social de manifestaciones: **conecta tu reloj, camina y reparte tus pasos entre las causas en las que crees**. Cuanto más constante eres, más unidades únicas despliegas y más espectacular se ve tu presencia en la avenida. Las cifras que llegan a los gobiernos, en cambio, son siempre reales: **una persona, una voz**.

## Qué incluye

- **Registro seguro**: email + código de verificación, Google opcional, sesiones rotatorias con detección de robo, recuperación, exportación y borrado de cuenta.
- **Smartwatches**: Fitbit / Pixel Watch, Withings y Garmin por OAuth y webhooks; Apple Watch y Wear OS / Samsung mediante la app móvil compañera con lecturas firmadas Ed25519.
- **Libro mayor fiel**: varias fuentes sin doble conteo, tope de integridad y el **patrón de reparto** ("de cada 5 pasos: 1 animales, 1 clima, 3 contra la guerra").
- **Progresión**: XP por pasos y días activos, niveles y capacidad de unidades con bonus de antigüedad.
- **Unidades únicas**: genoma procedural determinista, 4 rarezas, 8 roles (de manifestante a carroza) y estética *Riso Street*.
- **Marcha en 3D**: vista mundo y vista avenida, cámaras dron / calle / cabecera, *Vista fiel*, directo con SSE y pancartas votadas.
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

Abre `http://localhost:5173` y entra con `demo3@manifiest.local` / `manifiesto-demo-2026`. Detalles en [Despliegue](docs/13-despliegue.md).

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

## Licencia

MIT (ver `LICENSE` en la raíz). Consulta la recomendación sobre AGPL para el servidor en [Monetización](docs/09-monetizacion.md#licencias).

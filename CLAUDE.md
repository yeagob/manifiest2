# CLAUDE.md

Guía para agentes que trabajen en este repositorio.

## Estructura

- `v2/` es la versión activa (monorepo con npm workspaces: `shared`, `server`, `web`; `mobile` va aparte). Todo el trabajo nuevo va aquí.
- `backend/` y `frontend/` en la raíz son el prototipo V1, que se conserva solo como referencia.

## Documentación

La documentación de cada feature y módulo clave está en `v2/docs/`. **Léela antes de modificar un módulo y actualízala en el mismo cambio.** El índice también está en `v2/README.md`.

| Documento | Cuándo leerlo |
|---|---|
| `v2/docs/00-vision.md` | Siempre: principios no negociables (números fieles, 1 persona = 1 voz, no vender poder) |
| `v2/docs/01-arquitectura.md` | Antes de añadir un módulo o dependencia |
| `v2/docs/02-registro-y-autenticacion.md` | `server/src/auth/`, `security/`, `web/src/pages/AuthPages.jsx`, `web/src/lib/api.js` |
| `v2/docs/03-relojes.md` | `server/src/providers/`, `server/src/devices/`, `web/src/pages/DevicesPage.jsx` |
| `v2/docs/04-libro-mayor.md` | `server/src/steps/`, `shared/src/distribution.js`, `shared/src/progression.js` |
| `v2/docs/05-progresion-y-unidades.md` | `server/src/units/`, `shared/src/units.js`, `web/src/pages/MovementPage.jsx` |
| `v2/docs/06-estetica-y-unidades-unicas.md` | `shared/src/genome.js`, `web/src/components/UnitSVG.jsx`, estilos |
| `v2/docs/07-visualizacion.md` | `web/src/components/ProtestCanvas.jsx`, `server/src/protests/` |
| `v2/docs/08-causas-y-pancartas.md` | `server/src/causes/`, `server/src/placards/`, `server/src/lib/text.js` |
| `v2/docs/09-monetizacion.md` | `shared/src/cosmetics.js`, `server/src/shop/`, `web/src/pages/ShopPage.jsx` |
| `v2/docs/10-seguridad.md` | Cualquier cambio que toque entrada de usuario, sesiones, secretos o llamadas salientes |
| `v2/docs/11-privacidad.md` | `server/src/users/`, cualquier dato personal nuevo |
| `v2/docs/12-api.md` | Al añadir o cambiar un endpoint |
| `v2/docs/13-despliegue.md` | Variables de entorno, Docker, scripts |
| `v2/docs/14-app-movil.md` | `v2/mobile/` |
| `v2/docs/15-hoja-de-ruta.md` | Para priorizar trabajo |

## Comandos

```bash
cd v2
npm install
npm test
npm run build
npm run dev:server
npm run dev:web
npm run seed -w @manifiest/server
```

## Convenciones

- **No escribir comentarios en el código.** El código debe explicarse solo; las explicaciones van en `v2/docs/`.
- No hacer más de lo que se pide.
- JavaScript ESM, sin punto y coma, comillas simples, 2 espacios.
- Las reglas de juego puras van en `shared/` y se prueban allí con `node:test`.
- Toda escritura del servidor valida con `zod` (`.strict()`) y usa consultas preparadas.
- Ningún cambio puede hacer que algo comprable o visual altere pasos, personas únicas o votos.
- Todo endpoint nuevo lleva test en `server/test/` y fila en `v2/docs/12-api.md`.

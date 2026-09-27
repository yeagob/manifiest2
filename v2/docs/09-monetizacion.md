# 09 · Monetización y sostenibilidad

Código: `shared/src/cosmetics.js`, `server/src/shop/routes.js`, `web/src/pages/ShopPage.jsx`.

## Regla de oro

> **Se vende estética, nunca poder.** Nada que se pueda comprar altera pasos, personas, votos, capacidad, nivel ni número de unidades.

Si el dinero diera presencia, la plataforma perdería su legitimidad como herramienta de presión, que es su único activo.

## Catálogo

| Tipo | Por nivel (gratis) | De pago |
|---|---|---|
| Estilos de pancarta | Cartón (1), Risografía (4), Serigrafía (12) | Neón 1,99 €, Bordado 2,99 € |
| Efectos | Confeti (6), Pétalos (15) | Farolillos 1,99 €, Aurora 3,99 € |
| Paletas de unidad | Bosque (8) | Marea 1,49 €, Noche 1,49 € |
| Marcos de carta | Sello postal (10) | Holográfico 2,49 € |
| Temas de avenida (para creadores de causas) | Plaza (1), Bosque (18) | Litoral 9,99 €, Neón 9,99 € |

Siempre hay una alternativa gratuita y atractiva en cada categoría que se gana caminando.

## Flujo de pago

1. `POST /api/shop/checkout {itemId}` → sesión de Stripe Checkout (EUR, con clave de idempotencia por usuario, objeto y ventana de 10 minutos).
2. El usuario paga en Stripe; nunca tocamos datos de tarjeta.
3. `POST /api/webhooks/stripe` verifica la firma (`constructEvent` con `STRIPE_WEBHOOK_SECRET`), comprueba que el importe coincide con el catálogo y que el usuario existe, y registra `payments` (único por `provider_ref`) y `entitlements`. Es idempotente ante reintentos.
4. Sin `STRIPE_SECRET_KEY`, la tienda funciona en modo "solo desbloqueables".

## Modelo económico recomendado

| Fuente | Rol |
|---|---|
| Cosméticos | Cubrir la infraestructura. Coste estimado: un servidor de 20–40 €/mes aguanta decenas de miles de usuarios con SQLite. |
| Donaciones recurrentes (Open Collective / GitHub Sponsors) | Transparencia total de ingresos y gastos. |
| Temas de campaña para ONG y colectivos | Las organizaciones personalizan su avenida y reciben el acta de la manifestación. |
| Subvenciones de tecnología cívica (NLnet, Prototype Fund, fundaciones europeas) | Financiar el desarrollo de funciones grandes. |

Lo que **no** se hará: publicidad, venta de datos o monetizar la atención (métricas de "tiempo en app").

## Licencias

- Código: MIT. Se recomienda valorar **AGPL-3.0** para el servidor, de modo que quien opere una versión modificada como servicio tenga que publicar sus cambios.
- Arte premium (paletas, efectos o temas de pago): licencia propia o CC BY-NC, separada del código, para que las bifurcaciones no revendan el catálogo.

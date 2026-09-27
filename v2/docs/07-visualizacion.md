# 07 · Visualización: vista Mundo

> La experiencia de la mani (avenida, LOD por grupos, traveling, sonido, viñetas y modo foto) está en [19 · La experiencia de la mani](19-experiencia-de-mani.md). Este documento cubre solo la **vista Mundo** (`/mundo`).

## Vista Mundo

- Plaza central rosa de la que salen **avenidas radiales**, una por causa.
- **Longitud de la avenida ∝ √(pasos reales)** de la causa: la comparación entre causas es siempre fiel.
- Densidad de figuras = personas + figuras de unidades (máximo 400 por avenida), en el color de la causa.
- Etiqueta con título, **personas** y **pasos**. Al hacer clic se entra en la marcha.

Código: `web/src/components/ProtestCanvas.jsx` (`WorldScene`), `web/src/pages/WorldPage.jsx`, `GET /api/protests/world`.

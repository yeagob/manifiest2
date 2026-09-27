# 00 · Visión y principios de diseño

Manifiest es un videojuego social de protesta: **tus pasos reales se convierten en presencia en manifestaciones virtuales** por causas concretas, y esa presencia agregada se usa para presionar a quien toma las decisiones.

## El problema que resuelve

Firmar una petición online no cuesta nada, y por eso pesa poco. Una manifestación pesa porque la gente pone el cuerpo y el tiempo. Manifiest recupera ese coste con una **prueba de esfuerzo verificable**: los pasos que registra tu reloj.

## Principios no negociables

| Principio | Qué significa en el producto |
|---|---|
| **Números fieles** | Pasos, personas únicas y totales por causa salen de un libro mayor auditable. Ningún elemento visual, compra o nivel los altera. |
| **Una persona, una voz** | La métrica política es *personas únicas verificadas*. Un usuario de nivel 40 con 150 unidades sigue contando como **1 persona**. |
| **Impacto visual proporcional al compromiso** | Quien camina más días acumula nivel, capacidad y unidades, y su presencia en la avenida es más grande y más espectacular. |
| **Nada se compra que dé poder** | La tienda es solo estética: no vende pasos, niveles, capacidad ni unidades. |
| **Privacidad por diseño** | Solo se leen totales diarios de pasos. Nunca ubicación, rutas ni otros datos de salud. |
| **Causas con destinatario** | Toda causa declara *qué exige* y *a quién*. Sin eso no hay presión posible. |
| **Código abierto** | Transparencia sobre cómo se cuentan los pasos y cómo se decide qué se muestra. |

## Bucle principal

```
Caminar (reloj) ──► libro mayor ──► patrón de reparto ──► pasos por causa (fieles)
      │                                                          │
      ▼                                                          ▼
 XP + días activos ──► nivel ──► capacidad ──► unidades únicas ──► avenida espectacular
```

1. **Caminas** con tu reloj, sin abrir la app.
2. Los pasos se **reparten** según tu patrón, por ejemplo "de cada 5 pasos: 1 animales, 1 clima, 3 contra la guerra".
3. Los días activos y los pasos te dan **XP**. El nivel y la antigüedad amplían tu **capacidad**. Tus pasos y tus unidades en la calle generan **Eco**.
4. Con Eco y capacidad **acuñas unidades únicas**, procedurales e irrepetibles, y las **despliegas** estratégicamente en las causas que quieras (las manis que más lo necesitan rinden más). Puedes ponerlas todas en una sola. Con el Eco mejoras tu **taller** en un bucle incremental ([17](17-juego-de-gestion.md)).
5. La **mani infinita** se recorre en un traveling de cámara que pasa por todas las unidades, con su sonido y sus pancartas, y genera carteles para redes en el modo foto ([19](19-experiencia-de-mani.md)). Siempre hay un contador fiel visible y un modo *Vista fiel* (1 persona = 1 figura).

## Documentos relacionados

- [Progresión y unidades](05-progresion-y-unidades.md)
- [Estética y unidades únicas](06-estetica-y-unidades-unicas.md)
- [Visualización de la marcha](07-visualizacion.md)
- [Monetización y sostenibilidad](09-monetizacion.md)

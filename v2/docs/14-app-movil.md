# 14 · App móvil compañera

Código: `v2/mobile/` (Expo SDK 54, React Native).

## Por qué existe

Apple Health (Apple Watch) y Health Connect (Wear OS, Samsung, Xiaomi, Oppo y otros) **solo exponen los datos en el teléfono**. La app lee el total de pasos diario y lo envía firmado al servidor. No tiene más pantallas: el juego vive en la web.

## Estructura

| Fichero | Rol |
|---|---|
| `src/health.ios.js` | HealthKit mediante `react-native-health`: `getDailyStepCountSamples` por día, excluyendo entradas manuales. |
| `src/health.android.js` | Health Connect mediante `react-native-health-connect`: `aggregateRecord(Steps)` por día (Health Connect deduplica entre fuentes). |
| `src/identity.js` | Par de claves Ed25519 (`tweetnacl`, con PRNG de `expo-crypto`) guardado en `expo-secure-store` con `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`. |
| `src/sync.js` | Emparejamiento y envío firmado (`X-Device-Signature`). Exige HTTPS salvo en `localhost` o el emulador. |
| `src/background.js` | Tarea `expo-background-task` cada ~60 min con los últimos 3 días. |
| `src/App.js` | Pantalla única: servidor, código de emparejamiento, sincronizar, desemparejar. |

## Compilar

```bash
cd v2/mobile
npm install
npx expo install --fix
npx expo prebuild
npx expo run:ios
npx expo run:android
```

- iOS: requiere cuenta de desarrollador con la capacidad **HealthKit** (y *Background Delivery*). No funciona en Expo Go: hace falta un *development build*.
- Android: Health Connect instalado (integrado desde Android 14). `minSdkVersion` 26. Para publicar en Google Play hay que declarar el uso de datos de salud en la consola.

## Estado

El código de la app está escrito, pero **no se ha compilado en este entorno**, que no tiene toolchain de iOS ni de Android. La compatibilidad de la firma tweetnacl ↔ `crypto.verify` de Node sí está verificada. El contrato con el servidor está cubierto por `server/test/devices.test.js`, que firma igual que la app. Hay que probarlo en dispositivos reales antes de publicarlo.

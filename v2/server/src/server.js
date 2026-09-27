import { loadConfig } from './config.js'
import { createApp, createContext } from './app.js'

const config = loadConfig()
const ctx = createContext(config)
const app = createApp(ctx)

const server = app.listen(config.port, () => {
  console.info(`[manifiest] API escuchando en ${config.apiUrl} (${config.env})`)
})

function shutdown() {
  server.close(() => {
    ctx.db.close()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

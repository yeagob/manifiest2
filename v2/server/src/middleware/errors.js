import { HttpError } from '../lib/errors.js'

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada', code: 'not_found' })
}

export function errorHandler(ctx) {
  return (err, req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code })
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Petición demasiado grande', code: 'too_large' })
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido', code: 'bad_json' })
    if (ctx.config.env !== 'test') console.error(`[error] ${req.method} ${req.path}`, err)
    res.status(500).json({ error: 'Error interno', code: 'internal' })
  }
}

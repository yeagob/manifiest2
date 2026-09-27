export class HttpError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const badRequest = (msg, code = 'bad_request') => new HttpError(400, msg, code)
export const unauthorized = (msg = 'No autenticado', code = 'unauthorized') => new HttpError(401, msg, code)
export const forbidden = (msg = 'No autorizado', code = 'forbidden') => new HttpError(403, msg, code)
export const notFound = (msg = 'No encontrado', code = 'not_found') => new HttpError(404, msg, code)
export const conflict = (msg, code = 'conflict') => new HttpError(409, msg, code)

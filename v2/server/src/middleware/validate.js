import { badRequest } from '../lib/errors.js'

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const issue = result.error.issues[0]
      return next(badRequest(`${issue.path.join('.') || source}: ${issue.message}`, 'validation_error'))
    }
    req.valid = { ...(req.valid || {}), [source]: result.data }
    next()
  }
}

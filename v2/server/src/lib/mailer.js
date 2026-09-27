import nodemailer from 'nodemailer'

export function createMailer(config) {
  if (config.smtpUrl) {
    const transport = nodemailer.createTransport(config.smtpUrl, { disableFileAccess: true, disableUrlAccess: true })
    return {
      outbox: null,
      async send({ to, subject, text }) {
        await transport.sendMail({ from: config.mailFrom, to, subject, text })
      }
    }
  }
  const outbox = []
  return {
    outbox,
    async send(message) {
      outbox.push(message)
      if (config.env === 'development') console.info(`[mail:dev] Para ${message.to} — ${message.subject}\n${message.text}`)
    }
  }
}

export const templates = {
  verify: code => ({
    subject: 'Tu código para unirte a la marcha',
    text: `Tu código de verificación es ${code}.\nCaduca en 15 minutos. Si no has sido tú, ignora este mensaje.`
  }),
  alreadyRegistered: webUrl => ({
    subject: 'Ya tienes una cuenta en Manifiest',
    text: `Alguien ha intentado registrarse con este email, pero ya tienes cuenta.\nSi has olvidado tu contraseña, recupérala en ${webUrl}/recuperar.\nSi no has sido tú, puedes ignorar este mensaje.`
  }),
  reset: code => ({
    subject: 'Recupera tu contraseña',
    text: `Tu código para cambiar la contraseña es ${code}.\nCaduca en 15 minutos. Si no lo has pedido tú, ignora este mensaje: tu contraseña sigue siendo la misma.`
  }),
  passwordChanged: () => ({
    subject: 'Tu contraseña ha cambiado',
    text: 'Se ha cambiado la contraseña de tu cuenta y se han cerrado todas las sesiones. Si no has sido tú, contacta con nosotros de inmediato.'
  })
}

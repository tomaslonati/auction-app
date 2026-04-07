import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

export async function sendWelcomeEmail(to: string, nombre: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Registro recibido — Casa de Subastas',
    html: `
      <p>Hola ${nombre},</p>
      <p>Recibimos tu solicitud de registro. Un verificador revisará tu documentación y te notificaremos cuando tu cuenta sea aprobada.</p>
      <p>Una vez aprobada, podrás ingresar a la app para crear tu contraseña y completar el proceso.</p>
      <p>Gracias por registrarte.</p>
    `,
  })
}

export async function sendRegistrationApprovedEmail(to: string, nombre: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Tu registro fue aprobado — completá tu cuenta',
    html: `
      <p>Hola ${nombre},</p>
      <p>Tu solicitud de registro fue aprobada. Ingresá a la app para crear tu contraseña y completar el registro.</p>
    `,
  })
}

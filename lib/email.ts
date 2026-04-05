import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendRegistrationApprovedEmail(to: string, nombre: string) {
  return resend.emails.send({
    from: 'subastas@tudominio.com',
    to,
    subject: 'Tu registro fue aprobado — completá tu cuenta',
    html: `
      <p>Hola ${nombre},</p>
      <p>Tu solicitud de registro fue aprobada. Ingresá a la app para crear tu contraseña y completar el registro.</p>
    `,
  })
}

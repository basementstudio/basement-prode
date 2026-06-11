import nodemailer from 'nodemailer'

type OtpEmailType = 'sign-in' | 'email-verification' | 'forget-password' | 'change-email'

interface SendOtpEmailParams {
  email: string
  otp: string
  type: OtpEmailType
}

function getSubject(type: OtpEmailType): string {
  switch (type) {
    case 'sign-in':
      return 'Tu código para entrar al Prode 2026'
    case 'email-verification':
      return 'Verificá tu email — Prode 2026'
    case 'forget-password':
      return 'Restablecer acceso — Prode 2026'
    case 'change-email':
      return 'Confirmá tu nuevo email — Prode 2026'
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

function buildHtml(otp: string, type: OtpEmailType): string {
  const action =
    type === 'sign-in'
      ? 'Ingresá este código para entrar al prode.'
      : type === 'email-verification'
        ? 'Usá este código para verificar tu email.'
        : type === 'change-email'
          ? 'Usá este código para confirmar tu nuevo email.'
          : 'Usá este código para restablecer tu acceso.'

  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:#f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:420px;background:#111;border:1px solid #333;">
            <tr>
              <td style="padding:28px 24px 8px;">
                <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#888;">
                  PRODE/2026 · ACCESO
                </p>
                <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;letter-spacing:-0.02em;color:#fff;">
                  Tu código de acceso
                </h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#aaa;">
                  ${action} Expira en 10 minutos.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 24px 28px;">
                <div style="display:inline-block;padding:16px 24px;background:#000;border:1px solid #444;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#fff;">
                  ${otp}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#666;">
                  Si no pediste este código, podés ignorar este mail.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function getSmtpPass(): string | undefined {
  return process.env.SMTP_PASS?.replace(/\s/g, '')
}

export async function sendOtpEmail({ email, otp, type }: SendOtpEmailParams): Promise<void> {
  const user = process.env.SMTP_USER
  const pass = getSmtpPass()

  if (!user || !pass) {
    console.log(`[auth] OTP for ${email} (${type}): ${otp}`)
    console.warn('[auth] SMTP_USER / SMTP_PASS no configurados — el código solo aparece en consola.')
    return
  }

  const from = process.env.EMAIL_FROM ?? `Prode 2026 <${user}>`
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  await transporter.sendMail({
    from,
    to: email,
    subject: getSubject(type),
    html: buildHtml(otp, type),
    text: `Tu código de acceso al Prode 2026: ${otp}. Expira en 10 minutos.`,
  })
}

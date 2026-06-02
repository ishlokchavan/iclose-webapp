import 'server-only'
import nodemailer, { type Transporter } from 'nodemailer'

export type EmailPayload = {
  to: { email: string; name?: string }
  subject: string
  html: string
  replyTo?: string
}

export type SendResult = { ok: boolean; skipped?: boolean; error?: string }

// Cached across warm serverless invocations.
let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  const user = process.env.BREVO_SMTP_USER
  const pass = process.env.BREVO_SMTP_KEY
  if (!user || !pass) return null

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   'smtp-relay.brevo.com',
      port:   587,
      secure: false, // STARTTLS on 587
      auth:   { user, pass },
    })
  }
  return transporter
}

export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  const from = process.env.BREVO_FROM ?? 'hello@iclose.ae'
  const tx   = getTransporter()

  if (!tx) {
    console.warn('[email] BREVO_SMTP_USER/BREVO_SMTP_KEY not set — skipping send to', payload.to.email)
    return { ok: false, skipped: true, error: 'Brevo SMTP credentials are not configured' }
  }

  try {
    await tx.sendMail({
      from:    `iClose <${from}>`,
      to:      payload.to.name ? `${payload.to.name} <${payload.to.email}>` : payload.to.email,
      subject: payload.subject,
      html:    payload.html,
      ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
    })
    return { ok: true }
  } catch (err) {
    console.error('[email] SMTP send failed', err)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

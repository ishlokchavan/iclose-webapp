import 'server-only'
import nodemailer, { type Transporter } from 'nodemailer'

export type EmailPayload = {
  to: { email: string; name?: string }
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export type SendResult = { ok: boolean; skipped?: boolean; error?: string }

// Crude HTML→text for the multipart/alternative plaintext part.
// A text alternative meaningfully lowers spam score vs HTML-only.
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|tr|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&rsquo;/gi, '’')
    .replace(/&amp;/gi, '&')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

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
      from:    { name: 'iClose', address: from },
      to:      payload.to.name ? { name: payload.to.name, address: payload.to.email } : payload.to.email,
      subject: payload.subject,
      html:    payload.html,
      text:    payload.text ?? htmlToText(payload.html),
      replyTo: payload.replyTo ?? from,
    })
    return { ok: true }
  } catch (err) {
    console.error('[email] SMTP send failed', err)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

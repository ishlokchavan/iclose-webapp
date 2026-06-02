import 'server-only'

export type EmailPayload = {
  to: { email: string; name?: string }
  subject: string
  html: string
  replyTo?: string
}

export type SendResult = { ok: boolean; skipped?: boolean; error?: string }

export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  const apiKey = process.env.BREVO_API_KEY
  const from   = process.env.BREVO_FROM ?? 'hello@iclose.ae'

  if (!apiKey) {
    console.warn('[email] BREVO_API_KEY not set — skipping send to', payload.to.email)
    return { ok: false, skipped: true, error: 'BREVO_API_KEY is not configured' }
  }

  const body = {
    sender:      { email: from, name: 'iClose' },
    to:          [payload.to],
    subject:     payload.subject,
    htmlContent: payload.html,
    ...(payload.replyTo ? { replyTo: { email: payload.replyTo } } : {}),
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json' },
      body:    JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[email] Brevo error', res.status, text)
      return { ok: false, error: `Brevo ${res.status}: ${text.slice(0, 300)}` }
    }

    return { ok: true }
  } catch (err) {
    console.error('[email] request failed', err)
    return { ok: false, error: String(err) }
  }
}

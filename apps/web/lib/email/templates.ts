import 'server-only'

// Inline-styled HTML base layout (wide email-client compatibility)
function layout(content: string, previewText = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>iClose</title>
  <!--[if !mso]><!-->
  <style>
    body { margin:0; padding:0; background:#f5f5f7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    @media (prefers-color-scheme:dark) {
      body, .card { background:#1c1c1e !important; color:#f5f5f7 !important; }
      .muted { color:#8e8e93 !important; }
      .divider { border-color:#3a3a3c !important; }
    }
  </style>
  <!--<![endif]-->
</head>
<body>
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f5f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Logo -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#1c1c1e;">iClose</span>
            </td>
          </tr>
        </table>
        <!-- Card -->
        <table class="card" width="600" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>
        </table>
        <!-- Footer -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;margin-top:24px;">
          <tr>
            <td class="muted" style="font-size:12px;color:#8e8e93;text-align:center;line-height:1.6;">
              iClose · Dubai · You&rsquo;re receiving this because you signed up at iclose.ae<br />
              Questions? Reply to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const h1 = (text: string) =>
  `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;letter-spacing:-0.02em;color:#1c1c1e;line-height:1.3;">${text}</h1>`

const p = (text: string, muted = false) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${muted ? '#8e8e93' : '#1c1c1e'};">${text}</p>`

const divider = () =>
  `<hr class="divider" style="border:none;border-top:1px solid #e5e5ea;margin:24px 0;" />`

const table = (rows: [string, string][]) =>
  `<table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border-collapse:collapse;">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#8e8e93;width:40%;vertical-align:top;">${label}</td>
        <td style="padding:8px 0;font-size:13px;color:#1c1c1e;font-weight:500;vertical-align:top;">${value}</td>
      </tr>`).join('')}
  </table>`

// ── Templates ────────────────────────────────────────────────────────────────

export function enquiryConfirmation({
  buyerName,
  projectName,
  projectSlug,
  unitType,
  baseUrl,
}: {
  buyerName: string
  projectName: string
  projectSlug: string
  unitType: string | null
  baseUrl: string
}): string {
  const greeting = buyerName ? `Hi ${buyerName},` : 'Hi there,'
  const unit = unitType ? ` (${unitType})` : ''

  const content = `
    ${h1('We&rsquo;ve received your enquiry')}
    ${p(greeting)}
    ${p(`Thanks for enquiring about <strong>${projectName}</strong>${unit}. Your dedicated relationship manager will review the details and be in touch within 24 hours.`)}
    ${divider()}
    ${table([
      ['Project',   projectName],
      ...(unitType ? [['Unit type', unitType] as [string, string]] : []),
    ])}
    ${divider()}
    ${p('In the meantime you can browse more projects or update your preferences in your profile.', true)}
    <a href="${baseUrl}/app/explore"
      style="display:inline-block;padding:12px 24px;background:#0A84FF;color:#ffffff;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">
      Back to Explore
    </a>
  `

  return layout(content, `Your enquiry for ${projectName} is confirmed — we'll be in touch soon.`)
}

export function newLeadNotification({
  buyerName,
  buyerEmail,
  buyerPhone,
  projectName,
  projectSlug,
  unitType,
  leadId,
  baseUrl,
}: {
  buyerName: string
  buyerEmail: string
  buyerPhone: string | null
  projectName: string
  projectSlug: string
  unitType: string | null
  leadId: string
  baseUrl: string
}): string {
  const rows: [string, string][] = [
    ['Name',    buyerName  || '—'],
    ['Email',   buyerEmail || '—'],
    ['Phone',   buyerPhone || '—'],
    ['Project', projectName],
    ...(unitType ? [['Unit type', unitType] as [string, string]] : []),
    ['Lead ID', `<span style="font-family:monospace;font-size:12px;">${leadId}</span>`],
  ]

  const content = `
    ${h1('New lead')}
    ${p(`A buyer just submitted an enquiry for <strong>${projectName}</strong>.`)}
    ${divider()}
    ${table(rows)}
    ${divider()}
    <a href="${baseUrl}/admin/leads/${leadId}"
      style="display:inline-block;padding:12px 24px;background:#0A84FF;color:#ffffff;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">
      View in Admin
    </a>
  `

  return layout(content, `New lead from ${buyerName || buyerEmail} — ${projectName}`)
}

export function rmAssignmentNotification({
  rmName,
  buyerName,
  buyerEmail,
  buyerPhone,
  projectName,
  unitType,
  leadId,
  slaDate,
  baseUrl,
}: {
  rmName: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string | null
  projectName: string
  unitType: string | null
  leadId: string
  slaDate: string | null
  baseUrl: string
}): string {
  const greeting = rmName ? `Hi ${rmName},` : 'Hi,'

  const rows: [string, string][] = [
    ['Buyer',    buyerName  || '—'],
    ['Email',    buyerEmail || '—'],
    ['Phone',    buyerPhone || '—'],
    ['Project',  projectName],
    ...(unitType ? [['Unit type', unitType] as [string, string]] : []),
    ...(slaDate  ? [['Respond by', new Date(slaDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })] as [string, string]] : []),
  ]

  const content = `
    ${h1('You have a new lead')}
    ${p(greeting)}
    ${p(`You've been assigned a lead for <strong>${projectName}</strong>. Reach out to the buyer within the SLA window.`)}
    ${divider()}
    ${table(rows)}
    ${divider()}
    <a href="${baseUrl}/admin/leads/${leadId}"
      style="display:inline-block;padding:12px 24px;background:#0A84FF;color:#ffffff;border-radius:100px;font-size:14px;font-weight:600;text-decoration:none;">
      View lead
    </a>
  `

  return layout(content, `New lead assigned: ${buyerName || buyerEmail} — ${projectName}`)
}

const ROLE_LABEL: Record<string, string> = {
  rm:          'Relationship Manager',
  ops_manager: 'Operations Manager',
  finance:     'Finance',
  super_admin: 'Super Admin',
}

export function magicLink({ confirmUrl }: { confirmUrl: string }): string {
  const content = `
    ${h1('Sign in to iClose')}
    ${p('Click below to sign in. This link is single-use and expires shortly.')}
    ${divider()}
    <a href="${confirmUrl}"
      style="display:inline-block;padding:12px 28px;background:#0A84FF;color:#ffffff;border-radius:100px;font-size:15px;font-weight:600;text-decoration:none;">
      Sign in
    </a>
    ${p('If you didn&rsquo;t request this, you can safely ignore this email.', true)}
  `

  return layout(content, 'Your single-use sign-in link for iClose.')
}

export function staffInvite({
  name,
  role,
  confirmUrl,
}: {
  name: string
  role: string
  confirmUrl: string
}): string {
  const greeting  = name ? `Hi ${name},` : 'Hi,'
  const roleLabel = ROLE_LABEL[role] ?? role

  const content = `
    ${h1('You&rsquo;ve been invited to iClose')}
    ${p(greeting)}
    ${p(`You&rsquo;ve been added to the iClose team as <strong>${roleLabel}</strong>. Click below to activate your account and sign in.`)}
    ${divider()}
    <a href="${confirmUrl}"
      style="display:inline-block;padding:12px 28px;background:#0A84FF;color:#ffffff;border-radius:100px;font-size:15px;font-weight:600;text-decoration:none;">
      Activate your account
    </a>
    ${p('This link is single-use and will expire. If it stops working, ask an admin to re-send your invite.', true)}
  `

  return layout(content, `You've been invited to iClose as ${roleLabel}.`)
}

export function staffRoleAdded({
  name,
  role,
  signInUrl,
}: {
  name: string
  role: string
  signInUrl: string
}): string {
  const greeting  = name ? `Hi ${name},` : 'Hi,'
  const roleLabel = ROLE_LABEL[role] ?? role

  const content = `
    ${h1('Your iClose access changed')}
    ${p(greeting)}
    ${p(`You&rsquo;ve been granted the <strong>${roleLabel}</strong> role on iClose. Sign in to access the admin tools.`)}
    ${divider()}
    <a href="${signInUrl}"
      style="display:inline-block;padding:12px 28px;background:#0A84FF;color:#ffffff;border-radius:100px;font-size:15px;font-weight:600;text-decoration:none;">
      Go to iClose
    </a>
  `

  return layout(content, `You've been granted ${roleLabel} access on iClose.`)
}

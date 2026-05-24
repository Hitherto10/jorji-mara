import { Hono } from 'hono';

const contact = new Hono();

// Tiny HTML escape so customer-submitted text can't break the email markup.
const esc = (str = '') => String(str)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

contact.post('/', async (c) => {
	let body;
	try { body = await c.req.json(); }
	catch { return c.json({ error: 'Invalid JSON' }, 400); }

	const { name, email, subject, message } = body;

	// ── Input validation ────────────────────────────────────────────────────
	if (!name?.trim())          return c.json({ error: 'Name is required' }, 400);
	if (!email?.includes('@'))  return c.json({ error: 'Valid email required' }, 400);
	if (!message?.trim())       return c.json({ error: 'Message is required' }, 400);

	const cleanName    = name.trim();
	const cleanEmail   = email.trim();
	const cleanSubject = (subject ?? '').trim() || 'New contact form message';
	const cleanMessage = message.trim();

	const adminEmail = 'jorjimara@gmail.com';

	// ── Build email HTML ────────────────────────────────────────────────────
	const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>${esc(cleanSubject)}</title></head>
<body style="margin:0;padding:0;background-color:#F4F1ED;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1ED;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:2px;overflow:hidden;">

        <tr>
          <td style="background:#4d0011;padding:30px 36px;">
            <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:3px;text-transform:uppercase;">Contact Form</p>
            <h1 style="margin:0;font-size:24px;line-height:1.2;color:#ffffff;font-family:Georgia,serif;font-weight:400;">
              ${esc(cleanSubject)}
            </h1>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 36px 8px;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#bbb;">From</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#333;">
              <strong>${esc(cleanName)}</strong><br/>
              <a href="mailto:${esc(cleanEmail)}" style="color:#4d0011;text-decoration:none;">${esc(cleanEmail)}</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:18px 36px 32px;">
            <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#bbb;">Message</p>
            <div style="background:#F7F4F0;border-left:3px solid #4d0011;padding:16px 18px;font-size:14px;line-height:1.7;color:#333;white-space:pre-wrap;">${esc(cleanMessage)}</div>
            <p style="margin:18px 0 0;font-size:12px;color:#999;">Hit reply to respond directly to ${esc(cleanName.split(' ')[0])}.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

	// ── Send via Resend ─────────────────────────────────────────────────────
	const res = await fetch('https://api.resend.com/emails', {
		method:  'POST',
		headers: {
			'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
			'Content-Type':  'application/json',
		},
		body: JSON.stringify({
			from:       c.env.RESEND_FROM_EMAIL || 'orders@jorjimara.com',
			to:         [adminEmail],
			reply_to:   cleanEmail,
			subject:    `[Contact] ${cleanSubject}`,
			html,
		}),
	});

	if (!res.ok) {
		const errBody = await res.json().catch(() => ({}));
		console.error('[Contact] Resend error:', errBody);
		return c.json({ success: false, error: errBody.message ?? 'Failed to send message' }, 502);
	}

	return c.json({ success: true });
});

export default contact;

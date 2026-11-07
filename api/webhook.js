// POST /api/webhook  ← Stripe llama aquí cuando se completa un pago.
// Genera el PDF de entradas y se lo envía por email al cliente (con copia opcional al centro).
//
// Variables de entorno en Vercel:
//   STRIPE_SECRET_KEY      (obligatoria) la misma que usa /api/checkout
//   STRIPE_WEBHOOK_SECRET  (obligatoria) whsec_... → Stripe › Desarrolladores › Webhooks › tu endpoint
//   RESEND_API_KEY         (obligatoria) re_...    → resend.com › API Keys
//   EMAIL_FROM             (opcional)    p. ej. "Loe Marina <reservas@loemarina.com>" (dominio verificado en Resend)
//   EMAIL_COPIA            (opcional)    email del centro que recibe copia de cada pedido
//   SITE_URL               (opcional)    https://www.loemarina.com
//
// Eventos a activar en Stripe: checkout.session.completed y checkout.session.async_payment_succeeded

const crypto = require('crypto');
const { stripe, getSession } = require('./_lib/stripe.js');
const { buildTicketsPdf } = require('./_lib/ticket.js');

const SITE = () => (process.env.SITE_URL || 'https://www.loemarina.com').replace(/\/$/, '');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n, cur = 'eur') => new Intl.NumberFormat('es-ES', { style: 'currency', currency: cur.toUpperCase() }).format(n);

async function rawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
  return Buffer.concat(chunks);
}

// Verifica la cabecera Stripe-Signature (mismo algoritmo que el SDK oficial).
function verify(payload, header, secret, toleranceSec = 300) {
  const parts = {};
  const sigs = [];
  for (const kv of String(header || '').split(',')) {
    const [k, v] = kv.split('=');
    if (k === 't') parts.t = v;
    if (k === 'v1') sigs.push(v);
  }
  if (!parts.t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > toleranceSec) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${payload.toString('utf8')}`).digest('hex');
  return sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

function emailHtml(session, tickets, downloadUrl) {
  const first = ((session.customer_details && session.customer_details.name) || '').split(' ')[0];
  const rows = ((session.line_items && session.line_items.data) || []).map((li) => {
    const p = (li.price && li.price.product) || {};
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #eadbcf;font-size:15px;color:#2b1f1a">${li.quantity}× ${esc(p.name || li.description)}${p.description ? `<br><span style="font-size:13px;color:#8f4a2a;font-style:italic">${esc(p.description)}</span>` : ''}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #eadbcf;font-size:15px;color:#2b1f1a;white-space:nowrap">${money((li.amount_total || 0) / 100, session.currency)}</td></tr>`;
  }).join('');
  return `<!doctype html><html lang="es"><body style="margin:0;background:#eedfd1;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eedfd1;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fcf8f4;border-radius:18px;overflow:hidden">
<tr><td style="background:#2a1c17;padding:28px 32px;text-align:center">
  <div style="font-size:11px;letter-spacing:3px;color:#ebb08a">LOE MARINA · CENTRO MÉDICO ESTÉTICO</div>
  <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;color:#ffffff;margin-top:10px">Tus bonos están listos</div>
</td></tr>
<tr><td style="padding:30px 32px 8px;font-size:15px;line-height:1.6;color:#2b1f1a">
  <p style="margin:0 0 14px">${first ? `Hola, ${esc(first)}:` : 'Hola:'}</p>
  <p style="margin:0 0 14px">Gracias por tu compra. Te adjuntamos <strong>${tickets.length === 1 ? 'tu bono' : `tus ${tickets.length} bonos`}</strong> en PDF, uno por cada tratamiento.</p>
  <p style="margin:0 0 14px"><strong>¿Cómo se canjea?</strong> Cuando quieras usarlo, pide cita llamándonos al <a href="tel:+34922236677" style="color:#8f4a2a">922 236 677</a> o pasándote por el centro. El día de tu cita, presenta el bono impreso o en el móvil.</p>
  <p style="margin:0 0 22px">¿Dudas? Responde a este correo y te ayudamos.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
    <tr><td style="padding:14px 0 0;font-family:Georgia,serif;font-size:18px;color:#2b1f1a">Total pagado</td><td align="right" style="padding:14px 0 0;font-family:Georgia,serif;font-size:18px;color:#2b1f1a">${money((session.amount_total || 0) / 100, session.currency)}</td></tr>
  </table>
</td></tr>
<tr><td align="center" style="padding:26px 32px 30px">
  <a href="${esc(downloadUrl)}" style="display:inline-block;background:#8f4a2a;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:999px;font-size:14px;letter-spacing:1px">DESCARGAR MIS BONOS</a>
  <p style="margin:14px 0 0;font-size:12px;color:#6e5b52">Referencia del pedido: <strong>${esc(tickets[0] ? tickets[0].ref : '')}</strong></p>
</td></tr>
<tr><td style="background:#f3e4da;padding:18px 32px;font-size:12px;line-height:1.5;color:#6e5b52;text-align:center">
  Loe Marina · C/ Pedro Modesto Campos, Edif. Los Dragos 8, Local A-3 · 38003 Santa Cruz de Tenerife<br>
  <a href="${SITE()}" style="color:#8f4a2a">loemarina.com</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendEmail({ to, subject, html, text, pdf, filename }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Falta RESEND_API_KEY');
  const body = {
    from: process.env.EMAIL_FROM || 'Loe Marina <reservas@loemarina.com>',
    to: [to],
    subject,
    html,
    text,
    attachments: [{ filename, content: Buffer.from(pdf).toString('base64') }],
  };
  if (process.env.EMAIL_COPIA) { body.bcc = [process.env.EMAIL_COPIA]; body.reply_to = process.env.EMAIL_COPIA; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return r.json();
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] Falta STRIPE_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Webhook no configurado' });
  }

  const payload = await rawBody(req);
  if (!verify(payload, req.headers['stripe-signature'], secret)) return res.status(400).json({ error: 'Firma no válida' });

  let event;
  try { event = JSON.parse(payload.toString('utf8')); } catch { return res.status(400).json({ error: 'JSON no válido' }); }

  const types = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'];
  if (!types.includes(event.type)) return res.status(200).json({ received: true, ignored: event.type });

  try {
    const session = await getSession(event.data.object.id);
    if (session.payment_status !== 'paid') return res.status(200).json({ received: true, pending: true });

    const pi = session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null;
    if (pi && pi.metadata && pi.metadata.bonos_enviados) return res.status(200).json({ received: true, duplicate: true });

    const to = session.customer_details && session.customer_details.email;
    if (!to) {
      console.error('[webhook] Pedido sin email', session.id);
      return res.status(200).json({ received: true, noEmail: true });
    }

    const { bytes, tickets } = await buildTicketsPdf(session);
    const downloadUrl = `${SITE()}/api/ticket?session_id=${encodeURIComponent(session.id)}`;
    const ref = tickets[0] ? tickets[0].ref : session.id.slice(-10);
    await sendEmail({
      to,
      subject: tickets.length === 1 ? `Tu bono Loe Marina · ${tickets[0].name}` : `Tus ${tickets.length} bonos Loe Marina`,
      html: emailHtml(session, tickets, downloadUrl),
      text: `Gracias por tu compra en Loe Marina. Te adjuntamos tus bonos en PDF (referencia ${ref}). También puedes descargarlos aquí: ${downloadUrl}\nPara canjearlos, pide cita en el 922 236 677 o en el centro.`,
      pdf: bytes,
      filename: `bonos-loe-marina-${ref}.pdf`,
    });

    if (pi) await stripe(`/payment_intents/${pi.id}`, { method: 'POST', params: { 'metadata[bonos_enviados]': new Date().toISOString() } });
    return res.status(200).json({ received: true, sent: tickets.length });
  } catch (err) {
    // Devolvemos 500 para que Stripe reintente más tarde (lo hace durante 3 días).
    console.error('[webhook] No se pudieron enviar los bonos', err);
    return res.status(500).json({ error: 'No se pudieron enviar los bonos' });
  }
}

module.exports = handler;
module.exports.verify = verify;
module.exports.emailHtml = emailHtml;

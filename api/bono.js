// /api/bono — consulta y canje de bonos desde la página canjear.html (solo personal del centro).
//
//   GET  /api/bono?b=<token>                    → estado del bono
//   POST /api/bono?b=<token>  { "accion": "canjear" | "deshacer" }
//   Cabecera obligatoria: X-Staff-Pin: <PIN>
//
// Variable de entorno en Vercel: STAFF_PIN (la contraseña que usará el personal).

const { stripe, getSession } = require('./_lib/stripe.js');
const { ticketsFromSession } = require('./_lib/ticket.js');
const { parseToken, checkPin } = require('./_lib/bono.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmt = (iso) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Atlantic/Canary' }).format(new Date(iso));

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}

async function load(pi, n) {
  const list = await stripe(`/checkout/sessions?payment_intent=${encodeURIComponent(pi)}&limit=1`);
  const found = list.data && list.data[0];
  if (!found) return null;
  const session = await getSession(found.id);
  const ticket = ticketsFromSession(session).find((t) => t.n === n);
  if (!ticket) return null;
  const intent = typeof session.payment_intent === 'object' ? session.payment_intent : await stripe(`/payment_intents/${pi}`);
  return { session, ticket, intent };
}

function view({ session, ticket, intent }) {
  const charge = intent.latest_charge && typeof intent.latest_charge === 'object' ? intent.latest_charge : null;
  const refunded = !!(charge && (charge.refunded || charge.amount_refunded >= charge.amount));
  const partial = !!(charge && !refunded && charge.amount_refunded > 0);
  const used = (intent.metadata || {})[`canje_${ticket.n}`] || '';
  let estado = 'valido';
  if (session.payment_status !== 'paid') estado = 'no_pagado';
  else if (refunded) estado = 'reembolsado';
  else if (used) estado = 'canjeado';
  return {
    estado,
    reembolsoParcial: partial,
    canjeadoEl: used ? fmt(used) : '',
    codigo: ticket.code,
    numero: ticket.n,
    total: ticket.total,
    tratamiento: ticket.name,
    opcion: ticket.variant,
    titular: ticket.holder,
    para: ticket.gift,
    email: (session.customer_details && session.customer_details.email) || '',
    telefono: (session.customer_details && session.customer_details.phone) || '',
    compra: ticket.date,
    pago: intent.id,
    stripeUrl: `https://dashboard.stripe.com/${session.livemode ? '' : 'test/'}payments/${intent.id}`,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  if (!process.env.STAFF_PIN) return res.status(503).json({ error: 'Falta configurar STAFF_PIN en Vercel.' });

  let parsed;
  try { parsed = parseToken(req.query && req.query.b); } catch (e) { return res.status(503).json({ error: 'Pagos no configurados.' }); }
  if (!parsed) return res.status(404).json({ estado: 'invalido', error: 'Este código QR no corresponde a ningún bono de Loe Marina.' });

  if (!checkPin(req.headers['x-staff-pin'])) {
    await sleep(800); // frena los intentos de adivinar el PIN
    return res.status(401).json({ error: 'PIN incorrecto.' });
  }

  try {
    let data = await load(parsed.pi, parsed.n);
    if (!data) return res.status(404).json({ estado: 'invalido', error: 'No encontramos este bono.' });

    if (req.method === 'POST') {
      const accion = readBody(req).accion;
      const v = view(data);
      if (accion === 'canjear') {
        if (v.estado !== 'valido') return res.status(409).json({ ...v, error: 'Este bono no se puede canjear.' });
        await stripe(`/payment_intents/${data.intent.id}`, { method: 'POST', params: { [`metadata[canje_${parsed.n}]`]: new Date().toISOString() } });
      } else if (accion === 'deshacer') {
        if (v.estado !== 'canjeado') return res.status(409).json({ ...v, error: 'Este bono no estaba canjeado.' });
        await stripe(`/payment_intents/${data.intent.id}`, { method: 'POST', params: { [`metadata[canje_${parsed.n}]`]: '' } });
      } else {
        return res.status(400).json({ error: 'Acción no válida.' });
      }
      data = await load(parsed.pi, parsed.n);
    }
    return res.status(200).json(view(data));
  } catch (err) {
    console.error('[bono]', err);
    return res.status(502).json({ error: 'No hemos podido consultar el bono. Inténtalo de nuevo.' });
  }
};

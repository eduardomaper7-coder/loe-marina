// POST /api/checkout
// Recibe el carrito ({ items: [{ id, variant, qty }] }), recalcula los precios con el
// catálogo del servidor (nunca se fía del precio que envía el navegador) y crea una
// sesión de Stripe Checkout. Devuelve { url } para redirigir al cliente al pago.
//
// Variables de entorno en Vercel:
//   STRIPE_SECRET_KEY  (obligatoria)  sk_test_... para pruebas, sk_live_... en producción
//   SITE_URL           (opcional)     p. ej. https://www.loemarina.com

const catalog = require('../assets/js/catalog.js');

const ALLOWED_HOSTS = [/^(www\.)?loemarina\.com$/, /\.vercel\.app$/, /^localhost(:\d+)?$/, /^127\.0\.0\.1(:\d+)?$/];
const MAX_LINES = 20;
const MAX_QTY = 10;

function siteOrigin(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  if (ALLOWED_HOSTS.some((re) => re.test(host))) {
    const local = /^(localhost|127\.0\.0\.1)/.test(host);
    return `${local ? 'http' : 'https'}://${host}`;
  }
  return (process.env.SITE_URL || 'https://www.loemarina.com').replace(/\/$/, '');
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

// Convierte cada línea del carrito en una línea de Stripe con precio del catálogo.
function buildLines(items) {
  const lines = [];
  for (const raw of items.slice(0, MAX_LINES)) {
    const product = catalog.find((p) => p.id === raw?.id);
    if (!product) throw new Error('Uno de los tratamientos del carrito ya no está disponible. Actualiza el carrito e inténtalo de nuevo.');

    let price = product.price;
    let variant = '';
    let sku = product.id;
    if (product.variants && product.variants.length) {
      const v = product.variants.find((x) => x.name === raw.variant);
      if (!v) throw new Error(`Elige una opción válida para «${product.name}».`);
      price = v.price;
      variant = v.name;
      sku = v.sku || sku;
    }
    if (typeof price !== 'number' || !(price > 0)) throw new Error(`«${product.name}» no tiene precio configurado.`);

    const qty = Math.min(MAX_QTY, Math.max(1, parseInt(raw.qty, 10) || 1));
    lines.push({ product, variant, sku, qty, unitAmount: Math.round(price * 100) });
  }
  if (!lines.length) throw new Error('Tu carrito está vacío.');
  return lines;
}

function toStripeParams(lines, origin) {
  const p = new URLSearchParams();
  lines.forEach((l, i) => {
    const k = `line_items[${i}]`;
    p.append(`${k}[quantity]`, String(l.qty));
    p.append(`${k}[price_data][currency]`, 'eur');
    p.append(`${k}[price_data][unit_amount]`, String(l.unitAmount));
    p.append(`${k}[price_data][product_data][name]`, l.product.name);
    if (l.variant) p.append(`${k}[price_data][product_data][description]`, l.variant);
    if (l.product.image) p.append(`${k}[price_data][product_data][images][0]`, origin + l.product.image);
    p.append(`${k}[price_data][product_data][metadata][sku]`, l.sku);
  });

  p.append('mode', 'payment');
  p.append('locale', 'es');
  p.append('submit_type', 'pay');
  p.append('success_url', `${origin}/gracias.html?session_id={CHECKOUT_SESSION_ID}`);
  p.append('cancel_url', `${origin}/pago-cancelado.html`);
  p.append('billing_address_collection', 'auto');
  p.append('phone_number_collection[enabled]', 'true');
  p.append('customer_creation', 'always');
  p.append('custom_fields[0][key]', 'regalo');
  p.append('custom_fields[0][type]', 'text');
  p.append('custom_fields[0][optional]', 'true');
  p.append('custom_fields[0][label][type]', 'custom');
  p.append('custom_fields[0][label][custom]', '¿Es un regalo? Nombre para el bono');
  p.append('custom_text[submit][message]', 'Recibirás tu bono en PDF al momento y de forma automática en el email que indiques arriba (revisa que esté bien escrito). Si es un regalo, puedes imprimirlo o reenviarlo a quien quieras.');
  p.append('custom_text[after_submit][message]', 'Para canjearlo, llámanos al 922 236 677 o escríbenos y reservamos tu cita en Loe Marina (C/ Pedro Modesto Campos, Edif. Los Dragos 8, Santa Cruz de Tenerife). El pago está cifrado y lo procesa Stripe, y recibirás también el recibo de tu compra.');

  const summary = lines.map((l) => `${l.qty}× ${l.sku}`).join(', ').slice(0, 490);
  p.append('metadata[pedido]', summary);
  p.append('payment_intent_data[description]', `Loe Marina · ${lines.map((l) => l.product.name).join(', ')}`.slice(0, 990));
  p.append('payment_intent_data[metadata][pedido]', summary);
  return p;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('[checkout] Falta la variable STRIPE_SECRET_KEY');
    return res.status(503).json({ error: 'Los pagos online no están disponibles en este momento. Llámanos al 922 236 677 y te ayudamos.' });
  }

  let lines;
  try {
    const body = readBody(req);
    lines = buildLines(Array.isArray(body.items) ? body.items : []);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: toStripeParams(lines, siteOrigin(req)),
    });
    const data = await r.json();
    if (!r.ok || !data.url) {
      console.error('[checkout] Stripe respondió con error', r.status, data && data.error && data.error.message);
      return res.status(502).json({ error: 'No hemos podido iniciar el pago. Inténtalo de nuevo en unos minutos.' });
    }
    return res.status(200).json({ url: data.url });
  } catch (err) {
    console.error('[checkout] Error de red con Stripe', err);
    return res.status(502).json({ error: 'No hemos podido conectar con la pasarela de pago. Inténtalo de nuevo.' });
  }
};

module.exports.buildLines = buildLines;
module.exports.toStripeParams = toStripeParams;

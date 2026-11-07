// Llamadas mínimas a la API de Stripe (sin SDK) que comparten los endpoints.
const API = 'https://api.stripe.com/v1';

async function stripe(path, { method = 'GET', params } = {}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw Object.assign(new Error('Falta STRIPE_SECRET_KEY'), { status: 503 });
  const r = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${key}`, ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: params ? new URLSearchParams(params) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw Object.assign(new Error((data.error && data.error.message) || 'Error de Stripe'), { status: r.status });
  return data;
}

// Sesión de Checkout con lo necesario para las entradas.
function getSession(id) {
  const q = ['line_items.data.price.product', 'payment_intent.latest_charge'].map((e) => `expand[]=${encodeURIComponent(e)}`).join('&');
  return stripe(`/checkout/sessions/${encodeURIComponent(id)}?${q}`);
}

const isSessionId = (id) => /^cs_(test|live)_[A-Za-z0-9]+$/.test(String(id || ''));

module.exports = { stripe, getSession, isSessionId };

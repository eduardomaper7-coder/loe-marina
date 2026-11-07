// Utilidades de canje de bonos.
// · Cada bono lleva en su QR un enlace firmado: /canjear.html?b=<pago>.<n>.<firma>
//   La firma (HMAC) impide inventarse bonos o cambiar el número.
// · El estado del canje se guarda en la metadata del pago de Stripe: canje_<n> = fecha ISO.

const crypto = require('crypto');

const SITE = () => (process.env.SITE_URL || 'https://www.loemarina.com').replace(/\/$/, '');

function key() {
  const base = process.env.BONO_SECRET || process.env.STRIPE_SECRET_KEY || '';
  if (!base) throw Object.assign(new Error('Falta STRIPE_SECRET_KEY'), { status: 503 });
  return crypto.createHash('sha256').update('loe-marina-bonos:' + base).digest();
}

const sign = (pi, n) => crypto.createHmac('sha256', key()).update(`${pi}.${n}`).digest('base64url').slice(0, 22);

function makeToken(paymentIntentId, n) {
  return `${paymentIntentId}.${n}.${sign(paymentIntentId, n)}`;
}

function parseToken(token) {
  const m = /^(pi_[A-Za-z0-9]+)\.(\d{1,3})\.([A-Za-z0-9_-]{22})$/.exec(String(token || ''));
  if (!m) return null;
  const [, pi, nStr, sig] = m;
  const expected = sign(pi, Number(nStr));
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return { pi, n: Number(nStr) };
}

const redeemUrl = (paymentIntentId, n) => `${SITE()}/canjear.html?b=${makeToken(paymentIntentId, n)}`;

// Comprueba el PIN del personal (variable STAFF_PIN en Vercel).
function checkPin(pin) {
  const real = process.env.STAFF_PIN || '';
  if (!real) return false;
  const a = crypto.createHash('sha256').update(String(pin || '')).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = { makeToken, parseToken, redeemUrl, checkPin };

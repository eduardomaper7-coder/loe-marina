// GET /api/session?session_id=cs_...
// Devuelve un resumen mínimo del pago para la página de agradecimiento (gracias.html).
// Solo expone lo que el propio cliente ya ve en Stripe: estado, total, productos y su email.

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const id = String((req.query && req.query.session_id) || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: 'Pedido no válido.' });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(503).json({ error: 'Pagos no configurados.' });

  try {
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}?expand[]=line_items`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const s = await r.json();
    if (!r.ok) return res.status(404).json({ error: 'No encontramos este pedido.' });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      paid: s.payment_status === 'paid',
      status: s.payment_status,
      reference: String(s.payment_intent || s.id).slice(-10).toUpperCase(),
      email: (s.customer_details && s.customer_details.email) || '',
      name: (s.customer_details && s.customer_details.name) || '',
      total: (s.amount_total || 0) / 100,
      currency: (s.currency || 'eur').toUpperCase(),
      items: ((s.line_items && s.line_items.data) || []).map((li) => ({
        name: li.description,
        qty: li.quantity,
        amount: (li.amount_total || 0) / 100,
      })),
    });
  } catch (err) {
    console.error('[session] Error con Stripe', err);
    return res.status(502).json({ error: 'No hemos podido consultar el pedido.' });
  }
};

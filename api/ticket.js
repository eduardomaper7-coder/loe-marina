// GET /api/ticket?session_id=cs_...
// Descarga el PDF con las entradas de un pedido pagado (una por cada unidad comprada).
// El session_id es largo y aleatorio, y solo lo conoce quien ha pagado (llega en la URL de gracias.html).

const { getSession, isSessionId } = require('./_lib/stripe.js');
const { buildTicketsPdf } = require('./_lib/ticket.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const id = String((req.query && req.query.session_id) || '');
  if (!isSessionId(id)) return res.status(400).json({ error: 'Pedido no válido.' });

  try {
    const session = await getSession(id);
    if (session.payment_status !== 'paid') return res.status(409).json({ error: 'El pago de este pedido todavía no está confirmado.' });

    const { bytes, tickets } = await buildTicketsPdf(session);
    const inline = req.query && req.query.view === '1';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="bonos-loe-marina-${tickets[0] ? tickets[0].ref : 'pedido'}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(Buffer.from(bytes));
  } catch (err) {
    console.error('[ticket]', err);
    const status = err.status === 404 || err.status === 400 ? 404 : 502;
    return res.status(status).json({ error: status === 404 ? 'No encontramos este pedido.' : 'No hemos podido generar tus bonos. Inténtalo de nuevo en unos minutos.' });
  }
};

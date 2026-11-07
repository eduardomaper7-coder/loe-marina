// Genera el PDF de entradas de un pedido pagado: una entrada por cada unidad comprada,
// con estilo de entrada de evento (cuerpo con foto + talón oscuro con QR y código).
// Lo usan /api/ticket (descarga) y /api/webhook (envío por email).

const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, pushGraphicsState, popGraphicsState, rectangle, clip, endPath, setCharacterSpacing } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const QRCode = require('qrcode');
const catalog = require('../../assets/js/catalog.js');
const { redeemUrl } = require('./bono.js');

// ── Textos que el centro puede querer cambiar ─────────────────────────────────────────
const VALIDEZ = process.env.TICKET_VALIDEZ || '12 meses desde la compra';
const TELEFONO = '922 236 677';
const DIRECCION = 'C/ Pedro Modesto Campos, Edif. Los Dragos 8 · Local A-3 · 38003 Santa Cruz de Tenerife';

const ROOT = path.join(__dirname, '..', '..');
const asset = (p) => fs.readFileSync(path.join(ROOT, p));

const hex = (h) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const C = {
  bg: hex('#eedfd1'),
  paper: hex('#fcf8f4'),
  cocoa: hex('#2a1c17'),
  ink: hex('#2b1f1a'),
  soft: hex('#6e5b52'),
  copper: hex('#c26e3f'),
  copper700: hex('#8f4a2a'),
  copper300: hex('#ebb08a'),
  line: hex('#e6d3c4'),
  white: hex('#ffffff'),
};

const fmtDate = (unix) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Atlantic/Canary' }).format(new Date(unix * 1000));

// Convierte la sesión de Stripe (con line_items.data.price.product expandido) en la lista de entradas.
function ticketsFromSession(s) {
  const ref = String((s.payment_intent && s.payment_intent.id) || s.payment_intent || s.id).slice(-10).toUpperCase();
  const gift = ((s.custom_fields || []).find((f) => f.key === 'regalo') || {}).text;
  const lines = (s.line_items && s.line_items.data) || [];
  const total = lines.reduce((n, li) => n + (li.quantity || 1), 0);
  const out = [];
  let n = 0;
  for (const li of lines) {
    const prod = (li.price && typeof li.price.product === 'object' && li.price.product) || {};
    const name = prod.name || li.description || 'Tratamiento';
    const item = catalog.find((p) => p.name === name);
    for (let q = 0; q < (li.quantity || 1); q++) {
      n++;
      out.push({
        n,
        total,
        code: `${ref}-${n}`,
        ref,
        name,
        variant: prod.description || '',
        sku: (prod.metadata && prod.metadata.sku) || (item && item.id) || '',
        image: item && item.image,
        holder: (s.customer_details && s.customer_details.name) || '',
        gift: (gift && gift.value) || '',
        date: fmtDate(s.created || Date.now() / 1000),
        paymentId: (s.payment_intent && s.payment_intent.id) || s.payment_intent || s.id,
      });
    }
  }
  return out;
}

// Parte un texto en líneas que quepan en `width`.
function wrap(text, font, size, width, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (font.widthOfTextAtSize(next, size) <= width || !cur) cur = next;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1] + ' ' + lines.slice(maxLines).join(' ');
    while (font.widthOfTextAtSize(last + '…', size) > width && last.length > 1) last = last.slice(0, -1);
    kept[maxLines - 1] = last.trim() + '…';
    return kept;
  }
  return lines;
}

// Texto con espaciado entre letras (para los rótulos en mayúsculas).
function spaced(page, text, opts, spacing) {
  page.pushOperators(pushGraphicsState(), setCharacterSpacing(spacing));
  page.drawText(text, opts);
  page.pushOperators(setCharacterSpacing(0), popGraphicsState());
}
const spacedWidth = (font, text, size, spacing) => font.widthOfTextAtSize(text, size) + spacing * Math.max(0, text.length - 1);

// Rectángulo redondeado como path SVG (origen arriba-izquierda, y hacia abajo).
function roundRect(w, h, r) {
  return `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

async function buildTicketsPdf(session) {
  const tickets = ticketsFromSession(session);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Bonos Loe Marina · ${tickets[0] ? tickets[0].ref : ''}`);
  doc.setAuthor('Loe Marina');
  doc.setCreator('loemarina.com');

  const serif = await doc.embedFont(fs.readFileSync(path.join(__dirname, 'fonts', 'cormorant-garamond-latin-500-normal.ttf')), { subset: true });
  const serifIt = await doc.embedFont(fs.readFileSync(path.join(__dirname, 'fonts', 'cormorant-garamond-latin-500-italic.ttf')), { subset: true });
  const sans = await doc.embedFont(fs.readFileSync(path.join(__dirname, 'fonts', 'jost-latin-400-normal.ttf')), { subset: true });
  const sansMd = await doc.embedFont(fs.readFileSync(path.join(__dirname, 'fonts', 'jost-latin-500-normal.ttf')), { subset: true });
  let mono = null;
  try { mono = await doc.embedPng(asset('assets/img/brand/monogram-sm.png')); } catch { /* sin logo */ }

  const imgCache = {};
  async function productImage(p) {
    if (!p) return null;
    if (!(p in imgCache)) {
      try { imgCache[p] = await doc.embedJpg(asset(p.replace(/^\//, ''))); } catch { imgCache[p] = null; }
    }
    return imgCache[p];
  }

  const W = 720, H = 280, M = 14;          // página y margen
  const TW = W - 2 * M, TH = H - 2 * M;    // billete
  const STUB = 184;                        // ancho del talón
  const PX = M + TW - STUB;                // línea perforada
  const R = 18;                            // radio de esquinas

  for (const t of tickets) {
    const page = doc.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.bg });

    // Cuerpo del billete y talón oscuro
    page.drawSvgPath(roundRect(TW, TH, R), { x: M, y: H - M, color: C.paper });
    const stubPath = `M 0 0 H ${STUB - R} A ${R} ${R} 0 0 1 ${STUB} ${R} V ${TH - R} A ${R} ${R} 0 0 1 ${STUB - R} ${TH} H 0 Z`;
    page.drawSvgPath(stubPath, { x: PX, y: H - M, color: C.cocoa });

    // Muescas y perforación
    page.drawCircle({ x: PX, y: H - M, size: 13, color: C.bg });
    page.drawCircle({ x: PX, y: M, size: 13, color: C.bg });
    for (let y = M + 22; y < H - M - 22; y += 9) page.drawCircle({ x: PX, y, size: 1.7, color: C.bg });

    // Foto del tratamiento (recortada en un marco)
    const fx = M + 16, fy = M + 16, fw = 158, fh = TH - 32;
    const img = await productImage(t.image);
    if (img) {
      const s = Math.max(fw / img.width, fh / img.height);
      const iw = img.width * s, ih = img.height * s;
      page.pushOperators(pushGraphicsState(), rectangle(fx, fy, fw, fh), clip(), endPath());
      page.drawImage(img, { x: fx + (fw - iw) / 2, y: fy + (fh - ih) / 2, width: iw, height: ih });
      page.pushOperators(popGraphicsState());
    } else {
      page.drawRectangle({ x: fx, y: fy, width: fw, height: fh, color: hex('#f3e4da') });
    }
    page.drawRectangle({ x: fx, y: fy, width: fw, height: fh, borderColor: C.copper300, borderWidth: 0.6 });

    // Información
    const ix = fx + fw + 22, iw = PX - ix - 24;
    let y = H - M - 34;
    spaced(page, 'LOE MARINA · CENTRO MÉDICO ESTÉTICO', { x: ix, y, size: 7, font: sansMd, color: C.copper }, 1.6);
    if (mono) page.drawImage(mono, { x: PX - 24 - 30, y: y - 12, width: 30, height: 30 });

    y -= 34;
    const title = wrap(t.name, serif, 27, iw - 34, 2);
    for (const line of title) { page.drawText(line, { x: ix, y, size: 27, font: serif, color: C.cocoa }); y -= 27; }
    if (t.variant) {
      y += 4;
      page.drawText(wrap(t.variant, serifIt, 15, iw, 1)[0], { x: ix, y, size: 15, font: serifIt, color: C.copper700 });
      y -= 18;
    }

    y -= 4;
    page.drawRectangle({ x: ix, y, width: 42, height: 1.4, color: C.copper });
    page.drawRectangle({ x: ix + 46, y: y + 0.45, width: iw - 46, height: 0.5, color: C.line });
    y -= 22;

    const field = (label, value, x, yy, w) => {
      spaced(page, label, { x, y: yy, size: 6.3, font: sansMd, color: C.copper }, 1.2);
      page.drawText(wrap(value || '—', sans, 10, w, 1)[0], { x, y: yy - 14, size: 10, font: sans, color: C.ink });
    };
    const colW = (iw - 14) / 2;
    field('TITULAR', t.holder, ix, y, colW);
    field(t.gift ? 'PARA' : 'FECHA DE COMPRA', t.gift || t.date, ix + colW + 14, y, colW);
    y -= 38;
    field(t.gift ? 'FECHA DE COMPRA' : 'VALIDEZ', t.gift ? t.date : VALIDEZ, ix, y, colW);
    field(t.gift ? 'VALIDEZ' : 'RESERVA TU CITA', t.gift ? VALIDEZ : TELEFONO, ix + colW + 14, y, colW);

    // Pie
    const foot = t.gift
      ? `Pide cita en el ${TELEFONO} o en el centro y presenta este bono al llegar.`
      : 'Pide cita antes de venir y presenta este bono (impreso o en el móvil).';
    page.drawText(foot, { x: ix, y: M + 30, size: 7.6, font: sans, color: C.soft });
    page.drawText(wrap(DIRECCION, sans, 6.6, iw, 1)[0], { x: ix, y: M + 18, size: 6.6, font: sans, color: C.soft });

    // Talón: número de entrada, QR y código
    const sx = PX + 10, sw = STUB - 10;
    const cx = sx + sw / 2;
    const center = (txt, font, size, yy, color, sp = 0) => {
      const w = spacedWidth(font, txt, size, sp);
      if (sp) spaced(page, txt, { x: cx - w / 2, y: yy, size, font, color }, sp);
      else page.drawText(txt, { x: cx - w / 2, y: yy, size, font, color });
    };
    center('BONO', sansMd, 7, H - M - 34, C.copper300, 2.4);
    center(`${t.n} / ${t.total}`, sans, 19, H - M - 58, C.white, 1);

    const qrText = /^pi_/.test(t.paymentId) ? redeemUrl(t.paymentId, t.n) : `LOE MARINA · Bono ${t.code} · ${t.name}`;
    const qrPng = await QRCode.toBuffer(
      qrText,
      { errorCorrectionLevel: 'M', margin: 1, width: 360, color: { dark: '#2a1c17', light: '#fcf8f4' } }
    );
    const qr = await doc.embedPng(qrPng);
    const qs = 104;
    page.drawRectangle({ x: cx - qs / 2 - 6, y: M + 58, width: qs + 12, height: qs + 12, color: C.paper });
    page.drawImage(qr, { x: cx - qs / 2, y: M + 64, width: qs, height: qs });

    center(t.code, sansMd, 9.5, M + 38, C.white, 1.4);
    center('VÁLIDO PARA 1 PERSONA', sans, 6, M + 24, C.copper300, 1.4);
  }

  return { bytes: await doc.save(), tickets };
}

module.exports = { buildTicketsPdf, ticketsFromSession };

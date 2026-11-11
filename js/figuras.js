/** Figuras de área, volumen y perímetro, con cada medida en su color. */

const INK = {
  purple: "#7a3ff0",
  green: "#0d8a4a",
  orange: "#d35400",
  teal: "#0c7a8a",
  magenta: "#c2185b",
  blue: "#1554b0",
};

export function ink(tone, text) {
  return `{{${tone}:${text}}}`;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function label(mark) {
  return mark && mark.text != null ? mark : { text: String(mark ?? ""), tone: "blue" };
}

function textAt(x, y, mark, anchor = "middle") {
  const item = label(mark);
  const fill = INK[item.tone] || INK.blue;
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}">${esc(item.text)}</text>`;
}

function svg(body, alt) {
  return `<figure class="figura"><svg viewBox="0 0 360 230" role="img" aria-label="${esc(alt)}">${body}</svg></figure>`;
}

export function figureHtml(kind, spec) {
  if (kind === "prism") return prismSvg(spec);
  if (kind === "tri") return triSvg(spec);
  if (kind === "square") return squareSvg(spec);
  if (kind === "compound") return compoundSvg(spec);
  if (kind === "trap") return trapSvg(spec);
  return rectSvg(spec);
}

function rectSvg(spec) {
  const x = 48;
  const y = 42;
  const w = 210;
  const h = 118;
  return svg(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fffdf8" stroke="#243044" stroke-width="3" rx="2"/>
    ${textAt(x + w / 2, y + h + 32, spec.ancho || spec.largo)}
    ${textAt(x + w + 14, y + h / 2 + 8, spec.largo || spec.ancho, "start")}`,
    "Rectángulo con el ancho y el largo marcados"
  );
}

function squareSvg(spec) {
  const x = 96;
  const y = 28;
  const s = 140;
  return svg(
    `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#f6f1ff" stroke="#243044" stroke-width="3"/>
    ${textAt(x + s / 2, y + s + 32, spec.lado)}
    ${textAt(x - 12, y + s / 2 + 8, spec.lado, "end")}`,
    "Cuadrado con el lado marcado"
  );
}

function triSvg(spec) {
  const left = 46;
  const right = 300;
  const baseY = 176;
  const topX = 173;
  const topY = 36;
  const mid = (left + right) / 2;
  return svg(
    `<polygon points="${left},${baseY} ${right},${baseY} ${topX},${topY}" fill="#fffdf8" stroke="#243044" stroke-width="3" stroke-linejoin="round"/>
    <line x1="${mid}" y1="${topY}" x2="${mid}" y2="${baseY}" stroke="${INK.orange}" stroke-width="2.5" stroke-dasharray="7 6"/>
    ${textAt(mid, baseY + 32, spec.base)}
    ${textAt(mid + 14, (topY + baseY) / 2 + 6, spec.altura, "start")}`,
    "Triángulo con la base y la altura marcadas"
  );
}

function prismSvg(spec) {
  const x = 54;
  const y = 168;
  const w = 150;
  const h = 96;
  const dx = 64;
  const dy = -40;
  const front = `${x},${y} ${x + w},${y} ${x + w},${y - h} ${x},${y - h}`;
  const top = `${x},${y - h} ${x + w},${y - h} ${x + w + dx},${y - h + dy} ${x + dx},${y - h + dy}`;
  const side = `${x + w},${y} ${x + w + dx},${y + dy} ${x + w + dx},${y - h + dy} ${x + w},${y - h}`;
  return svg(
    `<polygon points="${top}" fill="#f4ebff" stroke="#243044" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="${side}" fill="#e7f8ee" stroke="#243044" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="${front}" fill="#fffdf8" stroke="#243044" stroke-width="3" stroke-linejoin="round"/>
    ${textAt(x + w / 2, y + 30, spec.largo)}
    ${textAt(x + w + dx / 2 + 16, y + dy / 2 + 22, spec.ancho)}
    ${textAt(x - 14, y - h / 2 + 8, spec.alto, "end")}`,
    "Prisma rectangular con largo, ancho y alto marcados"
  );
}

function compoundSvg(spec) {
  const x = 28;
  const y = 36;
  const s = 132;
  const w = 86;
  return svg(
    `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#f4ebff" stroke="#243044" stroke-width="3"/>
    <rect x="${x + s}" y="${y}" width="${w}" height="${s}" fill="#e7f8ee" stroke="#243044" stroke-width="3"/>
    ${textAt(x + s / 2, y + s + 32, spec.lado)}
    ${textAt(x + s + w / 2, y + s + 32, spec.extra)}`,
    "Cuadrado con un rectángulo pegado a un lado"
  );
}

function trapSvg(spec) {
  const y1 = 58;
  const y2 = 176;
  const x1 = 40;
  const x2 = 310;
  const t1 = 110;
  const t2 = 230;
  const mid = (t1 + t2) / 2;
  return svg(
    `<polygon points="${x1},${y2} ${x2},${y2} ${t2},${y1} ${t1},${y1}" fill="#fffdf8" stroke="#243044" stroke-width="3" stroke-linejoin="round"/>
    <line x1="${mid}" y1="${y1}" x2="${mid}" y2="${y2}" stroke="${INK.orange}" stroke-width="2.5" stroke-dasharray="7 6"/>
    ${textAt((x1 + x2) / 2, y2 + 32, spec.mayor)}
    ${textAt(mid, y1 - 14, spec.menor)}
    ${textAt(mid + 16, (y1 + y2) / 2, spec.altura, "start")}`,
    "Trapecio con las dos bases y la altura marcadas"
  );
}

export function askRow(text) {
  return { step: { tone: "neutral", label: "¿Qué nos piden?" }, text };
}

export function formulaRow(text) {
  return { step: { tone: "blue", label: "Fórmula" }, text };
}

export function subRow(text) {
  return { step: { tone: "purple", label: "Sustitución" }, text };
}

export function workRow(labelText, text, tone) {
  return { step: { tone, label: labelText }, text };
}

export function resultRow(left, right) {
  return { left, right, result: true, step: { tone: "result", label: "Resultado" } };
}

export function boardOf(rows, figure = "") {
  return { paths: [{ title: "", subtitle: "", rows }], clave: "", check: null, figure };
}

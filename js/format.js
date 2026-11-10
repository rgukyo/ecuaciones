/** Texto matemático en HTML, armado solo con números propios. */

import { frac } from "./frac.js";

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function fmtInt(n) {
  return String(n).replace("-", "−");
}

export function numHtml(f) {
  const value = typeof f === "number" ? frac(f) : f;
  if (value.d === 1) return fmtInt(value.n);
  const sign = value.n < 0 ? "−" : "";
  return `${sign}<span class="frac"><span class="n">${Math.abs(value.n)}</span><span class="d">${value.d}</span></span>`;
}

function mono(coef, body) {
  const abs = Math.abs(coef);
  if (!body) return String(abs);
  if (abs === 1) return body;
  return `${abs}${body}`;
}

/** Términos [coeficiente, parte literal]. La parte literal ya trae el símbolo (x, x²). */
export function linTerms(terms) {
  const chunks = [];
  for (const [coef, body] of terms) {
    if (coef === 0) continue;
    const piece = mono(coef, body);
    if (chunks.length === 0) {
      chunks.push(coef < 0 ? `−${piece}` : piece);
    } else {
      chunks.push(coef < 0 ? `− ${piece}` : `+ ${piece}`);
    }
  }
  return chunks.length ? chunks.join(" ") : "0";
}

export function linHtml(a, b, variable = "x") {
  return linTerms([
    [a, variable],
    [b, ""],
  ]);
}

export function eqHtml(a, b, c, d) {
  return `${linHtml(a, b)} = ${linHtml(c, d)}`;
}

export function lin2Html(a, b) {
  return linTerms([
    [a, "x"],
    [b, "y"],
  ]);
}

export function polyHtml(a, b, c) {
  return linTerms([
    [a, "x²"],
    [b, "x"],
    [c, ""],
  ]);
}

export function polyPlain(c2, c1, c0) {
  return linTerms([
    [c2, "x^2"],
    [c1, "x"],
    [c0, ""],
  ])
    .replace(/−/g, "-")
    .replace(/x\^2/g, "x^2");
}

export function parenX(constant) {
  if (constant === 0) return "(x)";
  if (constant > 0) return `(x + ${constant})`;
  return `(x − ${-constant})`;
}

export function parenTerm(coef, constant, isFirst) {
  const inner = parenX(constant);
  const abs = Math.abs(coef);
  const body = `${abs === 1 ? "" : abs}${inner}`;
  if (isFirst) return `${coef < 0 ? "−" : ""}${body}`;
  return `${coef < 0 ? "− " : "+ "}${body}`;
}

export function fracBar(top, bottom) {
  return `<span class="frac"><span class="n">${top}</span><span class="d">${bottom}</span></span>`;
}

export function systemHtml(e1, e2) {
  return `<div class="eq-system"><span class="brace" aria-hidden="true">{</span><div class="eq-lines"><div>${lin2Html(e1.a, e1.b)} = ${fmtInt(e1.c)}</div><div>${lin2Html(e2.a, e2.b)} = ${fmtInt(e2.c)}</div></div></div>`;
}

export function promptBox(lead, inner, extraClass = "") {
  return `<p class="lead">${lead}</p><div class="math-lg ${extraClass}">${inner}</div>`;
}

function mathToken(inner) {
  const t = inner.trim();
  const asFrac = t.match(/^([+-]?\d+)\/([+]?\d+)$/);
  if (asFrac) {
    const d = parseInt(asFrac[2], 10);
    if (d !== 0) return numHtml(frac(parseInt(asFrac[1], 10), d));
  }
  const safe = esc(t).replace(/-/g, "−").replace(/\^2/g, "²").replace(/\*/g, "×");
  return `<span class="math-inline">${safe}</span>`;
}

/** Párrafos de la lección: **negrita** y [[3/2]] o [[x^2]]. */
export function rich(s) {
  const escaped = esc(s);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[\[([^\]]+)\]\]/g, (_, inner) => mathToken(inner.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")));
}

export function años(n) {
  return Math.abs(n) === 1 ? "1 año" : `${Math.abs(n)} años`;
}

export function pesos(n) {
  const v = Math.abs(n);
  return v === 1 ? "$1 peso" : `$${v} pesos`;
}

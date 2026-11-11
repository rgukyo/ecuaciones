/** Cuaderno visual: la ecuación se mueve renglón por renglón. */

import { add, frac, mul } from "./frac.js";

let arrowSerial = 0;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtInt(n) {
  return String(n).replace("-", "−");
}

function fmtFrac(value) {
  const f = value && typeof value === "object" ? value : frac(value);
  if (f.d === 1) return fmtInt(f.n);
  return `[[${f.n}/${f.d}]]`;
}

function piece(coef, body, isFirst) {
  if (coef === 0) return "";
  const abs = Math.abs(coef);
  const core = body ? (abs === 1 ? body : `${abs}${body}`) : String(abs);
  if (isFirst) return `${coef < 0 ? "−" : ""}${core}`;
  return `${coef < 0 ? "−" : "+"} ${core}`;
}

function sideText(xCoef, constant, variable = "x") {
  const parts = [piece(xCoef, variable, true), piece(constant, "", xCoef === 0)];
  const text = parts.filter(Boolean).join(" ");
  return text || "0";
}

function withOp(base, opText) {
  return `${base} ${opText}`.trim();
}

function monoX(coef) {
  const abs = Math.abs(coef);
  return abs === 1 ? "x" : `${abs}x`;
}

/** Dos caminos para ax + b = cx + d. */
export function linearBoard(a, b, c, d, solution) {
  const sol = fmtFrac(solution);
  const balance = balancePath(a, b, c, d, sol);
  const pass = passPath(a, b, c, d, sol);
  const paths = [balance];
  let clave = "";
  if (pass) {
    paths.push(pass);
    clave = "Distinto camino, ¡misma respuesta!";
  }
  return { paths, clave, check: substitution(a, b, c, d, solution) };
}

function balancePath(a, b, c, d, sol) {
  const rows = [{ left: sideText(a, b), right: sideText(c, d) }];
  let A = a;
  let B = b;
  let C = c;
  let D = d;
  if (C !== 0) {
    const op = C > 0 ? `− ${monoX(C)}` : `+ ${monoX(-C)}`;
    const label = C > 0 ? `Resta ${monoX(C)} en los dos lados` : `Suma ${monoX(-C)} en los dos lados`;
    rows.push({
      left: withOp(sideText(A, B), op),
      right: withOp(sideText(C, D), op),
      hot: [op],
      arrow: { op: C > 0 ? "−" : "+", label, dir: "same" },
    });
    A -= C;
    C = 0;
    rows.push({
      left: sideText(A, B),
      right: sideText(0, D),
      arrow: { op: "=", label: "Simplifica", dir: "same" },
    });
  }
  if (B !== 0) {
    const op = B > 0 ? `− ${B}` : `+ ${-B}`;
    const label = B > 0 ? `Resta ${B} en los dos lados` : `Suma ${-B} en los dos lados`;
    rows.push({
      left: withOp(sideText(A, B), op),
      right: withOp(sideText(0, D), op),
      hot: [op],
      arrow: { op: B > 0 ? "−" : "+", label, dir: "same" },
    });
    D -= B;
    B = 0;
    rows.push({
      left: sideText(A, 0),
      right: sideText(0, D),
      arrow: { op: "=", label: "Simplifica", dir: "same" },
    });
  }
  if (A !== 1) {
    const divisor = fmtInt(A);
    rows.push({
      left: `${sideText(A, 0)} ÷ (${divisor})`,
      right: `${sideText(0, D)} ÷ (${divisor})`,
      hot: [`÷ (${divisor})`],
      arrow: { op: "÷", label: `Divide entre ${divisor}`, dir: "same" },
    });
  }
  finishRow(rows, sol);
  return { title: "Método 01", subtitle: "La misma operación en los dos lados", rows };
}

function finishRow(rows, sol) {
  const last = rows[rows.length - 1];
  if (last && last.left === "x" && last.right === sol) {
    last.result = true;
    return;
  }
  rows.push({
    left: "x",
    right: sol,
    result: true,
    arrow: { op: "=", label: "Resultado", dir: "same" },
  });
}

function passPath(a, b, c, d, sol) {
  if (b === 0 && c === 0) return null;
  const rows = [{ left: sideText(a, b), right: sideText(c, d) }];
  let A = a;
  let B = b;
  let D = d;
  if (c !== 0) {
    const gone = c > 0 ? `− ${monoX(c)}` : `+ ${monoX(-c)}`;
    A -= c;
    rows.push({
      left: sideText(A, B),
      right: sideText(0, D),
      hot: [],
      arrow: {
        op: c > 0 ? "−" : "+",
        label: c > 0 ? `${monoX(c)} pasa restando` : `${monoX(-c)} pasa sumando`,
        dir: "to-left",
      },
    });
    void gone;
  }
  if (B !== 0) {
    const passed = B > 0 ? `− ${B}` : `+ ${-B}`;
    const shown = `${sideText(0, D)} ${passed}`;
    const nextD = D - B;
    rows.push({
      left: sideText(A, 0),
      right: shown,
      hot: [passed],
      arrow: {
        op: B > 0 ? "−" : "+",
        label: B > 0 ? `+${B} pasa restando` : `−${-B} pasa sumando`,
        dir: "to-right",
      },
    });
    D = nextD;
    const simplified = sideText(0, D);
    if (simplified !== shown) {
      rows.push({
        left: sideText(A, 0),
        right: simplified,
        arrow: { op: "=", label: "Calcula ese lado", dir: "same" },
      });
    }
  }
  if (A !== 1) {
    const divisor = fmtInt(A);
    rows.push({
      left: "x",
      right: `${sideText(0, D)} ÷ (${divisor})`,
      hot: [`÷ (${divisor})`],
      arrow: { op: "÷", label: `Divide entre ${divisor}`, dir: "same" },
    });
  }
  finishRow(rows, sol);
  return { title: "Método 02", subtitle: "Pasar al otro lado", rows };
}

function substitution(a, b, c, d, solution) {
  const sol = fmtFrac(solution);
  const leftValue = add(mul(frac(a), solution), frac(b));
  const rightValue = add(mul(frac(c), solution), frac(d));
  return {
    title: "Sustitución",
    lines: [
      { left: sideText(a, b), right: sideText(c, d) },
      { left: plug(a, b, sol), right: plug(c, d, sol), hot: [`(${sol})`] },
      { left: fmtFrac(leftValue), right: fmtFrac(rightValue), ok: true },
    ],
  };
}

function plug(coef, constant, sol) {
  const parts = [];
  if (coef !== 0) {
    const abs = Math.abs(coef);
    const core = `${abs === 1 ? "" : abs}(${sol})`;
    parts.push(coef < 0 ? `−${core}` : core);
  }
  if (constant !== 0) {
    const abs = Math.abs(constant);
    if (!parts.length) parts.push(constant < 0 ? `−${abs}` : String(abs));
    else parts.push(constant < 0 ? `− ${abs}` : `+ ${abs}`);
  }
  return parts.join(" ") || "0";
}

function stripStep(html) {
  return String(html)
    .replace(/<span class="frac">\s*<span class="n">([^<]*)<\/span>\s*<span class="d">([^<]*)<\/span>\s*<\/span>/g, "[[$1/$2]]")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function asEquation(text) {
  let t = text.replace(/^(Ecuación|Queda|Operación|Expresión|Solución|Resultado)\s*:\s*/i, "");
  t = t.replace(/\.$/, "").trim();
  if (!t.includes("=")) return null;
  if ((t.match(/=/g) || []).length !== 1) return null;
  if (/[a-záéíóúñ]{5,}/i.test(t)) return null;
  const [left, right] = t.split("=").map((part) => part.trim());
  if (!left || !right) return null;
  return { left, right };
}

function opFrom(text) {
  const t = text.toLowerCase();
  if (t.includes("divide") || t.includes("÷")) return "÷";
  if (t.includes("multiplica") || t.includes("distrib")) return "×";
  if (t.includes("resta") || t.includes("pasa restando")) return "−";
  if (t.includes("suma") || t.includes("pasa sumando")) return "+";
  return "→";
}

/** Si el problema no trae un tablero propio, el cuaderno se arma con sus pasos. */
export function notebookFromSteps(steps) {
  const rows = [];
  let checkText = "";
  for (const step of steps || []) {
    const text = stripStep(step);
    if (!text) continue;
    if (/^comprobación/i.test(text)) {
      checkText = text.replace(/^Comprobación:\s*/i, "");
      continue;
    }
    const eq = asEquation(text);
    if (!eq) {
      rows.push({ note: text });
      continue;
    }
    const prev = rows[rows.length - 1];
    const result = /^solución|^resultado/i.test(text);
    rows.push({
      ...eq,
      result,
      arrow: prev && prev.note
        ? { op: opFrom(prev.note), label: prev.note.replace(/\.$/, "").slice(0, 72), dir: "same" }
        : null,
    });
  }
  const check = checkText ? { title: "Sustitución", note: checkText, lines: [] } : null;
  return {
    paths: [{ title: "", subtitle: "", rows }],
    clave: "",
    check,
  };
}

export function beatCount(board) {
  if (!board) return 1;
  const rows = Math.max(...board.paths.map((path) => path.rows.length), 0);
  return rows + (board.check ? 1 : 0);
}

function paint(text, hot = []) {
  let html = esc(text).replace(/\[\[(-?\d+)\/(\d+)\]\]/g, (_, n, d) => {
    const neg = n.startsWith("-");
    const num = neg ? n.slice(1) : n;
    return `${neg ? "−" : ""}<span class="frac"><span class="n">${num}</span><span class="d">${d}</span></span>`;
  });
  const marks = [...hot].filter(Boolean).sort((a, b) => b.length - a.length);
  const chosen = [];
  for (const mark of marks) {
    if (chosen.some((kept) => kept.includes(mark))) continue;
    chosen.push(mark);
  }
  for (const mark of chosen) {
    const safe = esc(mark).replace(/\[\[(-?\d+)\/(\d+)\]\]/g, (_, n, d) => {
      const neg = n.startsWith("-");
      const num = neg ? n.slice(1) : n;
      return `${neg ? "−" : ""}<span class="frac"><span class="n">${num}</span><span class="d">${d}</span></span>`;
    });
    if (!safe || !html.includes(safe)) continue;
    html = html.split(safe).join(`<span class="hot">${safe}</span>`);
  }
  return html;
}

function arrowSvg(arrow, index) {
  if (!arrow) return "";
  const id = `flecha-${arrowSerial}-${index}`;
  const dir = arrow.dir || "same";
  const start = dir === "to-right" ? 48 : dir === "to-left" ? 300 : 250;
  const end = dir === "to-right" ? 300 : dir === "to-left" ? 48 : 250;
  const hue = { "−": "#e07a3d", "+": "#0c8a7a", "×": "#7b4bb3", "÷": "#1d6fd6", "=": "#1554b0", "→": "#c62828" }[arrow.op] || "#c62828";
  return `<div class="move" style="color:${hue}">
    <svg viewBox="0 0 360 72" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <marker id="${id}" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="14" refY="8" orient="auto">
          <path d="M0,0 L16,8 L0,16 Z" fill="${hue}"></path>
        </marker>
      </defs>
      <path d="M${start} 8 C ${start} 36, ${end} 14, ${end} 50" fill="none" stroke="${hue}" stroke-width="6" stroke-linecap="round" marker-end="url(#${id})"></path>
    </svg>
    <span class="move-op">${esc(arrow.op || "")}</span>
    <span class="move-label">${esc(arrow.label || "")}</span>
  </div>`;
}

function rowHtml(row) {
  if (row.note) return `<p class="ink-note">${esc(row.note)}</p>`;
  const body = `<div class="eq-row ${row.result ? "is-result" : ""}">
      <span class="eq-side left">${paint(row.left, row.hot)}</span>
      <span class="eq-sign">=</span>
      <span class="eq-side right">${row.result ? `<span class="result-pill">${paint(row.right, row.hot)} <span class="check-mark" aria-label="correcto">✓</span></span>` : paint(row.right, row.hot)}</span>
    </div>`;
  return body;
}

function checkHtml(check) {
  if (!check) return "";
  if (check.note && (!check.lines || !check.lines.length)) {
    return `<aside class="subst"><h3>Comprobación</h3><p class="ink-note">${esc(check.note)} <span class="check-mark">✓</span></p></aside>`;
  }
  const lines = (check.lines || [])
    .map((line) => `<div class="eq-row ${line.ok ? "is-ok" : ""}">
        <span class="eq-side left">${paint(line.left, line.hot)}</span>
        <span class="eq-sign">=</span>
        <span class="eq-side right">${line.ok ? `<span class="result-pill">${paint(line.right, line.hot)} <span class="check-mark">✓</span></span>` : paint(line.right, line.hot)}</span>
      </div>`)
    .join("");
  return `<aside class="subst"><h3>${esc(check.title || "Sustitución")}</h3>${lines}</aside>`;
}

function pathHtml(path, shown) {
  arrowSerial += 1;
  const chunks = [];
  path.rows.forEach((row, index) => {
    if (index >= shown) return;
    if (index > 0 && row.arrow) chunks.push(arrowSvg(row.arrow, index));
    chunks.push(rowHtml(row));
  });
  const head = path.title ? `<h3 class="path-title">${esc(path.title)}</h3>${path.subtitle ? `<p class="path-sub">${esc(path.subtitle)}</p>` : ""}` : "";
  return `<section class="path">${head}${chunks.join("")}</section>`;
}

export function renderNotebook(board, shown) {
  if (!board) return "";
  const limit = shown == null ? 99 : shown;
  const many = board.paths.length > 1;
  const paths = board.paths
    .map((path) => pathHtml(path, limit))
    .join(many ? `<div class="path-split" aria-hidden="true"></div>` : "");
  const showCheck = board.check && limit > Math.max(...board.paths.map((path) => path.rows.length));
  const clave = many && board.clave && showCheck ? `<p class="clave"><strong>Clave:</strong> ${esc(board.clave)}</p>` : "";
  return `<div class="notebook-work ${many ? "paths" : "one-path"}">${paths}</div>${clave}${showCheck ? `<div class="work-check">${checkHtml(board.check)}</div>` : ""}`;
}

export function renderLinearCheck(a, b, c, d, solution) {
  return checkHtml(substitution(a, b, c, d, solution));
}

export function viewBoard(problem) {
  if (problem && problem.board) return problem.board;
  return notebookFromSteps(problem && problem.steps);
}

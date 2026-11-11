/** Cuaderno visual: cada término que se mueve conserva su color. */

import { add, frac, mul } from "./frac.js";

const TONES = ["purple", "green", "orange", "teal", "magenta", "blue"];
const TONE_STYLE = {
  purple: { ink: "#7a3ff0", band: "#f3e9ff" },
  green: { ink: "#0d8a4a", band: "#e5f8ec" },
  orange: { ink: "#d35400", band: "#fff0e4" },
  teal: { ink: "#0c7a8a", band: "#e3f6f8" },
  magenta: { ink: "#c2185b", band: "#fde8f0" },
  blue: { ink: "#1554b0", band: "#e7f0ff" },
  neutral: { ink: "#3d4d63", band: "#f7f1e4" },
  result: { ink: "#14663a", band: "#e5f6ea" },
};

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

function monoX(coef) {
  const abs = Math.abs(coef);
  return abs === 1 ? "x" : `${abs}x`;
}

function tag(tone, text) {
  return `{{${tone}:${text}}}`;
}

function plain(text) {
  return String(text ?? "")
    .replace(/\{\{[a-z]+:([\s\S]*?)\}\}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function colorLeaving(text, abs, tone) {
  const candidates = [`−${abs}`, `− ${abs}`, `+ ${abs}`, `+${abs}`, abs];
  for (const candidate of candidates) {
    const index = text.indexOf(candidate);
    if (index < 0) continue;
    const after = text[index + candidate.length] || "";
    if (/[0-9x²]/.test(after)) continue;
    return `${text.slice(0, index)}${tag(tone, candidate)}${text.slice(index + candidate.length)}`;
  }
  return text;
}

function colorConstant(text, value, tone) {
  const abs = String(Math.abs(value));
  const candidates = value < 0 ? [`− ${abs}`, `−${abs}`] : [`+ ${abs}`, `+${abs}`, abs];
  for (const candidate of candidates) {
    const index = text.indexOf(candidate);
    if (index < 0) continue;
    const after = text[index + candidate.length] || "";
    if (/[0-9x²]/.test(after)) continue;
    return `${text.slice(0, index)}${tag(tone, candidate)}${text.slice(index + candidate.length)}`;
  }
  return text;
}

function joinChunks(chunks) {
  return chunks.filter(Boolean).join(" ");
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
  let toneAt = 0;
  const nextTone = () => TONES[toneAt++ % TONES.length];
  let A = a;
  let B = b;
  let C = c;
  let D = d;
  if (C !== 0) {
    const tone = nextTone();
    const abs = monoX(Math.abs(C));
    const op = C > 0 ? `− ${abs}` : `+ ${abs}`;
    const label = C > 0 ? `Resta ${abs} en los dos lados` : `Suma ${abs} en los dos lados`;
    const prev = rows[rows.length - 1];
    prev.right = colorLeaving(prev.right, abs, tone);
    rows.push({
      left: `${sideText(A, B)} ${tag(tone, op)}`,
      right: `${sideText(C, D)} ${tag(tone, op)}`,
      step: { tone, label },
    });
    A -= C;
    C = 0;
    rows.push({
      left: sideText(A, B),
      right: sideText(0, D),
      step: { tone: "neutral", label: "Simplifica" },
    });
  }
  if (B !== 0) {
    const tone = nextTone();
    const abs = String(Math.abs(B));
    const op = B > 0 ? `− ${abs}` : `+ ${abs}`;
    const label = B > 0 ? `Resta ${abs} en los dos lados` : `Suma ${abs} en los dos lados`;
    const prev = rows[rows.length - 1];
    prev.left = colorConstant(prev.left, B, tone);
    prev.right = colorConstant(prev.right, B, tone);
    rows.push({
      left: `${sideText(A, B)} ${tag(tone, op)}`,
      right: `${sideText(0, D)} ${tag(tone, op)}`,
      step: { tone, label },
    });
    D -= B;
    B = 0;
    rows.push({
      left: sideText(A, 0),
      right: sideText(0, D),
      step: { tone: "neutral", label: "Simplifica" },
    });
  }
  if (A !== 1) {
    const tone = nextTone();
    const divisor = fmtInt(A);
    rows.push({
      left: `${sideText(A, 0)} ÷ (${tag(tone, divisor)})`,
      right: `${sideText(0, D)} ÷ (${tag(tone, divisor)})`,
      step: { tone, label: `Divide entre ${divisor}` },
    });
  }
  finishRow(rows, sol);
  return { title: "Método 01", subtitle: "La misma operación en los dos lados", rows };
}

function finishRow(rows, sol) {
  const last = rows[rows.length - 1];
  if (last && plain(last.left) === "x" && plain(last.right) === sol && !last.step) {
    last.result = true;
    last.step = { tone: "result", label: "Resultado" };
    return;
  }
  rows.push({
    left: "x",
    right: sol,
    result: true,
    step: { tone: "result", label: "Resultado" },
  });
}

function passPath(a, b, c, d, sol) {
  if (b === 0 && c === 0) return null;
  const rows = [{ left: sideText(a, b), right: sideText(c, d) }];
  let toneAt = 0;
  const nextTone = () => TONES[toneAt++ % TONES.length];
  let A = a;
  let B = b;
  let D = d;
  if (c !== 0) {
    const tone = nextTone();
    const abs = monoX(Math.abs(c));
    const arrived = c > 0 ? `− ${abs}` : `+ ${abs}`;
    const label = `La ${abs} ${c > 0 ? "pasa restando" : "pasa sumando"}`;
    const prev = rows[rows.length - 1];
    prev.right = colorLeaving(prev.right, abs, tone);
    A -= c;
    const leftShown = joinChunks([sideText(a, 0) === "0" ? "" : sideText(a, 0), tag(tone, arrived), B === 0 ? "" : B > 0 ? `+ ${B}` : `− ${Math.abs(B)}`]);
    rows.push({
      left: leftShown,
      right: sideText(0, D),
      step: { tone, label },
    });
    const simplified = sideText(A, B);
    if (plain(leftShown) !== simplified) {
      rows.push({
        left: simplified,
        right: sideText(0, D),
        step: { tone: "neutral", label: "Se juntan los términos semejantes" },
      });
    }
  }
  if (B !== 0) {
    const tone = nextTone();
    const abs = String(Math.abs(B));
    const passed = B > 0 ? `− ${abs}` : `+ ${abs}`;
    const label = B > 0 ? `El +${abs} pasa restando` : `El −${abs} pasa sumando`;
    const prev = rows[rows.length - 1];
    prev.left = colorConstant(prev.left, B, tone);
    const oldD = D;
    D -= B;
    const rightShown = oldD === 0 ? tag(tone, passed) : `${sideText(0, oldD)} ${tag(tone, passed)}`;
    rows.push({
      left: sideText(A, 0),
      right: rightShown,
      step: { tone, label },
    });
    const simplified = sideText(0, D);
    if (plain(rightShown) !== simplified) {
      rows.push({
        left: sideText(A, 0),
        right: simplified,
        step: { tone: "neutral", label: "Calcula ese lado" },
      });
    }
    B = 0;
  }
  if (A !== 1) {
    const tone = nextTone();
    const divisor = fmtInt(A);
    rows.push({
      left: "x",
      right: `${sideText(0, D)} ÷ (${tag(tone, divisor)})`,
      step: { tone, label: `Divide entre ${divisor}` },
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
      { left: plug(a, b, sol), right: plug(c, d, sol) },
      { left: fmtFrac(leftValue), right: fmtFrac(rightValue), ok: true },
    ],
  };
}

function plug(coef, constant, sol) {
  const parts = [];
  if (coef !== 0) {
    const abs = Math.abs(coef);
    const core = abs === 1 ? tag("magenta", sol) : `${abs}${tag("magenta", `(${sol})`)}`;
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
  let t = text.replace(
    /^(Ecuación|Queda|Operación|Expresión|Solución|Resultado|Primero|Segundo|Tercero|Cuarto|Después|Luego|Ahora)\s*:\s*/i,
    ""
  );
  t = t.replace(/\.$/, "").trim();
  if (!t.includes("=")) return null;
  if ((t.match(/=/g) || []).length !== 1) return null;
  if (/[a-záéíóúñ]{5,}/i.test(t)) return null;
  const [left, right] = t.split("=").map((part) => part.trim());
  if (!left || !right) return null;
  return { left, right };
}

function extractTerm(note) {
  const cleaned = note.replace(/\.$/, "");
  let match = cleaned.match(/(?:resta|suma)\s+([0-9]+\s*[a-z²]*|[a-z](?:²)?)/i);
  if (match) return match[1].replace(/\s/g, "");
  match = cleaned.match(/entre\s+([0-9]+|[a-z])/i);
  if (match) return match[1];
  match = cleaned.match(/([0-9]*[a-z](?:²)?|[0-9]+)\s+pasa/i);
  if (match) return match[1];
  return "";
}

function colorNote(text, term, tone) {
  if (!term || !text) return text;
  return colorLeaving(text, term, tone);
}

/** Si el problema no trae un tablero propio, el cuaderno se arma con sus pasos. */
export function notebookFromSteps(steps) {
  const rows = [];
  let toneAt = 0;
  let checkText = "";
  const nextTone = () => TONES[toneAt++ % TONES.length];
  for (const step of steps || []) {
    const text = stripStep(step);
    if (!text) continue;
    if (/^comprobación/i.test(text)) {
      checkText = text.replace(/^Comprobación:\s*/i, "");
      continue;
    }
    const bare = text.match(/^(Operación|Ecuación)\s*:\s*(.+?)\.?$/i);
    if (bare && !bare[2].includes("=")) {
      rows.push({ expr: bare[2].replace(/\.$/, ""), opener: bare[1] });
      continue;
    }
    const resultLine = /^solución|^resultado|^expresión reducida/i.test(text);
    const eq = asEquation(text);
    if (!eq) {
      if (resultLine) {
        const value = text.replace(/^(Resultado|Solución|Expresión reducida)\s*:\s*/i, "").replace(/\.$/, "");
        rows.push({ value, result: true, step: { tone: "result", label: "Resultado" } });
      } else {
        rows.push({ step: { tone: nextTone(), label: text.replace(/\.$/, "") } });
      }
      continue;
    }
    const prev = rows[rows.length - 1];
    const tone = prev?.step?.tone && prev.step.tone !== "result" ? prev.step.tone : nextTone();
    const term = prev?.step?.label ? extractTerm(prev.step.label) : "";
    const colored = {
      left: colorNote(eq.left, term, tone),
      right: colorNote(eq.right, term, tone),
    };
    if (resultLine) {
      rows.push({ ...colored, result: true, step: { tone: "result", label: "Resultado" } });
    } else if (prev?.step?.label && prev.left == null && prev.value == null) {
      rows.push({ ...colored, step: { tone, label: prev.step.label } });
    } else {
      rows.push(colored);
    }
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

const ORDINALS = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto", "Séptimo", "Octavo", "Noveno", "Décimo"];
let arrowSerial = 0;

function fracHtml(n, d) {
  const neg = String(n).startsWith("-");
  const num = neg ? String(n).slice(1) : n;
  return `${neg ? "−" : ""}<span class="frac"><span class="n">${num}</span><span class="d">${d}</span></span>`;
}

function chunksOf(text) {
  const chunks = [];
  const re = /\{\{[a-z]+:([\s\S]*?)\}\}/g;
  let last = 0;
  let match;
  const source = String(text ?? "");
  while ((match = re.exec(source))) {
    if (match.index > last) chunks.push({ raw: source.slice(last, match.index), tagged: false });
    chunks.push({ raw: match[1], tagged: true });
    last = match.index + match[0].length;
  }
  if (last < source.length) chunks.push({ raw: source.slice(last), tagged: false });
  return chunks.length ? chunks : [{ raw: source, tagged: false }];
}

function lexRaw(raw) {
  const tokens = [];
  const re = /\[\[(-?\d+)\/(\d+)\]\]|([0-9]*[a-zA-Z][a-zA-Z0-9²^]*)|([0-9]+)|([+−×÷=·])|(\s+)|(.)/g;
  let match;
  while ((match = re.exec(raw))) {
    if (match[1] != null) tokens.push({ type: "frac", n: match[1], d: match[2] });
    else if (match[3]) tokens.push({ type: /[a-zA-Z]/.test(match[3]) ? "var" : "num", text: match[3] });
    else if (match[4]) tokens.push({ type: "num", text: match[4] });
    else if (match[5]) tokens.push({ type: "op", text: match[5] });
    else if (match[6]) tokens.push({ type: "sp", text: match[6] });
    else tokens.push({ type: "txt", text: match[7] });
  }
  return tokens;
}

function tokenHtml(token, kind) {
  if (token.type === "frac") {
    return `<span class="k-${kind}">${fracHtml(token.n, token.d)}</span>`;
  }
  return `<span class="k-${kind}">${esc(token.text || "")}</span>`;
}

function mathHtml(text, options = {}) {
  const { circle = false, sole = false } = options;
  if (sole && /^[−-]?\d+(\/\d+)?$/.test(plain(text).trim())) {
    return `<span class="k-res">${esc(plain(text).trim())}</span>`;
  }
  const chunks = chunksOf(text);
  let prevOp = "";
  let html = "";
  chunks.forEach((chunk) => {
    const tokens = lexRaw(chunk.raw);
    let piece = "";
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (token.type === "sp") {
        piece += token.text;
        continue;
      }
      if (token.type === "op" && token.text === "=") {
        piece += tokenHtml(token, "eq");
        prevOp = "=";
        continue;
      }
      if (token.type === "op" && "+−×÷·".includes(token.text)) {
        const next = tokens.slice(i + 1).find((item) => item.type !== "sp");
        const spaces = tokens[i + 1] && tokens[i + 1].type === "sp" ? tokens[i + 1].text : "";
        if (next && (next.type === "num" || next.type === "var" || next.type === "frac")) {
          const opKind = token.text === "−" ? "sub" : token.text === "+" ? "sum" : "mul";
          const numKind = token.text === "×" || token.text === "÷" || token.text === "·" ? "mul" : token.text === "+" || token.text === "−" ? "sum" : "var";
          piece += tokenHtml(token, opKind) + spaces + tokenHtml(next, numKind);
          i += spaces ? 2 : 1;
          prevOp = token.text;
          continue;
        }
        piece += tokenHtml(token, token.text === "−" ? "sub" : token.text === "+" ? "sum" : "mul");
        prevOp = token.text;
        continue;
      }
      let kind = "var";
      if (token.type === "num" || token.type === "frac") {
        if (prevOp === "+" || prevOp === "−") kind = "sum";
        else if (prevOp === "×" || prevOp === "÷" || prevOp === "·") kind = "mul";
        else if (prevOp === "=" && sole) kind = "res";
        else kind = "var";
      } else if (token.type === "txt") kind = "txt";
      piece += tokenHtml(token, kind);
      prevOp = "";
    }
    if (circle && chunk.tagged) html += `<span class="oval oval-sub">${piece}</span>`;
    else html += piece;
  });
  if (circle === "all") return `<span class="oval oval-sub">${html}</span>`;
  if (circle && !html.includes("oval")) {
    const wrapped = html.replace(
      /(<span class="k-sub">−<\/span>\s*<span class="k-sum">[^<]+<\/span>(?:<span class="k-var">[^<]+<\/span>)?)/,
      '<span class="oval oval-sub">$1</span>'
    );
    if (wrapped !== html) return wrapped;
    const divided = html.replace(
      /((?:<span class="k-mul">[^<]*<\/span>\s*){1,4})/,
      '<span class="oval oval-mul">$1</span>'
    );
    if (divided !== html) return divided;
  }
  return html;
}

function noteHtml(text) {
  let html = esc(text);
  html = html.replace(/(\+[0-9]+(?:[a-z²]+)?)/gi, '<span class="k-sum">$1</span>');
  html = html.replace(/(−\s*[0-9]+(?:[a-z²]+)?)/gi, '<span class="k-sub">$1</span>');
  html = html.replace(/\b(restando|resta)\b/gi, '<span class="k-sub">$1</span>');
  html = html.replace(/\b(sumando|suma)\b/gi, '<span class="k-sum">$1</span>');
  html = html.replace(/\b(dividiendo|multiplicando|multiplicación|división|divide|multiplica)\b/gi, '<span class="k-mul">$1</span>');
  return html;
}

function rowText(row) {
  if (row.expr != null) return row.expr;
  if (row.value != null && row.left == null) return row.value;
  if (row.left != null) return `${row.left} = ${row.right}`;
  return row.text || "";
}

function isMathRow(row) {
  if (row.result) return false;
  if (row.expr != null || row.left != null) return true;
  if (!row.text) return false;
  if (row.step && /^(fórmula|sustitución)\b/i.test(row.step.label || "")) return true;
  const text = plain(row.text);
  if (/[a-záéíóúñ]{4,}/i.test(text)) return false;
  return /[=+−×÷·]/.test(text);
}

function preface(row) {
  const label = row.step?.label || "";
  if (!label || row.result) return "";
  if (/^simplifica$/i.test(label) || /calcula ese lado/i.test(label)) return "";
  const pasa = label.match(/^(?:La|El)\s+(.+?)\s+pasa\s+(restando|sumando)/i);
  if (pasa) return `El ${pasa[1]} pasa ${pasa[2].toLowerCase()} al otro lado del =, haciendo lo contrario.`;
  if (/^divide entre/i.test(label)) return "Está multiplicando. Pasa al otro lado dividiendo.";
  if (/se juntan/i.test(label)) return "Se juntan los términos semejantes.";
  if (row.left != null && label.length > 2) return label.replace(/\.$/, "") + (/[.!]$/.test(label) ? "" : ".");
  return "";
}

function arrowKind(row, prevExpr) {
  const label = row.step?.label || "";
  if (/pasa restando|^(resta)\b/i.test(label)) return "#d32f2f";
  if (/pasa sumando|^(suma)\b/i.test(label)) return "#f57c00";
  if (/^divide entre|^multiplica por/i.test(label)) return "#7b1fa2";
  if (row.left != null && prevExpr) {
    const host = plain(prevExpr).replace(/\s/g, "");
    const part = plain(row.left).replace(/\s/g, "");
    if (part.length >= 3 && /[+−×÷]/.test(part) && host.includes(part)) return "#d32f2f";
  }
  return "";
}

function fontPx(text) {
  const length = Math.max(plain(text).length, 1);
  return Math.max(14, Math.min(28, Math.floor(168 / (length * 0.56))));
}

function equationRow(row, label, circle, aside) {
  const text = rowText(row);
  const sole =
    row.left != null &&
    !/^(Ecuación|Operación)/.test(label) &&
    /^[−-]?\d+(\/\d+)?$/.test(plain(row.right || "").trim());
  let math = "";
  if (row.left != null) {
    const leftTagged = String(row.left).includes("{{");
    const rightTagged = String(row.right).includes("{{");
    const left = mathHtml(row.left, { circle: circle === "all-left" ? "all" : circle === "tag" && leftTagged && !rightTagged, sole: false });
    const right = mathHtml(row.right, { circle: circle === "tag" && rightTagged, sole });
    math = `${left}<span class="k-eq"> = </span>${right}`;
  } else {
    math = mathHtml(text, { circle: circle === "tag", sole: false });
  }
  const extra = aside ? `<span class="aside">${esc(aside)}</span>` : "";
  return `<div class="sheet-row"><span class="sheet-label">${esc(label)}</span><span class="sheet-math" style="font-size:${fontPx(text + (aside || ""))}px">${math}${extra}</span></div>`;
}

function resultRow(row) {
  const text = row.left != null ? `${plain(row.left)} = ${plain(row.right)}` : plain(row.value || row.text || "");
  return `<div class="sheet-row sheet-result"><span class="sheet-label sheet-label-lg">Resultado:</span><span class="result-oval">${esc(text)}</span></div>`;
}

function noteBlock(text) {
  if (!text) return "";
  return `<p class="sheet-note">${noteHtml(text)}</p>`;
}

function arrowSvg(color) {
  arrowSerial += 1;
  const id = `punta-${arrowSerial}`;
  return `<svg class="gutter-arrow" viewBox="0 0 46 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="${id}" markerUnits="strokeWidth" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="${color}"></path></marker></defs><path d="M8,4 C 38,14 40,72 14,94" fill="none" stroke="${color}" stroke-width="2.4" vector-effect="non-scaling-stroke" marker-end="url(#${id})"></path></svg>`;
}

function renderRows(rows, eqStart, prevExprStart = "") {
  let count = eqStart;
  let prevExpr = prevExprStart;
  let lastNote = "";
  const norm = (value) => plain(value).replace(/[.]+$/g, "").trim();
  const html = rows
    .map((row) => {
      if (row.result || (row.value != null && row.left == null && !row.expr)) return resultRow(row);
      if (!isMathRow(row)) {
        const label = row.step?.label || "";
        const text = row.text || row.note || "";
        const combined = label && text && !text.toLowerCase().includes(label.toLowerCase()) ? `${label} ${text}` : text || label;
        lastNote = combined;
        return noteBlock(combined);
      }
      const label = row.opener
        ? `${row.opener}:`
        : row.step && row.text && !row.left
          ? `${row.step.label}:`
          : count === 0
            ? (/[a-z]/i.test(plain(rowText(row))) ? "Ecuación:" : "Operación:")
            : `${ORDINALS[count - 1] || "Sigue"}:`;
      count += 1;
      const note = preface(row);
      const showNote = note && norm(note) !== norm(lastNote);
      if (showNote) lastNote = note;
      let aside = "";
      if (row.step && /calcula ese lado|simplifica/i.test(row.step.label || "") && prevExpr.includes("=")) {
        const prevRight = plain(prevExpr.split("=").pop());
        const now = plain(row.right || "");
        if (prevRight && now && prevRight !== now) aside = `(${prevRight} = ${now})`;
      }
      const line = `${showNote ? noteBlock(note) : ""}${equationRow(row, label, row._circle || "", aside)}`;
      prevExpr = rowText(row);
      return line;
    })
    .join("");
  return { html, count, prevExpr };
}

function pathHtml(path, shown) {
  const rows = path.rows.slice(0, shown);
  const parts = [];
  let eqCount = 0;
  let carried = "";
  let index = 0;
  while (index < rows.length) {
    let dest = -1;
    for (let cursor = index + 1; cursor < rows.length; cursor += 1) {
      let fromExpr = "";
      for (let back = cursor - 1; back >= index; back -= 1) {
        if (rows[back].expr || rows[back].left != null || isMathRow(rows[back])) {
          fromExpr = rowText(rows[back]);
          break;
        }
      }
      const tone = arrowKind(rows[cursor], fromExpr);
      if (tone && isMathRow(rows[cursor])) {
        dest = cursor;
        const tagged = String(rows[cursor].left || "").includes("{{") || String(rows[cursor].right || "").includes("{{");
        rows[cursor]._circle = tagged ? "tag" : "all-left";
        rows[cursor]._arrow = tone;
        break;
      }
    }
    if (dest < 0) {
      const chunk = renderRows(rows.slice(index), eqCount, carried);
      parts.push(chunk.html);
      break;
    }
    let source = dest - 1;
    while (source > index && !(rows[source].expr || rows[source].left != null || isMathRow(rows[source]))) source -= 1;
    if (source > index) {
      const before = renderRows(rows.slice(index, source), eqCount, carried);
      parts.push(before.html);
      eqCount = before.count;
      carried = before.prevExpr;
    }
    const block = renderRows(rows.slice(source, dest + 1), eqCount, carried);
    parts.push(`<div class="arrow-block">${block.html}${arrowSvg(rows[dest]._arrow)}</div>`);
    eqCount = block.count;
    carried = block.prevExpr;
    index = dest + 1;
  }
  const head = path.title ? `<h3 class="sheet-title">${esc(path.title)}</h3>${path.subtitle ? `<p class="sheet-sub">${esc(path.subtitle)}</p>` : ""}` : "";
  return `<section class="sheet">${head}${parts.join("")}</section>`;
}

function comprueba(check) {
  if (!check) return "";
  if (check.note && (!check.lines || !check.lines.length)) return `✓ Comprueba: ${check.note}`;
  const lines = check.lines || [];
  if (lines.length < 2) return check.note ? `✓ Comprueba: ${check.note}` : "";
  const mid = lines[1];
  const end = lines[lines.length - 1];
  const left = plain(mid.left);
  const right = plain(mid.right);
  const value = plain(end.right);
  if (right === value) return `✓ Comprueba: ${left} = ${value}`;
  return `✓ Comprueba: ${left} = ${right} = ${value}`;
}

function checkHtml(check) {
  const text = comprueba(check);
  if (!text) return "";
  return `<p class="sheet-check">${esc(text).replace(/^✓ /, "✓ ")}</p>`;
}

export function renderNotebook(board, shown) {
  if (!board) return "";
  const limit = shown == null ? 99 : shown;
  const many = board.paths.length > 1;
  const paths = board.paths
    .map((path) => pathHtml(path, limit))
    .join(many ? `<div class="path-split" aria-hidden="true"></div>` : "");
  const rowCount = Math.max(...board.paths.map((path) => path.rows.length), 0);
  const showCheck = board.check && limit > rowCount;
  const clave = many && board.clave && showCheck ? `<p class="clave"><strong>Clave:</strong> ${esc(board.clave)}</p>` : "";
  const check = showCheck ? checkHtml(board.check) : "";
  return `<div class="notebook-work ${many ? "paths" : "one-path"}">${paths}${check}</div>${clave}`;
}

export function renderLinearCheck(a, b, c, d, solution) {
  return checkHtml(substitution(a, b, c, d, solution));
}

export function viewBoard(problem) {
  if (problem && problem.board) return problem.board;
  return notebookFromSteps(problem && problem.steps);
}

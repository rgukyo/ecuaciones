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
  const shown = tag("magenta", `(${sol})`);
  const parts = [];
  if (coef !== 0) {
    const abs = Math.abs(coef);
    const core = `${abs === 1 ? "" : abs}${shown}`;
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

function formatPlain(text) {
  return esc(text).replace(/\[\[(-?\d+)\/(\d+)\]\]/g, (_, n, d) => {
    const neg = n.startsWith("-");
    const num = neg ? n.slice(1) : n;
    return `${neg ? "−" : ""}<span class="frac"><span class="n">${num}</span><span class="d">${d}</span></span>`;
  });
}

function paint(text) {
  return String(text ?? "")
    .split(/(\{\{[a-z]+:[\s\S]*?\}\})/g)
    .map((part) => {
      const token = part.match(/^\{\{([a-z]+):([\s\S]*)\}\}$/);
      if (!token) return formatPlain(part);
      return `<span class="term t-${token[1]}">${formatPlain(token[2])}</span>`;
    })
    .join("");
}

function rowHtml(row) {
  if (row.note && row.left == null && row.text == null && !row.step) return `<p class="ink-note">${esc(row.note)}</p>`;
  const tone = row.result ? "result" : row.step?.tone || "";
  const style = TONE_STYLE[tone] ? ` style="--ink:${TONE_STYLE[tone].ink};--band:${TONE_STYLE[tone].band}"` : "";
  const label = row.step?.label ? `<p class="step-label">➜ ${esc(row.step.label)}</p>` : "";
  let body = "";
  if (row.result && row.value != null && row.left == null) {
    body = `<div class="result-box">${paint(row.value)} <span class="check-mark" aria-label="correcto">✓</span></div>`;
  } else if (row.result) {
    body = `<div class="result-box">${paint(row.left)} <span class="eq-sign">=</span> ${paint(row.right)} <span class="check-mark" aria-label="correcto">✓</span></div>`;
  } else if (row.text != null) {
    body = `<p class="step-text">${paint(row.text)}</p>`;
  } else if (row.left != null) {
    body = `<div class="eq-line"><span class="eq-side left">${paint(row.left)}</span><span class="eq-sign">=</span><span class="eq-side right">${paint(row.right)}</span></div>`;
  }
  const cls = ["step-card", row.step && !row.result ? "has-move" : "", row.result ? "is-result" : ""].filter(Boolean).join(" ");
  return `<div class="${cls}"${style}>${label}${body}</div>`;
}

function checkHtml(check) {
  if (!check) return "";
  if (check.note && (!check.lines || !check.lines.length)) {
    return `<aside class="subst"><h3>Comprobación</h3><p class="ink-note">${esc(check.note)} <span class="check-mark">✓</span></p></aside>`;
  }
  const lines = (check.lines || [])
    .map((line) =>
      rowHtml({
        left: line.left,
        right: line.right,
        result: Boolean(line.ok),
        step: line.ok ? { tone: "result", label: "Los dos lados coinciden" } : null,
      })
    )
    .join("");
  return `<aside class="subst"><h3>${esc(check.title || "Sustitución")}</h3>${lines}</aside>`;
}

function pathHtml(path, shown) {
  const chunks = [];
  path.rows.forEach((row, index) => {
    if (index >= shown) return;
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

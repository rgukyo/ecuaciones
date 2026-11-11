/** Expresiones con letras: lectura, valor exacto y formas equivalentes. */

import { add, div, frac, fracPlain, mul, sub } from "./frac.js";
import { fracBar, numHtml } from "./format.js";

function tokenize(src) {
  const s = String(src)
    .replace(/[−–—]/g, "-")
    .replace(/÷/g, "/")
    .replace(/[×·]/g, "*");
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t") {
      i += 1;
      continue;
    }
    if ("+-*/()^".includes(c)) {
      tokens.push({ k: c });
      i += 1;
      continue;
    }
    if (c === "²") {
      tokens.push({ k: "^" }, { k: "n", v: frac(2) });
      i += 1;
      continue;
    }
    if (c === "√") {
      tokens.push({ k: "sqrt" });
      i += 1;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9]/.test(s[j])) j += 1;
      if (s[j] === "." || s[j] === ",") {
        j += 1;
        const dec = j;
        while (j < s.length && /[0-9]/.test(s[j])) j += 1;
        if (j === dec) return null;
      }
      const text = s.slice(i, j).replace(",", ".");
      const match = text.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
      if (!match) return null;
      const sign = match[1] === "-" ? -1 : 1;
      const digits = match[2] + (match[3] || "");
      const den = 10 ** (match[3] || "").length;
      tokens.push({ k: "n", v: frac(sign * Number(digits), den) });
      i = j;
      continue;
    }
    if (/[A-Za-z]/.test(c)) {
      tokens.push({ k: "v", name: c });
      i += 1;
      continue;
    }
    return null;
  }
  return tokens;
}

export function parseExpr(src) {
  const tokens = tokenize(src);
  if (!tokens) return null;
  let i = 0;
  const peek = () => tokens[i];
  const eat = () => tokens[i++];

  function parseAdd() {
    let left = parseMul();
    if (!left) return null;
    while (peek() && (peek().k === "+" || peek().k === "-")) {
      const op = eat().k;
      const right = parseMul();
      if (!right) return null;
      left = { t: op, l: left, r: right };
    }
    return left;
  }

  function parsePow() {
    let left = parseUnary();
    if (!left) return null;
    if (peek() && peek().k === "^") {
      eat();
      const right = parseUnary();
      if (!right) return null;
      left = { t: "^", l: left, r: right };
    }
    return left;
  }

  function parseMul() {
    let left = parsePow();
    if (!left) return null;
    while (peek()) {
      const next = peek();
      if (next.k === "*" || next.k === "/") {
        const op = eat().k;
        const right = parseUnary();
        if (!right) return null;
        left = { t: op, l: left, r: right };
      } else if (next.k === "n" || next.k === "v" || next.k === "(" || next.k === "sqrt") {
        const right = parsePow();
        if (!right) return null;
        left = { t: "*", l: left, r: right };
      } else {
        break;
      }
    }
    return left;
  }

  function parseUnary() {
    if (peek() && peek().k === "+") {
      eat();
      return parseUnary();
    }
    if (peek() && peek().k === "-") {
      eat();
      const value = parseUnary();
      if (!value) return null;
      return { t: "-", l: { t: "n", v: frac(0) }, r: value };
    }
    if (peek() && peek().k === "sqrt") {
      eat();
      const value = parseUnary();
      if (!value) return null;
      return { t: "sqrt", r: value };
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const token = eat();
    if (!token) return null;
    if (token.k === "n") return { t: "n", v: token.v };
    if (token.k === "v") return { t: "v", name: token.name };
    if (token.k === "(") {
      const inner = parseAdd();
      if (!inner || !peek() || peek().k !== ")") return null;
      eat();
      return inner;
    }
    return null;
  }

  const ast = parseAdd();
  if (!ast || i !== tokens.length) return null;
  return ast;
}

function sqrtFrac(value) {
  if (value.n < 0) throw new Error("raíz");
  const sn = Math.round(Math.sqrt(value.n));
  const sd = Math.round(Math.sqrt(value.d));
  if (sn * sn !== value.n || sd * sd !== value.d) throw new Error("raíz");
  return frac(sn, sd);
}

export function evalExpr(ast, env) {
  if (ast.t === "n") return ast.v;
  if (ast.t === "v") {
    const value = env[ast.name];
    if (!value) throw new Error(`falta ${ast.name}`);
    return value;
  }
  if (ast.t === "sqrt") return sqrtFrac(evalExpr(ast.r, env));
  const left = evalExpr(ast.l, env);
  const right = evalExpr(ast.r, env);
  if (ast.t === "+") return add(left, right);
  if (ast.t === "-") return sub(left, right);
  if (ast.t === "*") return mul(left, right);
  if (ast.t === "/") return div(left, right);
  if (ast.t === "^") {
    if (right.d !== 1 || right.n < 0 || right.n > 6) throw new Error("potencia");
    let acc = frac(1);
    for (let i = 0; i < right.n; i += 1) acc = mul(acc, left);
    return acc;
  }
  throw new Error("operación");
}

export function variablesIn(ast, acc = []) {
  if (!ast) return acc;
  if (ast.t === "v" && !acc.includes(ast.name)) acc.push(ast.name);
  if (ast.l) variablesIn(ast.l, acc);
  if (ast.r) variablesIn(ast.r, acc);
  return acc;
}

function prec(ast) {
  if (ast.t === "+" || ast.t === "-") return 1;
  if (ast.t === "*" || ast.t === "/") return 2;
  return 3;
}

function plainSide(parent, child, right) {
  const text = exprPlain(child);
  const childPrec = prec(child);
  const parentPrec = prec(parent);
  if (childPrec < parentPrec) return `(${text})`;
  if (right && childPrec === parentPrec && (parent.t === "-" || parent.t === "/")) return `(${text})`;
  return text;
}

export function exprPlain(ast) {
  if (ast.t === "n") return fracPlain(ast.v);
  if (ast.t === "v") return ast.name;
  if (ast.t === "*") {
    const left = ast.l;
    const right = ast.r;
    if (left.t === "n" && left.v.d === 1 && left.v.n > 1 && (right.t === "v" || right.t === "*" || right.t === "/")) {
      return `${left.v.n}${plainSide(ast, right, true)}`;
    }
    if (left.t === "v" && right.t === "v") return `${left.name}${right.name}`;
  }
  return `${plainSide(ast, ast.l, false)}${ast.t === "+" ? "+" : ast.t === "-" ? "-" : ast.t === "*" ? "*" : "/"}${plainSide(ast, ast.r, true)}`;
}

export function exprHtml(ast) {
  if (ast.t === "n") return numHtml(ast.v);
  if (ast.t === "v") return ast.name;
  if (ast.t === "/") return fracBar(exprHtml(ast.l), exprHtml(ast.r));
  if (ast.t === "*") {
    if (ast.l.t === "n" && ast.l.v.d === 1 && ast.l.v.n > 1 && ast.r.t === "v") return `${ast.l.v.n}${ast.r.name}`;
    if (ast.l.t === "v" && ast.r.t === "v") return `${ast.l.name}${ast.r.name}`;
    return `${exprHtml(ast.l)} ${exprHtml(ast.r)}`;
  }
  const op = ast.t === "+" ? " + " : " − ";
  const right = ast.r.t === "n" && ast.r.v.n < 0 ? `(${exprHtml(ast.r)})` : exprHtml(ast.r);
  return `${exprHtml(ast.l)}${op}${right}`;
}

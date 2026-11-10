/** Aritmética exacta con fracciones y lectura de respuestas. */

export function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

export function frac(n, d = 1) {
  if (!Number.isInteger(n) || !Number.isInteger(d)) {
    throw new Error("Se esperaban enteros");
  }
  if (d === 0) throw new Error("Denominador cero");
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export function add(a, b) {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function sub(a, b) {
  return frac(a.n * b.d - b.n * a.d, a.d * b.d);
}

export function mul(a, b) {
  return frac(a.n * b.n, a.d * b.d);
}

export function div(a, b) {
  return frac(a.n * b.d, a.d * b.n);
}

export function eq(a, b) {
  return a.n === b.n && a.d === b.d;
}

export function neg(a) {
  return frac(-a.n, a.d);
}

export function isZero(a) {
  return a.n === 0;
}

export function isInt(a) {
  return a.d === 1;
}

export function cmp(a, b) {
  const v = a.n * b.d - b.n * a.d;
  return v < 0 ? -1 : v > 0 ? 1 : 0;
}

/** Raíz cuadrada entera si n es cuadrado perfecto; si no, null. */
export function isqrt(n) {
  if (!Number.isInteger(n) || n < 0) return null;
  if (n === 0) return 0;
  let x = Math.floor(Math.sqrt(n));
  while (x * x > n) x -= 1;
  while ((x + 1) * (x + 1) <= n) x += 1;
  return x * x === n ? x : null;
}

export function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function stripAnswer(raw) {
  return String(raw)
    .trim()
    .replace(/[−–—]/g, "-")
    .replace(/^[xy]\s*=\s*/i, "")
    .trim();
}

function parseToken(token) {
  const s = token.replace(/\s+/g, "").replace(",", ".");
  if (!s || s === "+" || s === "-") return null;
  const mixed = s.match(/^([+-]?\d+)\/(\d+)$/);
  if (mixed) {
    const d = parseInt(mixed[2], 10);
    if (d === 0) return null;
    return frac(parseInt(mixed[1], 10), d);
  }
  const dec = s.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!dec) return null;
  const sign = dec[1] === "-" ? -1 : 1;
  const digits = dec[2] + (dec[3] || "");
  const den = 10 ** (dec[3] || "").length;
  return frac(sign * parseInt(digits, 10), den);
}

/** Acepta 3/2, 6/4, 1.5, 1,5, -2, 1 1/2, "x = -2" y "11 años". */
export function parseNumber(raw) {
  if (raw == null) return null;
  const cleaned = stripAnswer(raw).replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  const mixed = cleaned.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = parseInt(mixed[1], 10);
    const n = parseInt(mixed[2], 10);
    const d = parseInt(mixed[3], 10);
    if (d === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    return frac(sign * (Math.abs(whole) * d + n), d);
  }

  const direct = parseToken(cleaned);
  if (direct) return direct;

  const found = cleaned.match(
    /[+-]?\d+\s+\d+\s*\/\s*\d+|[+-]?\d+\s*\/\s*\d+|[+-]?\d+[.,]\d+|[+-]?\d+/
  );
  if (!found) return null;
  const piece = found[0];
  const mixedPiece = piece.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedPiece) {
    const whole = parseInt(mixedPiece[1], 10);
    const n = parseInt(mixedPiece[2], 10);
    const d = parseInt(mixedPiece[3], 10);
    if (d === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    return frac(sign * (Math.abs(whole) * d + n), d);
  }
  return parseToken(piece);
}

export function fracPlain(f) {
  if (f.d === 1) return String(f.n);
  return `${f.n}/${f.d}`;
}

/**
 * Decimal exacto si el denominador solo tiene factores 2 y 5.
 * Devuelve null si el decimal sería periódico.
 */
export function terminatingDecimal(f) {
  let d = f.d;
  let twos = 0;
  let fives = 0;
  while (d % 2 === 0) {
    d /= 2;
    twos += 1;
  }
  while (d % 5 === 0) {
    d /= 5;
    fives += 1;
  }
  if (d !== 1) return null;
  const k = Math.max(twos, fives);
  const scaled = (f.n * 10 ** k) / f.d;
  if (!Number.isInteger(scaled)) return null;
  if (k === 0) return String(scaled);
  const negSign = scaled < 0;
  const digits = String(Math.abs(scaled)).padStart(k + 1, "0");
  const head = digits.slice(0, digits.length - k);
  const tail = digits.slice(digits.length - k);
  return `${negSign ? "-" : ""}${head}.${tail}`;
}

function coefToken(body) {
  if (body == null || body === "") return frac(1);
  return parseToken(body);
}

/** Lee polinomios como 5x - 3, -3 + 5x, x^2, 2x² o 0. */
export function parsePoly(raw) {
  if (raw == null) return null;
  let s = String(raw).trim().toLowerCase();
  if (!s) return null;
  s = s
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "")
    .replace(/x²/g, "x^2")
    .replace(/\(\+/g, "+")
    .replace(/\(-/g, "-")
    .replace(/[()]/g, "");
  s = s.replace(/\+\+/g, "+").replace(/\+-/g, "-").replace(/-\+/g, "-").replace(/--/g, "+");
  if (s[0] !== "+" && s[0] !== "-") s = `+${s}`;
  const re =
    /[+-](?:\d+\/\d+|\d+(?:[.,]\d+)?)?x\^2|[+-](?:\d+\/\d+|\d+(?:[.,]\d+)?)?x|[+-](?:\d+\/\d+|\d+(?:[.,]\d+)?)/g;
  const parts = s.match(re);
  if (!parts || parts.join("") !== s) return null;
  let c2 = frac(0);
  let c1 = frac(0);
  let c0 = frac(0);
  for (const part of parts) {
    const sign = part[0] === "-" ? -1 : 1;
    const body = part.slice(1);
    let bucket = "c0";
    let coefBody = body;
    if (body.endsWith("x^2")) {
      bucket = "c2";
      coefBody = body.slice(0, -3);
    } else if (body.endsWith("x")) {
      bucket = "c1";
      coefBody = body.slice(0, -1);
    }
    const coef = coefToken(coefBody);
    if (!coef) return null;
    const signed = mul(coef, frac(sign));
    if (bucket === "c2") c2 = add(c2, signed);
    else if (bucket === "c1") c1 = add(c1, signed);
    else c0 = add(c0, signed);
  }
  return { c2, c1, c0 };
}

export function parsePair(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase().replace(/[−–—]/g, "-");
  if (!s) return null;
  const named = s.match(/x\s*=\s*([^,;]+?)\s*[,;]?\s*y\s*=\s*(.+)$/);
  if (named) {
    const x = parseNumber(named[1]);
    const y = parseNumber(named[2]);
    if (!x || !y) return null;
    return { x, y };
  }
  const bare = s.replace(/[()]/g, " ").trim();
  let parts = null;
  if (bare.includes(";")) parts = bare.split(";");
  else if (/\sy\s/.test(bare)) parts = bare.split(/\s+y\s+/);
  else if (/,\s/.test(bare)) parts = bare.split(/,\s+/);
  if (!parts || parts.length !== 2) return null;
  const x = parseNumber(parts[0]);
  const y = parseNumber(parts[1]);
  if (!x || !y) return null;
  return { x, y };
}

export function parseRoots(raw) {
  if (raw == null) return null;
  const original = String(raw).trim().toLowerCase().replace(/[−–—]/g, "-");
  if (!original) return null;
  if (/no\s+tiene|sin\s+soluci|ninguna|no\s+hay/.test(original)) {
    return { none: true, roots: [] };
  }
  let s = original
    .replace(/ra[ií]ces?/g, " ")
    .replace(/dobles?/g, " ")
    .replace(/x\s*=/g, " ")
    .replace(/[()]/g, " ");
  const parts = s.split(/\s*(?:;|,|\sy\s+|\so\s+)\s*/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  const roots = [];
  for (const part of parts) {
    const n = parseNumber(part);
    if (!n) return null;
    roots.push(n);
  }
  return { none: false, roots };
}

export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(arr) {
      return arr[this.int(0, arr.length - 1)];
    },
    nz(min, max) {
      let n = 0;
      while (n === 0) n = this.int(min, max);
      return n;
    },
  };
}

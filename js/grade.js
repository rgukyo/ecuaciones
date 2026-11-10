/** Califica una respuesta escrita por el estudiante. */

import { eq, frac, fracPlain, parseNumber, parsePair, parsePoly, parseRoots } from "./frac.js";

function sameRoots(expected, given, doble) {
  if (!expected.length) return given.none === true;
  if (!given || given.none) return false;
  const got = given.roots;
  if (doble) {
    return got.length > 0 && got.every((root) => eq(root, expected[0]));
  }
  if (got.length !== expected.length) return false;
  const used = new Array(got.length).fill(false);
  for (const root of expected) {
    const index = got.findIndex((item, i) => !used[i] && eq(item, root));
    if (index < 0) return false;
    used[index] = true;
  }
  return true;
}

export function grade(problem, input) {
  if (!problem) return { ok: false };
  if (problem.kind === "number") {
    const value = parseNumber(input);
    return { ok: Boolean(value) && eq(value, frac(problem.answer.n, problem.answer.d)) };
  }
  if (problem.kind === "poly") {
    const poly = parsePoly(input);
    if (!poly) return { ok: false };
    const a = problem.answer;
    return {
      ok: eq(poly.c2, frac(a.c2)) && eq(poly.c1, frac(a.c1)) && eq(poly.c0, frac(a.c0)),
    };
  }
  if (problem.kind === "pair") {
    const pair = parsePair(input);
    if (!pair) return { ok: false };
    return {
      ok: eq(pair.x, frac(problem.answer.x.n, problem.answer.x.d)) && eq(pair.y, frac(problem.answer.y.n, problem.answer.y.d)),
    };
  }
  if (problem.kind === "roots") {
    return { ok: sameRoots(problem.answer.roots.map((r) => frac(r.n, r.d)), parseRoots(input), problem.answer.doble) };
  }
  if (problem.kind === "discriminant") {
    if (!input || typeof input !== "object") return { ok: false };
    const d = parseNumber(input.d);
    return {
      ok: Boolean(d) && eq(d, frac(problem.answer.d)) && input.nature === problem.answer.nature,
    };
  }
  return { ok: false };
}

export function sampleInput(problem) {
  if (problem.kind === "number") return fracPlain(frac(problem.answer.n, problem.answer.d));
  if (problem.kind === "poly") return problem.answer.plain;
  if (problem.kind === "pair") {
    const x = fracPlain(problem.answer.x);
    const y = fracPlain(problem.answer.y);
    return `x = ${x}, y = ${y}`;
  }
  if (problem.kind === "roots") {
    if (!problem.answer.roots.length) return "ninguna";
    return problem.answer.roots.map((r) => fracPlain(frac(r.n, r.d))).join(" y ");
  }
  if (problem.kind === "discriminant") {
    return { d: String(problem.answer.d), nature: problem.answer.nature };
  }
  return "";
}

export function yoursText(entry, kind) {
  if (entry == null || entry === "") return "Sin respuesta";
  if (kind === "discriminant") {
    if (typeof entry !== "object") return "Sin respuesta";
    const nombres = { dos: "dos soluciones", una: "una solución", ninguna: "ninguna solución real" };
    const d = entry.d ? entry.d : "—";
    const n = nombres[entry.nature] || "sin clasificar";
    return `D = ${d}; ${n}`;
  }
  return String(entry);
}

/** Revisa un renglón del procedimiento sin revelar la respuesta. */

import { evalExpr, parseExpr, variablesIn } from "./expr.js";
import { eq, frac } from "./frac.js";
import { renderLinearCheck } from "./visual.js";

function parseEquation(raw) {
  const text = String(raw ?? "")
    .replace(/[−–—]/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, "")
    .trim();
  if (!text.includes("=")) return null;
  const parts = text.split("=");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const left = parseExpr(parts[0]);
  const right = parseExpr(parts[1]);
  if (!left || !right) return null;
  return { left, right };
}

function holds(equation, env) {
  try {
    return eq(evalExpr(equation.left, env), evalExpr(equation.right, env));
  } catch {
    return false;
  }
}

function isIdentity(equation, names) {
  const seeds = [0, 1, 2, 3, 5, 8];
  let checked = 0;
  for (const seed of seeds) {
    const env = {};
    for (const name of names) env[name] = frac(seed + 2 + (name.charCodeAt(0) % 3));
    try {
      if (!eq(evalExpr(equation.left, env), evalExpr(equation.right, env))) return false;
      checked += 1;
    } catch {
      return false;
    }
  }
  return checked === seeds.length;
}

function isolated(equation, name) {
  if (equation.left.t !== "v" || equation.left.name !== name) return null;
  if (variablesIn(equation.right).includes(name)) return null;
  try {
    return evalExpr(equation.right, {});
  } catch {
    return null;
  }
}

function modelOf(problem) {
  if (!problem || !problem.verify) return null;
  const verify = problem.verify;
  const answer = problem.answer;
  if (verify.type === "despeje") {
    return { kind: "formula", target: verify.target, free: verify.free, samples: verify.samples, answerPlain: problem.answerPlain };
  }
  if (verify.type === "system") {
    return {
      kind: "system",
      names: ["x", "y"],
      solutions: [{ x: frac(answer.x.n, answer.x.d), y: frac(answer.y.n, answer.y.d) }],
      equations: [verify.e1, verify.e2],
    };
  }
  if (verify.type === "quadratic" && verify.mode === "roots") {
    const solutions = (answer.roots || []).map((root) => ({ x: frac(root.n, root.d) }));
    return { kind: "poly", names: ["x"], solutions, finals: solutions.map((item) => item.x), coefs: verify, strict: true };
  }
  const linear = verify.type === "linear" ? verify : verify.eq;
  if (answer && Number.isInteger(answer.n) && Number.isInteger(answer.d)) {
    const solutions = [{ x: frac(answer.n, answer.d) }];
    if (verify.type === "rect-num" || verify.type === "compuesto-num") {
      const extra = -(answer.n + verify.data.k);
      solutions.push({ x: frac(extra) });
    }
    return {
      kind: "poly",
      names: ["x"],
      solutions,
      finals: [{ x: frac(answer.n, answer.d) }],
      linear: linear && Number.isInteger(linear.a) ? linear : null,
      strict: true,
    };
  }
  return null;
}

function signHint(linear, equation) {
  if (!linear) return null;
  const value = isolated(equation, "x");
  if (!value || linear.c !== 0 || linear.a === 0) return null;
  const { a, b, d } = linear;
  const movedSame = frac(d + b, a);
  const movedFlip = frac(d - b, a);
  if (eq(value, movedFlip)) return null;
  if (b !== 0 && eq(value, movedSame)) {
    const amount = Math.abs(b);
    const wasAdding = b > 0;
    return {
      message: `El ${amount} pasó sin cambiar de signo.`,
      hint: wasAdding
        ? "Ese número está sumando. Si lo pasas al otro lado, resta."
        : "Ese número está restando. Si lo pasas al otro lado, suma.",
    };
  }
  return null;
}

function extraRoot(equation, solutions) {
  const known = new Set(solutions.map((item) => `${item.x.n}/${item.x.d}`));
  for (let n = -12; n <= 12; n += 1) {
    const key = `${n}/1`;
    if (known.has(key)) continue;
    if (holds(equation, { x: frac(n) })) return true;
  }
  return false;
}

function judgePoly(model, equation) {
  if (isIdentity(equation, model.names)) {
    return {
      ok: false,
      final: false,
      message: "Esta igualdad es verdadera para cualquier número.",
      hint: "Escribe un paso que todavía cambie la ecuación, o deja la x sola.",
    };
  }
  const hits = model.solutions.filter((sol) => holds(equation, sol));
  if (hits.length === 0) {
    const signed = signHint(model.linear, equation);
    if (signed) return { ok: false, final: false, ...signed };
    return {
      ok: false,
      final: false,
      message: "Este renglón ya no corresponde a la ecuación.",
      hint: "Revisa el signo del término que acabas de pasar o la operación.",
    };
  }
  if (hits.length < model.solutions.length) {
    const alone = isolated(equation, "x");
    if (alone && hits.some((sol) => eq(sol.x, alone))) {
      return { ok: true, final: false, assign: { x: alone } };
    }
    return {
      ok: false,
      final: false,
      message: "Esa es solo una parte. La ecuación tiene otra solución.",
      hint: "No te quedes con un solo valor si el ejercicio tiene dos.",
    };
  }
  if (model.strict && model.names.length === 1 && extraRoot(equation, model.solutions)) {
    return {
      ok: false,
      final: false,
      message: "Esta ecuación tiene soluciones de más.",
      hint: "No cambies el grado de la ecuación si no hace falta.",
    };
  }
  const alone = isolated(equation, "x");
  const final = Boolean(alone && model.finals.some((item) => eq(item.x, alone)) && model.finals.length === 1);
  const allRootsNamed =
    model.finals &&
    model.finals.length > 1 &&
    model.finals.every((item) => isolated(equation, "x") && eq(isolated(equation, "x"), item.x));
  return { ok: true, final: final || Boolean(allRootsNamed), assign: alone ? { x: alone } : null };
}

function judgeSystem(model, equation) {
  if (isIdentity(equation, model.names)) {
    return {
      ok: false,
      final: false,
      message: "Esta igualdad es verdadera para cualquier par.",
      hint: "Usa las dos ecuaciones del sistema, no una identidad.",
    };
  }
  if (!model.solutions.every((sol) => holds(equation, sol))) {
    return {
      ok: false,
      final: false,
      message: "Este renglón no se cumple con la solución del sistema.",
      hint: "Al sustituir, cuida el signo y los paréntesis.",
    };
  }
  const x = isolated(equation, "x");
  const y = isolated(equation, "y");
  const sol = model.solutions[0];
  if (x && eq(x, sol.x)) return { ok: true, final: false, assign: { x } };
  if (y && eq(y, sol.y)) return { ok: true, final: false, assign: { y } };
  return { ok: true, final: false, assign: null };
}

function judgeFormula(model, equation) {
  const answer = parseExpr(model.answerPlain);
  if (!answer) {
    return { ok: false, final: false, message: "No pude leer el renglón.", hint: "Usa las mismas letras de la fórmula." };
  }
  let good = 0;
  let stillTrue = 0;
  for (const sample of model.samples) {
    const env = {};
    for (const name of model.free) env[name] = frac(sample[name]);
    let value;
    try {
      value = evalExpr(answer, env);
    } catch {
      return { ok: false, final: false, message: "Revisa los paréntesis.", hint: "Cada paréntesis que se abre se cierra." };
    }
    env[model.target] = value;
    if (holds(equation, env)) good += 1;
    const envWrong = { ...env, [model.target]: frac(value.n + value.d, value.d) };
    if (holds(equation, envWrong)) stillTrue += 1;
  }
  if (good < model.samples.length) {
    return {
      ok: false,
      final: false,
      message: "Al despejar cambió la operación o el signo.",
      hint: "Lo que está multiplicando pasa dividiendo, y lo que está sumando pasa restando.",
    };
  }
  if (stillTrue > 0) {
    return {
      ok: false,
      final: false,
      message: "Esta igualdad sigue siendo cierta aunque la letra esté mal.",
      hint: "Despeja la letra que te piden, no dejes una igualdad que valga para cualquier valor.",
    };
  }
  const alone = isolated(equation, model.target);
  let final = false;
  if (equation.left.t === "v" && equation.left.name === model.target && !variablesIn(equation.right).includes(model.target)) {
    final = model.samples.every((sample) => {
      const env = {};
      for (const name of model.free) env[name] = frac(sample[name]);
      try {
        return eq(evalExpr(equation.right, env), evalExpr(answer, env));
      } catch {
        return false;
      }
    });
  }
  void alone;
  return { ok: true, final, assign: null };
}

export function checkLine(problem, line) {
  const parsed = parseEquation(line);
  if (!parsed) {
    return {
      ok: false,
      final: false,
      message: "Este renglón necesita un signo igual.",
      hint: "Separa los dos lados, por ejemplo x + 7 = 12.",
    };
  }
  const model = modelOf(problem);
  if (!model) {
    return {
      ok: false,
      final: false,
      message: "En este ejercicio conviene usar la respuesta rápida.",
      hint: problem.hint || "Escribe el resultado en el otro modo.",
    };
  }
  if (model.kind === "formula") return judgeFormula(model, parsed);
  if (model.kind === "system") return judgeSystem(model, parsed);
  return judgePoly(model, parsed);
}

export function substitutionHtml(problem) {
  const verify = problem.verify || {};
  const linear = verify.type === "linear" ? verify : verify.eq;
  if (linear && Number.isInteger(linear.a) && problem.answer && Number.isInteger(problem.answer.n)) {
    return renderLinearCheck(linear.a, linear.b, linear.c, linear.d, frac(problem.answer.n, problem.answer.d));
  }
  if (verify.type === "quadratic" && verify.mode === "roots") {
    const roots = (problem.answer.roots || []).map((root) => (root.d === 1 ? String(root.n) : `${root.n}/${root.d}`));
    return `<aside class="subst"><h3>Sustitución</h3><p class="ink-note">Las soluciones ${roots.join(" y ")} hacen cero la ecuación. <span class="check-mark">✓</span></p></aside>`;
  }
  if (verify.type === "system") {
    const x = problem.answer.x;
    const y = problem.answer.y;
    const xs = x.d === 1 ? String(x.n) : `${x.n}/${x.d}`;
    const ys = y.d === 1 ? String(y.n) : `${y.n}/${y.d}`;
    return `<aside class="subst"><h3>Sustitución</h3><p class="ink-note">El par (<span class="hot">${xs}</span>, <span class="hot">${ys}</span>) cumple las dos ecuaciones. <span class="check-mark">✓</span></p></aside>`;
  }
  if (verify.type === "despeje") {
    return `<aside class="subst"><h3>Sustitución</h3><p class="ink-note">Si reemplazas la expresión en la fórmula, los dos lados coinciden. <span class="check-mark">✓</span></p></aside>`;
  }
  return `<aside class="subst"><h3>Sustitución</h3><p class="ink-note">El valor cumple la ecuación del problema. <span class="check-mark">✓</span></p></aside>`;
}

export function lineDone(problem, lines) {
  if (lines.some((line) => line.final)) return true;
  const verify = problem.verify || {};
  if (verify.type === "system") {
    const got = {};
    for (const line of lines) {
      if (line.assign) Object.assign(got, line.assign);
    }
    const x = problem.answer.x;
    const y = problem.answer.y;
    return Boolean(got.x && got.y && eq(got.x, frac(x.n, x.d)) && eq(got.y, frac(y.n, y.d)));
  }
  if (verify.type === "quadratic") {
    const roots = problem.answer.roots || [];
    if (roots.length < 2) return false;
    const values = lines.filter((line) => line.assign && line.assign.x).map((line) => line.assign.x);
    return roots.every((root) => values.some((value) => eq(value, frac(root.n, root.d))));
  }
  return false;
}

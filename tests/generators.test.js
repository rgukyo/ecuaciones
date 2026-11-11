import assert from "node:assert/strict";
import test from "node:test";
import { evalExpr, parseExpr, variablesIn } from "../js/expr.js";
import { add, eq, frac, isqrt, mul, terminatingDecimal } from "../js/frac.js";
import { grade } from "../js/grade.js";
import { subtopicIds, generateProblem, lessonExamples } from "../js/generators.js";
import { checkLine, lineDone } from "../js/pasos.js";
import { linearBoard } from "../js/visual.js";

function num(value) {
  return frac(value.n, value.d);
}

function evalArith(op, values) {
  if (op === "mul") return values.reduce((prod, value) => prod * value, 1);
  if (op === "div") {
    if (values[1] === 0 || values[0] % values[1] !== 0) return null;
    return values[0] / values[1];
  }
  if (op === "add") return values[0] + values[1];
  if (op === "sub") return values[0] - values[1];
  return null;
}

function hierarchyValue(template, nums) {
  const { a, b, c } = nums;
  if (template === "sum-mul") return a + b * c;
  if (template === "sub-mul") return a - b * c;
  if (template === "paren") return (a + b) * c;
  if (template === "left") return a - b + c;
  if (template === "div-mul") {
    if (b === 0 || a % b !== 0) return null;
    return (a / b) * c;
  }
  if (template === "power") return a * a + b * c;
  return null;
}

function satisfies(problem) {
  const answer = problem.answer;
  const check = problem.verify;
  if (check.type === "arith") {
    const value = evalArith(check.op, check.values);
    return Number.isInteger(value) && eq(num(answer), frac(value));
  }
  if (check.type === "hierarchy") {
    const value = hierarchyValue(check.template, check.nums);
    return Number.isInteger(value) && eq(num(answer), frac(value));
  }
  if (check.type === "terms") {
    const total = { c2: 0, c1: 0, c0: 0 };
    for (const term of check.terms) {
      if (term.deg === 2) total.c2 += term.coef;
      else if (term.deg === 1) total.c1 += term.coef;
      else total.c0 += term.coef;
    }
    return answer.c2 === total.c2 && answer.c1 === total.c1 && answer.c0 === total.c0;
  }
  if (check.type === "linear") return linearHolds(check.a, check.b, check.c, check.d, num(answer));
  if (check.type === "paren") return parenHolds(check, num(answer));
  if (check.type === "parens") return parensHolds(check, num(answer));
  if (check.type === "frac-den") return fracDenHolds(check, num(answer));
  if (check.type === "frac-shift") return fracShiftHolds(check, num(answer));
  if (check.type === "frac-sum") return fracSumHolds(check, num(answer));
  if (check.type === "frac-eq") return fracEqHolds(check, num(answer));
  if (check.type === "word") return wordHolds(check, num(answer));
  if (check.type === "system") return systemHolds(check, answer);
  if (check.type === "quadratic") return quadraticHolds(check, answer);
  if (check.type === "despeje") return despejeHolds(problem);
  if (check.type === "figura") return figuraHolds(problem);
  if (check.type === "variacion") return variacionHolds(problem);
  return false;
}

function despejeHolds(problem) {
  const check = problem.verify;
  const ast = parseExpr(problem.answerPlain);
  if (!ast || !check.samples || check.samples.length < 3) return false;
  if (variablesIn(ast).includes(check.target)) return false;
  for (const sample of check.samples) {
    const env = {};
    for (const name of check.free) {
      if (!Number.isInteger(sample[name]) || sample[name] === 0) return false;
      env[name] = frac(sample[name]);
    }
    let value;
    try {
      value = evalExpr(ast, env);
    } catch {
      return false;
    }
    env[check.target] = value;
    if (!relationOk(check.template, env)) return false;
  }
  return true;
}

function relationOk(template, env) {
  const g = (name) => env[name];
  if (template === "vt") return eq(g("d"), mul(g("v"), g("t")));
  if (template === "perimetro") return eq(g("P"), mul(frac(2), add(g("l"), g("a"))));
  if (template === "area") return eq(g("A"), mul(g("l"), g("w")));
  if (template === "triangulo") return eq(mul(frac(2), g("A")), mul(g("b"), g("h")));
  if (template === "prisma") return eq(g("V"), mul(g("a"), mul(g("b"), g("c"))));
  if (template === "fuerza") return eq(g("F"), mul(g("m"), g("a")));
  if (template === "trapecio") return eq(mul(frac(2), g("A")), mul(add(g("B"), g("b")), g("h")));
  return false;
}

function figuraHolds(problem) {
  const { template, data } = problem.verify;
  const answer = problem.answer;
  if (template === "rect-expr") return answer.c2 === 1 && answer.c1 === data.k && answer.c0 === 0 && data.k > 0;
  if (template === "tri-expr") return answer.c2 === 0 && answer.c1 === data.coef && answer.c0 === 0 && data.height === data.coef * 2 && data.coef > 0;
  if (template === "prisma-expr") return answer.c2 === 0 && answer.c1 === data.p * data.q && answer.c0 === 0 && data.p > 0 && data.q > 0;
  if (template === "rect-num") return answer.d === 1 && answer.n > 0 && answer.n * (answer.n + data.k) === data.area && data.k > 0;
  if (template === "prisma-num") return answer.d === 1 && answer.n > 0 && answer.n * data.p * data.q === data.volume;
  if (template === "compuesto-num") return answer.d === 1 && answer.n > 0 && answer.n * answer.n + data.k * answer.n === data.total && data.k > 0;
  if (template === "cuadrado-num") return answer.d === 1 && answer.n > 0 && answer.n * answer.n === data.area;
  if (template === "tri-num") return answer.d === 1 && answer.n > 0 && data.base > 0 && data.base % 2 === 0 && (data.base * answer.n) / 2 === data.area;
  return false;
}

function variacionHolds(problem) {
  const { template, data } = problem.verify;
  const answer = problem.answer;
  if (answer.d !== 1) return false;
  const n = answer.n;
  if (template === "directa") return data.k > 0 && data.baseQty > 0 && data.basePay === data.k * data.baseQty && n === data.k * data.x && data.x > 0;
  if (template === "inversa") return data.w2 > 0 && data.constante === data.w1 * data.h1 && data.constante % data.w2 === 0 && n === data.constante / data.w2;
  if (template === "lineal") return data.m !== 0 && n === data.m * data.x + data.b;
  if (template === "cuadratica") return data.a > 0 && data.y0 === data.a * data.x0 * data.x0 && n === data.a * data.x * data.x;
  if (template === "reparto-directo") return data.p > 0 && data.q > 0 && data.total === (data.p + data.q) * data.m && n === data.p * data.m;
  if (template === "reparto-inverso") return data.p > 0 && data.q > 0 && data.total === (data.p + data.q) * data.m && n === data.q * data.m;
  if (template === "tabla") return data.k > 0 && data.x > 0 && n === data.k * data.x;
  return false;
}

function linearHolds(a, b, c, d, x) {
  if (a - c === 0) return false;
  const left = addInt(a, b, x);
  const right = addInt(c, d, x);
  const expected = frac(d - b, a - c);
  return eq(left, right) && eq(x, expected);
}

function addInt(coef, constant, x) {
  return frac(coef * x.n + constant * x.d, x.d);
}

function parenHolds(check, x) {
  const inside = frac(x.n + check.b * x.d, x.d);
  const left = frac(check.a * inside.n, inside.d);
  const right = addInt(check.c, check.d, x);
  return eq(left, right) && linearHolds(check.a, check.a * check.b, check.c, check.d, x);
}

function parensHolds(check, x) {
  const left1 = frac(check.a * (x.n + check.b * x.d), x.d);
  const left2 = frac(check.c * (x.n + check.d * x.d), x.d);
  const left = frac(left1.n * left2.d + left2.n * left1.d, left1.d * left2.d);
  return eq(left, frac(check.e)) && check.a + check.c !== 0 && linearHolds(check.a + check.c, check.a * check.b + check.c * check.d, 0, check.e, x);
}

function fracDenHolds(check, x) {
  if (check.q === 0) return false;
  const left = frac(x.n + check.p * x.d, x.d * check.q);
  return eq(left, frac(check.r)) && linearHolds(1, check.p, 0, check.r * check.q, x);
}

function fracShiftHolds(check, x) {
  if (check.a === 0) return false;
  const left = frac(x.n + check.b * check.a * x.d, check.a * x.d);
  return eq(left, frac(check.c)) && linearHolds(1, check.a * check.b, 0, check.a * check.c, x);
}

function fracSumHolds(check, x) {
  if (check.a === 0 || check.b === 0) return false;
  const left = frac(x.n * check.b + x.n * check.a, x.d * check.a * check.b);
  return eq(left, frac(check.k));
}

function fracEqHolds(check, x) {
  if (check.q === 0 || check.den === 0) return false;
  return eq(frac(x.n, x.d * check.q), frac(check.num, check.den));
}

function wordHolds(check, x) {
  if (x.d !== 1 || !linearHolds(check.eq.a, check.eq.b, check.eq.c, check.eq.d, x)) return false;
  const data = check.data;
  const n = x.n;
  if (check.template === "edades") {
    return check.eq.a === 1 + data.m && check.eq.b === data.k && check.eq.c === 0 && check.eq.d === data.suma && n + (data.m * n + data.k) === data.suma && n > 0;
  }
  if (check.template === "dinero") {
    return (
      check.eq.a === data.p + data.q &&
      check.eq.b === -data.q * data.k &&
      check.eq.c === 0 &&
      check.eq.d === data.total &&
      data.p * n + data.q * (n - data.k) === data.total &&
      n > data.k &&
      data.k > 0
    );
  }
  if (check.template === "perimetro") {
    return (
      check.eq.a === 4 &&
      check.eq.b === 2 * data.extra &&
      check.eq.c === 0 &&
      check.eq.d === data.perimetro &&
      2 * (n + n + data.extra) === data.perimetro &&
      data.extra > 0
    );
  }
  if (check.template === "consecutivos") {
    const b = (data.step * data.count * (data.count - 1)) / 2;
    let suma = 0;
    for (let i = 0; i < data.count; i += 1) suma += n + i * data.step;
    const paridad =
      data.tipo === "pares" ? n % 2 === 0 : data.tipo === "impares" ? n % 2 !== 0 : true;
    return check.eq.a === data.count && check.eq.b === b && check.eq.c === 0 && check.eq.d === data.suma && suma === data.suma && paridad;
  }
  if (check.template === "numero") {
    return check.eq.a === data.m && check.eq.b === data.k && check.eq.c === 0 && check.eq.d === data.result && data.m * n + data.k === data.result && data.k !== 0;
  }
  if (check.template === "billetes") {
    const de20 = data.cantidad - n;
    return (
      check.eq.a === 30 &&
      check.eq.b === 20 * data.cantidad &&
      check.eq.c === 0 &&
      check.eq.d === data.total &&
      de20 > 0 &&
      n > 0 &&
      20 * de20 + 50 * n === data.total
    );
  }
  return false;
}

function systemHolds(check, answer) {
  const det = check.e1.a * check.e2.b - check.e2.a * check.e1.b;
  if (det === 0) return false;
  const x = frac(check.e1.c * check.e2.b - check.e2.c * check.e1.b, det);
  const y = frac(check.e1.a * check.e2.c - check.e2.a * check.e1.c, det);
  if (!eq(x, num(answer.x)) || !eq(y, num(answer.y))) return false;
  const left1 = frac(check.e1.a * x.n * y.d + check.e1.b * y.n * x.d, x.d * y.d);
  const left2 = frac(check.e2.a * x.n * y.d + check.e2.b * y.n * x.d, x.d * y.d);
  return eq(left1, frac(check.e1.c)) && eq(left2, frac(check.e2.c));
}

function quadraticHolds(check, answer) {
  const { a, b, c } = check;
  if (a === 0) return false;
  const D = b * b - 4 * a * c;
  if (check.mode === "discriminant") {
    const nature = D > 0 ? "dos" : D === 0 ? "una" : "ninguna";
    return answer.d === D && answer.nature === nature;
  }
  const s = isqrt(D);
  if (s === null) return false;
  const roots = [frac(-b + s, 2 * a), frac(-b - s, 2 * a)];
  const unique = eq(roots[0], roots[1]) ? [roots[0]] : roots;
  if (answer.roots.length !== unique.length) return false;
  const pending = unique.slice();
  for (const root of answer.roots) {
    const index = pending.findIndex((item) => eq(item, num(root)));
    if (index < 0) return false;
    pending.splice(index, 1);
    const value = frac(a * root.n * root.n + b * root.n * root.d + c * root.d * root.d, root.d * root.d);
    if (!eq(value, frac(0))) return false;
  }
  return pending.length === 0;
}

function equivalentInputs(problem) {
  if (problem.kind === "number") {
    const value = num(problem.answer);
    const inputs = [`${value.n * 2}/${value.d * 2}`];
    const decimal = terminatingDecimal(value);
    if (decimal) inputs.push(decimal, decimal.replace(".", ","));
    if (value.n > value.d && value.d > 1) {
      const whole = Math.floor(value.n / value.d);
      const rem = value.n % value.d;
      if (rem !== 0) inputs.push(`${whole} ${rem}/${value.d}`);
    }
    return inputs;
  }
  if (problem.kind === "poly") {
    const { c2, c1, c0 } = problem.answer;
    const chunks = [];
    const push = (coef, body) => {
      if (coef === 0) return;
      const abs = Math.abs(coef);
      const core = body ? (abs === 1 ? body : `${abs}${body}`) : String(abs);
      chunks.push(coef < 0 ? `-${core}` : `+${core}`);
    };
    push(c0, "");
    push(c1, "x");
    push(c2, "x^2");
    return [chunks.join("") || "0"];
  }
  if (problem.kind === "pair") {
    const x = `${problem.answer.x.n}/${problem.answer.x.d}`;
    const y = `${problem.answer.y.n}/${problem.answer.y.d}`;
    return [`(${x}; ${y})`];
  }
  if (problem.kind === "roots") {
    if (!problem.answer.roots.length) return ["no tiene solución real"];
    return [problem.answer.roots.map((root) => `${root.n}/${root.d}`).reverse().join(" o ")];
  }
  if (problem.kind === "discriminant") {
    return [{ d: `${problem.answer.d * 2}/2`, nature: problem.answer.nature }];
  }
  if (problem.kind === "formula") {
    const plain = problem.answerPlain;
    const inputs = [plain.replaceAll("/", "÷"), `(${plain})`, `${problem.verify.target} = ${plain}`, plain.replaceAll("/", " / ")];
    if (plain === "P/2-a") inputs.push("(P-2*a)/2");
    if (plain === "2A/b") inputs.push("2*A/b");
    return inputs;
  }
  return [];
}

function wrongInput(problem) {
  if (problem.kind === "discriminant") return { d: String(problem.answer.d + 1), nature: problem.answer.nature };
  if (problem.kind === "pair") return "x = 999, y = -998";
  if (problem.kind === "roots") return problem.answer.roots.length ? "999 y 998" : "1 y 2";
  if (problem.kind === "poly") return "999x + 998";
  return "999998";
}

test("los generadores cumplen la ecuación y aceptan formas equivalentes", () => {
  const seenStories = new Set();
  const seenDespeje = new Set();
  const seenFigura = new Set();
  const seenVariacion = new Set();
  for (const id of subtopicIds()) {
    for (let seed = 1; seed <= 40; seed += 1) {
      const problem = generateProblem(id, seed);
      assert.equal(problem.subtopicId, id, id);
      assert.ok(problem.steps.length >= 2, `${id} ${seed} sin pasos`);
      assert.equal(JSON.stringify(problem).includes("undefined"), false, `${id} ${seed} undefined`);
      assert.equal(JSON.stringify(problem).includes("NaN"), false, `${id} ${seed} NaN`);
      assert.equal(satisfies(problem), true, `${id} semilla ${seed} no cumple: ${JSON.stringify(problem.verify)}`);
      assert.equal(grade(problem, problem.kind === "discriminant" ? { d: String(problem.answer.d), nature: problem.answer.nature } : problem.answerPlain).ok, true, `${id} ${seed} respuesta canónica`);
      for (const input of equivalentInputs(problem)) {
        assert.equal(grade(problem, input).ok, true, `${id} ${seed} equivalente ${JSON.stringify(input)}`);
      }
      assert.equal(grade(problem, wrongInput(problem)).ok, false, `${id} ${seed} aceptó una respuesta incorrecta`);
      if (problem.verify.type === "word") seenStories.add(problem.verify.template);
      if (problem.verify.type === "despeje") seenDespeje.add(`${problem.verify.template}:${problem.verify.target}`);
      if (problem.verify.type === "figura") seenFigura.add(problem.verify.template);
      if (problem.verify.type === "variacion") seenVariacion.add(problem.verify.template);
    }
    for (const example of lessonExamples(id)) {
      assert.equal(satisfies(example), true, `ejemplo de ${id}`);
      assert.ok(example.steps.length >= 2);
    }
  }
  for (const story of ["edades", "dinero", "perimetro", "consecutivos", "numero", "billetes"]) {
    assert.equal(seenStories.has(story), true, story);
  }
  for (const key of ["vt:v", "vt:t", "perimetro:l", "perimetro:a", "area:l", "area:w", "triangulo:h", "triangulo:b", "prisma:a", "fuerza:m", "fuerza:a", "trapecio:h", "trapecio:B"]) {
    assert.equal(seenDespeje.has(key), true, key);
  }
  for (const key of ["rect-expr", "tri-expr", "prisma-expr", "rect-num", "prisma-num", "compuesto-num", "cuadrado-num", "tri-num"]) {
    assert.equal(seenFigura.has(key), true, key);
  }
  for (const key of ["directa", "inversa", "lineal", "cuadratica", "reparto-directo", "reparto-inverso", "tabla"]) {
    assert.equal(seenVariacion.has(key), true, key);
  }

  const simple = lessonExamples("simples")[0];
  assert.equal(checkLine(simple, "x = 12 - 7").ok, true);
  assert.equal(checkLine(simple, "x + 7 - 7 = 12 - 7").ok, true);
  const signo = checkLine(simple, "x = 12 + 7");
  assert.equal(signo.ok, false);
  assert.match(signo.message, /sin cambiar de signo/);
  assert.equal(checkLine(simple, "x = 5").final, true);
  assert.equal(checkLine(simple, "0 = 0").ok, false);

  const cuadratica = lessonExamples("factorizacion")[0];
  assert.equal(checkLine(cuadratica, "(x-2)(x-3)=0").ok, true);
  const una = checkLine(cuadratica, "x=2");
  assert.equal(una.ok, true);
  assert.equal(una.final, false);
  const otra = checkLine(cuadratica, "x=3");
  assert.equal(lineDone(cuadratica, [{ assign: una.assign }, { assign: otra.assign }]), true);

  const despeje = lessonExamples("despejes")[0];
  assert.equal(checkLine(despeje, "v = d/t").final, true);
  assert.equal(checkLine(despeje, "v = d*t").ok, false);
  assert.equal(checkLine(despeje, "d = v*t").ok, true);

  const sistema = lessonExamples("sustitucion")[0];
  assert.equal(checkLine(sistema, "y = 2x + 1").ok, true);
  assert.equal(checkLine(sistema, "x + y = 9").ok, false);
  const dosCaminos = linearBoard(5, 2, 2, 14, { n: 4, d: 1 });
  const largo = dosCaminos.paths[0].rows.find((row) => String(row.left).includes("− 2x"));
  assert.ok(largo && String(largo.left).includes("5x") && String(largo.right).includes("− 2x"));
  const pasado = dosCaminos.paths[1].rows.find((row) => row.arrow && /pasa restando/.test(row.arrow.label));
  assert.ok(pasado);
  assert.equal((pasado.hot || []).some((mark) => String(mark).replace(/\s/g, "").startsWith("3x")), false);

  const sx = checkLine(sistema, "x = 3");
  const sy = checkLine(sistema, "y = 7");
  assert.equal(lineDone(sistema, [{ assign: sx.assign }, { assign: sy.assign }]), true);
});

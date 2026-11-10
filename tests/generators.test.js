import assert from "node:assert/strict";
import test from "node:test";
import { eq, frac, isqrt, terminatingDecimal } from "../js/frac.js";
import { grade } from "../js/grade.js";
import { subtopicIds, generateProblem, lessonExamples } from "../js/generators.js";

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
    }
    for (const example of lessonExamples(id)) {
      assert.equal(satisfies(example), true, `ejemplo de ${id}`);
      assert.ok(example.steps.length >= 2);
    }
  }
  for (const story of ["edades", "dinero", "perimetro", "consecutivos", "numero", "billetes"]) {
    assert.equal(seenStories.has(story), true, story);
  }
});

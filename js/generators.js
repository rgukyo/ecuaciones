/** Generadores. Cada problema se arma para que la solución guardada sea exacta. */

import { findSubtopic } from "./catalog.js";
import { generateAreas, generateDespejes, generateVariacion, lessonModelos } from "./modelos.js";
import { linearBoard } from "./visual.js";
import {
  add,
  div,
  eq,
  frac,
  fracPlain,
  isqrt,
  lcm,
  makeRng,
  mul,
  sub,
} from "./frac.js";
import {
  eqHtml,
  esc,
  fmtInt,
  fracBar,
  lin2Html,
  linHtml,
  linTerms,
  numHtml,
  parenTerm,
  parenX,
  polyHtml,
  polyPlain,
  promptBox,
  systemHtml,
  años,
  pesos,
} from "./format.js";

const HELP = {
  number: "Puedes escribir 3/2, 1.5, 1,5 o −2. Si lleva unidad, también vale «12 años».",
  poly: "Ejemplo: 4x − 3. El orden no importa: también vale −3 + 4x.",
  pair: "Ejemplo: x = 2, y = −1. También vale (2; −1).",
  roots: "Escribe las soluciones separadas por «y», por ejemplo 2 y −3. Si no hay solución real, escribe ninguna.",
  discriminant: "Escribe el valor de D y elige cuántas soluciones reales tiene la ecuación.",
};

const NOMBRES = [
  "Lucía",
  "Mateo",
  "Sofía",
  "Diego",
  "Valeria",
  "Emiliano",
  "Regina",
  "Santiago",
  "Camila",
  "Ana",
  "Luis",
  "Fernanda",
  "José",
  "María",
  "Andrés",
  "Renata",
];

function solveLinear(a, b, c, d) {
  if (a - c === 0) throw new Error("sin solución única");
  const steps = [];
  let A = a;
  let B = b;
  let C = c;
  let D = d;
  if (C !== 0) {
    steps.push(
      C > 0
        ? `Resta ${linTerms([[C, "x"]])} en los dos lados.`
        : `Suma ${linTerms([[-C, "x"]])} en los dos lados.`
    );
    A -= C;
    C = 0;
    steps.push(`Queda: ${eqHtml(A, B, C, D)}.`);
  }
  if (B !== 0) {
    steps.push(B > 0 ? `Resta ${B} en los dos lados.` : `Suma ${-B} en los dos lados.`);
    D -= B;
    B = 0;
    steps.push(`Queda: ${eqHtml(A, B, C, D)}.`);
  }
  if (A !== 1) steps.push(`Divide los dos lados entre ${fmtInt(A)}.`);
  const sol = frac(d - b, a - c);
  const sol2 = frac(D, A);
  if (!eq(sol, sol2)) throw new Error("pasos inconsistentes");
  const left = add(mul(frac(a), sol), frac(b));
  const right = add(mul(frac(c), sol), frac(d));
  if (!eq(left, right)) throw new Error("comprobación falló");
  steps.push(`Solución: x = ${numHtml(sol)}.`);
  steps.push(`Comprobación: al sustituir x, los dos lados valen ${numHtml(left)}.`);
  return { solution: sol, steps };
}

function withNumber(solution, extra) {
  return {
    kind: "number",
    answer: { n: solution.n, d: solution.d },
    answerPlain: fracPlain(solution),
    answerHtml: extra.answerHtml || `x = ${numHtml(solution)}`,
    ...extra,
  };
}

function atom(n) {
  return n < 0 ? `(${fmtInt(n)})` : String(n);
}

function twoNames(rng) {
  const n1 = rng.pick(NOMBRES);
  let n2 = rng.pick(NOMBRES);
  while (n2 === n1) n2 = rng.pick(NOMBRES);
  return [n1, n2];
}

function shuffle(rng, list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = rng.int(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function tag(subtopicId, problem, seed = 0) {
  const sub = findSubtopic(subtopicId);
  return {
    ...problem,
    subtopicId,
    groupId: sub.group.id,
    hint: sub.hint,
    inputHelp: problem.inputHelp || HELP[problem.kind],
    seed,
  };
}

function buildProduct(values) {
  let result = 1;
  const steps = [`Operación: ${values.map((v) => `(${fmtInt(v)})`).join("")}.`];
  if (values.length === 2) {
    const [a, b] = values;
    const same = (a < 0) === (b < 0);
    steps.push(
      same
        ? "Los signos son iguales, así que el resultado es positivo."
        : "Los signos son distintos, así que el resultado es negativo."
    );
    steps.push(`Valores absolutos: ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(a * b)}.`);
  } else {
    let running = values[0];
    for (let i = 1; i < values.length; i += 1) {
      const next = values[i];
      const partial = running * next;
      const same = (running < 0) === (next < 0);
      steps.push(
        `(${fmtInt(running)})(${fmtInt(next)}) = ${fmtInt(partial)} porque los signos son ${same ? "iguales" : "distintos"}.`
      );
      running = partial;
    }
  }
  result = values.reduce((prod, value) => prod * value, 1);
  steps.push(`Resultado: ${fmtInt(result)}.`);
  const sol = frac(result);
  return withNumber(sol, {
    promptHtml: promptBox("Calcula.", values.map((v) => `(${fmtInt(v)})`).join("")),
    steps,
    answerHtml: numHtml(sol),
    verify: { type: "arith", op: "mul", values },
  });
}

function buildQuotient(a, b) {
  if (b === 0 || a % b !== 0) throw new Error("división no exacta");
  const result = a / b;
  const same = (a < 0) === (b < 0);
  const steps = [
    `Operación: (${fmtInt(a)}) ÷ (${fmtInt(b)}).`,
    same
      ? "Los signos son iguales, así que el resultado es positivo."
      : "Los signos son distintos, así que el resultado es negativo.",
    `Valores absolutos: ${Math.abs(a)} ÷ ${Math.abs(b)} = ${Math.abs(result)}.`,
    `Resultado: ${fmtInt(result)}.`,
  ];
  const sol = frac(result);
  return withNumber(sol, {
    promptHtml: promptBox("Calcula.", `(${fmtInt(a)}) ÷ (${fmtInt(b)})`),
    steps,
    answerHtml: numHtml(sol),
    verify: { type: "arith", op: "div", values: [a, b] },
  });
}

function buildSum(a, b) {
  const result = a + b;
  const steps = [`Operación: (${fmtInt(a)}) + (${fmtInt(b)}).`];
  if (result === 0) {
    steps.push("Tienen signos distintos y el mismo valor absoluto, así que se anulan.");
  } else if ((a >= 0) === (b >= 0)) {
    steps.push("Tienen el mismo signo: se suman los valores absolutos y se conserva el signo.");
    steps.push(`${Math.abs(a)} + ${Math.abs(b)} = ${Math.abs(result)}.`);
  } else {
    const mayor = Math.abs(a) >= Math.abs(b) ? a : b;
    steps.push("Tienen signos distintos: se restan los valores absolutos y queda el signo del que está más lejos del cero.");
    steps.push(`${Math.max(Math.abs(a), Math.abs(b))} − ${Math.min(Math.abs(a), Math.abs(b))} = ${Math.abs(result)}.`);
    steps.push(`Ese signo es el de ${fmtInt(mayor)}.`);
  }
  steps.push(`Resultado: ${fmtInt(result)}.`);
  const sol = frac(result);
  return withNumber(sol, {
    promptHtml: promptBox("Calcula.", `(${fmtInt(a)}) + (${fmtInt(b)})`),
    steps,
    answerHtml: numHtml(sol),
    verify: { type: "arith", op: "add", values: [a, b] },
  });
}

function buildDifference(a, b) {
  const result = a - b;
  const steps = [
    `Operación: ${atom(a)} − (${fmtInt(b)}).`,
    `Restar es sumar el opuesto: ${atom(a)} + (${fmtInt(-b)}).`,
  ];
  const sum = buildSum(a, -b);
  steps.push(...sum.steps.slice(1));
  const sol = frac(result);
  return withNumber(sol, {
    promptHtml: promptBox("Calcula.", `${atom(a)} − (${fmtInt(b)})`),
    steps,
    answerHtml: numHtml(sol),
    verify: { type: "arith", op: "sub", values: [a, b] },
  });
}

function buildHierarchy(template, nums) {
  const { a, b, c } = nums;
  let html = "";
  let value = 0;
  const steps = [];
  if (template === "sum-mul") {
    value = a + b * c;
    html = `${atom(a)} + ${atom(b)} × ${atom(c)}`;
    steps.push(
      `Operación: ${html}.`,
      "Hay suma y multiplicación. La multiplicación va primero.",
      `${atom(b)} × ${atom(c)} = ${fmtInt(b * c)}.`,
      `Ahora suma: ${atom(a)} + ${fmtInt(b * c)} = ${fmtInt(value)}.`
    );
  } else if (template === "sub-mul") {
    value = a - b * c;
    html = `${atom(a)} − ${atom(b)} × ${atom(c)}`;
    steps.push(
      `Operación: ${html}.`,
      "La multiplicación se hace antes que la resta.",
      `${atom(b)} × ${atom(c)} = ${fmtInt(b * c)}.`,
      `Ahora resta: ${atom(a)} − ${fmtInt(b * c)} = ${fmtInt(value)}.`
    );
  } else if (template === "paren") {
    value = (a + b) * c;
    const inside = b < 0 ? `${fmtInt(a)} − ${-b}` : `${fmtInt(a)} + ${b}`;
    html = `(${inside}) × ${atom(c)}`;
    steps.push(
      `Operación: ${html}.`,
      "Primero se resuelve el paréntesis.",
      `${inside} = ${fmtInt(a + b)}.`,
      `Después se multiplica: ${fmtInt(a + b)} × ${atom(c)} = ${fmtInt(value)}.`
    );
  } else if (template === "left") {
    value = a - b + c;
    html = `${atom(a)} − ${atom(b)} + ${atom(c)}`;
    steps.push(
      `Operación: ${html}.`,
      "La suma y la resta van al mismo nivel: se hacen de izquierda a derecha.",
      `Primero: ${atom(a)} − ${atom(b)} = ${fmtInt(a - b)}.`,
      `Después: ${fmtInt(a - b)} + ${atom(c)} = ${fmtInt(value)}.`,
      `No es ${atom(a)} − (${fmtInt(b)} + ${atom(c)}). Eso cambiaría el signo de ${atom(c)}.`
    );
  } else if (template === "div-mul") {
    if (b === 0 || a % b !== 0) throw new Error("división");
    value = (a / b) * c;
    html = `${atom(a)} ÷ ${atom(b)} × ${atom(c)}`;
    steps.push(
      `Operación: ${html}.`,
      "La división y la multiplicación se hacen de izquierda a derecha.",
      `${atom(a)} ÷ ${atom(b)} = ${fmtInt(a / b)}.`,
      `Luego se multiplica: ${fmtInt(a / b)} × ${atom(c)} = ${fmtInt(value)}.`,
      "No multipliques primero los dos últimos números: el orden sí cambia el resultado."
    );
  } else if (template === "power") {
    value = a * a + b * c;
    html = `${atom(a)}² + ${atom(b)} × ${atom(c)}`;
    steps.push(
      `Operación: ${html}.`,
      a < 0
        ? "Primero la potencia. Un número negativo al cuadrado da positivo."
        : "Primero la potencia, después la multiplicación y al final la suma.",
      `${atom(a)}² = ${a * a}.`,
      `${atom(b)} × ${atom(c)} = ${fmtInt(b * c)}.`,
      `Suma: ${a * a} + ${fmtInt(b * c)} = ${fmtInt(value)}.`
    );
  } else {
    throw new Error(`plantilla desconocida: ${template}`);
  }
  steps.push(`Resultado: ${fmtInt(value)}.`);
  const sol = frac(value);
  return withNumber(sol, {
    promptHtml: promptBox("Resuelve respetando la jerarquía de operaciones.", html),
    steps,
    answerHtml: numHtml(sol),
    verify: { type: "hierarchy", template, nums: { a, b, c } },
  });
}

function termsHtml(terms) {
  return linTerms(terms.map((term) => [term.coef, term.deg === 2 ? "x²" : term.deg === 1 ? "x" : ""]));
}

function sumTerms(terms) {
  const total = { c2: 0, c1: 0, c0: 0 };
  for (const term of terms) {
    if (term.deg === 2) total.c2 += term.coef;
    else if (term.deg === 1) total.c1 += term.coef;
    else total.c0 += term.coef;
  }
  return total;
}

function buildCombine(terms) {
  const answer = sumTerms(terms);
  const steps = [`Expresión: ${termsHtml(terms)}.`];
  for (const deg of [2, 1, 0]) {
    const group = terms.filter((term) => term.deg === deg);
    if (!group.length) continue;
    const nombre = deg === 2 ? "x²" : deg === 1 ? "x" : "las constantes";
    const total = group.reduce((sum, term) => sum + term.coef, 0);
    if (group.length === 1) {
      steps.push(
        deg === 0
          ? `La constante ${fmtInt(total)} no se junta con nadie.`
          : `${linTerms([[total, deg === 2 ? "x²" : "x"]])} no tiene otro término semejante.`
      );
    } else {
      const suma = group.map((term) => `(${fmtInt(term.coef)})`).join(" + ");
      steps.push(`Coeficientes de ${nombre}: ${suma} = ${fmtInt(total)}.`);
    }
  }
  steps.push(`Expresión reducida: ${polyHtml(answer.c2, answer.c1, answer.c0)}.`);
  return {
    kind: "poly",
    promptHtml: promptBox("Reduce los términos semejantes.", termsHtml(terms)),
    steps,
    answer: { ...answer, plain: polyPlain(answer.c2, answer.c1, answer.c0) },
    answerPlain: polyPlain(answer.c2, answer.c1, answer.c0),
    answerHtml: polyHtml(answer.c2, answer.c1, answer.c0),
    verify: { type: "terms", terms: terms.map((term) => ({ coef: term.coef, deg: term.deg })) },
  };
}

function buildLinear(a, b, c, d) {
  const solved = solveLinear(a, b, c, d);
  const equation = eqHtml(a, b, c, d);
  return withNumber(solved.solution, {
    promptHtml: promptBox("Resuelve la ecuación.", equation),
    steps: [`Ecuación: ${equation}.`, ...solved.steps],
    board: linearBoard(a, b, c, d, solved.solution),
    verify: { type: "linear", a, b, c, d },
  });
}

function buildParen(a, b, c, d) {
  const solved = solveLinear(a, a * b, c, d);
  const equation = `${parenTerm(a, b, true)} = ${linHtml(c, d)}`;
  const steps = [`Ecuación: ${equation}.`];
  if (a < 0) {
    steps.push("Hay un coeficiente negativo: al distribuir, cambia el signo de cada término de adentro.");
  } else {
    steps.push("Quita el paréntesis con la propiedad distributiva.");
  }
  steps.push(`Queda: ${eqHtml(a, a * b, c, d)}.`);
  steps.push(...solved.steps);
  return withNumber(solved.solution, {
    promptHtml: promptBox("Resuelve la ecuación.", equation),
    steps,
    verify: { type: "paren", a, b, c, d },
  });
}

function buildParens(a, pb, c, pd, e) {
  const A = a + c;
  const B = a * pb + c * pd;
  if (A === 0) throw new Error("se cancela la x");
  const solved = solveLinear(A, B, 0, e);
  const equation = `${parenTerm(a, pb, true)} ${parenTerm(c, pd, false)} = ${fmtInt(e)}`;
  const steps = [
    `Ecuación: ${equation}.`,
    `Distribuye en cada paréntesis: ${linHtml(a, a * pb)} y ${linHtml(c, c * pd)}.`,
    `Junta términos semejantes: ${eqHtml(A, B, 0, e)}.`,
    ...solved.steps,
  ];
  return withNumber(solved.solution, {
    promptHtml: promptBox("Resuelve la ecuación.", equation),
    steps,
    verify: { type: "parens", a, b: pb, c, d: pd, e },
  });
}

function buildFracDen(p, q, r) {
  if (q === 0) throw new Error("denominador");
  const solved = solveLinear(1, p, 0, r * q);
  const top = p === 0 ? "x" : p > 0 ? `x + ${p}` : `x − ${-p}`;
  const equation = `${fracBar(top, String(q))} = ${fmtInt(r)}`;
  return withNumber(solved.solution, {
    promptHtml: promptBox("Resuelve la ecuación.", equation),
    steps: [
      `Ecuación: ${equation}.`,
      `Multiplica los dos lados por ${q} para quitar el denominador.`,
      `Queda: ${eqHtml(1, p, 0, r * q)}.`,
      ...solved.steps,
    ],
    verify: { type: "frac-den", p, q, r },
  });
}

function buildFracShift(a, b, c) {
  if (a === 0) throw new Error("denominador");
  const right = c - b;
  const solved = solveLinear(1, a * b, 0, a * c);
  const equation = `${fracBar("x", String(Math.abs(a)))} ${b < 0 ? `− ${-b}` : `+ ${b}`} = ${fmtInt(c)}`;
  const shown = a < 0 ? `−${equation}` : equation;
  const steps = [
    `Ecuación: ${shown}.`,
    b > 0 ? `Resta ${b} en los dos lados.` : `Suma ${-b} en los dos lados.`,
    `Queda: ${a < 0 ? "−" : ""}${fracBar("x", String(Math.abs(a)))} = ${fmtInt(right)}.`,
    `Multiplica los dos lados por ${fmtInt(a)}.`,
    ...solved.steps.slice(-2),
  ];
  return withNumber(solved.solution, {
    promptHtml: promptBox("Resuelve la ecuación.", shown),
    steps,
    verify: { type: "frac-shift", a, b, c },
  });
}

function buildFracSum(a, b, k) {
  if (a === 0 || b === 0) throw new Error("denominador");
  const m = lcm(a, b);
  const coef = m / a + m / b;
  const rhs = k * m;
  const solved = solveLinear(coef, 0, 0, rhs);
  const equation = `${fracBar("x", String(a))} + ${fracBar("x", String(b))} = ${fmtInt(k)}`;
  return withNumber(solved.solution, {
    promptHtml: promptBox("Resuelve la ecuación.", equation),
    steps: [
      `Ecuación: ${equation}.`,
      `El mínimo común múltiplo de ${a} y ${b} es ${m}. Multiplica cada término por ${m}.`,
      `Queda: ${fmtInt(m / a)}x + ${fmtInt(m / b)}x = ${fmtInt(rhs)}.`,
      `Junta las x: ${eqHtml(coef, 0, 0, rhs)}.`,
      ...solved.steps,
    ],
    verify: { type: "frac-sum", a, b, k },
  });
}

function buildFracEq(q, num, den) {
  if (q === 0 || den === 0) throw new Error("denominador");
  const sol = frac(q * num, den);
  const equation = `${fracBar("x", String(q))} = ${fracBar(fmtInt(num), String(den))}`;
  const steps = [
    `Ecuación: ${equation}.`,
    `Multiplica los dos lados por ${q}.`,
    `x = ${numHtml(frac(q))} × ${numHtml(frac(num, den))} = ${numHtml(frac(q * num, den))}.`,
  ];
  if (sol.n !== q * num || sol.d !== den) {
    steps.push(`Simplifica la fracción: x = ${numHtml(sol)}.`);
  }
  const left = frac(sol.n, sol.d * q);
  if (!eq(left, frac(num, den))) throw new Error("fracción");
  steps.push(`Comprobación: x ÷ ${q} = ${numHtml(frac(num, den))}.`);
  return withNumber(sol, {
    promptHtml: promptBox("Resuelve la ecuación.", equation),
    steps,
    verify: { type: "frac-eq", q, num, den },
  });
}

function compra(p, q) {
  const libros = p === 1 ? "un libro" : `${p} libros`;
  const plumas = q === 1 ? "una pluma" : `${q} plumas`;
  return `${libros} y ${plumas}`;
}

function buildEdades({ n1, n2, m, k, suma }) {
  const eqA = 1 + m;
  const solved = solveLinear(eqA, k, 0, suma);
  if (solved.solution.d !== 1 || solved.solution.n <= 0) throw new Error("edad");
  const edad = solved.solution.n;
  const otro = m * edad + k;
  const veces = m === 2 ? "el doble" : m === 3 ? "el triple" : `${m} veces`;
  const mas = k === 1 ? "1 año más" : `${k} años más`;
  const text = `${n2} tiene ${mas} que ${veces} de la edad de ${n1}. Entre los dos suman ${suma} años. ¿Cuántos años tiene ${n1}?`;
  return withNumber(solved.solution, {
    promptHtml: `<p class="story">${esc(text)}</p>`,
    steps: [
      `Sea x la edad de ${esc(n1)}, en años.`,
      `${esc(n2)} tiene ${mas} que ${veces} de x: ${linHtml(m, k)}.`,
      `Las edades suman ${suma}: x + (${linHtml(m, k)}) = ${suma}.`,
      `Junta términos: ${eqHtml(eqA, k, 0, suma)}.`,
      ...solved.steps,
      `${esc(n1)} tiene ${edad} años y ${esc(n2)} tiene ${otro}. Juntos: ${edad + otro} años.`,
    ],
    answerHtml: `x = ${edad}. ${esc(n1)} tiene ${años(edad)}.`,
    inputHelp: "Escribe la edad. También vale «12 años».",
    verify: { type: "word", template: "edades", data: { m, k, suma }, eq: { a: eqA, b: k, c: 0, d: suma } },
  });
}

function buildDinero({ nombre, k, p, q, total }) {
  const a = p + q;
  const b = -q * k;
  const solved = solveLinear(a, b, 0, total);
  if (solved.solution.d !== 1) throw new Error("precio");
  const x = solved.solution.n;
  if (x <= k || k <= 0) throw new Error("precio");
  const text = `Un libro cuesta cierta cantidad y una pluma cuesta ${k} pesos menos que el libro. ${nombre} compra ${compra(p, q)} y paga $${total}. ¿Cuánto cuesta el libro?`;
  return withNumber(solved.solution, {
    promptHtml: `<p class="story">${esc(text)}</p>`,
    steps: [
      `Sea x el precio del libro, en pesos. La pluma cuesta x − ${k}.`,
      `${p === 1 ? "Un libro" : `${p} libros`} y ${q === 1 ? "una pluma" : `${q} plumas`}: ${linHtml(p, 0)} + ${q}(x − ${k}) = ${total}.`,
      `Distribuye: ${linHtml(p, 0)} + ${linHtml(q, -q * k)} = ${total}.`,
      `Junta términos: ${eqHtml(a, b, 0, total)}.`,
      ...solved.steps,
      `El libro cuesta $${x} y la pluma cuesta $${x - k}.`,
    ],
    answerHtml: `x = ${x}. El libro cuesta ${pesos(x)}.`,
    inputHelp: "Escribe el precio en pesos. También vale «45 pesos».",
    verify: { type: "word", template: "dinero", data: { p, q, k, total }, eq: { a, b, c: 0, d: total } },
  });
}

function buildPerimetro({ extra, perimetro }) {
  const solved = solveLinear(4, 2 * extra, 0, perimetro);
  if (solved.solution.d !== 1 || solved.solution.n <= 0 || extra <= 0) throw new Error("perímetro");
  const ancho = solved.solution.n;
  const text = `Una cancha rectangular mide ${extra} m más de largo que de ancho. Su perímetro es ${perimetro} m. ¿Cuánto mide el ancho?`;
  return withNumber(solved.solution, {
    promptHtml: `<p class="story">${esc(text)}</p>`,
    steps: [
      "Sea x el ancho, en metros. El largo mide x + " + extra + ".",
      `El perímetro suma los cuatro lados: 2(x + (x + ${extra})) = ${perimetro}.`,
      `Dentro del paréntesis: 2(${linHtml(2, extra)}) = ${perimetro}.`,
      `Distribuye el 2: ${eqHtml(4, 2 * extra, 0, perimetro)}.`,
      ...solved.steps,
      `El ancho mide ${ancho} m y el largo mide ${ancho + extra} m.`,
    ],
    answerHtml: `x = ${ancho}. El ancho mide ${ancho} m.`,
    inputHelp: "Escribe la medida. También vale «6 m».",
    verify: {
      type: "word",
      template: "perimetro",
      data: { extra, perimetro },
      eq: { a: 4, b: 2 * extra, c: 0, d: perimetro },
    },
  });
}

function buildConsecutivos({ suma, step, tipo }) {
  const count = 3;
  const b = (step * count * (count - 1)) / 2;
  const solved = solveLinear(count, b, 0, suma);
  if (solved.solution.d !== 1) throw new Error("consecutivos");
  const menor = solved.solution.n;
  if (tipo === "pares" && menor % 2 !== 0) throw new Error("par");
  if (tipo === "impares" && menor % 2 === 0) throw new Error("impar");
  const nombre =
    tipo === "pares"
      ? "tres números pares consecutivos"
      : tipo === "impares"
        ? "tres números impares consecutivos"
        : "tres números consecutivos";
  const n2 = menor + step;
  const n3 = menor + 2 * step;
  const text = `La suma de ${nombre} es ${suma}. ¿Cuál es el menor de esos números?`;
  return withNumber(solved.solution, {
    promptHtml: `<p class="story">${esc(text)}</p>`,
    steps: [
      "Sea x el menor de los tres números.",
      `Los números son x, ${linHtml(1, step)} y ${linHtml(1, 2 * step)}.`,
      `Su suma es ${suma}: x + (x + ${step}) + (x + ${2 * step}) = ${suma}.`,
      `Junta términos: ${eqHtml(count, b, 0, suma)}.`,
      ...solved.steps,
      `Los números son ${menor}, ${n2} y ${n3}. Suman ${menor + n2 + n3}.`,
    ],
    answerHtml: `x = ${menor}. El menor es ${menor}.`,
    inputHelp: "Escribe el menor de los números.",
    verify: {
      type: "word",
      template: "consecutivos",
      data: { count, step, suma, tipo },
      eq: { a: count, b, c: 0, d: suma },
    },
  });
}

function nombreMul(m) {
  if (m === 2) return "doble";
  if (m === 3) return "triple";
  if (m === 4) return "cuádruple";
  return `${m} veces el valor`;
}

function buildNumero({ m, k, result }) {
  if (k === 0) throw new Error("sin constante");
  const solved = solveLinear(m, k, 0, result);
  const cambio = k > 0 ? `aumentado en ${k}` : `disminuido en ${-k}`;
  const text = `El ${nombreMul(m)} de un número, ${cambio}, es igual a ${fmtInt(result)}. ¿Cuál es el número?`;
  return withNumber(solved.solution, {
    promptHtml: `<p class="story">${text}</p>`,
    steps: [
      "Sea x el número.",
      k > 0
        ? `El ${nombreMul(m)} de x, aumentado en ${k}, se escribe ${eqHtml(m, k, 0, result)}.`
        : `El ${nombreMul(m)} de x, disminuido en ${-k}, se escribe ${eqHtml(m, k, 0, result)}.`,
      ...solved.steps,
    ],
    verify: { type: "word", template: "numero", data: { m, k, result }, eq: { a: m, b: k, c: 0, d: result } },
  });
}

function buildBilletes({ nombre, cantidad, total }) {
  const solved = solveLinear(30, 20 * cantidad, 0, total);
  if (solved.solution.d !== 1) throw new Error("billetes");
  const de50 = solved.solution.n;
  const de20 = cantidad - de50;
  if (de50 <= 0 || de20 <= 0) throw new Error("billetes");
  const text = `${nombre} tiene ${cantidad} billetes, unos de $20 y otros de $50. En total tiene $${total}. ¿Cuántos billetes de $50 tiene?`;
  return withNumber(solved.solution, {
    promptHtml: `<p class="story">${esc(text)}</p>`,
    steps: [
      "Sea x el número de billetes de $50.",
      `Entonces los billetes de $20 son ${cantidad} − x.`,
      `El dinero cumple 20(${cantidad} − x) + 50x = ${total}.`,
      `Distribuye: ${20 * cantidad} − 20x + 50x = ${total}.`,
      `Junta términos: ${eqHtml(30, 20 * cantidad, 0, total)}.`,
      ...solved.steps,
      `Son ${de50} billetes de $50 y ${de20} de $20. El total es $${20 * de20 + 50 * de50}.`,
    ],
    answerHtml: `x = ${de50}. Tiene ${de50} ${de50 === 1 ? "billete" : "billetes"} de $50.`,
    inputHelp: "Escribe cuántos billetes de $50.",
    verify: {
      type: "word",
      template: "billetes",
      data: { cantidad, total },
      eq: { a: 30, b: 20 * cantidad, c: 0, d: total },
    },
  });
}

function cramer(e1, e2) {
  const det = e1.a * e2.b - e2.a * e1.b;
  if (det === 0) throw new Error("sistema singular");
  return {
    det,
    x: frac(e1.c * e2.b - e2.c * e1.b, det),
    y: frac(e1.a * e2.c - e2.a * e1.c, det),
  };
}

function pairProblem({ lead, html, steps, e1, e2 }) {
  const solved = cramer(e1, e2);
  return {
    kind: "pair",
    promptHtml: `<p class="lead">${lead}</p><div class="math-lg">${html}</div>`,
    steps,
    answer: { x: solved.x, y: solved.y },
    answerPlain: `x = ${fracPlain(solved.x)}, y = ${fracPlain(solved.y)}`,
    answerHtml: `x = ${numHtml(solved.x)}, y = ${numHtml(solved.y)}`,
    verify: { type: "system", e1, e2 },
  };
}

function checkLine(eq, x, y) {
  const left = add(mul(frac(eq.a), x), mul(frac(eq.b), y));
  if (!eqFn(left, frac(eq.c))) throw new Error("no comprueba el sistema");
  return `En ${lin2Html(eq.a, eq.b)} = ${fmtInt(eq.c)}, al sustituir se obtiene ${numHtml(left)}.`;
}

function eqFn(a, b) {
  return eq(a, b);
}

function buildSustitucion(m, k, e2) {
  const e1 = { a: -m, b: 1, c: k };
  const A = e2.a + e2.b * m;
  const R = e2.c - e2.b * k;
  if (A === 0) throw new Error("singular");
  const x = frac(R, A);
  const y = add(mul(frac(m), x), frac(k));
  const official = cramer(e1, e2);
  if (!eq(official.x, x) || !eq(official.y, y)) throw new Error("sustitución");
  const friendly = `<div>y = ${linHtml(m, k)}</div><div>${lin2Html(e2.a, e2.b)} = ${fmtInt(e2.c)}</div>`;
  const steps = [
    `La primera ecuación ya tiene despejada y: y = ${linHtml(m, k)}.`,
    "Sustituye esa expresión en la segunda ecuación:",
    `${lin2Html(e2.a, e2.b).replace("y", `(${linHtml(m, k)})`)} = ${fmtInt(e2.c)}.`,
    `Distribuye y junta las x: ${eqHtml(A, e2.b * k, 0, e2.c)}.`,
  ];
  if (e2.b * k !== 0) {
    steps.push(
      e2.b * k > 0
        ? `Resta ${e2.b * k} en los dos lados: ${eqHtml(A, 0, 0, R)}.`
        : `Suma ${-e2.b * k} en los dos lados: ${eqHtml(A, 0, 0, R)}.`
    );
  }
  if (A !== 1) steps.push(`Divide entre ${fmtInt(A)}: x = ${numHtml(x)}.`);
  else if (e2.b * k === 0) steps.push(`x = ${numHtml(x)}.`);
  steps.push(
    `Regresa a y = ${linHtml(m, k)} y sustituye x = ${numHtml(x)}.`,
    `y = ${numHtml(y)}.`,
    `Comprobación: ${numHtml(y)} coincide con ${linHtml(m, k)} cuando x = ${numHtml(x)}.`,
    checkLine(e2, x, y)
  );
  return pairProblem({
    lead: "Resuelve el sistema por sustitución.",
    html: friendly,
    steps,
    e1,
    e2,
  });
}

function buildIgualacion(m1, k1, m2, k2) {
  if (m1 === m2) throw new Error("rectas paralelas o iguales");
  const e1 = { a: -m1, b: 1, c: k1 };
  const e2 = { a: -m2, b: 1, c: k2 };
  const x = frac(k2 - k1, m1 - m2);
  const y = add(mul(frac(m1), x), frac(k1));
  const official = cramer(e1, e2);
  if (!eq(official.x, x) || !eq(official.y, y)) throw new Error("igualación");
  const html = `<div>y = ${linHtml(m1, k1)}</div><div>y = ${linHtml(m2, k2)}</div>`;
  const cleared = solveLinear(m1, k1, m2, k2);
  if (!eq(cleared.solution, x)) throw new Error("igualación");
  const steps = [
    "Las dos ecuaciones tienen despejada y. Iguala los lados derechos.",
    `${linHtml(m1, k1)} = ${linHtml(m2, k2)}.`,
    ...cleared.steps,
    `Sustituye x en la primera: y = ${numHtml(y)}.`,
    `La segunda expresión da el mismo valor de y.`,
  ];
  return pairProblem({ lead: "Resuelve el sistema por igualación.", html, steps, e1, e2 });
}

function buildReduccion(e1, e2, modo) {
  const solved = cramer(e1, e2);
  const steps = ["Acomoda el sistema y observa los coeficientes de y."];
  let x;
  if (modo === "suma") {
    const A = e1.a + e2.a;
    const R = e1.c + e2.c;
    if (A === 0 || e1.b + e2.b !== 0) throw new Error("no cancela al sumar");
    x = frac(R, A);
    steps.push("Los coeficientes de y son opuestos. Suma las ecuaciones para cancelar y.");
    steps.push(`${linHtml(e1.a, 0)} ${e2.a < 0 ? "−" : "+"} ${linTerms([[Math.abs(e2.a), "x"]])} = ${fmtInt(e1.c)} ${e2.c < 0 ? "−" : "+"} ${Math.abs(e2.c)}.`);
    steps.push(`La y se cancela. Queda ${eqHtml(A, 0, 0, R)}.`);
  } else {
    const A = e1.a - e2.a;
    const R = e1.c - e2.c;
    if (A === 0 || e1.b !== e2.b) throw new Error("no cancela al restar");
    x = frac(R, A);
    steps.push("Los coeficientes de y son iguales. Resta la segunda ecuación de la primera para cancelar y.");
    steps.push(`(${lin2Html(e1.a, e1.b)}) − (${lin2Html(e2.a, e2.b)}) = ${fmtInt(e1.c)} − ${fmtInt(e2.c)}.`);
    steps.push(`Queda ${eqHtml(A, 0, 0, R)}.`);
  }
  if (!eq(x, solved.x)) throw new Error("reducción");
  steps.push(`x = ${numHtml(solved.x)}.`);
  const ax = mul(frac(e1.a), solved.x);
  const resto = sub(frac(e1.c), ax);
  const yDesde = div(resto, frac(e1.b));
  if (!eq(yDesde, solved.y)) throw new Error("y de reducción");
  steps.push(`Sustituye x = ${numHtml(solved.x)} en ${lin2Html(e1.a, e1.b)} = ${fmtInt(e1.c)}.`);
  steps.push(`Queda ${linTerms([[e1.b, "y"]])} = ${numHtml(resto)}.`);
  if (e1.b !== 1) steps.push(`Divide entre ${fmtInt(e1.b)}: y = ${numHtml(solved.y)}.`);
  else steps.push(`y = ${numHtml(solved.y)}.`);
  steps.push(checkLine(e1, solved.x, solved.y));
  steps.push(checkLine(e2, solved.x, solved.y));
  return pairProblem({
    lead: "Resuelve el sistema por reducción.",
    html: systemHtml(e1, e2),
    steps,
    e1,
    e2,
  });
}

function plugQuad(a, b, c, root) {
  const square = mul(root, root);
  return add(add(mul(frac(a), square), mul(frac(b), root)), frac(c));
}

function factorPair(b, c) {
  for (let m = -40; m <= 40; m += 1) {
    if (m * (b - m) === c) return [m, b - m];
  }
  return null;
}

function showDiscriminant(a, b, c) {
  const b2 = b * b;
  const four = 4 * a * c;
  const D = b2 - four;
  const lines = [
    `a = ${fmtInt(a)}, b = ${fmtInt(b)} y c = ${fmtInt(c)}.`,
    `(${fmtInt(b)})² = ${b2}.`,
    `4ac = 4(${fmtInt(a)})(${fmtInt(c)}) = ${fmtInt(four)}.`,
  ];
  if (four < 0) lines.push(`D = ${b2} − (${fmtInt(four)}) = ${b2} + ${-four} = ${fmtInt(D)}.`);
  else lines.push(`D = ${b2} − ${four} = ${fmtInt(D)}.`);
  return { D, lines };
}

function natureOf(D) {
  if (D > 0) return "dos";
  if (D === 0) return "una";
  return "ninguna";
}

function natureText(nature) {
  if (nature === "dos") return "Hay dos soluciones reales distintas.";
  if (nature === "una") return "Hay una solución real (raíz doble).";
  return "No hay solución real.";
}

function buildQuadratic(a, b, c, method) {
  if (a === 0) throw new Error("no es cuadrática");
  const equation = `${polyHtml(a, b, c)} = 0`;
  const disc = showDiscriminant(a, b, c);
  if (method === "discriminant") {
    const nature = natureOf(disc.D);
    return {
      kind: "discriminant",
      promptHtml: promptBox("Calcula el discriminante y di cuántas soluciones reales tiene.", equation),
      steps: [`Ecuación: ${equation}.`, ...disc.lines, natureText(nature)],
      answer: { d: disc.D, nature },
      answerPlain: `D = ${disc.D}; ${natureText(nature)}`,
      answerHtml: `D = ${fmtInt(disc.D)}. ${natureText(nature)}`,
      verify: { type: "quadratic", a, b, c, mode: "discriminant" },
    };
  }
  const s = isqrt(disc.D);
  if (s === null) throw new Error("raíz no exacta");
  const r1 = frac(-b + s, 2 * a);
  const r2 = frac(-b - s, 2 * a);
  if (eq(r1, r2)) throw new Error("se pidieron dos soluciones");
  for (const root of [r1, r2]) {
    if (!eq(plugQuad(a, b, c, root), frac(0))) throw new Error("raíz ajena");
  }
  const roots = [r1, r2].sort((p, q) => p.n * q.d - q.n * p.d);
  if (method === "factor") {
    if (a !== 1) throw new Error("factorización con a distinto de 1");
    const pair = factorPair(b, c);
    if (!pair) throw new Error("no factoriza");
    const [m, n] = pair;
    const fromFactors = [frac(-m), frac(-n)].sort((p, q) => p.n * q.d - q.n * p.d);
    if (!eq(fromFactors[0], roots[0]) || !eq(fromFactors[1], roots[1])) throw new Error("factores");
    const steps = [
      `Ecuación: ${equation}.`,
      `Busca dos números que sumados den ${fmtInt(b)} y multiplicados den ${fmtInt(c)}.`,
      `Esos números son ${fmtInt(m)} y ${fmtInt(n)}.`,
      `Factoriza: ${parenX(m).replace("x", "x")} ${parenX(n)} = 0.`.replace("(x)", "x"),
      `Un producto es cero cuando alguno de los factores es cero.`,
      `${parenX(m)} = 0, así que x = ${numHtml(frac(-m))}.`,
      `${parenX(n)} = 0, así que x = ${numHtml(frac(-n))}.`,
      `Comprobación: con cada valor la ecuación da 0.`,
    ];
    return {
      kind: "roots",
      promptHtml: promptBox("Resuelve factorizando.", equation),
      steps,
      answer: { roots, doble: false },
      answerPlain: roots.map((root) => fracPlain(root)).join(" y "),
      answerHtml: `x = ${numHtml(roots[0])} o x = ${numHtml(roots[1])}`,
      verify: { type: "quadratic", a, b, c, mode: "roots" },
    };
  }
  const den = 2 * a;
  const steps = [
    `Ecuación: ${equation}.`,
    "Identifica los coeficientes de la fórmula general.",
    ...disc.lines,
    `Como D = ${s * s} = ${s}², la raíz cuadrada de D es ${s}.`,
    `x = (−b ± √D) / (2a) = (${fmtInt(-b)} ± ${s}) / ${fmtInt(den)}.`,
    `Con el signo más: x = ${numHtml(frac(-b + s, den))}.`,
    `Con el signo menos: x = ${numHtml(frac(-b - s, den))}.`,
    `Comprobación: las dos soluciones hacen cero la ecuación.`,
  ];
  return {
    kind: "roots",
    promptHtml: promptBox("Resuelve con la fórmula general.", equation),
    steps,
    answer: { roots, doble: false },
    answerPlain: roots.map((root) => fracPlain(root)).join(" y "),
    answerHtml: `x = ${numHtml(roots[0])} o x = ${numHtml(roots[1])}`,
    verify: { type: "quadratic", a, b, c, mode: "roots" },
  };
}

function genSignos(rng, seed) {
  const form = ["mul2", "mul3", "div", "add", "sub"][seed % 5];
  if (form === "mul2") return buildProduct([rng.nz(-9, 9), rng.nz(-9, 9)]);
  if (form === "mul3") return buildProduct([rng.nz(-5, 5), rng.nz(-5, 5), rng.nz(-4, 4)]);
  if (form === "div") {
    const divisor = rng.nz(-9, 9);
    const cociente = rng.nz(-9, 9);
    return buildQuotient(divisor * cociente, divisor);
  }
  if (form === "add") return buildSum(rng.nz(-12, 12), rng.nz(-12, 12));
  return buildDifference(rng.int(-12, 12), rng.nz(-12, 12));
}

function genJerarquia(rng, seed) {
  const form = ["sum-mul", "sub-mul", "paren", "left", "div-mul", "power"][seed % 6];
  if (form === "div-mul") {
    const divisor = rng.nz(-8, 8);
    const cociente = rng.nz(-8, 8);
    return buildHierarchy("div-mul", { a: divisor * cociente, b: divisor, c: rng.nz(-6, 6) });
  }
  if (form === "power") {
    return buildHierarchy("power", { a: rng.nz(-6, 6), b: rng.nz(-6, 6), c: rng.nz(-6, 6) });
  }
  return buildHierarchy(form, { a: rng.int(-8, 12), b: rng.nz(-8, 8), c: rng.nz(-6, 6) });
}

function genSemejantes(rng, seed) {
  const form = seed % 3;
  let terms;
  if (form === 0) {
    terms = [
      { coef: rng.nz(-7, 7), deg: 1 },
      { coef: rng.nz(-7, 7), deg: 1 },
      { coef: rng.nz(-9, 9), deg: 0 },
      { coef: rng.int(-9, 9), deg: 0 },
    ];
  } else if (form === 1) {
    terms = [
      { coef: rng.nz(-5, 5), deg: 1 },
      { coef: rng.nz(-5, 5), deg: 1 },
      { coef: rng.nz(-5, 5), deg: 1 },
      { coef: rng.nz(-8, 8), deg: 0 },
    ];
  } else {
    terms = [
      { coef: rng.nz(-4, 4), deg: 2 },
      { coef: rng.nz(-4, 4), deg: 2 },
      { coef: rng.nz(-6, 6), deg: 1 },
      { coef: rng.int(-6, 6), deg: 1 },
      { coef: rng.nz(-8, 8), deg: 0 },
    ];
  }
  return buildCombine(shuffle(rng, terms));
}

function different(rng, banned, min, max) {
  let value = 0;
  do {
    value = rng.nz(min, max);
  } while (value === banned);
  return value;
}

function genSimples(rng, seed) {
  const form = seed % 5;
  const x = rng.int(-8, 8);
  if (form === 0) {
    const b = rng.nz(-9, 9);
    return buildLinear(1, b, 0, x + b);
  }
  if (form === 1) {
    const a = different(rng, 1, -8, 8);
    return buildLinear(a, 0, 0, a * x);
  }
  if (form === 2) {
    const a = rng.nz(-8, 8);
    const b = rng.nz(-9, 9);
    return buildLinear(a, b, 0, a * x + b);
  }
  if (form === 3) {
    const a = rng.nz(-6, 6);
    const c = different(rng, a, -6, 6);
    const b = rng.int(-8, 8);
    return buildLinear(a, b, c, a * x + b - c * x);
  }
  let p = rng.nz(-8, 8);
  const q = rng.int(2, 4);
  if (p % q === 0) p += 1;
  const k = rng.nz(-3, 3);
  const b = rng.nz(-6, 6);
  return buildLinear(q * k, b, 0, k * p + b);
}

function genParentesis(rng, seed) {
  const form = seed % 3;
  const x = rng.int(-6, 6);
  if (form === 0) {
    const a = rng.nz(-6, 6);
    const b = rng.nz(-6, 6);
    const right = a * (x + b);
    return buildParen(a, b, 0, right);
  }
  if (form === 1) {
    const a = rng.nz(-5, 5);
    const b = rng.nz(-6, 6);
    const c = different(rng, a, -5, 5);
    const d = a * (x + b) - c * x;
    return buildParen(a, b, c, d);
  }
  const a = rng.nz(-5, 5);
  let c = rng.nz(-5, 5);
  if (a + c === 0) c = c === 5 ? 4 : c + 1;
  if (a + c === 0) c = 2;
  const pb = rng.int(-5, 5);
  const pd = rng.int(-5, 5);
  const e = (a + c) * x + a * pb + c * pd;
  return buildParens(a, pb, c, pd, e);
}

function genFracciones(rng, seed) {
  const form = seed % 4;
  if (form === 0) {
    const q = rng.int(2, 6);
    const r = rng.int(-6, 6);
    const p = rng.int(-8, 8);
    return buildFracDen(p, q, r);
  }
  if (form === 1) {
    const a = rng.int(2, 6);
    const b = rng.nz(-7, 8);
    const c = b + rng.nz(-6, 6);
    return buildFracShift(a, b, c);
  }
  if (form === 2) {
    const a = rng.int(2, 6);
    const b = rng.int(2, 6);
    const t = rng.int(1, 4);
    const x = lcm(a, b) * t;
    const k = x / a + x / b;
    return buildFracSum(a, b, k);
  }
  for (let i = 0; i < 20; i += 1) {
    const q = rng.int(2, 5);
    const den = rng.int(2, 4);
    const num = rng.nz(-5, 5);
    const sol = frac(q * num, den);
    if (sol.d !== 1) return buildFracEq(q, num, den);
  }
  return buildFracEq(2, 3, 4);
}

function genProblemas(rng, seed) {
  const form = ["edades", "dinero", "perimetro", "consecutivos", "numero", "billetes"][seed % 6];
  if (form === "edades") {
    const [n1, n2] = twoNames(rng);
    const x = rng.int(8, 16);
    const m = rng.int(2, 3);
    const k = rng.int(1, 8);
    return buildEdades({ n1, n2, m, k, suma: x + (m * x + k) });
  }
  if (form === "dinero") {
    const x = rng.int(20, 60);
    const k = rng.int(5, Math.min(25, x - 5));
    const p = rng.int(1, 4);
    const q = rng.int(1, 4);
    return buildDinero({
      nombre: rng.pick(NOMBRES),
      k,
      p,
      q,
      total: p * x + q * (x - k),
    });
  }
  if (form === "perimetro") {
    const ancho = rng.int(4, 18);
    const extra = rng.int(1, 10);
    return buildPerimetro({ extra, perimetro: 2 * (ancho + ancho + extra) });
  }
  if (form === "consecutivos") {
    const tipo = ["seguidos", "pares", "impares"][seed % 3];
    const step = tipo === "seguidos" ? 1 : 2;
    let menor = rng.int(2, 20);
    if (tipo === "pares" && menor % 2 !== 0) menor += 1;
    if (tipo === "impares" && menor % 2 === 0) menor += 1;
    const suma = menor + (menor + step) + (menor + 2 * step);
    return buildConsecutivos({ suma, step, tipo });
  }
  if (form === "numero") {
    const m = rng.int(2, 4);
    const x = rng.int(2, 15);
    const k = rng.nz(-9, 9);
    return buildNumero({ m, k, result: m * x + k });
  }
  const de50 = rng.int(1, 6);
  const de20 = rng.int(1, 6);
  return buildBilletes({
    nombre: rng.pick(NOMBRES),
    cantidad: de50 + de20,
    total: 20 * de20 + 50 * de50,
  });
}

function genSustitucion(rng) {
  const m = rng.nz(-3, 3);
  const x = rng.int(-6, 6);
  const k = rng.int(-6, 6);
  const y = m * x + k;
  const a2 = rng.nz(-4, 4);
  let b2 = rng.nz(-4, 4);
  if (a2 + b2 * m === 0) b2 = b2 === 4 ? 3 : b2 + 1;
  if (a2 + b2 * m === 0) b2 = b2 === 3 ? -2 : 3;
  const e2 = { a: a2, b: b2, c: a2 * x + b2 * y };
  return buildSustitucion(m, k, e2);
}

function genIgualacion(rng) {
  const m1 = rng.int(-3, 3);
  let m2 = rng.int(-3, 3);
  if (m1 === m2) m2 = m2 === 3 ? -2 : m2 + 1;
  const x = rng.int(-6, 6);
  const k1 = rng.int(-6, 6);
  const y = m1 * x + k1;
  const k2 = y - m2 * x;
  return buildIgualacion(m1, k1, m2, k2);
}

function genReduccion(rng, seed) {
  const x = rng.int(-6, 6);
  const y = rng.int(-6, 6);
  const b = rng.nz(-4, 4);
  const a1 = rng.nz(-4, 4);
  if (seed % 2 === 0) {
    let a2 = rng.nz(-4, 4);
    if (a1 + a2 === 0) a2 = a2 === 4 ? 3 : a2 + 1;
    if (a1 + a2 === 0) a2 = 2;
    const e1 = { a: a1, b, c: a1 * x + b * y };
    const e2 = { a: a2, b: -b, c: a2 * x - b * y };
    return buildReduccion(e1, e2, "suma");
  }
  let a2 = rng.nz(-4, 4);
  if (a1 === a2) a2 = a2 === 4 ? 3 : a2 + 1;
  if (a1 === a2) a2 = -2;
  const e1 = { a: a1, b, c: a1 * x + b * y };
  const e2 = { a: a2, b, c: a2 * x + b * y };
  return buildReduccion(e1, e2, "resta");
}

function monicFromRoots(r1, r2) {
  return { a: 1, b: -(r1 + r2), c: r1 * r2 };
}

function genFactorizacion(rng) {
  let r1 = rng.int(-6, 6);
  let r2 = rng.int(-6, 6);
  if (r1 === r2) r2 = r2 === 6 ? -2 : r2 + 1;
  const { a, b, c } = monicFromRoots(r1, r2);
  return buildQuadratic(a, b, c, "factor");
}

function genFormula(rng) {
  for (let intento = 0; intento < 30; intento += 1) {
    const a1 = rng.pick([2, 3, -2, -3]);
    const b1 = rng.nz(-4, 4);
    const a2 = rng.pick([1, 2, -1]);
    const b2 = rng.nz(-4, 4);
    let A = a1 * a2;
    let B = a1 * b2 + b1 * a2;
    let C = b1 * b2;
    const g = Math.abs(gcdSafe(gcdSafe(A, B), C));
    if (g > 1) {
      A /= g;
      B /= g;
      C /= g;
    }
    if (A < 0) {
      A = -A;
      B = -B;
      C = -C;
    }
    if (Math.abs(A) === 1 || Math.abs(A) > 6) continue;
    const D = B * B - 4 * A * C;
    if (isqrt(D) === null || D === 0) continue;
    return buildQuadratic(A, B, C, "formula");
  }
  return buildQuadratic(2, 5, -12, "formula");
}

function gcdSafe(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

function genDiscriminante(rng, seed) {
  const form = seed % 3;
  if (form === 1) {
    const r = rng.int(-5, 5);
    return buildQuadratic(1, -2 * r, r * r, "discriminant");
  }
  if (form === 2) {
    const b = rng.int(-6, 6);
    const c = Math.floor((b * b) / 4) + rng.int(1, 4);
    return buildQuadratic(1, b, c, "discriminant");
  }
  let r1 = rng.int(-5, 5);
  let r2 = rng.int(-5, 5);
  if (r1 === r2) r2 += 2;
  const coef = monicFromRoots(r1, r2);
  return buildQuadratic(coef.a, coef.b, coef.c, "discriminant");
}

const GENERATORS = {
  signos: genSignos,
  jerarquia: genJerarquia,
  semejantes: genSemejantes,
  simples: genSimples,
  parentesis: genParentesis,
  fracciones: genFracciones,
  problemas: genProblemas,
  sustitucion: (rng) => genSustitucion(rng),
  igualacion: (rng) => genIgualacion(rng),
  reduccion: genReduccion,
  factorizacion: (rng) => genFactorizacion(rng),
  formula: (rng) => genFormula(rng),
  discriminante: genDiscriminante,
  despejes: generateDespejes,
  areas: generateAreas,
  variacion: generateVariacion,
};

export function generateProblem(subtopicId, seed) {
  const safeSeed = seed >>> 0;
  const rng = makeRng(safeSeed || 1);
  const build = GENERATORS[subtopicId];
  if (!build) throw new Error(`Tema desconocido: ${subtopicId}`);
  return tag(subtopicId, build(rng, safeSeed || 1), safeSeed || 1);
}

export function lessonExamples(subtopicId) {
  const examples = {
    ...lessonModelos(),
    signos: [
      buildProduct([-6, -4]),
      buildSum(-8, 3),
      buildDifference(5, -2),
    ],
    jerarquia: [
      buildHierarchy("sum-mul", { a: 2, b: 3, c: 4 }),
      buildHierarchy("paren", { a: 2, b: 3, c: 4 }),
      buildHierarchy("left", { a: 20, b: 8, c: 3 }),
    ],
    semejantes: [
      buildCombine([
        { coef: 3, deg: 1 },
        { coef: 2, deg: 1 },
        { coef: -5, deg: 0 },
        { coef: 1, deg: 0 },
      ]),
      buildCombine([
        { coef: 4, deg: 1 },
        { coef: -1, deg: 1 },
        { coef: 7, deg: 0 },
        { coef: -2, deg: 0 },
      ]),
      buildCombine([
        { coef: 2, deg: 2 },
        { coef: 3, deg: 1 },
        { coef: -1, deg: 2 },
        { coef: 1, deg: 1 },
        { coef: -4, deg: 0 },
      ]),
    ],
    simples: [buildLinear(1, 7, 0, 12), buildLinear(3, -4, 0, 11), buildLinear(5, 2, 2, 14)],
    parentesis: [buildParen(2, 3, 0, 16), buildParen(3, -2, 2, 4), buildParens(4, 1, -2, -3, 18)],
    fracciones: [buildFracDen(1, 2, 5), buildFracSum(2, 3, 5), buildFracShift(4, 3, 7)],
    problemas: [
      buildEdades({ n1: "Lucía", n2: "Mateo", m: 2, k: 4, suma: 40 }),
      buildDinero({ nombre: "Andrea", k: 15, p: 2, q: 3, total: 180 }),
      buildPerimetro({ extra: 3, perimetro: 30 }),
    ],
    sustitucion: [
      buildSustitucion(2, 1, { a: 1, b: 1, c: 10 }),
      buildSustitucion(-1, 5, { a: 2, b: 1, c: 7 }),
      buildSustitucion(3, -2, { a: 1, b: -1, c: 0 }),
    ],
    igualacion: [
      buildIgualacion(1, 2, -2, 11),
      buildIgualacion(2, -1, -1, 8),
      buildIgualacion(0, 4, 2, -2),
    ],
    reduccion: [
      buildReduccion({ a: 2, b: 1, c: 7 }, { a: 3, b: -1, c: 8 }, "suma"),
      buildReduccion({ a: 4, b: 2, c: 14 }, { a: 1, b: 2, c: 8 }, "resta"),
    ],
    factorizacion: [
      buildQuadratic(1, -5, 6, "factor"),
      buildQuadratic(1, 2, -15, "factor"),
      buildQuadratic(1, 0, -4, "factor"),
    ],
    formula: [buildQuadratic(2, 5, -12, "formula"), buildQuadratic(3, -5, -2, "formula")],
    discriminante: [
      buildQuadratic(1, -4, 3, "discriminant"),
      buildQuadratic(1, -6, 9, "discriminant"),
      buildQuadratic(1, 2, 5, "discriminant"),
    ],
  };
  const list = examples[subtopicId];
  if (!list) throw new Error(subtopicId);
  return list.map((problem, index) => ({ ...tag(subtopicId, problem, 1000 + index), fixed: true }));
}

export function subtopicIds() {
  return Object.keys(GENERATORS);
}

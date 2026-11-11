/** Despejes, áreas y volúmenes, variación y reparto. Contenido original. */

import { frac, fracPlain } from "./frac.js";
import { esc, polyHtml, polyPlain, promptBox } from "./format.js";
import { exprHtml, exprPlain, evalExpr, parseExpr } from "./expr.js";

const V = (name) => ({ t: "v", name });
const N = (n) => ({ t: "n", v: frac(n) });
const op = (t, l, r) => ({ t, l, r });

const FORMULA_HELP =
  "Escribe la expresión despejada. Sirve d/t, d÷t, (P−2a)/2 o v = d/t, con las mismas letras.";

const DESPEJES = {
  vt: {
    shown: "d = vt",
    note: "d es la distancia, v la velocidad y t el tiempo.",
    solves: {
      v: {
        free: ["d", "t"],
        ast: op("/", V("d"), V("t")),
        steps: (plain) => [
          "Fórmula: d = vt. La distancia es velocidad por tiempo.",
          "v está multiplicando a t. Divide los dos lados entre t. El tiempo no es cero.",
          `Queda v = ${plain}.`,
          "También puedes escribirlo v = d÷t. Es la misma expresión.",
          "Comprobación: (d/t) · t regresa a d.",
        ],
      },
      t: {
        free: ["d", "v"],
        ast: op("/", V("d"), V("v")),
        steps: (plain) => [
          "Fórmula: d = vt.",
          "t está multiplicando a v. Divide los dos lados entre v.",
          `El tiempo despejado es t = ${plain}.`,
          "Comprobación: v · (d/v) = d.",
        ],
      },
    },
  },
  perimetro: {
    shown: "P = 2(l + a)",
    note: "P es el perímetro de un rectángulo, l el largo y a el ancho.",
    solves: {
      l: {
        free: ["P", "a"],
        ast: op("-", op("/", V("P"), N(2)), V("a")),
        steps: (plain) => [
          "Fórmula: P = 2(l + a).",
          "Divide los dos lados entre 2: P/2 = l + a.",
          "Resta a en los dos lados para dejar l sola.",
          `l = ${plain}.`,
          "Equivale a l = (P − 2a)/2. Las dos formas dicen lo mismo.",
          "Comprobación: 2((P/2 − a) + a) = P.",
        ],
      },
      a: {
        free: ["P", "l"],
        ast: op("-", op("/", V("P"), N(2)), V("l")),
        steps: (plain) => [
          "Fórmula: P = 2(l + a).",
          "Divide entre 2: P/2 = l + a.",
          "Resta l: el ancho queda solo.",
          `a = ${plain}.`,
          "Comprobación: 2(l + (P/2 − l)) = P.",
        ],
      },
    },
  },
  area: {
    shown: "A = lw",
    note: "A es el área de un rectángulo, l el largo y w el ancho.",
    solves: {
      l: {
        free: ["A", "w"],
        ast: op("/", V("A"), V("w")),
        steps: (plain) => [
          "Fórmula: A = lw.",
          "l está multiplicando a w. Divide los dos lados entre w.",
          `l = ${plain}.`,
          "Comprobación: (A/w) · w = A.",
        ],
      },
      w: {
        free: ["A", "l"],
        ast: op("/", V("A"), V("l")),
        steps: (plain) => [
          "Fórmula: A = lw.",
          "Divide los dos lados entre l.",
          `w = ${plain}.`,
          "Comprobación: l · (A/l) = A.",
        ],
      },
    },
  },
  triangulo: {
    shown: "A = bh/2",
    note: "A es el área de un triángulo, b la base y h la altura.",
    solves: {
      h: {
        free: ["A", "b"],
        ast: op("/", op("*", N(2), V("A")), V("b")),
        steps: (plain) => [
          "Fórmula: A = bh/2.",
          "Multiplica los dos lados por 2 para quitar el denominador: 2A = bh.",
          "Divide entre b. La altura queda sola.",
          `h = ${plain}.`,
          "Comprobación: b · (2A/b) / 2 = A.",
        ],
      },
      b: {
        free: ["A", "h"],
        ast: op("/", op("*", N(2), V("A")), V("h")),
        steps: (plain) => [
          "Fórmula: A = bh/2.",
          "Multiplica por 2: 2A = bh.",
          "Divide entre h.",
          `b = ${plain}.`,
          "Comprobación: (2A/h) · h / 2 = A.",
        ],
      },
    },
  },
  prisma: {
    shown: "V = abc",
    note: "V es el volumen de un prisma rectangular y a, b, c son sus tres aristas.",
    solves: {
      a: {
        free: ["V", "b", "c"],
        ast: op("/", V("V"), op("*", V("b"), V("c"))),
        steps: (plain) => [
          "Fórmula: V = abc. El volumen es el producto de las tres aristas.",
          "a está multiplicando a bc. Divide los dos lados entre bc.",
          `a = ${plain}.`,
          "Comprobación: (V/(bc)) · b · c = V.",
        ],
      },
    },
  },
  fuerza: {
    shown: "F = ma",
    note: "F es la fuerza, m la masa y a la aceleración.",
    solves: {
      m: {
        free: ["F", "a"],
        ast: op("/", V("F"), V("a")),
        steps: (plain) => [
          "Fórmula: F = ma.",
          "m está multiplicando a a. Divide los dos lados entre a.",
          `m = ${plain}.`,
          "Comprobación: (F/a) · a = F.",
        ],
      },
      a: {
        free: ["F", "m"],
        ast: op("/", V("F"), V("m")),
        steps: (plain) => [
          "Fórmula: F = ma.",
          "Divide los dos lados entre m.",
          `a = ${plain}.`,
          "Comprobación: m · (F/m) = F.",
        ],
      },
    },
  },
  trapecio: {
    shown: "A = (B + b)h/2",
    note: "A es el área de un trapecio, B la base mayor, b la base menor y h la altura.",
    solves: {
      h: {
        free: ["A", "B", "b"],
        ast: op("/", op("*", N(2), V("A")), op("+", V("B"), V("b"))),
        steps: (plain) => [
          "Fórmula: A = (B + b)h/2.",
          "Multiplica por 2: 2A = (B + b)h.",
          "Divide entre (B + b). Esa suma no es cero.",
          `h = ${plain}.`,
          "Comprobación: (B + b) · (2A/(B + b)) / 2 = A.",
        ],
      },
      B: {
        free: ["A", "h", "b"],
        ast: op("-", op("/", op("*", N(2), V("A")), V("h")), V("b")),
        steps: (plain) => [
          "Fórmula: A = (B + b)h/2.",
          "Multiplica por 2: 2A = (B + b)h.",
          "Divide entre h: 2A/h = B + b.",
          "Resta b.",
          `B = ${plain}.`,
          "Comprobación: ((2A/h − b) + b) · h / 2 = A.",
        ],
      },
    },
  },
};

const DESPEJE_KEYS = Object.entries(DESPEJES).flatMap(([template, spec]) =>
  Object.keys(spec.solves).map((target) => [template, target])
);

function samplesFor(free, seed) {
  return [0, 1, 2, 3].map((row) => {
    const sample = {};
    free.forEach((name, index) => {
      sample[name] = 2 + ((seed + row * 5 + index * 3) % 7);
    });
    return sample;
  });
}

function makeDespeje(template, target, seed) {
  const spec = DESPEJES[template];
  const solve = spec.solves[target];
  const plain = exprPlain(solve.ast);
  const legible = plain.replaceAll("+", " + ").replaceAll("-", " − ").replaceAll("*", " · ");
  const parsed = parseExpr(plain);
  if (!parsed) throw new Error(`no se lee ${plain}`);
  const samples = samplesFor(solve.free, seed || 1);
  for (const sample of samples) {
    const env = {};
    for (const name of solve.free) env[name] = frac(sample[name]);
    const value = evalExpr(parsed, env);
    env[target] = value;
    if (!sameFormula(template, env)) throw new Error(`despeje ${template} ${target}`);
  }
  return {
    kind: "formula",
    promptHtml: `<p class="lead">Despeja ${target}.</p><div class="math-lg">${esc(spec.shown)}</div><p class="fine">${esc(spec.note)}</p>`,
    steps: solve.steps(legible),
    answerPlain: plain,
    answerHtml: `${target} = ${exprHtml(solve.ast)}`,
    inputHelp: FORMULA_HELP,
    verify: { type: "despeje", template, target, free: solve.free, samples },
  };
}

function sameFormula(template, env) {
  const g = (name) => env[name];
  const eqFrac = (left, right) => left.n === right.n && left.d === right.d;
  if (template === "vt") return eqFrac(g("d"), mulFrac(g("v"), g("t")));
  if (template === "perimetro") return eqFrac(g("P"), mulFrac(frac(2), addFrac(g("l"), g("a"))));
  if (template === "area") return eqFrac(g("A"), mulFrac(g("l"), g("w")));
  if (template === "triangulo") return eqFrac(mulFrac(frac(2), g("A")), mulFrac(g("b"), g("h")));
  if (template === "prisma") return eqFrac(g("V"), mulFrac(g("a"), mulFrac(g("b"), g("c"))));
  if (template === "fuerza") return eqFrac(g("F"), mulFrac(g("m"), g("a")));
  if (template === "trapecio") return eqFrac(mulFrac(frac(2), g("A")), mulFrac(addFrac(g("B"), g("b")), g("h")));
  return false;
}

function addFrac(a, b) {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d);
}
function mulFrac(a, b) {
  return frac(a.n * b.n, a.d * b.d);
}

function polyProblem(c2, c1, c0, fields) {
  return {
    kind: "poly",
    answer: { c2, c1, c0, plain: polyPlain(c2, c1, c0) },
    answerPlain: polyPlain(c2, c1, c0),
    answerHtml: polyHtml(c2, c1, c0),
    ...fields,
  };
}

function numberProblem(value, fields) {
  const f = frac(value);
  return {
    kind: "number",
    answer: { n: f.n, d: f.d },
    answerPlain: fracPlain(f),
    answerHtml: fields.answerHtml || `${numFrom(f)}`,
    ...fields,
  };
}

function numFrom(f) {
  return f.d === 1 ? String(f.n).replace("-", "−") : `${f.n}/${f.d}`;
}

function makeRectExpr(k) {
  return polyProblem(1, k, 0, {
    promptHtml: promptBox(
      "Escribe el área, ya reducida.",
      `Un rectángulo mide x de ancho y x + ${k} de largo.`
    ),
    steps: [
      "El área de un rectángulo es ancho por largo.",
      `Área = x(x + ${k}).`,
      `Distribuye: x² + ${k}x.`,
      `Expresión reducida: ${polyHtml(1, k, 0)}.`,
    ],
    verify: { type: "figura", template: "rect-expr", data: { k } },
  });
}

function makeTriExpr(height) {
  const coef = height / 2;
  return polyProblem(0, coef, 0, {
    promptHtml: promptBox(
      "Escribe el área, ya reducida.",
      `Un triángulo tiene base x y altura ${height}.`
    ),
    steps: [
      "El área de un triángulo es base por altura entre 2.",
      `Área = x · ${height} / 2.`,
      `${height} / 2 = ${coef}, así que el área es ${coef}x.`,
      `Expresión reducida: ${polyHtml(0, coef, 0)}.`,
    ],
    verify: { type: "figura", template: "tri-expr", data: { height, coef } },
  });
}

function makePrismaExpr(p, q) {
  const coef = p * q;
  return polyProblem(0, coef, 0, {
    promptHtml: promptBox(
      "Escribe el volumen, ya reducido.",
      `Un prisma rectangular mide x de largo, ${p} de ancho y ${q} de alto.`
    ),
    steps: [
      "El volumen es el producto de las tres aristas.",
      `Volumen = x · ${p} · ${q}.`,
      `${p} · ${q} = ${coef}, así que el volumen es ${coef}x.`,
      `Expresión reducida: ${polyHtml(0, coef, 0)}.`,
    ],
    verify: { type: "figura", template: "prisma-expr", data: { p, q } },
  });
}

function makeRectNum(x, k) {
  const area = x * (x + k);
  const otro = x + k;
  return numberProblem(x, {
    promptHtml: `<p class="story">Un rectángulo tiene de ancho x cm y de largo x + ${k} cm. Su área es ${area} cm². ¿Cuánto mide el ancho?</p>`,
    steps: [
      `Sea x el ancho, en centímetros. El largo mide x + ${k}.`,
      `El área es el producto: x(x + ${k}) = ${area}.`,
      `Quita el paréntesis: x² + ${k}x − ${area} = 0.`,
      `Factoriza. Busca dos números que sumen ${k} y multiplicados den −${area}: −${x} y ${otro}.`,
      `(x − ${x})(x + ${otro}) = 0.`,
      `x = ${x} o x = −${otro}. Una longitud es positiva, así que x = ${x}.`,
      `Comprobación: ${x} · ${x + k} = ${area}.`,
    ],
    answerHtml: `x = ${x}. El ancho mide ${x} cm.`,
    inputHelp: "Escribe la medida positiva, en centímetros.",
    verify: { type: "figura", template: "rect-num", data: { k, area } },
  });
}

function makePrismaNum(x, p, q) {
  const volume = x * p * q;
  return numberProblem(x, {
    promptHtml: `<p class="story">Una caja mide x cm de largo, ${p} cm de ancho y ${q} cm de alto. Su volumen es ${volume} cm³. ¿Cuánto mide el largo?</p>`,
    steps: [
      "El volumen de la caja es largo por ancho por alto.",
      `x · ${p} · ${q} = ${volume}.`,
      `${p} · ${q} = ${p * q}, así que ${p * q}x = ${volume}.`,
      `Divide entre ${p * q}: x = ${volume} / ${p * q} = ${x}.`,
      `Comprobación: ${x} · ${p} · ${q} = ${volume}.`,
    ],
    answerHtml: `x = ${x}. El largo mide ${x} cm.`,
    inputHelp: "Escribe la medida, en centímetros.",
    verify: { type: "figura", template: "prisma-num", data: { p, q, volume } },
  });
}

function makeCompuesto(x, k) {
  const total = x * x + k * x;
  return numberProblem(x, {
    promptHtml: `<p class="story">Una tarjeta se forma con un cuadrado de lado x cm y, pegado a un lado, un rectángulo de ${k} cm por x cm. El área total es ${total} cm². ¿Cuánto mide x?</p>`,
    steps: compuestoSteps(x, k, total),
    verify: { type: "figura", template: "compuesto-num", data: { k, total } },
  });
}

function compuestoSteps(x, k, total) {
  const otro = x + k;
  return [
    `El cuadrado mide x² y el rectángulo mide ${k}x.`,
    `x² + ${k}x = ${total}.`,
    `Entonces x² + ${k}x − ${total} = 0.`,
    `Dos números que suman ${k} y multiplicados dan −${total} son −${x} y ${otro}.`,
    `(x − ${x})(x + ${otro}) = 0.`,
    `x = ${x} o x = −${otro}. La longitud positiva es x = ${x}.`,
    `Comprobación: ${x}² + ${k}·${x} = ${x * x} + ${k * x} = ${total}.`,
  ];
}

function makeTriNum(base, x) {
  const area = (base * x) / 2;
  return numberProblem(x, {
    promptHtml: `<p class="story">Un triángulo tiene base de ${base} cm y área de ${area} cm². ¿Cuánto mide la altura?</p>`,
    steps: [
      "Área = base × altura / 2.",
      `${base} · h / 2 = ${area}.`,
      `Multiplica por 2: ${base}h = ${area * 2}.`,
      `Divide entre ${base}: h = ${area * 2} / ${base} = ${x}.`,
      `Comprobación: ${base} · ${x} / 2 = ${area}.`,
    ],
    answerHtml: `h = ${x}. La altura mide ${x} cm.`,
    inputHelp: "Escribe la altura, en centímetros.",
    verify: { type: "figura", template: "tri-num", data: { base, area } },
  });
}

function makeCuadrado(x) {
  return numberProblem(x, {
    promptHtml: `<p class="story">Un cuadrado tiene área de ${x * x} cm². ¿Cuánto mide su lado?</p>`,
    steps: [
      "El área de un cuadrado es lado por lado: x².",
      `x² = ${x * x}.`,
      `x es la raíz positiva de ${x * x}, porque un lado no es negativo.`,
      `${x} · ${x} = ${x * x}, así que x = ${x}.`,
    ],
    answerHtml: `x = ${x}. El lado mide ${x} cm.`,
    inputHelp: "Escribe la medida positiva del lado.",
    verify: { type: "figura", template: "cuadrado-num", data: { area: x * x } },
  });
}

const NOMBRES = ["Ana", "Luis", "Bruno", "Carla", "Renata", "Diego", "Sofía", "Mateo"];

function tableHtml(pairs, missing) {
  const xs = pairs.map((pair) => `<td>${pair.x}</td>`).join("");
  const ys = pairs
    .map((pair, index) => `<td>${index === missing ? "?" : pair.y}</td>`)
    .join("");
  return `<table class="data"><tbody><tr><th>x</th>${xs}</tr><tr><th>y</th>${ys}</tr></tbody></table>`;
}

function graphHtml(points) {
  const width = 220;
  const height = 140;
  const pad = 28;
  const maxX = Math.max(...points.map((point) => point.x), 1);
  const maxY = Math.max(...points.map((point) => point.y), 1);
  const X = (x) => pad + (x / maxX) * (width - pad - 12);
  const Y = (y) => height - pad - (y / maxY) * (height - pad - 12);
  const line = points.map((point) => `${X(point.x).toFixed(1)},${Y(point.y).toFixed(1)}`).join(" ");
  const dots = points
    .map((point) => `<circle cx="${X(point.x).toFixed(1)}" cy="${Y(point.y).toFixed(1)}" r="4"/>`)
    .join("");
  return `<svg class="plot" viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfica de los puntos de la tabla">
    <line x1="${pad}" y1="${height - pad}" x2="${width - 8}" y2="${height - pad}"/>
    <line x1="${pad}" y1="${height - pad}" x2="${pad}" y2="8"/>
    <polyline points="${line}"/>
    ${dots}
  </svg>`;
}

function makeDirecta({ baseQty, k, x }) {
  const basePay = k * baseQty;
  const answer = k * x;
  return numberProblem(answer, {
    promptHtml: `<p class="story">${baseQty} litros de jugo cuestan $${basePay}. Al mismo precio por litro, ¿cuánto cuestan ${x} litros?</p>
      ${tableHtml([{ x: baseQty, y: basePay }, { x, y: answer }], 1)}`,
    steps: [
      "El costo y los litros están en proporcionalidad directa: y/x vale siempre lo mismo.",
      `La constante es k = ${basePay} / ${baseQty} = ${k} pesos por litro.`,
      `Para ${x} litros: y = ${k} · ${x} = ${answer}.`,
      `Cuestan $${answer}.`,
    ],
    answerHtml: `$${answer}`,
    inputHelp: "Escribe el costo. También vale «20 pesos».",
    verify: { type: "variacion", template: "directa", data: { baseQty, basePay, k, x } },
  });
}

function makeInversa({ w1, h1, w2 }) {
  const constante = w1 * h1;
  const answer = constante / w2;
  return numberProblem(answer, {
    promptHtml: `<p class="story">${w1} personas, trabajando al mismo ritmo, pintan una barda en ${h1} horas. ¿Cuántas horas tardan ${w2} personas?</p>`,
    steps: [
      "A más personas, menos horas: es proporcionalidad inversa. El producto personas × horas no cambia.",
      `${w1} · ${h1} = ${constante}.`,
      `${w2} · horas = ${constante}.`,
      `horas = ${constante} / ${w2} = ${answer}.`,
      `Tardan ${answer} horas. Comprueba: ${w2} · ${answer} = ${constante}.`,
    ],
    answerHtml: `${answer} horas`,
    inputHelp: "Escribe las horas.",
    verify: { type: "variacion", template: "inversa", data: { w1, h1, w2, constante } },
  });
}

function makeLineal({ b, m, x }) {
  const answer = m * x + b;
  return numberProblem(answer, {
    promptHtml: `<p class="story">Un estacionamiento cobra $${b} al entrar y $${m} por cada hora. ¿Cuánto se paga por ${x} horas?</p>`,
    steps: [
      "No es proporcionalidad directa: aunque estés 0 horas, ya se cobró la entrada.",
      `La fórmula es y = ${m}x + ${b}.`,
      `Sustituye x = ${x}: y = ${m} · ${x} + ${b} = ${m * x} + ${b} = ${answer}.`,
      `Se pagan $${answer}.`,
    ],
    answerHtml: `$${answer}`,
    inputHelp: "Escribe el pago total.",
    verify: { type: "variacion", template: "lineal", data: { b, m, x } },
  });
}

function makeCuadratica({ x0, a, x }) {
  const y0 = a * x0 * x0;
  const answer = a * x * x;
  return numberProblem(answer, {
    promptHtml: `<p class="story">El precio de una loseta crece con el cuadrado de su lado. Una loseta de ${x0} cm cuesta $${y0}. ¿Cuánto cuesta una de ${x} cm?</p>`,
    steps: [
      "La relación es cuadrática: y = ax².",
      `Con el primer dato: a · ${x0}² = ${y0}.`,
      `${x0}² = ${x0 * x0}, así que a · ${x0 * x0} = ${y0} y a = ${a}.`,
      `Para ${x} cm: y = ${a} · ${x}² = ${a} · ${x * x} = ${answer}.`,
      `Cuesta $${answer}.`,
    ],
    answerHtml: `$${answer}`,
    inputHelp: "Escribe el precio.",
    verify: { type: "variacion", template: "cuadratica", data: { x0, y0, a, x } },
  });
}

function makeRepartoDirecto({ nombre1, nombre2, p, q, m }) {
  const total = (p + q) * m;
  const primero = p * m;
  const segundo = q * m;
  return numberProblem(primero, {
    promptHtml: `<p class="story">Se reparten $${total} entre ${nombre1} y ${nombre2} en partes proporcionales a ${p} y ${q}. ¿Cuánto le toca a ${nombre1}?</p>`,
    steps: [
      `Las partes son ${p} y ${q}. Juntas forman ${p + q} partes iguales.`,
      `Cada parte vale ${total} / ${p + q} = ${m}.`,
      `${nombre1} tiene ${p} partes: ${p} · ${m} = ${primero}.`,
      `${nombre2} recibe ${q} · ${m} = ${segundo}. La suma ${primero} + ${segundo} = ${total}.`,
    ],
    answerHtml: `$${primero}`,
    inputHelp: "Escribe la cantidad de la primera persona.",
    verify: { type: "variacion", template: "reparto-directo", data: { p, q, m, total } },
  });
}

function makeRepartoInverso({ nombre1, nombre2, p, q, m }) {
  const total = (p + q) * m;
  const primero = q * m;
  const segundo = p * m;
  return numberProblem(primero, {
    promptHtml: `<p class="story">Se reparten ${total} dulces entre ${nombre1} y ${nombre2} de forma inversamente proporcional a ${p} y ${q}. ¿Cuántos dulces le tocan a ${nombre1}, que corresponde al ${p}?</p>`,
    steps: [
      `Inversamente proporcional a ${p} y ${q} significa que las partes van como ${q} y ${p}: se cruzan los números.`,
      `Hay ${q} + ${p} = ${p + q} partes.`,
      `Cada parte vale ${total} / ${p + q} = ${m}.`,
      `${nombre1} corresponde al ${p}, así que se lleva la parte del ${q}: ${q} · ${m} = ${primero}.`,
      `${nombre2} se lleva ${p} · ${m} = ${segundo}. Juntos suman ${total}.`,
    ],
    answerHtml: `${primero} dulces`,
    inputHelp: "Escribe cuántos dulces.",
    verify: { type: "variacion", template: "reparto-inverso", data: { p, q, m, total } },
  });
}

function makeTabla(k, missingX) {
  const xs = [1, 2, 3, 4];
  const pairs = xs.map((x) => ({ x, y: k * x }));
  const missing = xs.indexOf(missingX);
  const answer = k * missingX;
  const known = pairs.filter((pair) => pair.x !== missingX);
  return numberProblem(answer, {
    promptHtml: `<p class="lead">La tabla y la gráfica muestran una proporcionalidad directa. ¿Cuánto vale y cuando x = ${missingX}?</p>
      ${tableHtml(pairs, missing)}
      ${graphHtml(known)}`,
    steps: [
      "En una proporcionalidad directa, y/x es constante y la recta pasa por el origen.",
      `Por ejemplo, ${known[0].y} / ${known[0].x} = ${k}. Las otras parejas también dan ${k}.`,
      `La fórmula es y = ${k}x.`,
      `Cuando x = ${missingX}, y = ${k} · ${missingX} = ${answer}.`,
    ],
    answerHtml: `y = ${answer}`,
    inputHelp: "Escribe el valor de y que falta.",
    verify: { type: "variacion", template: "tabla", data: { k, x: missingX } },
  });
}

function pickDivisor(product, banned, salt) {
  const divisors = [];
  for (let n = 2; n <= 12; n += 1) {
    if (n !== banned && product % n === 0) divisors.push(n);
  }
  if (!divisors.length) return null;
  return divisors[salt % divisors.length];
}

export function generateDespejes(rng, seed) {
  void rng;
  const [template, target] = DESPEJE_KEYS[seed % DESPEJE_KEYS.length];
  return makeDespeje(template, target, seed);
}

export function generateAreas(rng, seed) {
  const form = seed % 8;
  if (form === 0) return makeRectExpr(rng.int(1, 6));
  if (form === 1) return makeTriExpr(rng.pick([2, 4, 6, 8]));
  if (form === 2) return makePrismaExpr(rng.int(2, 5), rng.int(2, 5));
  if (form === 3) return makeRectNum(rng.int(2, 8), rng.int(1, 5));
  if (form === 4) return makePrismaNum(rng.int(2, 8), rng.int(2, 5), rng.int(2, 5));
  if (form === 5) return makeCuadrado(rng.int(2, 12));
  if (form === 6) return makeTriNum(rng.pick([4, 6, 8, 10]), rng.int(2, 9));
  return makeCompuesto(rng.int(2, 8), rng.int(1, 5));
}

export function generateVariacion(rng, seed) {
  const form = seed % 7;
  if (form === 0) {
    return makeDirecta({ baseQty: rng.int(2, 8), k: rng.int(3, 9), x: rng.int(2, 9) });
  }
  if (form === 1) {
    let w1 = rng.int(2, 8);
    let h1 = rng.int(2, 9);
    let w2 = pickDivisor(w1 * h1, w1, seed);
    if (!w2) {
      w1 = 4;
      h1 = 6;
      w2 = 3;
    }
    return makeInversa({ w1, h1, w2 });
  }
  if (form === 2) return makeLineal({ b: rng.int(10, 30), m: rng.int(4, 12), x: rng.int(2, 6) });
  if (form === 3) return makeCuadratica({ x0: rng.int(2, 4), a: rng.int(1, 4), x: rng.int(5, 8) });
  if (form === 4) {
    const [nombre1, nombre2] = dosNombres(rng);
    return makeRepartoDirecto({ nombre1, nombre2, p: rng.int(1, 5), q: rng.int(2, 6), m: rng.int(8, 30) });
  }
  if (form === 5) {
    const [nombre1, nombre2] = dosNombres(rng);
    return makeRepartoInverso({ nombre1, nombre2, p: rng.int(1, 5), q: rng.int(2, 6), m: rng.int(4, 15) });
  }
  return makeTabla(rng.int(2, 9), rng.pick([2, 3, 4]));
}

function dosNombres(rng) {
  const nombre1 = rng.pick(NOMBRES);
  let nombre2 = rng.pick(NOMBRES);
  while (nombre2 === nombre1) nombre2 = rng.pick(NOMBRES);
  return [nombre1, nombre2];
}

export function lessonModelos() {
  return {
    despejes: [makeDespeje("vt", "v", 3), makeDespeje("perimetro", "l", 4), makeDespeje("triangulo", "h", 5)],
    areas: [makeRectExpr(3), makeRectNum(5, 4), makeCompuesto(5, 3)],
    variacion: [
      makeDirecta({ baseQty: 12, k: 4, x: 5 }),
      makeInversa({ w1: 4, h1: 6, w2: 3 }),
      makeRepartoDirecto({ nombre1: "Ana", nombre2: "Luis", p: 2, q: 3, m: 72 }),
    ],
  };
}

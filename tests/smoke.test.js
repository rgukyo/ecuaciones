import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { sampleInput } from "../js/grade.js";
import { render } from "../js/render.js";
import { createState, reduce } from "../js/state.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function collectAssets(rel, seen = new Set()) {
  if (seen.has(rel) || !fs.existsSync(path.join(root, rel))) return seen;
  seen.add(rel);
  const text = read(rel);
  const dir = path.posix.dirname(rel);
  for (const match of text.matchAll(/from\s+["'](\.\/[^"']+)["']/g)) {
    collectAssets(path.posix.normalize(path.posix.join(dir, match[1])), seen);
  }
  for (const match of text.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = match[1];
    if (url.startsWith("http") || url.startsWith("#") || url.startsWith("data:")) continue;
    collectAssets(url.replace(/^\.\//, ""), seen);
  }
  return seen;
}

test("la app carga y cada módulo se dibuja", () => {
  const html = read("index.html");
  assert.equal(/lang="es-MX"/.test(html), true);
  assert.equal(/(?:src|href)="\//.test(html), false);
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  const sw = read("sw.js");
  const assets = collectAssets("index.html");
  for (const icon of manifest.icons) assets.add(icon.src);
  assets.add("icons/apple-touch-icon.png");
  for (const asset of assets) {
    assert.equal(fs.existsSync(path.join(root, asset)), true, asset);
    assert.equal(sw.includes(asset) || sw.includes(`./${asset}`), true, `sin caché: ${asset}`);
  }
  assert.equal(/https?:\/\//.test(sw), false);

  let state = createState();
  const home = render(state);
  assert.match(home, /Enseñanza/);
  assert.match(home, /Practicar/);
  assert.match(home, /Exámenes/);

  state = reduce(state, { type: "nav", view: "ensenanza" });
  const aprender = render(state);
  assert.match(aprender, /Leyes de los signos/);
  assert.match(aprender, /Jerarquía de operaciones/);
  assert.match(aprender, /Términos semejantes/);
  assert.match(aprender, /Despejes de fórmulas/);
  assert.match(aprender, /Áreas y volúmenes/);
  assert.match(aprender, /Variación y reparto/);

  state = reduce(state, { type: "open-lesson", subtopicId: "signos" });
  let leccion = render(state);
  assert.match(leccion, /Ejemplo 1/);
  assert.match(leccion, /Paso a paso/);
  assert.match(leccion, /Ver todo/);
  state = reduce(state, { type: "lesson-step", index: 0 });
  state = reduce(state, { type: "lesson-step", index: 0 });
  leccion = render(state);
  assert.match(leccion, /Paso a paso/);
  assert.match(leccion, /Los signos son iguales/);
  state = reduce(state, { type: "open-lesson", subtopicId: "simples" });
  state = reduce(state, { type: "lesson-all", index: 0 });
  const simple = render(state);
  assert.match(simple, /Ver de nuevo/);
  assert.match(simple, /Método 01/);
  assert.match(simple, /Método 02/);
  assert.match(simple, /Sustitución/);
  assert.match(simple, /Clave/);

  state = reduce(state, { type: "nav", view: "practicar" });
  assert.match(render(state), /Elige un tema/);
  state = reduce(state, { type: "start-practice", subtopicId: "simples", seed: 4 });
  let practica = render(state);
  assert.match(practica, /Tu respuesta/);
  assert.match(practica, /data-action="hint"/);
  assert.match(practica, /Ver solución/);
  state = reduce(state, { type: "practice-check", entry: sampleInput(state.practice.problem) });
  assert.match(render(state), /Correcto/);

  state = reduce(state, { type: "start-practice", subtopicId: "despejes", seed: 1 });
  const despeje = render(state);
  assert.match(despeje, /Despeja/);
  assert.match(despeje, /data-action="hint"/);
  state = reduce(state, { type: "practice-check", entry: sampleInput(state.practice.problem) });
  assert.match(render(state), /Correcto/);

  state = reduce(createState(), { type: "nav", view: "examen" });
  const examen = render(state);
  assert.match(examen, /Comenzar examen/);
  assert.match(examen, /Despejes de fórmulas/);
  assert.match(examen, /Áreas y volúmenes/);
  assert.match(examen, /Variación y reparto/);
  assert.match(read("sw.js"), /ecuaciones-v3/);
  assert.match(read("sw.js"), /Kalam-Bold.ttf/);
  assert.match(read("sw.js"), /visual.js/);
  state = reduce(state, { type: "start-exam", seed: 8, now: 5_000 });
  const curso = render(state);
  assert.match(curso, /Pregunta 1 de 5/);
  assert.equal(curso.includes('data-action="hint"'), false);
  assert.equal(curso.includes("Ver solución"), false);
  state = reduce(state, { type: "exam-finish", now: 9_000, entry: "999999" });
  const resultado = render(state);
  assert.match(resultado, /Resultado/);
  assert.match(resultado, /Para repasar/);
  assert.match(resultado, /Solución/);
  assert.equal(state.progress.exams.length, 1);

  state = reduce(state, { type: "nav", view: "avance" });
  assert.match(render(state), /Borrar mi progreso/);
  state = reduce(state, { type: "reset-progress" });
  assert.equal(state.progress.exams.length, 0);
  assert.match(render(state), /Todavía no haces un examen/);
});

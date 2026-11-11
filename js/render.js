/** Vistas de la app. Devuelve HTML; no toca el documento. */

import { CATALOG, findSubtopic } from "./catalog.js";
import { esc, rich } from "./format.js";
import { lessonExamples } from "./generators.js";
import { LESSONS } from "./lessons.js";
import { beatCount, renderNotebook, viewBoard } from "./visual.js";
import { substitutionHtml } from "./pasos.js";

const NAV = [
  { view: "inicio", label: "Inicio", icon: "home" },
  { view: "ensenanza", label: "Aprender", icon: "book" },
  { view: "practicar", label: "Practicar", icon: "pencil" },
  { view: "examen", label: "Examen", icon: "clock" },
  { view: "avance", label: "Avance", icon: "chart" },
];

function icon(name) {
  const paths = {
    home: '<path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z"/>',
    book: '<path d="M5 4.5h6.2A2.8 2.8 0 0 1 14 7.3V20a2.2 2.2 0 0 0-2.2-2.2H5V4.5Z"/><path d="M19 4.5h-6.2A2.8 2.8 0 0 0 10 7.3V20a2.2 2.2 0 0 1 2.2-2.2H19V4.5Z"/>',
    pencil: '<path d="M14.2 4.8a1.6 1.6 0 0 1 2.3 0l2.7 2.7a1.6 1.6 0 0 1 0 2.3L9.4 20H4.5v-4.9L14.2 4.8Z"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>',
    chart: '<path d="M5 19V9M12 19V5M19 19v-7"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}

function shell(state, { title, back, extra = "", body }) {
  const current = state.view === "leccion" ? "ensenanza" : state.view === "examen-curso" || state.view === "examen-resultado" ? "examen" : state.view;
  return `<div class="shell">
    <header class="topbar">
      ${back ? `<button type="button" class="icon-btn" data-action="nav" data-view="${back}" aria-label="Volver">←</button>` : ""}
      <div class="brand"><span class="eyebrow">3° de secundaria</span><h1>${esc(title)}</h1></div>
      ${extra}
    </header>
    <main id="contenido">${body}</main>
    <nav class="tabbar" aria-label="Secciones">
      ${NAV.map((item) => `<button type="button" class="tab" data-action="nav" data-view="${item.view}" ${current === item.view ? 'aria-current="page"' : ""}>${icon(item.icon)}<span>${item.label}</span></button>`).join("")}
    </nav>
  </div>`;
}

function totals(progress) {
  let ok = 0;
  let bad = 0;
  for (const stats of Object.values(progress.practice)) {
    ok += stats.ok || 0;
    bad += stats.bad || 0;
  }
  return { ok, bad, exams: progress.exams.length };
}

function blocks(list) {
  return (list || []).map((block) => {
    if (block.type === "h") return `<h2>${esc(block.text)}</h2>`;
    if (block.type === "p") return `<p>${rich(block.text)}</p>`;
    if (block.type === "note") return `<p class="note">${rich(block.text)}</p>`;
    if (block.type === "formula") return `<p class="formula">${esc(block.text)}</p>`;
    const tag = block.type === "ol" ? "ol" : "ul";
    return `<${tag}>${block.items.map((item) => `<li>${rich(item)}</li>`).join("")}</${tag}>`;
  }).join("");
}

function answerControl(problem, entry) {
  const help = `<p class="format-hint">${esc(problem.inputHelp || "")}</p>`;
  if (problem.kind === "discriminant") {
    const data = entry && typeof entry === "object" ? entry : { d: "", nature: "" };
    const options = [
      ["dos", "Dos soluciones reales"],
      ["una", "Una solución real"],
      ["ninguna", "Ninguna solución real"],
    ];
    return `<fieldset><legend>Tu respuesta</legend>
      <label for="discriminante">Discriminante D</label>
      <input id="discriminante" name="d" value="${esc(data.d || "")}" maxlength="40" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false">
      <div class="choices">
        ${options.map(([value, label]) => `<label class="choice"><input type="radio" name="nature" value="${value}" ${data.nature === value ? "checked" : ""}> ${label}</label>`).join("")}
      </div>
      ${help}
    </fieldset>`;
  }
  const value = typeof entry === "string" ? entry : "";
  return `<label for="respuesta">Tu respuesta</label>
    <input id="respuesta" name="respuesta" value="${esc(value)}" maxlength="80" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done">
    ${help}`;
}

const KEYS = ["7", "8", "9", "÷", "x", "4", "5", "6", "×", "y", "1", "2", "3", "−", "(", "0", "=", "+", ")", "²", "√", "/", "←"];

function keyboardHtml(draft) {
  return `<div class="step-pad">
      <p class="step-draft" aria-live="polite">${draft ? esc(draft) : "Escribe un renglón"}</p>
      <div class="keys">
        ${KEYS.map((key) => `<button type="button" class="key" data-action="${key === "←" ? "step-back" : "step-key"}" data-key="${esc(key)}">${key}</button>`).join("")}
      </div>
      <div class="actions">
        <button type="button" class="ghost" data-action="step-clear">Limpiar renglón</button>
        <button type="button" class="primary" data-action="step-check">Comprobar renglón</button>
      </div>
    </div>`;
}

function stepHtml(practice) {
  const lines = practice.stepLines
    .map((line) => `<li class="step-ok"><span>${esc(line.text)}</span> <span class="check-mark">✓</span></li>`)
    .join("");
  const note = practice.stepNote
    ? `<p class="feedback ${practice.stepNote.ok ? "ok" : "bad"}" role="status"><strong>${esc(practice.stepNote.message || "")}</strong> ${esc(practice.stepNote.hint || "")}</p>`
    : "";
  const done = practice.stepFinal ? `<div class="notebook">${substitutionHtml(practice.problem)}</div>` : "";
  return `<div class="step-mode">
      ${lines ? `<ol class="step-list">${lines}</ol>` : `<p class="fine">Escribe cada renglón de tu procedimiento. La app revisa si sigue siendo la misma ecuación.</p>`}
      ${keyboardHtml(practice.stepDraft || "")}
      ${note}
      ${done}
    </div>`;
}

function solutionHtml(problem, shown) {
  const board = viewBoard(problem);
  if (!board) return "";
  return `<div class="notebook">${renderNotebook(board, shown)}</div>`;
}

function renderHome(state) {
  const sum = totals(state.progress);
  return shell(state, {
    title: "Ecuaciones",
    body: `<section class="hero">
        <p class="kicker" style="color:#f2d48a">Sin cuentas y sin internet</p>
        <h2 style="font-size:1.7rem;margin-top:0.2rem">Aprende a resolver ecuaciones paso a paso.</h2>
        <p>Explicaciones cortas, ejercicios nuevos cada vez y exámenes con reloj. Tu avance se queda en este dispositivo.</p>
        <div class="hero-eq" aria-hidden="true"><span>2x + 3</span><span class="eq">=</span><span>11</span></div>
      </section>
      <div class="stats">
        <div class="stat"><b>${sum.ok}</b><span>aciertos</span></div>
        <div class="stat"><b>${sum.bad}</b><span>por corregir</span></div>
        <div class="stat"><b>${sum.exams}</b><span>exámenes</span></div>
      </div>
      <div class="grid">
        <button type="button" class="card-link" data-action="nav" data-view="ensenanza"><article class="card"><span class="kicker">Módulo 1</span><h2>Enseñanza</h2><p>Reglas claras y ejemplos que se descubren un paso a la vez.</p></article></button>
        <button type="button" class="card-link" data-action="nav" data-view="practicar"><article class="card"><span class="kicker">Módulo 2</span><h2>Practicar</h2><p>Ejercicios distintos en cada intento, con pista y solución.</p></article></button>
        <button type="button" class="card-link" data-action="nav" data-view="examen"><article class="card"><span class="kicker">Módulo 3</span><h2>Exámenes</h2><p>Elige temas, responde con tiempo y revisa qué repasar.</p></article></button>
      </div>
      <p class="fine">Después de abrirla una vez, la app funciona sin conexión.</p>`,
  });
}

function renderTopics(state) {
  return shell(state, {
    title: "Enseñanza",
    body: `<p class="lede">Sigue el orden. Cada tema usa lo anterior.</p>
      <div class="topic-list">
        ${CATALOG.map((group) => `<section class="card" style="--topic:${group.color}">
          <span class="kicker">Tema ${group.numero}</span>
          <h2>${esc(group.title)}</h2>
          <p>${esc(group.blurb)}</p>
          <div class="subtopics">
            ${group.subtopics.map((sub) => `<button type="button" class="topic" data-action="open-lesson" data-subtopic="${sub.id}"><span>${esc(sub.title)}${state.progress.lessons[sub.id] ? "<small>Ya lo abriste</small>" : ""}</span><span aria-hidden="true">→</span></button>`).join("")}
          </div>
        </section>`).join("")}
      </div>`,
  });
}

function renderLesson(state) {
  const sub = findSubtopic(state.subtopicId);
  if (!sub) return renderTopics(state);
  const lesson = LESSONS[sub.id];
  const examples = lessonExamples(sub.id);
  return shell(state, {
    title: sub.short,
    back: "ensenanza",
    body: `<article class="card prose notebook" style="--topic:${sub.group.color}">
        <span class="kicker">${esc(sub.group.title)}</span>
        <h2>${esc(sub.title)}</h2>
        ${blocks(lesson.blocks)}
      </article>
      ${examples.map((example, index) => {
        const total = beatCount(viewBoard(example));
        const shown = state.lessonReveal[index] || 0;
        const done = shown >= total;
        return `<section class="card example notebook">
          <h3>Ejemplo ${index + 1}</h3>
          ${example.promptHtml}
          ${shown ? solutionHtml(example, shown) : ""}
          <div class="actions">
            ${done
              ? `<button type="button" class="ghost" data-action="lesson-reset" data-index="${index}">Ver de nuevo</button>`
              : `<button type="button" class="primary" data-action="lesson-step" data-index="${index}">Paso a paso</button><button type="button" class="ghost" data-action="lesson-all" data-index="${index}">Ver todo</button>`}
          </div>
        </section>`;
      }).join("")}
      <div class="actions"><button type="button" class="primary wide" data-action="start-practice" data-subtopic="${sub.id}">Practicar este tema</button></div>`,
  });
}

function renderPracticeHome(state) {
  return shell(state, {
    title: "Practicar",
    body: `<p class="lede">Elige un tema. Cada ejercicio es nuevo y la respuesta es exacta.</p>
      <div class="topic-list">
        ${CATALOG.map((group) => `<section class="card" style="--topic:${group.color}">
          <span class="kicker">Tema ${group.numero}</span>
          <h2>${esc(group.title)}</h2>
          <div class="subtopics">
            ${group.subtopics.map((sub) => {
              const stats = state.progress.practice[sub.id];
              const note = stats ? `<small>${stats.ok} aciertos · ${stats.bad} errores</small>` : `<small>${esc(sub.short)}</small>`;
              return `<button type="button" class="topic" data-action="start-practice" data-subtopic="${sub.id}"><span>${esc(sub.title)}${note}</span><span aria-hidden="true">→</span></button>`;
            }).join("")}
          </div>
        </section>`).join("")}
      </div>`,
  });
}

function renderPractice(state) {
  if (!state.practice) return renderPracticeHome(state);
  const practice = state.practice;
  const { problem, entry, hint, solution, status } = practice;
  const sub = findSubtopic(problem.subtopicId);
  let feedback = "";
  if (status === "ok") feedback = `<p class="feedback ok" role="status">Correcto. ${problem.answerHtml}</p>`;
  else if (status === "bad") feedback = `<p class="feedback bad" role="status">Todavía no. Puedes corregir e intentar de nuevo, o pedir una pista.</p>`;
  return shell(state, {
    title: sub ? sub.short : "Practicar",
    back: "practicar",
    body: `<article class="card" style="--topic:${sub ? sub.group.color : "var(--primary)"}">
        <span class="kicker">${esc(sub ? sub.group.title : "")}</span>
        ${problem.promptHtml}
      </article>
      <form class="card" id="answer-form" style="margin-top:0.8rem">
        <div class="segment">
          <button type="button" class="ghost" data-action="practice-mode" data-mode="rapida" aria-pressed="${practice.mode !== "pasos"}">Respuesta rápida</button>
          <button type="button" class="ghost" data-action="practice-mode" data-mode="pasos" aria-pressed="${practice.mode === "pasos"}">Paso a paso</button>
        </div>
        ${practice.mode === "pasos" ? stepHtml(practice) : answerControl(problem, entry)}
        ${practice.mode === "pasos" ? "" : feedback}
        ${hint ? `<p class="hint-box notebook"><strong>Pista.</strong> ${esc(problem.hint)}</p>` : ""}
        ${solution ? `<div class="answer-box"><strong>Solución.</strong> ${problem.answerHtml}${solutionHtml(problem, 99)}</div>` : ""}
        <div class="actions">
          ${practice.mode === "pasos" ? "" : `<button type="submit" class="primary">Comprobar</button>`}
          <button type="button" class="ghost" data-action="pizarra">Pizarra</button>
          <button type="button" class="ghost" data-action="hint">Pista</button>
          <button type="button" class="ghost" data-action="solution">Ver solución</button>
          ${status === "ok" || solution || practice.stepFinal ? `<button type="button" class="primary" data-action="next-practice">Siguiente ejercicio</button>` : ""}
        </div>
      </form>`,
  });
}

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function renderExamSetup(state) {
  const { groups, n } = state.examSetup;
  const seconds = n * 90;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return shell(state, {
    title: "Exámenes",
    body: `<section class="card">
        <h2>Arma tu examen</h2>
        <p>Sin pistas. Al final ves el puntaje, la solución de cada pregunta y los temas que conviene repasar.</p>
        <h3 style="margin-top:0.9rem">Temas</h3>
        <div class="checks">
          ${CATALOG.map((group) => `<button type="button" class="check ${groups.includes(group.id) ? "on" : ""}" style="--topic:${group.color}" data-action="toggle-group" data-group="${group.id}" aria-pressed="${groups.includes(group.id)}"><span><strong>${esc(group.title)}</strong><br><span class="fine">${esc(group.blurb)}</span></span></button>`).join("")}
        </div>
        <h3 style="margin-top:0.9rem">Preguntas</h3>
        <div class="segment">
          ${[5, 10, 15].map((value) => `<button type="button" class="ghost" data-action="set-n" data-n="${value}" aria-pressed="${n === value}">${value}</button>`).join("")}
        </div>
        <p class="fine">Tiempo: ${minutes}:${String(rest).padStart(2, "0")} (un minuto y medio por pregunta).</p>
        <div class="actions"><button type="button" class="primary wide" data-action="start-exam" ${groups.length ? "" : "disabled"}>Comenzar examen</button></div>
      </section>`,
  });
}

function renderExamRun(state) {
  const exam = state.exam;
  const question = exam.questions[exam.index];
  const sub = findSubtopic(question.subtopicId);
  const left = exam.durationMs - (Date.now() - exam.startedAt);
  const width = Math.round(((exam.index + 1) / exam.questions.length) * 100);
  return shell(state, {
    title: "Examen",
    extra: `<span id="timer" class="timer ${left < 60000 ? "urgent" : ""}" aria-live="polite">${formatTime(left)}</span>`,
    body: `<p class="kicker">Pregunta ${exam.index + 1} de ${exam.questions.length}${sub ? ` · ${esc(sub.title)}` : ""}</p>
      <div class="progress-track" aria-hidden="true"><span style="width:${width}%"></span></div>
      <article class="card">${question.promptHtml}</article>
      <form class="card" id="answer-form" style="margin-top:0.8rem">
        ${answerControl(question, exam.answers[exam.index])}
        <div class="actions">
          <button type="button" class="ghost" data-action="pizarra">Pizarra</button>
          <button type="button" class="ghost" data-action="exam-prev" ${exam.index === 0 ? "disabled" : ""}>Anterior</button>
          ${exam.index < exam.questions.length - 1
            ? `<button type="button" class="primary" data-action="exam-next">Siguiente</button>`
            : `<button type="button" class="primary" data-action="exam-finish">Terminar examen</button>`}
        </div>
        ${exam.index < exam.questions.length - 1 ? `<div class="actions"><button type="button" class="text-btn" data-action="exam-finish">Terminar ahora</button></div>` : ""}
      </form>
      <p class="fine">En el examen no hay pistas. Si el tiempo llega a cero, se califica solo.</p>`,
  });
}

function messageFor(percent) {
  if (percent === 100) return "Excelente. Resolviste todo.";
  if (percent >= 80) return "Muy bien. Repasa solo los detalles que fallaron.";
  if (percent >= 60) return "Buen intento. Con otro rato de práctica vas a subir.";
  return "Ánimo. Vuelve a la enseñanza de los temas marcados y practica un poco más.";
}

function renderResult(state) {
  const record = state.exam && state.exam.record;
  if (!record) return renderExamSetup(state);
  const percent = record.n ? Math.round((100 * record.correct) / record.n) : 0;
  const missed = record.missedSubtopics || [];
  return shell(state, {
    title: "Resultado",
    back: "examen",
    body: `<section class="card">
        <p class="kicker">${state.exam.reviewOnly ? "Examen guardado" : "Examen terminado"}</p>
        <p class="score">${record.correct}/${record.n}</p>
        <p>${percent}% · ${messageFor(percent)}</p>
        <p class="fine">Tiempo usado: ${Math.floor(record.secondsUsed / 60)}:${String(record.secondsUsed % 60).padStart(2, "0")}. Quedó guardado en este dispositivo.</p>
      </section>
      <section class="card" style="margin-top:0.8rem">
        <h2>Para repasar</h2>
        ${missed.length
          ? `<div class="subtopics">${missed.map((id) => {
              const sub = findSubtopic(id);
              if (!sub) return "";
              return `<button type="button" class="topic" data-action="open-lesson" data-subtopic="${id}"><span>${esc(sub.group.title)}<small>${esc(sub.title)}</small></span><span aria-hidden="true">→</span></button>`;
            }).join("")}</div>`
          : `<p>No hay temas pendientes de este examen.</p>`}
      </section>
      <section class="review">
        ${record.questions.map((question, index) => `<details ${index === 0 ? "open" : ""}>
          <summary><span class="tag ${question.ok ? "ok" : "bad"}">${question.ok ? "Bien" : "Revisar"}</span> Pregunta ${index + 1}</summary>
          ${question.promptHtml}
          <p><strong>Tu respuesta:</strong> ${esc(question.yours)}</p>
          <div class="answer-box"><strong>Solución.</strong> ${question.answerHtml}</div>
          ${solutionHtml(question, 99)}
        </details>`).join("")}
      </section>`,
  });
}

function renderProgress(state) {
  const when = (stamp) => {
    try {
      return new Date(stamp).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return "";
    }
  };
  return shell(state, {
    title: "Mi avance",
    body: `<section class="stack">
        ${CATALOG.map((group) => `<article class="card" style="--topic:${group.color}">
          <span class="kicker">Tema ${group.numero}</span>
          <h2>${esc(group.title)}</h2>
          ${group.subtopics.map((sub) => {
            const stats = state.progress.practice[sub.id] || { ok: 0, bad: 0 };
            const total = stats.ok + stats.bad;
            const pct = total ? Math.round((100 * stats.ok) / total) : 0;
            return `<div style="margin-top:0.7rem"><strong>${esc(sub.title)}</strong><div class="fine">${total ? `${stats.ok} de ${total} aciertos` : "Sin práctica todavía"}${state.progress.lessons[sub.id] ? " · lección vista" : ""}</div><div class="bar"><span style="width:${pct}%"></span></div></div>`;
          }).join("")}
        </article>`).join("")}
        <article class="card">
          <h2>Historial de exámenes</h2>
          ${state.progress.exams.length
            ? `<div class="subtopics">${state.progress.exams.map((exam, index) => `<button type="button" class="topic" data-action="open-history" data-index="${index}"><span>${when(exam.at)}<small>${exam.correct}/${exam.n} · ${exam.missedSubtopics && exam.missedSubtopics.length ? "hay temas por repasar" : "sin pendientes"}</small></span><span aria-hidden="true">→</span></button>`).join("")}</div>`
            : `<p>Todavía no haces un examen. Cuando termines uno, aparecerá aquí.</p>`}
        </article>
        <article class="card">
          <h2>Borrar progreso</h2>
          <p>Solo se guarda en este aparato: aciertos, lecciones abiertas y exámenes. No hay cuenta ni datos personales.</p>
          ${state.confirmReset
            ? `<p class="feedback bad">¿Seguro? Esta acción no se puede deshacer.</p><div class="actions"><button type="button" class="ghost" data-action="reset-cancel">Cancelar</button><button type="button" class="primary danger" data-action="reset-progress">Borrar mi progreso</button></div>`
            : `<div class="actions"><button type="button" class="ghost danger" data-action="reset-ask">Borrar mi progreso</button></div>`}
        </article>
      </section>`,
  });
}

export function render(state) {
  if (state.view === "ensenanza") return renderTopics(state);
  if (state.view === "leccion") return renderLesson(state);
  if (state.view === "practicar") return renderPractice(state);
  if (state.view === "examen") return renderExamSetup(state);
  if (state.view === "examen-curso" && state.exam && !state.exam.record) return renderExamRun(state);
  if (state.view === "examen-resultado") return renderResult(state);
  if (state.view === "avance") return renderProgress(state);
  return renderHome(state);
}

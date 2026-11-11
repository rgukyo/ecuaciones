/** Arranque, navegación y guardado local. */

import { findSubtopic } from "./catalog.js";
import { render } from "./render.js";
import { createState, loadProgress, reduce, saveProgress } from "./state.js";
import { mountPizarra } from "./pizarra.js";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function hashFor(state) {
  if (state.view === "leccion" && state.subtopicId) return `#/aprender/${state.subtopicId}`;
  if (state.view === "practicar" && state.practice) return `#/practicar/${state.practice.problem.subtopicId}`;
  if (state.view === "practicar") return "#/practicar";
  if (state.view === "ensenanza") return "#/aprender";
  if (state.view === "examen" || state.view === "examen-curso" || state.view === "examen-resultado") return "#/examen";
  if (state.view === "avance") return "#/avance";
  return "#/";
}

function actionFromHash(hash) {
  const [head, id] = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (head === "aprender" && id && findSubtopic(id)) return { type: "open-lesson", subtopicId: id };
  if (head === "aprender") return { type: "nav", view: "ensenanza" };
  if (head === "practicar" && id && findSubtopic(id)) {
    return { type: "start-practice", subtopicId: id, seed: (Math.floor(Math.random() * 1_000_000_000) + 1) >>> 0 };
  }
  if (head === "practicar") return { type: "nav", view: "practicar" };
  if (head === "examen") return { type: "nav", view: "examen" };
  if (head === "avance") return { type: "nav", view: "avance" };
  return { type: "nav", view: "inicio" };
}

export function boot(doc = document, storage = typeof localStorage !== "undefined" ? localStorage : memoryStorage()) {
  const root = doc.getElementById("app");
  const pizarra = doc.getElementById("pizarra");
  const board = pizarra ? mountPizarra(pizarra) : null;
  let state = createState(loadProgress(storage));
  let progressRef = state.progress;
  let focusKey = "";

  function readEntry(problem) {
    if (!problem) return "";
    if (problem.kind === "discriminant") {
      return {
        d: root.querySelector("#discriminante")?.value ?? "",
        nature: root.querySelector('input[name="nature"]:checked')?.value ?? "",
      };
    }
    return root.querySelector("#respuesta")?.value ?? "";
  }

  function draw() {
    const y = doc.defaultView ? doc.defaultView.scrollY : 0;
    root.innerHTML = render(state);
    const practiceSeed = state.practice ? state.practice.problem.seed : "";
    const examIndex = state.exam && !state.exam.record ? state.exam.index : "";
    const key = `${state.view}:${state.subtopicId || ""}:${practiceSeed}:${examIndex}`;
    if (key !== focusKey) {
      focusKey = key;
      doc.defaultView?.scrollTo(0, 0);
      const field = root.querySelector("#respuesta") || root.querySelector("#discriminante");
      if (field && (state.view === "practicar" || state.view === "examen-curso")) field.focus();
    } else {
      doc.defaultView?.scrollTo(0, y);
    }
  }

  function dispatch(action) {
    state = reduce(state, action);
    if (state.progress !== progressRef) {
      progressRef = state.progress;
      saveProgress(storage, state.progress);
    }
    if (!action.keepHash && doc.defaultView) {
      const next = hashFor(state);
      if (doc.defaultView.location.hash !== next) {
        doc.defaultView.history.replaceState(null, "", next);
      }
    }
    draw();
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || !root.contains(button)) return;
    const name = button.dataset.action;
    if (name === "pizarra") {
      board?.open();
      return;
    }
    if (name === "nav") dispatch({ type: "nav", view: button.dataset.view });
    else if (name === "open-lesson") dispatch({ type: "open-lesson", subtopicId: button.dataset.subtopic });
    else if (name === "start-practice") {
      dispatch({
        type: "start-practice",
        subtopicId: button.dataset.subtopic,
        seed: (Math.floor(Math.random() * 1_000_000_000) + 1) >>> 0,
      });
    } else if (name === "lesson-step") dispatch({ type: "lesson-step", index: Number(button.dataset.index) });
    else if (name === "lesson-all") dispatch({ type: "lesson-all", index: Number(button.dataset.index) });
    else if (name === "lesson-reset") dispatch({ type: "lesson-reset", index: Number(button.dataset.index) });
    else if (name === "hint") dispatch({ type: "practice-hint", entry: readEntry(state.practice?.problem) });
    else if (name === "solution") dispatch({ type: "practice-solution", entry: readEntry(state.practice?.problem) });
    else if (name === "next-practice") {
      dispatch({
        type: "start-practice",
        subtopicId: state.subtopicId,
        seed: (Math.floor(Math.random() * 1_000_000_000) + 1) >>> 0,
      });
    } else if (name === "toggle-group") dispatch({ type: "toggle-group", groupId: button.dataset.group });
    else if (name === "set-n") dispatch({ type: "set-n", n: Number(button.dataset.n) });
    else if (name === "start-exam") {
      dispatch({ type: "start-exam", seed: (Math.floor(Math.random() * 1_000_000_000) + 1) >>> 0, now: Date.now() });
    } else if (name === "exam-prev" || name === "exam-next") {
      const question = state.exam.questions[state.exam.index];
      dispatch({ type: "exam-move", dir: name === "exam-next" ? 1 : -1, entry: readEntry(question) });
    } else if (name === "exam-finish") {
      const question = state.exam.questions[state.exam.index];
      dispatch({ type: "exam-finish", now: Date.now(), entry: readEntry(question) });
    } else if (name === "open-history") dispatch({ type: "open-history", index: Number(button.dataset.index) });
    else if (name === "reset-ask") dispatch({ type: "reset-ask" });
    else if (name === "reset-cancel") dispatch({ type: "reset-cancel" });
    else if (name === "reset-progress") dispatch({ type: "reset-progress" });
    else if (name === "practice-mode") dispatch({ type: "practice-mode", mode: button.dataset.mode });
    else if (name === "step-key") dispatch({ type: "step-key", key: button.dataset.key });
    else if (name === "step-back") dispatch({ type: "step-back" });
    else if (name === "step-clear") dispatch({ type: "step-clear" });
    else if (name === "step-check") dispatch({ type: "step-check" });
  });

  root.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof doc.defaultView.HTMLFormElement) && form?.id !== "answer-form") return;
    if (form.id !== "answer-form") return;
    event.preventDefault();
    if (state.view === "practicar" && state.practice) {
      dispatch({ type: "practice-check", entry: readEntry(state.practice.problem) });
    }
  });

  doc.defaultView?.addEventListener("hashchange", () => {
    const next = hashFor(state);
    if (doc.defaultView.location.hash === next) return;
    dispatch({ ...actionFromHash(doc.defaultView.location.hash), keepHash: true });
  });

  doc.defaultView?.setInterval(() => {
    if (state.view !== "examen-curso" || !state.exam || state.exam.record) return;
    const left = state.exam.durationMs - (Date.now() - state.exam.startedAt);
    const timer = root.querySelector("#timer");
    if (timer) {
      timer.textContent = formatClock(left);
      timer.classList.toggle("urgent", left < 60000);
    }
    if (left <= 0) {
      const question = state.exam.questions[state.exam.index];
      dispatch({ type: "exam-finish", now: Date.now(), entry: readEntry(question) });
    }
  }, 400);

  if (doc.defaultView && doc.defaultView.location.hash && doc.defaultView.location.hash !== "#/") {
    dispatch({ ...actionFromHash(doc.defaultView.location.hash), keepHash: true });
  } else {
    draw();
    if (doc.defaultView && doc.defaultView.location.hash !== "#/") {
      doc.defaultView.history.replaceState(null, "", "#/");
    }
  }
  return { getState: () => state, dispatch };
}

if (typeof document !== "undefined") {
  boot();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

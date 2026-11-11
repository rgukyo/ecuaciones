/** Estado de la app y avance guardado solo en el dispositivo. */

import { CATALOG, findSubtopic } from "./catalog.js";
import { grade, yoursText } from "./grade.js";
import { generateProblem } from "./generators.js";
import { makeRng } from "./frac.js";
import { checkLine, lineDone } from "./pasos.js";

export const STORAGE_KEY = "ecuaciones.progreso.v1";

export function emptyProgress() {
  return { practice: {}, lessons: {}, exams: [] };
}

export function normalizeProgress(raw) {
  if (!raw || typeof raw !== "object") return emptyProgress();
  const practice = {};
  if (raw.practice && typeof raw.practice === "object") {
    for (const [id, stats] of Object.entries(raw.practice)) {
      if (!findSubtopic(id) || !stats) continue;
      practice[id] = {
        ok: Math.max(0, Number(stats.ok) || 0),
        bad: Math.max(0, Number(stats.bad) || 0),
      };
    }
  }
  const lessons = {};
  if (raw.lessons && typeof raw.lessons === "object") {
    for (const id of Object.keys(raw.lessons)) {
      if (findSubtopic(id) && raw.lessons[id]) lessons[id] = true;
    }
  }
  const exams = Array.isArray(raw.exams) ? raw.exams.filter((item) => item && typeof item === "object").slice(0, 30) : [];
  return { practice, lessons, exams };
}

export function loadProgress(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(storage, progress) {
  storage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function createState(progress = emptyProgress()) {
  return {
    view: "inicio",
    subtopicId: null,
    lessonReveal: [0, 0, 0],
    practice: null,
    examSetup: { groups: CATALOG.map((group) => group.id), n: 5 },
    exam: null,
    progress: normalizeProgress(progress),
    confirmReset: false,
  };
}

function recordPractice(progress, id, ok) {
  const prev = progress.practice[id] || { ok: 0, bad: 0 };
  return {
    ...progress,
    practice: {
      ...progress.practice,
      [id]: ok ? { ok: prev.ok + 1, bad: prev.bad } : { ok: prev.ok, bad: prev.bad + 1 },
    },
  };
}

export function buildExam(groupIds, n, seed) {
  const ids = CATALOG.filter((group) => groupIds.includes(group.id)).flatMap((group) =>
    group.subtopics.map((sub) => sub.id)
  );
  if (!ids.length) return [];
  const rng = makeRng(seed >>> 0 || 1);
  const questions = [];
  for (let i = 0; i < n; i += 1) {
    const id = ids[rng.int(0, ids.length - 1)];
    questions.push(generateProblem(id, rng.int(1, 1_000_000_000)));
  }
  return questions;
}

function blankAnswers(questions) {
  return questions.map((question) => (question.kind === "discriminant" ? { d: "", nature: "" } : ""));
}

export function reduce(state, action) {
  switch (action.type) {
    case "nav":
      return {
        ...state,
        view: action.view,
        confirmReset: false,
        practice: action.view === "practicar" ? null : state.practice,
      };
    case "open-lesson": {
      if (!findSubtopic(action.subtopicId)) return state;
      return {
        ...state,
        view: "leccion",
        subtopicId: action.subtopicId,
        lessonReveal: [0, 0, 0],
        confirmReset: false,
        progress: {
          ...state.progress,
          lessons: { ...state.progress.lessons, [action.subtopicId]: true },
        },
      };
    }
    case "lesson-step": {
      const reveal = state.lessonReveal.slice();
      const index = action.index;
      reveal[index] = (reveal[index] || 0) + 1;
      return { ...state, lessonReveal: reveal };
    }
    case "lesson-all": {
      const reveal = state.lessonReveal.slice();
      reveal[action.index] = 99;
      return { ...state, lessonReveal: reveal };
    }
    case "lesson-reset": {
      const reveal = state.lessonReveal.slice();
      reveal[action.index] = 0;
      return { ...state, lessonReveal: reveal };
    }
    case "start-practice": {
      if (!findSubtopic(action.subtopicId)) return state;
      return {
        ...state,
        view: "practicar",
        subtopicId: action.subtopicId,
        confirmReset: false,
        practice: {
          problem: generateProblem(action.subtopicId, action.seed >>> 0 || 1),
          entry: null,
          hint: false,
          solution: false,
          status: null,
          counted: false,
          mode: "rapida",
          stepDraft: "",
          stepLines: [],
          stepNote: null,
          stepFinal: false,
        },
      };
    }
    case "practice-hint":
      if (!state.practice) return state;
      return { ...state, practice: { ...state.practice, hint: true, entry: action.entry } };
    case "practice-solution": {
      if (!state.practice) return state;
      let progress = state.progress;
      let counted = state.practice.counted;
      if (!counted) {
        progress = recordPractice(progress, state.practice.problem.subtopicId, false);
        counted = true;
      }
      return {
        ...state,
        progress,
        practice: { ...state.practice, solution: true, counted, entry: action.entry },
      };
    }
    case "practice-mode":
      if (!state.practice) return state;
      return { ...state, practice: { ...state.practice, mode: action.mode === "pasos" ? "pasos" : "rapida" } };
    case "step-key": {
      if (!state.practice) return state;
      const stepDraft = `${state.practice.stepDraft}${action.key}`.slice(0, 80);
      return { ...state, practice: { ...state.practice, stepDraft, stepNote: null } };
    }
    case "step-back": {
      if (!state.practice) return state;
      const chars = [...state.practice.stepDraft];
      chars.pop();
      return { ...state, practice: { ...state.practice, stepDraft: chars.join("") } };
    }
    case "step-clear":
      if (!state.practice) return state;
      return { ...state, practice: { ...state.practice, stepDraft: "", stepNote: null } };
    case "step-check": {
      if (!state.practice) return state;
      const result = checkLine(state.practice.problem, state.practice.stepDraft);
      if (!result.ok) {
        return { ...state, practice: { ...state.practice, stepNote: result } };
      }
      const stepLines = [
        ...state.practice.stepLines,
        { text: state.practice.stepDraft, final: Boolean(result.final), assign: result.assign || null },
      ];
      const stepFinal = Boolean(result.final) || lineDone(state.practice.problem, stepLines);
      let progress = state.progress;
      let counted = state.practice.counted;
      if (stepFinal && !counted) {
        progress = recordPractice(progress, state.practice.problem.subtopicId, true);
        counted = true;
      }
      return {
        ...state,
        progress,
        practice: {
          ...state.practice,
          stepLines,
          stepDraft: "",
          stepNote: { ok: true, message: "Correcto.", hint: "" },
          stepFinal,
          counted,
          status: stepFinal ? "ok" : state.practice.status,
        },
      };
    }
    case "practice-check": {
      if (!state.practice) return state;
      const ok = grade(state.practice.problem, action.entry).ok;
      let progress = state.progress;
      let counted = state.practice.counted;
      if (!counted) {
        progress = recordPractice(progress, state.practice.problem.subtopicId, ok);
        counted = true;
      }
      return {
        ...state,
        progress,
        practice: { ...state.practice, status: ok ? "ok" : "bad", counted, entry: action.entry },
      };
    }
    case "toggle-group": {
      const groups = state.examSetup.groups.includes(action.groupId)
        ? state.examSetup.groups.filter((id) => id !== action.groupId)
        : [...state.examSetup.groups, action.groupId];
      return { ...state, examSetup: { ...state.examSetup, groups } };
    }
    case "set-n": {
      const n = [5, 10, 15].includes(action.n) ? action.n : 5;
      return { ...state, examSetup: { ...state.examSetup, n } };
    }
    case "start-exam": {
      const n = [5, 10, 15].includes(state.examSetup.n) ? state.examSetup.n : 5;
      const questions = buildExam(state.examSetup.groups, n, action.seed >>> 0 || 1);
      if (!questions.length) return state;
      return {
        ...state,
        view: "examen-curso",
        confirmReset: false,
        exam: {
          groups: state.examSetup.groups.slice(),
          questions,
          index: 0,
          answers: blankAnswers(questions),
          startedAt: action.now ?? Date.now(),
          durationMs: n * 90 * 1000,
          record: null,
        },
      };
    }
    case "exam-move": {
      if (!state.exam || state.exam.record) return state;
      const answers = state.exam.answers.slice();
      answers[state.exam.index] = action.entry;
      const last = answers.length - 1;
      const index = Math.max(0, Math.min(last, state.exam.index + action.dir));
      return { ...state, exam: { ...state.exam, answers, index } };
    }
    case "exam-finish": {
      if (!state.exam || state.exam.record) return state;
      const answers = state.exam.answers.slice();
      if (action.entry !== undefined) answers[state.exam.index] = action.entry;
      const now = action.now ?? Date.now();
      const detail = state.exam.questions.map((question, index) => {
        const entry = answers[index];
        const ok = grade(question, entry).ok;
        return {
          subtopicId: question.subtopicId,
          promptHtml: question.promptHtml,
          steps: question.steps,
          board: question.board || null,
          answerHtml: question.answerHtml,
          ok,
          yours: yoursText(entry, question.kind),
        };
      });
      const correct = detail.filter((item) => item.ok).length;
      const missedSubtopics = [...new Set(detail.filter((item) => !item.ok).map((item) => item.subtopicId))];
      const record = {
        at: now,
        n: detail.length,
        correct,
        groups: state.exam.groups,
        missedSubtopics,
        secondsUsed: Math.max(0, Math.min(Math.round(state.exam.durationMs / 1000), Math.round((now - state.exam.startedAt) / 1000))),
        questions: detail,
      };
      return {
        ...state,
        view: "examen-resultado",
        exam: { ...state.exam, answers, record },
        progress: { ...state.progress, exams: [record, ...state.progress.exams].slice(0, 30) },
      };
    }
    case "open-history": {
      const record = state.progress.exams[action.index];
      if (!record) return state;
      return { ...state, view: "examen-resultado", exam: { record, reviewOnly: true }, confirmReset: false };
    }
    case "reset-ask":
      return { ...state, confirmReset: true };
    case "reset-cancel":
      return { ...state, confirmReset: false };
    case "reset-progress":
      return { ...state, confirmReset: false, progress: emptyProgress() };
    default:
      return state;
  }
}

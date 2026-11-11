/** Hoja para escribir el ejercicio a mano. No se califica. */

const COLORS = [
  { name: "Negro", value: "#243044" },
  { name: "Azul", value: "#1554b0" },
  { name: "Rojo", value: "#b71c1c" },
  { name: "Verde", value: "#1b7f4e" },
];

export function mountPizarra(host) {
  host.innerHTML = `<header class="pizarra-bar">
      <div class="pizarra-titulo">
        <strong>Pizarra</strong>
        <span class="fine">Para trabajar a mano. No se califica.</span>
      </div>
      <button type="button" class="ghost" data-pz="close">Cerrar</button>
    </header>
    <p class="pizarra-eq" id="pizarra-eq">Ejemplo para practicar: 3x + 5 = 20</p>
    <canvas class="pizarra-lienzo"></canvas>
    <div class="pizarra-confirm" hidden>
      <p>¿Borrar toda la hoja?</p>
      <button type="button" class="primary" data-pz="clear-yes">Sí, borrar</button>
      <button type="button" class="ghost" data-pz="clear-no">Cancelar</button>
    </div>
    <div class="pizarra-tools" role="toolbar" aria-label="Herramientas de la pizarra">
      ${COLORS.map(
        (color, index) =>
          `<button type="button" class="tool color ${index === 0 ? "on" : ""}" data-pz="color" data-value="${color.value}" aria-pressed="${index === 0}" aria-label="${color.name}"><span class="dot" style="background:${color.value}"></span>${color.name}</button>`
      ).join("")}
      <button type="button" class="tool on" data-pz="size" data-value="4" aria-pressed="true">Fino</button>
      <button type="button" class="tool" data-pz="size" data-value="12" aria-pressed="false">Grueso</button>
      <button type="button" class="tool" data-pz="eraser" aria-pressed="false">Borrador</button>
      <button type="button" class="tool" data-pz="undo">Deshacer</button>
      <button type="button" class="tool danger-text" data-pz="clear-ask">Borrar todo</button>
    </div>`;

  const canvas = host.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const equation = host.querySelector("#pizarra-eq");
  const confirm = host.querySelector(".pizarra-confirm");
  const strokes = [];
  let current = null;
  let activePointer = null;
  let color = COLORS[0].value;
  let width = 4;
  let eraser = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    redraw();
  }

  function redraw() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokes) paint(stroke);
    if (current) paint(current);
  }

  function paint(stroke) {
    if (!stroke.points.length) return;
    ctx.save();
    ctx.globalCompositeOperation = stroke.eraser ? "destination-out" : "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    if (stroke.points.length === 1) {
      ctx.lineTo(stroke.points[0].x + 0.2, stroke.points[0].y + 0.2);
    } else {
      for (const point of stroke.points.slice(1)) ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function pointOf(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function isPalm(event) {
    return event.pointerType === "touch" && Math.max(event.width || 0, event.height || 0) > 42;
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (isPalm(event) || activePointer !== null) return;
    event.preventDefault();
    activePointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    current = {
      color,
      width: eraser ? Math.max(width * 3, 22) : width,
      eraser,
      points: [pointOf(event)],
    };
    redraw();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!current || event.pointerId !== activePointer) return;
    event.preventDefault();
    current.points.push(pointOf(event));
    redraw();
  });
  function endStroke(event) {
    if (!current || event.pointerId !== activePointer) return;
    event.preventDefault();
    strokes.push(current);
    current = null;
    activePointer = null;
    redraw();
  }
  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointercancel", endStroke);

  function markTools() {
    host.querySelectorAll("[data-pz='color']").forEach((button) => {
      const on = !eraser && button.dataset.value === color;
      button.classList.toggle("on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
    host.querySelectorAll("[data-pz='size']").forEach((button) => {
      const on = !eraser && Number(button.dataset.value) === width;
      button.classList.toggle("on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const eraserButton = host.querySelector("[data-pz='eraser']");
    eraserButton.classList.toggle("on", eraser);
    eraserButton.setAttribute("aria-pressed", eraser ? "true" : "false");
  }

  host.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pz]");
    if (!button) return;
    const kind = button.dataset.pz;
    if (kind === "close") {
      host.hidden = true;
      document.body.classList.remove("pizarra-abierta");
      confirm.hidden = true;
      return;
    }
    if (kind === "color") {
      color = button.dataset.value;
      eraser = false;
      markTools();
    } else if (kind === "size") {
      width = Number(button.dataset.value);
      eraser = false;
      markTools();
    } else if (kind === "eraser") {
      eraser = true;
      markTools();
    } else if (kind === "undo") {
      strokes.pop();
      redraw();
    } else if (kind === "clear-ask") {
      confirm.hidden = false;
    } else if (kind === "clear-no") {
      confirm.hidden = true;
    } else if (kind === "clear-yes") {
      strokes.length = 0;
      current = null;
      confirm.hidden = true;
      redraw();
    }
  });

  window.addEventListener("resize", () => {
    if (!host.hidden) resize();
  });

  return {
    open(text) {
      equation.textContent = text || "No hay un ejercicio abierto. Ejemplo: 3x + 5 = 20";
      confirm.hidden = true;
      host.hidden = false;
      document.body.classList.add("pizarra-abierta");
      resize();
    },
  };
}

export function exerciseCaption(problem) {
  if (!problem || !problem.promptHtml) return "";
  const html = String(problem.promptHtml);
  const math = html.match(/class="math-lg[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  const raw = math ? math[1] : html.replace(/<p class="fine">[\s\S]*?<\/p>/g, "");
  const text = raw
    .replace(/<span class="frac">\s*<span class="n">([^<]*)<\/span>\s*<span class="d">([^<]*)<\/span>\s*<\/span>/g, "$1/$2")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 220);
}

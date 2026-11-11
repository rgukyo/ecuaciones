/** Hoja para escribir con el dedo o el mouse. No se califica. */

export function mountPizarra(host) {
  host.innerHTML = `<div class="pizarra-bar">
      <strong>Pizarra</strong>
      <span class="fine">Para trabajar a mano. No se califica.</span>
      <button type="button" class="ghost" data-pz="close">Cerrar</button>
    </div>
    <canvas class="pizarra-lienzo"></canvas>
    <div class="pizarra-tools">
      <button type="button" class="swatch on" data-pz="color" data-value="#243044" style="background:#243044" aria-label="Tinta"></button>
      <button type="button" class="swatch" data-pz="color" data-value="#1554b0" style="background:#1554b0" aria-label="Azul"></button>
      <button type="button" class="swatch" data-pz="color" data-value="#b71c1c" style="background:#b71c1c" aria-label="Rojo"></button>
      <button type="button" class="swatch" data-pz="color" data-value="#1b7f4e" style="background:#1b7f4e" aria-label="Verde"></button>
      <button type="button" class="ghost" data-pz="size" data-value="3">Fino</button>
      <button type="button" class="ghost" data-pz="size" data-value="7">Medio</button>
      <button type="button" class="ghost" data-pz="size" data-value="14">Grueso</button>
      <button type="button" class="ghost" data-pz="eraser">Borrador</button>
      <button type="button" class="ghost" data-pz="undo">Deshacer</button>
      <button type="button" class="ghost" data-pz="clear">Limpiar</button>
    </div>`;
  const canvas = host.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const strokes = [];
  let current = null;
  let color = "#243044";
  let width = 7;
  let eraser = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
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
    if (stroke.points.length < 1) return;
    ctx.save();
    ctx.globalCompositeOperation = stroke.eraser ? "destination-out" : "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (const point of stroke.points.slice(1)) ctx.lineTo(point.x, point.y);
    if (stroke.points.length === 1) ctx.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y);
    ctx.stroke();
    ctx.restore();
  }

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    current = { color, width: eraser ? width * 2 : width, eraser, points: [point(event)] };
    redraw();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!current) return;
    event.preventDefault();
    current.points.push(point(event));
    redraw();
  });
  function endStroke(event) {
    if (!current) return;
    event.preventDefault();
    strokes.push(current);
    current = null;
    redraw();
  }
  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointercancel", endStroke);

  host.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pz]");
    if (!button) return;
    const kind = button.dataset.pz;
    if (kind === "close") {
      host.hidden = true;
      return;
    }
    if (kind === "color") {
      color = button.dataset.value;
      eraser = false;
      host.querySelectorAll(".swatch").forEach((item) => item.classList.toggle("on", item === button));
    } else if (kind === "size") {
      width = Number(button.dataset.value);
    } else if (kind === "eraser") {
      eraser = true;
    } else if (kind === "undo") {
      strokes.pop();
      redraw();
    } else if (kind === "clear") {
      strokes.length = 0;
      redraw();
    }
  });

  window.addEventListener("resize", () => {
    if (!host.hidden) resize();
  });

  return {
    open() {
      host.hidden = false;
      resize();
    },
  };
}

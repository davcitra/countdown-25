import { createEngine } from "../_shared/engine.js";
import Fleur from "./fleur.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;

let flower = null;

// Mouse tracking for slicing
let isMouseDown = false;
let mouseStartX = 0;
let mouseStartY = 0;
let mouseCurrentX = 0;
let mouseCurrentY = 0;
let slicePath = [];

run(display);

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mouseleave", handleMouseUp);

function handleMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  mouseStartX = (e.clientX - rect.left) * scaleX;
  mouseStartY = (e.clientY - rect.top) * scaleY;
  mouseCurrentX = mouseStartX;
  mouseCurrentY = mouseStartY;
  isMouseDown = true;
  slicePath = [{ x: mouseStartX, y: mouseStartY }];
}

function handleMouseMove(e) {
  if (isMouseDown) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    mouseCurrentX = (e.clientX - rect.left) * scaleX;
    mouseCurrentY = (e.clientY - rect.top) * scaleY;
    slicePath.push({ x: mouseCurrentX, y: mouseCurrentY });
  }
}

function handleMouseUp(e) {
  if (isMouseDown && flower) {
    for (let i = 0; i < slicePath.length - 1; i++) {
      const start = slicePath[i];
      const end = slicePath[i + 1];
      flower.checkSlice(start.x, start.y, end.x, end.y);
    }
  }

  isMouseDown = false;
  slicePath = [];
}

function display(dt) {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const size = canvas.height * 0.8;

  if (flower === null) {
    flower = new Fleur(
      canvas.width / 2,
      canvas.height / 2 + (canvas.height - size) / 2,
      size
    );
    console.log("flower created");
  }

  flower.update(canvas.height);
  flower.draw(ctx);

  // Draw slice path while dragging
  if (isMouseDown && slicePath.length > 1 && !flower.gardeningComplete) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(slicePath[0].x, slicePath[0].y);
    for (let i = 1; i < slicePath.length; i++) {
      ctx.lineTo(slicePath[i].x, slicePath[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

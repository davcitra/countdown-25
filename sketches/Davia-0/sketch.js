import { createEngine } from "../_shared/engine.js";
import { createSpringSettings, Spring } from "../_shared/spring.js";
import SVG from "./svgManager.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;

// Initialize SVG manager with renderer
const svg = new SVG(renderer);
let finished = false;

// Animation configuration
const SPEED = 0.03;
const BASE_AMPLITUDE = 1920 / 16; // Based on original SVG width

// Animation state
let time = 0;
let angle = 90; // Start at initialization state (90 degrees)
let rotation = Math.PI / 2; // Start at initialization state (PI/2)

// Drag state
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartRotation = 0;

// Load SVGs
svg.loadAll();

run(display);

// Mouse event handlers
canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mouseleave", handleMouseUp);

function handleMouseDown(e) {
  if (!svg.loaded) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  dragStartX = (e.clientX - rect.left) * scaleX;
  dragStartY = (e.clientY - rect.top) * scaleY;
  dragStartRotation = rotation;

  isDragging = true;
}

function handleMouseMove(e) {
  if (!isDragging || !svg.loaded) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const currentX = (e.clientX - rect.left) * scaleX;
  const currentY = (e.clientY - rect.top) * scaleY;

  // Calculate vectors from rotation center to start and current positions
  const startDx = dragStartX - svg.rotationCenterX;
  const startDy = dragStartY - svg.rotationCenterY;
  const currentDx = currentX - svg.rotationCenterX;
  const currentDy = currentY - svg.rotationCenterY;

  // Calculate angles
  const startAngle = Math.atan2(startDy, startDx);
  const currentAngle = Math.atan2(currentDy, currentDx);

  // Calculate the angular difference (handles wrapping correctly)
  let angleDelta = currentAngle - startAngle;

  // Normalize angle delta to be between -PI and PI
  if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
  if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;

  // Calculate new rotation
  rotation = dragStartRotation + angleDelta;

  // Clamp rotation between 0 and PI/2
  rotation = Math.max(0, Math.min(Math.PI / 2, rotation));

  // Update angle to match rotation
  angle = (rotation / (Math.PI / 2)) * 90;
}

function handleMouseUp() {
  isDragging = false;
}

function display() {
  // Clear canvas with black background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!svg.loaded) return;

  // Calculate amplitude scaled to match SVG scale
  const AMPLITUDE = BASE_AMPLITUDE * svg.scale;

  // Convert angle to radians for offset calculations
  const angleRad = (angle * Math.PI) / 180;

  // Calculate offsets based on angle:
  // bdroite: angle=0 -> min position (-AMPLITUDE), angle=90 -> initial position (0)
  const bdroiteOffsetY = -AMPLITUDE + Math.sin(angleRad) * AMPLITUDE;

  // bgauche: angle=0 -> initial position (0), angle=90 -> min position (-AMPLITUDE)
  const bgaucheOffsetX = -Math.sin(angleRad) * AMPLITUDE;

  // Draw SVGs with offsets and rotation
  svg.draw(bgaucheOffsetX, bdroiteOffsetY, rotation);

  // Increment time for animation
  time++;

  if (finished) {
    finish();
  }
}

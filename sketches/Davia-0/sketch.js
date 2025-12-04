import { createEngine } from "../_shared/engine.js";
import { createSpringSettings, Spring } from "../_shared/spring.js";
import SVG from "./svgManager.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;

// Initialize SVG manager with renderer
const svg = new SVG(renderer);
let finished = false;

// Animation configuration - MODIFY THESE VALUES
const AMPLITUDE_SCALE = 1 / 9; // Amplitude as a proportion of canvas height (1/9 of canvas height)
const SPEED = 0.03; // Speed of the sine wave animation
// const AMPLITUDE = canvas.height / 9;
const AMPLITUDE = canvas.width / 16;

// Animation state
let time = 0;
let angle = 0; // Angle variable controlled by rotation
let rotation = 0; // Rotation variable controlled by mouse (0 to PI/2)

// Position tracking
let positionsLogged = false;

// Load SVGs
svg.loadAll();

run(display);

function display() {
  // Clear canvas with white background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Get mouse position using canvas event listeners
  const mouseX = input.mouseX !== undefined ? input.mouseX : canvas.width;

  // Map mouseX to rotation (mouseX=0 -> rotation=PI/2, mouseX=max -> rotation=0)
  rotation = ((canvas.width - mouseX) / canvas.width) * (Math.PI / 2);
  rotation = Math.max(0, Math.min(Math.PI / 2, rotation)); // Clamp between 0 and PI/2

  // Map rotation to angle (rotation at max PI/2 -> angle=90, rotation=0 -> angle=0)
  angle = (rotation / (Math.PI / 2)) * 90;

  // Convert angle to radians for offset calculations
  const angleRad = (angle * Math.PI) / 180;

  // Calculate offsets based on angle:
  // bdroite: angle=0 -> min position (-AMPLITUDE), angle=90 -> initial position (0)
  const bdroiteOffsetY = -AMPLITUDE + Math.sin(angleRad) * AMPLITUDE;

  // bgauche: angle=0 -> initial position (0), angle=90 -> min position (-AMPLITUDE)
  const bgaucheOffsetX = -Math.sin(angleRad) * AMPLITUDE;

  // Draw SVGs with offsets and rotation
  svg.draw(bgaucheOffsetX, bdroiteOffsetY, rotation);

  // Log positions once when loaded
  if (svg.loaded && !positionsLogged) {
    const scale = svg.scale;
    const bgaucheCenter = {
      x: svg.elementBounds.bgauche.x + svg.elementBounds.bgauche.width / 2,
      y: svg.elementBounds.bgauche.y + svg.elementBounds.bgauche.height / 2,
    };
    const bdroiteCenter = {
      x: svg.elementBounds.bdroite.x + svg.elementBounds.bdroite.width / 2,
      y: svg.elementBounds.bdroite.y + svg.elementBounds.bdroite.height / 2,
    };
    const cercleCenter = {
      x: svg.elementBounds.cercle.x + svg.elementBounds.cercle.width / 2,
      y: svg.elementBounds.cercle.y + svg.elementBounds.cercle.height / 2,
    };

    // Calculate scaled positions
    const bgaucheScaledX = bgaucheCenter.x * scale;
    const bdroiteScaledY = bdroiteCenter.y * scale + svg.offsetY;

    // console.log("=== RESPONSIVE SCALE INFO ===");
    // console.log(`Canvas Width: ${canvas.width}px`);
    // console.log(`Canvas Height: ${canvas.height}px`);
    // console.log(`SVG Scale Factor: ${scale.toFixed(4)}`);
    // console.log(
    //   `Amplitude Scale: ${AMPLITUDE_SCALE.toFixed(4)} (${(
    //     AMPLITUDE_SCALE * 100
    //   ).toFixed(2)}% of canvas height)`
    // );
    // console.log(`Calculated Amplitude: ${AMPLITUDE.toFixed(2)}px`);

    // console.log("\n=== BGAUCHE (horizontal movement) ===");
    // console.log(`Initial X: ${bgaucheScaledX.toFixed(2)}px`);
    // console.log(
    //   `Min X: ${(bgaucheScaledX - AMPLITUDE).toFixed(2)}px (leftmost)`
    // );
    // console.log(
    //   `Max X: ${(bgaucheScaledX + AMPLITUDE).toFixed(2)}px (rightmost)`
    // );
    // console.log(
    //   `Y (constant): ${(bgaucheCenter.y * scale + svg.offsetY).toFixed(2)}px`
    // );

    // console.log("\n=== BDROITE (vertical movement) ===");
    // console.log(`X (constant): ${(bdroiteCenter.x * scale).toFixed(2)}px`);
    // console.log(`Initial Y: ${bdroiteScaledY.toFixed(2)}px`);
    // console.log(
    //   `Min Y: ${(bdroiteScaledY - AMPLITUDE).toFixed(2)}px (topmost)`
    // );
    // console.log(
    //   `Max Y: ${(bdroiteScaledY + AMPLITUDE).toFixed(2)}px (bottommost)`
    // );

    // console.log("\n=== MOUSE CONTROL ===");
    // console.log(`Move mouse left to right to control rotation and angle`);
    // console.log(`Mouse left (x=0): rotation=PI/2 (90°), angle=90°`);
    // console.log(`  - bdroite: at initial position`);
    // console.log(`  - bgauche: at min position`);
    // console.log(`Mouse right (x=max): rotation=0°, angle=0°`);
    // console.log(`  - bdroite: at min position`);
    // console.log(`  - bgauche: at initial position`);
    // console.log(`Rotation controls angle: both vary together`);
    // console.log(`All SVGs rotate around canvas center`);

    positionsLogged = true;
  }

  // Increment time for animation
  time++;

  if (finished) {
    finish();
  }
}

// Track mouse position manually
let mouseXPos = canvas.width / 2;

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  mouseXPos = (e.clientX - rect.left) * scaleX;
  input.mouseX = mouseXPos;
});

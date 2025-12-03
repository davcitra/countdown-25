import { createEngine } from "../_shared/engine.js";
// import { Spring } from "../_shared/spring.js"
import Emoji from "./smiley.js";
import Particle from "./particles.js";

const { renderer, run, math, finish } = createEngine();
const { ctx, canvas } = renderer;
run(display);
const size = 500; // Emoji size - stays the same
const wallThickness = 300; // Wall thickness - wider so they stay more separated

const emoji_1 = new Emoji({
  number: 1,
  size,
  ctx,
  canvas,
});

const emoji_2 = new Emoji({
  number: -1,
  size,
  ctx,
  canvas,
});

// Particle system for wall explosions
const particles = [];

function createExplosion(emoji1, emoji2, size) {
  // Calculate circle passing through both emojis
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Create 8 particles in a circle pattern
  const numParticles = 8;
  for (let i = 0; i < numParticles; i++) {
    const angle = (i / numParticles) * Math.PI * 2;
    const distance = Math.sqrt(
      Math.pow(emoji1.positionX - centerX, 2) +
        Math.pow(emoji1.positionY - centerY, 2)
    );
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    particles.push(new Particle(x, y, size));
  }
}

// // Tracking for facing detection
// let facingStartTime = null;
// const FACING_DURATION = 1000; // 1.5 seconds

let isDragging = false;
let controllingRightSide = null; // Track which side we're controlling
let hasMovedToThreeQuarters = false; // Track if emojis have moved to 3/4

const LOVE_DISTANCE = 333; // Distance between emojis in love mode (size/3 * 2)
const KISS_DELAY = 2000; // 2 second delay before allowing click

function handleMouseDown(event) {
  // Don't allow interaction until both emojis finish sliding in
  if (emoji_1.isAnimatingIn || emoji_2.isAnimatingIn) {
    return;
  }

  // Don't allow normal dragging if emojis are snapped, separating, or sliding out
  if (
    emoji_1.isSnapped ||
    emoji_2.isSnapped ||
    emoji_1.isSeparating ||
    emoji_2.isSeparating ||
    emoji_1.isSlidingOut ||
    emoji_2.isSlidingOut
  ) {
    // Only allow the click to move to 3/4 if at center and delay passed
    if (
      (emoji_1.isSnappedAtCenter || emoji_2.isSnappedAtCenter) &&
      !hasMovedToThreeQuarters
    ) {
      const timeSinceSnap = Date.now() - (emoji_1.snapTime || 0);
      if (timeSinceSnap < KISS_DELAY) {
        // Still in kiss delay, don't allow interaction
        return;
      }

      // Move to 3/4 of canvas width
      emoji_1.moveToThreeQuarters();
      emoji_2.moveToThreeQuarters();
      hasMovedToThreeQuarters = true;
    }
    return; // Block all other interactions when snapped/separating
  }

  isDragging = true;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const clickX = (event.clientX - rect.left) * scaleX;
  const centerX = canvas.width / 2;

  // Determine which side we clicked on
  controllingRightSide = clickX > centerX;

  handleMouseMove(event); // Update position immediately on click
}

function handleMouseMove(event) {
  if (!isDragging) return;

  const rect = canvas.getBoundingClientRect();

  // Calculate scale factors in case canvas is scaled in CSS
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // Get position relative to canvas and scale it
  let clickX = (event.clientX - rect.left) * scaleX;
  const clickY = (event.clientY - rect.top) * scaleY;

  const centerX = canvas.width / 2;

  // Enforce wall boundaries based on which side we're controlling
  if (controllingRightSide) {
    // Controlling right side - can't go past center minus wall
    clickX = Math.max(centerX + wallThickness / 2, clickX);
  } else {
    // Controlling left side - can't go past center plus wall
    clickX = Math.min(centerX - wallThickness / 2, clickX);
  }

  emoji_1.updatePos(
    clickX,
    clickY,
    canvas.width,
    canvas.height,
    controllingRightSide
  );
  emoji_2.updatePos(
    clickX,
    clickY,
    canvas.width,
    canvas.height,
    controllingRightSide
  );
}

function handleMouseUp(event) {
  // If emojis have moved to 3/4, trigger slide out on release
  if (
    hasMovedToThreeQuarters &&
    (emoji_1.isSeparating || emoji_2.isSeparating)
  ) {
    emoji_1.slideOut();
    emoji_2.slideOut();

    // Call finish after a delay to let the animation complete
    setTimeout(() => {
      // finish();
    }, 3000);
    return;
  }

  isDragging = false;
  controllingRightSide = null;
}

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mouseleave", handleMouseUp); // Stop dragging if mouse leaves canvas

function display() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.restore();

  // Update positions smoothly
  emoji_1.update();
  emoji_2.update();

  const centerX = canvas.width / 2;
  const wallLeft = centerX - wallThickness / 2;
  const wallRight = centerX + wallThickness / 2;

  // Check for winking to trigger particle explosion
  if (emoji_1.getWinkingChanged() || emoji_2.getWinkingChanged()) {
    createExplosion(emoji_1, emoji_2, size);
  }

  // // Check if both emojis are winking (close to center) and aligned
  // const bothWinking =
  //   emoji_1.isCurrentlyWinking() && emoji_2.isCurrentlyWinking();
  // const yAligned = Math.abs(emoji_1.positionY - emoji_2.positionY) < 50;
  // const readyForLove = bothWinking && yAligned;

  // if (readyForLove) {
  //   if (facingStartTime === null) {
  //     facingStartTime = Date.now();
  //     console.log("Started timer - both winking and aligned!");
  //   } else if (Date.now() - facingStartTime >= FACING_DURATION) {
  //     console.log("Timer completed!");
  //     // TODO: Add love mode logic here
  //     facingStartTime = null;
  //   }
  // } else {
  //   if (facingStartTime !== null) {
  //     console.log("Timer reset");
  //   }
  //   facingStartTime = null;
  // }

  // Check if emojis are close enough to snap together (1/10 of canvas width)
  const distance = math.dist(
    emoji_1.positionX,
    emoji_1.positionY,
    emoji_2.positionX,
    emoji_2.positionY
  );

  const snapDistance = canvas.width / 6;
  console.log("snap", snapDistance, "real", distance);

  if (distance < snapDistance && !emoji_1.isSnapped && !emoji_2.isSnapped) {
    // Snap both emojis to center positions separated by LOVE_DISTANCE
    const centerX = canvas.width / 2;
    const centerY = (emoji_1.positionY + emoji_2.positionY) / 2; // Average Y position

    // Check if they're snapping at the vertical center of the screen
    const screenCenterY = canvas.height / 2;
    const yTolerance = 100; // Allow some tolerance for "center"
    const isAtCenter = Math.abs(centerY - screenCenterY) < yTolerance;

    // Position them with LOVE_DISTANCE separation
    const emoji1X = centerX + LOVE_DISTANCE / 2; // Right side
    const emoji2X = centerX - LOVE_DISTANCE / 2; // Left side

    emoji_1.snapToCenter(emoji1X, centerY, isAtCenter);
    emoji_2.snapToCenter(emoji2X, centerY, isAtCenter);

    console.log(
      "Snapped together! Distance was:",
      distance,
      "At center:",
      isAtCenter
    );
  }

  // Update and draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    } else {
      particles[i].draw(ctx);
    }
  }

  emoji_1.draw();
  emoji_2.draw();
}

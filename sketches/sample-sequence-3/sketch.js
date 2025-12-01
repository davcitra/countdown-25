import { createEngine } from "../_shared/engine.js"
// import { Spring } from "../_shared/spring.js"
import Emoji from "./smiley.js"
import Particle from "./particles.js"

const { renderer, run } = createEngine()
const { ctx, canvas } = renderer
run(display)
const size = 500 // Emoji size - stays the same
const wallThickness = 300 // Wall thickness - smaller so they can get closer

const emoji_1 = new Emoji({
  number: 1,
  size,
  ctx,
  canvas
})

const emoji_2 = new Emoji({
  number: -1,
  size,
  ctx,
  canvas
})

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

// Tracking for facing detection
let facingStartTime = null;
const FACING_DURATION = 1500; // 1.5 seconds


let isDragging = false;
let controllingRightSide = null; // Track which side we're controlling

function handleMouseDown(event) {
  isDragging = true;
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const clickX = (event.clientX - rect.left) * scaleX;
  const centerX = canvas.width / 2;
  
  // Determine which side we clicked on
  controllingRightSide = clickX > centerX;
  
  // If in love mode, start dragging
  if (emoji_1.isLoveMode) {
    emoji_1.startDragging();
    emoji_2.startDragging();
  }
  
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
  
  emoji_1.updatePos(clickX, clickY, canvas.width, canvas.height, controllingRightSide);
  emoji_2.updatePos(clickX, clickY, canvas.width, canvas.height, controllingRightSide);
}

function handleMouseUp(event) {
  isDragging = false;
  controllingRightSide = null;
  
  // If in love mode, stop dragging
  if (emoji_1.isLoveMode) {
    emoji_1.stopDragging();
    emoji_2.stopDragging();
  }
}

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mouseleave", handleMouseUp); // Stop dragging if mouse leaves canvas

function display() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);
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
  
  // Check if both emojis are winking (close to center) and aligned
  const bothWinking = emoji_1.isCurrentlyWinking() && emoji_2.isCurrentlyWinking();
  const yAligned = Math.abs(emoji_1.positionY - emoji_2.positionY) < 50;
  const readyForLove = bothWinking && yAligned;
  
  if (readyForLove && !emoji_1.isLoveMode) { // Only start timer if not already in love mode
    if (facingStartTime === null) {
      facingStartTime = Date.now();
      console.log("Started love timer - both winking and aligned!");
    } else if (Date.now() - facingStartTime >= FACING_DURATION) {
      console.log("ACTIVATING LOVE MODE - PERMANENT!");
      emoji_1.setLoveMode(true);
      emoji_2.setLoveMode(true);
      facingStartTime = null; // Clear timer
    }
  } else if (!readyForLove && !emoji_1.isLoveMode) {
    // Only reset timer if not in love mode
    if (facingStartTime !== null) {
      console.log("Love timer reset");
    }
    facingStartTime = null;
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
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
let dragStartX = 0; // Track where drag started (for love mode)
let lovePositionX1 = 0; // Store love mode positions
let lovePositionX2 = 0;
let lovePositionY = 0;
const LOVE_DISTANCE = 333; // Distance between emojis in love mode (size/3 * 2)

function handleMouseDown(event) {
  isDragging = true;
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const clickX = (event.clientX - rect.left) * scaleX;
  const centerX = canvas.width / 2;
  
  // If in love mode, use drag translation
  if (emoji_1.isLoveMode) {
    dragStartX = clickX;
    // Store the love positions when entering love mode for the first time
    if (lovePositionX1 === 0) {
      lovePositionX1 = emoji_1.positionX;
      lovePositionX2 = emoji_2.positionX;
      lovePositionY = emoji_1.positionY;
    }
  } else {
    // Normal mode - determine which side we clicked on
    controllingRightSide = clickX > centerX;
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
  
  // If in love mode, translate along x-axis (only to the right)
  if (emoji_1.isLoveMode) {
    const dragDelta = clickX - dragStartX;
    
    // Only allow dragging to the right (positive delta)
    if (dragDelta > 0) {
      const newEmoji1X = lovePositionX1 + dragDelta;
      const newEmoji2X = lovePositionX2 + dragDelta;
      
      // Check if LEFT emoji (emoji_2) has passed 3/4 of the window width
      const threeQuarterWidth = canvas.width * 0.75;
      
      if (newEmoji2X >= threeQuarterWidth) {
        // Left emoji goes back to center to display :3 centered
        emoji_2.returnToCenter((canvas.width / 2)-50, lovePositionY);
        // Right emoji continues moving
        emoji_1.translateX(newEmoji1X, canvas.width);
      } else {
        // Both move together, maintaining distance
        emoji_1.translateX(newEmoji1X, canvas.width);
        emoji_2.translateX(newEmoji2X, canvas.width);
      }
    }
  } else {
    // Normal mode - follow mouse position with wall constraints
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
}

function handleMouseUp(event) {
  isDragging = false;
  controllingRightSide = null;
  
  // If in love mode, check if right emoji successfully exited
  if (emoji_1.isLoveMode) {
    const rightEmojiExited = emoji_1.positionX > canvas.width;
    
    if (rightEmojiExited) {
      // Success! Right emoji disappears, left stays at center
      emoji_1.disappear();
    } else {
      // Failed to exit - both return to love position
      emoji_1.returnToLove(lovePositionX1, lovePositionY);
      emoji_2.returnToLove(lovePositionX2, lovePositionY);
    }
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
      
      // Store the love positions
      const centerX = canvas.width / 2;
      lovePositionX1 = centerX + size / 3;
      lovePositionX2 = centerX - size / 3;
      lovePositionY = emoji_1.positionY;
      
      // Set emojis to love position
      emoji_1.returnToLove(lovePositionX1, lovePositionY);
      emoji_2.returnToLove(lovePositionX2, lovePositionY);
      
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
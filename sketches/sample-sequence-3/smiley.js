export default class Emoji {
  constructor({ number, size, ctx, canvas }) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.size = size;
    this.factor = number;

    this.deltaX = this.canvas.width / 4;
    this.deltaY = 0;
    this.emoji = number;

    // Final initialization positions
    if (this.emoji === 1) {
      this.initialX = this.canvas.width / 2 + this.deltaX;
      this.initialY = this.canvas.height / 2 + this.deltaY;
    } else {
      this.initialX = this.canvas.width / 2 - this.deltaX;
      this.initialY = this.canvas.height / 2 - this.deltaY;
    }

    // Start positions (off-screen)
    if (this.emoji === 1) {
      this.positionX = this.canvas.width + this.size; // Start off right edge
      this.positionY = this.initialY;
    } else {
      this.positionX = -this.size; // Start off left edge
      this.positionY = this.initialY;
    }

    // Animation state
    this.isAnimatingIn = true; // Flag for initial slide-in animation

    // Target positions for smooth movement
    this.targetX = this.positionX;
    this.targetY = this.positionY;
    this.smoothing = 0.03; // Fast smoothing when directly controlled
    this.mirroredSmoothing = 0.015; // Slower smoothing when mirroring
    this.currentSmoothing = this.smoothing; // Track which smoothing to use
    this.snapSmoothing = 0.25; // Fast and dramatic for snapping - like falling into a kiss!
    this.isWinking = false;
    this.isNeutral = false; // Start happy :)
    this.isVisible = true; // For making emoji disappear
    this.isSnapped = false; // Track if emoji is snapped to center
    this.isSnapping = false; // Track if currently animating snap
    this.isSnappedAtCenter = false; // Track if snapped specifically at screen center
    this.snapTime = null; // Track when snapping completed
    this.isSeparating = false; // Track if in separation process
    this.isSlidingOut = false; // Track if sliding out of canvas
    this.colonOpacity = 1.0; // Opacity for the ':' in ':3' face
    this.threeScale = 1.0; // Scale for the '3' character when alone

    // For wall hit detection
    this.previousX = this.positionX;
    this.wasAtWall = false;

    // For rotation - start facing center
    this.rotation = 0; // Start at 0° (facing center)
    this.targetRotation = 0; // Target also center
    this.facingCenter = true; // Start facing center
  }

  isAnimationComplete() {
    return !this.isAnimatingIn;
  }

  snapToCenter(targetX, targetY, isAtCenter = false) {
    this.targetX = targetX;
    this.targetY = targetY;
    this.isSnapping = true;
    this.isSnapped = true;
    this.isSnappedAtCenter = isAtCenter; // Only true if snapping at screen center
    this.rotation = 0; // Face forward
    this.targetRotation = 0;
    if (isAtCenter) {
      this.snapTime = Date.now(); // Record when we snapped at center
    }
  }

  moveToThreeQuarters() {
    // Move to 3/4 of canvas width
    this.isSeparating = true;
    const threeQuarterWidth = this.canvas.width * 0.75;

    if (this.emoji === 1) {
      this.targetX = threeQuarterWidth + this.canvas.width / 6 / 2;
    } else {
      this.targetX = threeQuarterWidth - this.canvas.width / 6 / 2;
    }
  }

  slideOut() {
    this.isSlidingOut = true;
    this.isSnappedAtCenter = false;
    if (this.emoji === 1) {
      // Right emoji slides out to the right
      this.targetX = this.canvas.width + this.size;
    } else {
      // Left emoji returns to center and starts fading the ':'
      this.targetX = this.canvas.width / 2;
      this.targetY = this.canvas.height / 2;
    }
  }

  hasHitWall(wallPosition) {
    const atWall = Math.abs(this.positionX - wallPosition) < 15;
    const justHit = atWall && !this.wasAtWall;
    this.wasAtWall = atWall;
    return justHit;
  }

  isCurrentlyWinking() {
    return this.isWinking;
  }

  getWinkingChanged() {
    const wasWinking = this.previousIsWinking || false;
    const nowWinking = this.isWinking;
    this.previousIsWinking = nowWinking;
    return !wasWinking && nowWinking; // Just started winking
  }

  updatePos(clickX, clickY, canvasWidth, canvasHeight, controllingRightSide) {
    // Normal behavior
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Right emoji (number = 1)
    if (this.emoji === 1) {
      if (controllingRightSide) {
        // Being directly controlled - fast smoothing
        this.currentSmoothing = this.smoothing;
        this.targetX = clickX;
        this.targetY = clickY;
      } else {
        // Mirroring the other emoji - slow smoothing
        this.currentSmoothing = this.mirroredSmoothing;
        this.targetX = centerX + (centerX - clickX);
        this.targetY = centerY + (centerY - clickY);
      }
    }
    // Left emoji (number = -1)
    else {
      if (controllingRightSide) {
        // Mirroring the other emoji - slow smoothing
        this.currentSmoothing = this.mirroredSmoothing;
        this.targetX = centerX - (clickX - centerX);
        this.targetY = centerY - (clickY - centerY);
      } else {
        // Being directly controlled - fast smoothing
        this.currentSmoothing = this.smoothing;
        this.targetX = clickX;
        this.targetY = clickY;
      }
    }
  }

  update() {
    const prevX = this.positionX;
    const prevY = this.positionY;

    // Handle initial slide-in animation
    if (this.isAnimatingIn) {
      const slideSpeed = 0.03; // Slower speed for slide-in animation (was 0.08)
      this.positionX += (this.initialX - this.positionX) * slideSpeed;
      this.positionY += (this.initialY - this.positionY) * slideSpeed;

      // Check if we've reached the initial position (within tolerance for early interaction)
      const distToInitial = Math.abs(this.positionX - this.initialX);
      if (distToInitial < 100) {
        // Increased tolerance from 1 to 100 for early interaction
        this.positionX = this.initialX;
        this.positionY = this.initialY;
        this.targetX = this.initialX;
        this.targetY = this.initialY;
        this.isAnimatingIn = false;
      }

      return; // Skip normal update logic during animation
    }

    // Handle snapping animation
    if (this.isSnapping) {
      // Calculate distance to target
      const distToTarget = Math.sqrt(
        Math.pow(this.targetX - this.positionX, 2) +
          Math.pow(this.targetY - this.positionY, 2)
      );

      // Easing: speed increases as we get closer (quadratic ease-in)
      // When far away, move slowly; when close, snap quickly
      const maxDist = 400; // Reference distance for easing
      const normalizedDist = Math.min(distToTarget / maxDist, 1);
      const easedSpeed =
        this.snapSmoothing * (1 - normalizedDist * normalizedDist * 0.8);

      this.positionX += (this.targetX - this.positionX) * easedSpeed;
      this.positionY += (this.targetY - this.positionY) * easedSpeed;

      if (distToTarget < 1) {
        this.positionX = this.targetX;
        this.positionY = this.targetY;
        this.isSnapping = false;
      }

      return; // Skip normal update logic during snapping
    }

    // Handle separation and sliding out
    if (this.isSeparating || this.isSlidingOut) {
      const speed = this.isSlidingOut ? 0.05 : 0.1; // Slower slide out
      this.positionX += (this.targetX - this.positionX) * speed;
      this.positionY += (this.targetY - this.positionY) * speed;

      // Fade out the ':' for left emoji when sliding out
      if (this.isSlidingOut && this.emoji === -1) {
        this.colonOpacity = Math.max(0, this.colonOpacity - 0.02);

        // Scale up the '3' with easing as it returns to center
        const targetScale = 3.0; // Scale to 3x size
        this.threeScale += (targetScale - this.threeScale) * 0.05; // Smooth easing
      }

      // Check if right emoji has slid off screen
      if (
        this.isSlidingOut &&
        this.emoji === 1 &&
        this.positionX > this.canvas.width
      ) {
        this.isVisible = false;
      }

      return; // Skip normal update logic during separation
    }

    // Normal mode - regular smoothing
    this.positionX += (this.targetX - this.positionX) * this.currentSmoothing;
    this.positionY += (this.targetY - this.positionY) * this.currentSmoothing;

    // Calculate distance from center (for winking)
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const distX = this.positionX - centerX;
    const distY = this.positionY - centerY;
    const distanceFromCenter = Math.sqrt(distX * distX + distY * distY);

    // Calculate distance from initial position (for rotation/face state)
    const distFromInitialX = this.positionX - this.initialX;
    const distFromInitialY = this.positionY - this.initialY;
    const distanceFromInitial = Math.sqrt(
      distFromInitialX * distFromInitialX + distFromInitialY * distFromInitialY
    );

    // Determine if we're beyond the initial position
    // Right emoji (number = 1) is beyond if moved RIGHT from initial
    // Left emoji (number = -1) is beyond if moved LEFT from initial
    let beyondInitial;
    if (this.emoji === 1) {
      beyondInitial = this.positionX > this.initialX;
    } else {
      beyondInitial = this.positionX < this.initialX;
    }

    // Set rotation and face based on position relative to initial
    if (beyondInitial) {
      // Beyond initial position - turn away and show :|
      this.targetRotation = Math.PI;
      this.isNeutral = true;
    } else {
      // At or closer to center than initial - face center and show :)
      this.targetRotation = 0;
      this.isNeutral = false;
    }

    // Handle winking (if close to center and facing center)
    if (!this.isNeutral) {
      this.isWinking = distanceFromCenter < this.canvas.width / 6;
    } else {
      this.isWinking = false;
    }

    // Smoothly interpolate rotation
    let rotDiff = this.targetRotation - this.rotation;
    while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
    while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
    this.rotation += rotDiff * 0.05;
  }

  draw() {
    // Don't draw if invisible
    if (!this.isVisible) return;

    this.ctx.save();

    this.ctx.fillStyle = "white";
    this.ctx.textBaseline = "middle";
    this.ctx.font = `${this.size}px Helvetica Neue, Helvetica, bold`;
    this.ctx.textAlign = "center";

    // Choose face based on state
    let face = ":)";
    if (this.isSnappedAtCenter || this.isSeparating || this.isSlidingOut) {
      // Once :3, always :3 (until separation completes)
      face = ":3";
    } else if (this.isWinking) {
      face = ";)";
    } else if (this.isNeutral) {
      face = ":|";
    }

    // Move to position and apply rotation
    this.ctx.translate(this.positionX, this.positionY);
    this.ctx.rotate(this.rotation);

    // Right emoji (number = 1) - starts facing left (toward center)
    if (this.emoji === 1) {
      this.ctx.scale(-1, 1);
    }

    // If we're fading the colon for left emoji, draw separately with scale
    if (this.emoji === -1 && face === ":3" && this.colonOpacity < 1) {
      // Draw ':' with fading opacity
      this.ctx.globalAlpha = this.colonOpacity;
      this.ctx.fillText(":", -this.size * 0.125, 0); // Position ':' to the left

      // Draw '3' with full opacity and scaling
      this.ctx.globalAlpha = 1.0;
      this.ctx.save();
      this.ctx.scale(this.threeScale, this.threeScale); // Apply scale
      this.ctx.fillText("3", (this.size * 0.125) / this.threeScale, 0); // Adjust position for scale
      this.ctx.restore();
    } else {
      // Draw normally
      this.ctx.fillText(face, 0, 0);
    }

    this.ctx.restore();
  }

  // state(i){
  //     if(i=0)
  // }
}

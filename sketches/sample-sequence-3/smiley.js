export default class Emoji {
  constructor({ number, size, ctx, canvas }) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.size = size;
    this.factor = number;
   
    this.deltaX = this.canvas.width / 4;
    this.deltaY = 0;
    this.emoji = number;

    if (this.emoji === 1) {
      this.positionX = this.canvas.width / 2 + this.deltaX;
      this.positionY = this.canvas.height / 2 + this.deltaY;
    } else {
      this.positionX = this.canvas.width / 2 - this.deltaX;
      this.positionY = this.canvas.height / 2 - this.deltaY;
    }
    
    // Store initial position for distance comparison
    this.initialX = this.positionX;
    this.initialY = this.positionY;
    
    // Target positions for smooth movement
    this.targetX = this.positionX;
    this.targetY = this.positionY;
    this.smoothing = 0.15;
    this.isWinking = false;
    this.isNeutral = true; // Start neutral :|
    this.isLoveMode = false;
    
    // For wall hit detection
    this.previousX = this.positionX;
    this.wasAtWall = false;
    
    // For rotation - start facing away
    this.rotation = Math.PI; // Start at 180° (facing away)
    this.targetRotation = Math.PI; // Target also away
    this.facingCenter = false; // Start facing away
  }
  
  setLoveMode(enabled) {
    this.isLoveMode = enabled;
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
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Right emoji (number = 1)
    if (this.emoji === 1) {
      if (controllingRightSide) {
        this.targetX = clickX;
        this.targetY = clickY;
      } else {
        this.targetX = centerX + (centerX - clickX);
        this.targetY = centerY + (centerY - clickY);
      }
    } 
    // Left emoji (number = -1)
    else {
      if (controllingRightSide) {
        this.targetX = centerX - (clickX - centerX);
        this.targetY = centerY - (clickY - centerY);
      } else {
        this.targetX = clickX;
        this.targetY = clickY;
      }
    }
  }
  
  update() {
    const prevX = this.positionX;
    const prevY = this.positionY;
    
    this.positionX += (this.targetX - this.positionX) * this.smoothing;
    this.positionY += (this.targetY - this.positionY) * this.smoothing;
    
    // Calculate actual distance (norm) from center point
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const distX = this.positionX - centerX;
    const distY = this.positionY - centerY;
    const distanceFromCenter = Math.sqrt(distX * distX + distY * distY);
    
    // Calculate previous distance to determine if moving toward or away from center
    const prevDistX = prevX - centerX;
    const prevDistY = prevY - centerY;
    const prevDistance = Math.sqrt(prevDistX * prevDistX + prevDistY * prevDistY);
    
    const movementAmount = Math.abs(distX - prevDistX);
    
    // If already in love mode, STAY THERE - don't change anything
    if (this.isLoveMode) {
      this.targetRotation = 0;
      this.isNeutral = false;
      this.isWinking = false;
      
      // Move emojis closer to touch
      if (this.emoji === 1) {
        this.positionX = centerX + this.size / 3;
      } else {
        this.positionX = centerX - this.size / 3;
      }
    } else {
      // Not in love mode yet - normal behavior
      
      // Handle rotation and neutral state based on movement
      if (movementAmount > 0.5) {
        const movingAwayFromCenter = distanceFromCenter > prevDistance;
        
        if (movingAwayFromCenter) {
          this.targetRotation = Math.PI; // Face away
          this.isNeutral = true;
        } else {
          this.targetRotation = 0; // Face center
          this.isNeutral = false;
        }
      }
      
      // Handle winking (if close to center and not moving away)
      if (!this.isNeutral) {
        this.isWinking = distanceFromCenter < this.canvas.width / 6;
      } else {
        this.isWinking = false;
      }
    }
    
    // ALWAYS: Smoothly interpolate rotation
    let rotDiff = this.targetRotation - this.rotation;
    while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
    while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
    this.rotation += rotDiff * 0.05; // Slow rotation
  }

  draw() {
    this.ctx.save();
    
    this.ctx.fillStyle = "white";
    this.ctx.textBaseline = "middle";
    this.ctx.font = `${this.size}px Helvetica Neue, Helvetica, bold`;
    this.ctx.textAlign = "center";
    
    // Choose face based on state (priority: love > winking > neutral > normal)
    let face = ":)";
    if (this.isLoveMode) {
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
    
    this.ctx.fillText(face, 0, 0);
    
    this.ctx.restore();
  }

  // state(i){
  //     if(i=0)
  // }
}
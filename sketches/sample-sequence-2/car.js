export default class Voiture {
  constructor(x, y, width = 120) {
    this.x = x;
    this.y = y;
    this.width = width;
    // Maintain aspect ratio based on the SVG viewBox (1560.7 x 1080)
    this.height = (1080 / 1560.7) * width;
    this.angle = 0; // Rotation angle in radians
    this.positionAlongPath = 0;
    this.isMoving = false;
    this.speed = 0; // Constant speed of movement along path

    // Off-road properties
    this.isOffRoad = false;
    this.offRoadVelocityX = 0;
    this.offRoadVelocityY = 0;

    // Fade-in properties
    this.opacity = 0; // Start invisible
    this.isSpawning = true;
    this.spawnDelay = 400; // 1 second delay in milliseconds
    this.spawnTime = Date.now();
    this.fadeDuration = 400; // Fade in over 800ms

    // Load the car SVG
    this.image = new Image();
    this.image.src = "Voiture.svg";
    this.loaded = false;

    this.image.onload = () => {
      this.loaded = true;
    };
  }

  // Update car position
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  // Set angle
  setAngle(angle) {
    this.angle = angle;
  }

  // Move car by delta values
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  update() {
    // Handle spawn fade-in
    if (this.isSpawning) {
      const timeSinceSpawn = Date.now() - this.spawnTime;

      if (timeSinceSpawn < this.spawnDelay) {
        // Still in delay period, stay invisible
        this.opacity = 0;
        return; // Don't update movement during delay
      } else {
        // Start fading in after delay
        const fadeProgress =
          (timeSinceSpawn - this.spawnDelay) / this.fadeDuration;
        this.opacity = Math.min(fadeProgress, 1); // Clamp to 1

        if (this.opacity >= 1) {
          this.isSpawning = false; // Fade-in complete
        }
      }
    }

    if (this.isMoving) {
      this.speed += 0.4;
    } else {
      this.speed *= 0.98;
    }

    if (!this.isOffRoad) {
      this.positionAlongPath += this.speed;
    } else {
      // When off-road, move in straight line
      this.x += this.offRoadVelocityX;
      this.y += this.offRoadVelocityY;
    }

    console.log(this.speed);
  }

  goOffRoad() {
    if (!this.isOffRoad) {
      this.isOffRoad = true;
      // Calculate velocity components based on current angle and speed
      this.offRoadVelocityX = Math.cos(this.angle) * this.speed;
      this.offRoadVelocityY = Math.sin(this.angle) * this.speed;
    }
  }

  // Start moving
  startMoving() {
    this.isMoving = true;
  }

  stopsMoving() {
    this.isMoving = false;
  }

  // Draw the car on the canvas
  draw(ctx) {
    if (this.loaded && this.opacity > 0) {
      ctx.save();

      // Apply opacity
      ctx.globalAlpha = this.opacity;

      // Translate to car center, rotate, then draw
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.drawImage(
        this.image,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );

      ctx.restore();
    }
  }
}

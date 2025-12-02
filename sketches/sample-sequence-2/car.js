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
    if (this.isMoving) {
      this.speed += 0.2;
    } else {
      this.speed *= 0.98;
    }
    this.positionAlongPath += this.speed;
    // if (this.progress > 1) {
    //   this.progress = 1;
    //   this.isMoving = false;
    // }
  }

  // Update car along path
  // updateOnPath(path) {
  //   if (!path.loaded) return;

  //   const point = path.getPointAtProgress(
  //     this.progress,
  //     path.scale,
  //     path.yOffset
  //   );
  //   if (point) {
  //     this.x = point.x - this.width / 2;
  //     this.y = point.y - this.height / 2;
  //     this.angle = point.angle;
  //   }
  // }

  // Start moving
  startMoving() {
    this.isMoving = true;
  }

  stopsMoving() {
    this.isMoving = false;
  }

  // Draw the car on the canvas
  draw(ctx) {
    if (this.loaded) {
      ctx.save();

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

  // Check if a point is inside the car (useful for mouse interactions)
  contains(x, y) {
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }

  // Get car's rotated bounding box for occlusion
  getBoundingBox() {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    // Create corners of the car rectangle
    const corners = [
      { x: -this.width / 2, y: -this.height / 2 },
      { x: this.width / 2, y: -this.height / 2 },
      { x: this.width / 2, y: this.height / 2 },
      { x: -this.width / 2, y: this.height / 2 },
    ];

    // Rotate corners
    const rotatedCorners = corners.map((corner) => {
      const x =
        corner.x * Math.cos(this.angle) - corner.y * Math.sin(this.angle);
      const y =
        corner.x * Math.sin(this.angle) + corner.y * Math.cos(this.angle);
      return { x: x + cx, y: y + cy };
    });

    return rotatedCorners;
  }

  // Check if a point is occluded by the car (considering rotation)
  occludesPoint(px, py) {
    const corners = this.getBoundingBox();

    // Use ray casting algorithm to check if point is inside polygon
    let inside = false;
    for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
      const xi = corners[i].x,
        yi = corners[i].y;
      const xj = corners[j].x,
        yj = corners[j].y;

      const intersect =
        yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }
}

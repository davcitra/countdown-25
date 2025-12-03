import * as math from "../_shared/engine/math.js";

export default class Path2 {
  constructor() {}

  calculateDistances() {
    this.distances = [];
    this.rots = [];

    let distance = 0;
    let rot = 0;
    for (let i = 0; i < this.points.length; i++) {
      if (i > 0) {
        const prevPoint = this.points[i - 1];
        const currPoint = this.points[i];

        const distToPrevious = math.dist(
          prevPoint.x,
          prevPoint.y,
          currPoint.x,
          currPoint.y
        );
        distance += distToPrevious;

        const rotToPrevious = Math.atan2(
          currPoint.y - prevPoint.y,
          currPoint.x - prevPoint.x
        );

        rot = rotToPrevious;
      }

      this.distances.push(distance);
      this.rots.push(rot);
    }
  }

  async loadPath(filename) {
    try {
      const response = await fetch(filename);
      const svgText = await response.text();

      // Parse the SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

      // Get the viewBox dimensions
      const svg = svgDoc.querySelector("svg");
      const viewBox = svg.getAttribute("viewBox").split(" ");
      const pathOriginalWidth = parseFloat(viewBox[2]);
      const pathOriginalHeight = parseFloat(viewBox[3]);

      // Get the path element and extract its 'd' attribute
      const pathElement = svgDoc.querySelector("path");
      const pathLength = pathElement.getTotalLength();
      const resolution = 40;
      const steps = pathLength / resolution;

      const screenPixelWidth = window.innerWidth * window.devicePixelRatio;
      const screenPixelHeight = window.innerHeight * window.devicePixelRatio;
      const scale = screenPixelWidth / pathOriginalWidth;
      const offsetY = screenPixelHeight / 2 - (pathOriginalHeight / 2) * scale;
      const offsetX = 0;

      this.points = [];

      for (let i = 0; i < steps; i++) {
        const point = pathElement.getPointAtLength(i * resolution);
        this.points.push({
          x: point.x * scale + offsetX,
          y: point.y * scale + offsetY,
        });
      }

      // Load the mask path
      const maskElement = svgDoc.querySelector("#mask path");
      if (maskElement) {
        this.maskPath = new Path2D(maskElement.getAttribute("d"));
        this.scale = scale;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
      }

      this.calculateDistances();

      this.loaded = true;
    } catch (err) {
      console.error("Error loading path.svg:", err);
    }
  }

  getPointAtDistance(progressDistance) {
    for (let i = 0; i < this.distances.length; i++) {
      if (this.distances[i] > progressDistance) {
        const startId = i - 1;
        const endId = i;
        const startDist = this.distances[startId];
        const endDist = this.distances[endId];
        const progressBetweenPoints = math.map(
          progressDistance,
          startDist,
          endDist,
          0,
          1
        );
        const startPoint = this.points[startId];
        const endPoint = this.points[endId];

        const x = math.lerp(startPoint.x, endPoint.x, progressBetweenPoints);
        const y = math.lerp(startPoint.y, endPoint.y, progressBetweenPoints);
        return { x, y };
      }
    }
  }
  getAngleAtDistance(progressDistance) {
    for (let i = 0; i < this.distances.length; i++) {
      if (this.distances[i] > progressDistance) {
        const startId = i - 1;
        const endId = i;
        const startDist = this.distances[startId];
        const endDist = this.distances[endId];

        const progressBetweenPoints = math.map(
          progressDistance,
          startDist,
          endDist,
          0,
          1
        );

        let startAngle = this.rots[startId];
        let endAngle = this.rots[endId];

        // Fix angle wrapping - ensure we take the shortest path
        let diff = endAngle - startAngle;
        if (diff > Math.PI) {
          endAngle -= 2 * Math.PI;
        } else if (diff < -Math.PI) {
          endAngle += 2 * Math.PI;
        }

        const a = math.lerp(startAngle, endAngle, progressBetweenPoints);

        return { a };
      }
    }
  }

  // draw(ctx) {
  //   if (this.loaded) {
  //     ctx.save();

  //     // ctx.beginPath();
  //     // ctx.moveTo(this.points[0].x, this.points[0].y);
  //     // for (let i = 1; i < this.points.length; i++) {
  //     //   ctx.lineTo(this.points[i].x, this.points[i].y);
  //     // }
  //     // ctx.strokeWidth = 5;
  //     // ctx.strokeStyle = "white";
  //     // ctx.stroke();

  //     for (let i = 0; i < this.points.length; i++) {
  //       const angle = this.rots[i];

  //       ctx.beginPath();
  //       ctx.rect(this.points[i].x - 5, this.points[i].y - 5, 20, 8);
  //       ctx.rotate(angle);
  //       ctx.fillStyle = "red";
  //       ctx.fill();
  //     }

  //     ctx.restore();
  //   }
  // }

  draw(ctx) {
    if (this.loaded) {
      ctx.save();

      // // Draw the mask in white
      // if (this.maskPath) {
      //   ctx.save();
      //   ctx.translate(this.offsetX, this.offsetY);
      //   ctx.scale(this.scale, this.scale);
      //   ctx.fillStyle = "white";
      //   ctx.fill(this.maskPath);
      //   ctx.restore();
      // }

      for (let i = 0; i < this.points.length; i++) {
        const angle = (this.rots[i] + this.rots[i + 1]) / 2;

        ctx.save(); // Save state for each rectangle
        ctx.translate(this.points[i].x, this.points[i].y); // Move to the point
        ctx.rotate(angle); // Rotate around that point

        ctx.beginPath();
        ctx.rect(-10, -4, 20, 8); // Draw centered on the point
        ctx.fillStyle = "white"; // Changed to white as you requested
        ctx.fill();

        ctx.restore(); // Restore state after each rectangle
      }

      ctx.restore();
    }
  }
}

import * as math from "../_shared/engine/math.js";

export default class Path2 {
  constructor() {}

  calculateDistances() {
    this.distances = [];

    let distance = 0;
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
      }
      this.distances.push(distance);
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

  draw(ctx) {
    if (this.loaded) {
      ctx.save();

      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.strokeWidth = 5;
      ctx.strokeStyle = "white";
      ctx.stroke();

      for (let i = 0; i < this.points.length; i++) {
        ctx.beginPath();
        ctx.rect(this.points[i].x - 5, this.points[i].y - 5, 10, 10);
        ctx.fillStyle = "red";
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

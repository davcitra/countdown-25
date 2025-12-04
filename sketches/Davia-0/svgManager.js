// SVG Manager Class
export default class SVG {
  constructor(renderer) {
    this.svgs = new Map();
    this.loaded = false;
    this.scale = 1;
    this.renderer = renderer;
    this.ctx = renderer.ctx;
    this.canvas = renderer.canvas;

    // Define the actual drawing bounds for each element in original SVG coordinates
    this.elementBounds = {
      bgauche: { x: 565, y: 28, width: 66, height: 43 }, // bulle_gauche O character
      bdroite: { x: 1245, y: 233, width: 45, height: 67 }, // bulle_droite O character
      cercle: { x: 1108, y: 61, width: 384, height: 412 }, // circle with ruler marks
    };

    // Store initial positions after scaling
    this.initialPositions = {
      bgauche: { x: 0, y: 0 },
      bdroite: { x: 0, y: 0 },
    };
  }

  async loadSVG(name, path) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.svgs.set(name, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = path;
    });
  }

  async loadAll() {
    const svgFiles = [
      { name: "bdroite", path: "./bdroite.svg" },
      { name: "bgauche", path: "./bgauche.svg" },
      { name: "metre", path: "./metre.svg" },
      { name: "cercle", path: "./cercle.svg" },
      { name: "rectangle", path: "./rectangle.svg" },
    ];

    try {
      await Promise.all(
        svgFiles.map(({ name, path }) => this.loadSVG(name, path))
      );
      this.loaded = true;
      this.calculateScale();
    } catch (error) {
      console.error("Error loading SVGs:", error);
    }
  }

  calculateScale() {
    // Original SVG dimensions
    const SVG_WIDTH = 1920;
    const SVG_HEIGHT = 535.6;

    // Calculate scale to fit canvas width
    this.scale = this.canvas.width / SVG_WIDTH;
    this.scaledHeight = SVG_HEIGHT * this.scale;

    // Center the SVG vertically
    this.offsetY = (this.canvas.height - this.scaledHeight) / 2;

    // Store initial positions
    this.initialPositions.bgauche.x = 0;
    this.initialPositions.bgauche.y = this.offsetY;
    this.initialPositions.bdroite.x = 0;
    this.initialPositions.bdroite.y = this.offsetY;
  }

  draw(bgaucheOffsetX = 0, bdroiteOffsetY = 0, rotation = 0) {
    if (!this.loaded) return;

    const SVG_WIDTH = 1920;
    const SVG_HEIGHT = 535.6;

    // Calculate dimensions
    const width = this.canvas.width;
    const height = SVG_HEIGHT * this.scale;

    // Rotate around canvas center
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Draw order: static elements first, then animated ones
    const staticElements = ["metre", "cercle", "rectangle"];

    // Draw static elements with rotation around canvas center
    staticElements.forEach((name) => {
      const img = this.svgs.get(name);
      if (img) {
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(rotation);
        this.ctx.translate(-centerX, -centerY);
        this.ctx.drawImage(img, 0, this.offsetY, width, height);
        this.ctx.restore();
      }
    });

    // Draw bgauche with horizontal offset and rotation
    const bgaucheImg = this.svgs.get("bgauche");
    if (bgaucheImg) {
      this.ctx.save();
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(rotation);
      this.ctx.translate(-centerX, -centerY);
      this.ctx.drawImage(
        bgaucheImg,
        this.initialPositions.bgauche.x + bgaucheOffsetX,
        this.initialPositions.bgauche.y,
        width,
        height
      );
      this.ctx.restore();
    }

    // Draw bdroite with vertical offset and rotation
    const bdroiteImg = this.svgs.get("bdroite");
    if (bdroiteImg) {
      this.ctx.save();
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(rotation);
      this.ctx.translate(-centerX, -centerY);
      this.ctx.drawImage(
        bdroiteImg,
        this.initialPositions.bdroite.x,
        this.initialPositions.bdroite.y + bdroiteOffsetY,
        width,
        height
      );
      this.ctx.restore();
    }
  }

  getSVG(name) {
    return this.svgs.get(name);
  }
}

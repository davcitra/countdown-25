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

    // Scale to 80% of canvas width
    this.scale = (this.canvas.width * 0.9) / SVG_WIDTH;
    this.scaledWidth = SVG_WIDTH * this.scale;
    this.scaledHeight = SVG_HEIGHT * this.scale;

    // Center the SVG in the canvas
    this.offsetX = (this.canvas.width - this.scaledWidth) / 2;
    this.offsetY = (this.canvas.height - this.scaledHeight) / 2;

    // Calculate circle center in original SVG coordinates
    const circleCenterXOriginal =
      this.elementBounds.cercle.x + this.elementBounds.cercle.width / 2;
    const circleCenterYOriginal =
      this.elementBounds.cercle.y + this.elementBounds.cercle.height / 2;

    // Calculate circle center position in canvas coordinates (this is our rotation point)
    this.rotationCenterX = this.offsetX + circleCenterXOriginal * this.scale;
    this.rotationCenterY = this.offsetY + circleCenterYOriginal * this.scale;

    // Store initial positions
    this.initialPositions.bgauche.x = this.offsetX;
    this.initialPositions.bgauche.y = this.offsetY;
    this.initialPositions.bdroite.x = this.offsetX;
    this.initialPositions.bdroite.y = this.offsetY;
  }

  draw(
    bgaucheOffsetX = 0,
    bdroiteOffsetY = 0,
    rotation = 0,
    translationX = 0,
    translationY = 0,
    scaleMultiplier = 1.0
  ) {
    if (!this.loaded) return;

    const SVG_WIDTH = 1920;
    const SVG_HEIGHT = 535.6;

    // Calculate dimensions with scale multiplier
    const width = this.scaledWidth * scaleMultiplier;
    const height = this.scaledHeight * scaleMultiplier;

    // Calculate bdroite center position on canvas
    const bdroiteCenterX =
      this.elementBounds.bdroite.x + this.elementBounds.bdroite.width / 2;
    const bdroiteCenterY =
      this.elementBounds.bdroite.y + this.elementBounds.bdroite.height / 2;

    // bdroite position on canvas (before scaling)
    const bdroiteCanvasX =
      this.offsetX + bdroiteCenterX * this.scale + translationX;
    const bdroiteCanvasY =
      this.offsetY +
      bdroiteCenterY * this.scale +
      bdroiteOffsetY +
      translationY;

    // Use bdroite center for scaling when scaleMultiplier > 1, otherwise use rotation center
    const transformCenterX =
      scaleMultiplier > 1.0 ? bdroiteCanvasX : this.rotationCenterX;
    const transformCenterY =
      scaleMultiplier > 1.0 ? bdroiteCanvasY : this.rotationCenterY;

    // Draw order: static elements first, then animated ones
    const staticElements = ["metre", "cercle", "rectangle"];

    // Draw static elements with rotation, translation, and scaling from bdroite center
    staticElements.forEach((name) => {
      const img = this.svgs.get(name);
      if (img) {
        this.ctx.save();
        this.ctx.translate(transformCenterX, transformCenterY);
        this.ctx.scale(scaleMultiplier, scaleMultiplier);
        this.ctx.rotate(rotation);
        this.ctx.translate(-transformCenterX, -transformCenterY);
        this.ctx.drawImage(
          img,
          this.offsetX + translationX,
          this.offsetY + translationY,
          this.scaledWidth,
          this.scaledHeight
        );
        this.ctx.restore();
      }
    });

    // Draw bgauche with horizontal offset, rotation, translation, and scaling
    const bgaucheImg = this.svgs.get("bgauche");
    if (bgaucheImg) {
      this.ctx.save();
      this.ctx.translate(transformCenterX, transformCenterY);
      this.ctx.scale(scaleMultiplier, scaleMultiplier);
      this.ctx.rotate(rotation);
      this.ctx.translate(-transformCenterX, -transformCenterY);
      this.ctx.drawImage(
        bgaucheImg,
        this.initialPositions.bgauche.x + bgaucheOffsetX + translationX,
        this.initialPositions.bgauche.y + translationY,
        this.scaledWidth,
        this.scaledHeight
      );
      this.ctx.restore();
    }

    // Draw bdroite with vertical offset, rotation, translation, and scaling
    const bdroiteImg = this.svgs.get("bdroite");
    if (bdroiteImg) {
      this.ctx.save();
      this.ctx.translate(transformCenterX, transformCenterY);
      this.ctx.scale(scaleMultiplier, scaleMultiplier);
      this.ctx.rotate(rotation);
      this.ctx.translate(-transformCenterX, -transformCenterY);
      this.ctx.drawImage(
        bdroiteImg,
        this.initialPositions.bdroite.x + translationX,
        this.initialPositions.bdroite.y + bdroiteOffsetY + translationY,
        this.scaledWidth,
        this.scaledHeight
      );
      this.ctx.restore();
    }
  }

  getSVG(name) {
    return this.svgs.get(name);
  }
}

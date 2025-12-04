export default class Fleur {
  constructor(x, y, height, canvasHeight) {
    this.x = x;
    this.targetY = y; // Store the target position
    this.y = canvasHeight + height; // Start below the screen
    this.height = height;
    this.width = (852.5 / 912.1) * height;

    // Load all the layer SVGs
    this.fleur = new Image();
    this.fleur.src = "fleur.svg";
    this.fleurLoaded = false;

    this.stem = new Image();
    this.stem.src = "1.svg";
    this.stemLoaded = false;

    this.leftLeaf = new Image();
    this.leftLeaf.src = "fgauche.svg";
    this.leftLeafLoaded = false;

    this.rightLeaf = new Image();
    this.rightLeaf.src = "fdroite.svg";
    this.rightLeafLoaded = false;

    // Load the final complete flower
    this.finalFlower = new Image();
    this.finalFlower.src = "final1.svg";
    this.finalFlowerLoaded = false;

    this.fleur.onload = () => {
      this.fleurLoaded = true;
    };

    this.stem.onload = () => {
      this.stemLoaded = true;
    };

    this.leftLeaf.onload = () => {
      this.leftLeafLoaded = true;
    };

    this.rightLeaf.onload = () => {
      this.rightLeafLoaded = true;
    };

    this.finalFlower.onload = () => {
      this.finalFlowerLoaded = true;
    };

    // Individual layer transformations
    this.fleurOffset = { x: 0, y: 0 };
    this.stemOffset = { x: 0, y: 0 };
    this.leftLeafOffset = { x: 0, y: 0 };
    this.rightLeafOffset = { x: 0, y: 0 };

    this.fleurRotation = 0;
    this.stemRotation = 0;
    this.leftLeafRotation = 0;
    this.rightLeafRotation = 0;

    this.fleurScale = 1;
    this.stemScale = 1;
    this.leftLeafScale = 1;
    this.rightLeafScale = 1;

    // Detachment and falling physics
    this.fleurDetached = false;
    this.leftLeafDetached = false;
    this.rightLeafDetached = false;

    this.fleurVelocity = { x: 0, y: 0 };
    this.leftLeafVelocity = { x: 0, y: 0 };
    this.rightLeafVelocity = { x: 0, y: 0 };

    this.fleurAngularVelocity = 0;
    this.leftLeafAngularVelocity = 0;
    this.rightLeafAngularVelocity = 0;

    // Physics constants
    this.gravity = 0.3;
    this.angularDamping = 0.98;

    // Animation states
    this.rising = true;
    this.riseSpeed = 0;
    this.gardeningComplete = false;
    this.stemCentering = false;
    this.stemCentered = false;
    this.finalFlowerAppearing = false;
    this.finalFlowerOpacity = 0;
    this.finalFlowerVisible = false;
    this.finalDelay = 0;
    this.finalFalling = false;
    this.finalFallVelocity = 0;
    this.finalFallRotation = 0;
    this.finalFallRotationSpeed = 0;

    // Store target position
    this.targetCenterY = 0;
    this.centeringSpeed = 0;
    this.centeringDelay = 0;
    this.fadeInSpeed = 0.02;

    // Calculate rise speed
    this.riseSpeed = (this.y - this.targetY) / 90; // 90 frames to rise
  }

  get loaded() {
    return (
      this.fleurLoaded &&
      this.stemLoaded &&
      this.leftLeafLoaded &&
      this.rightLeafLoaded
    );
  }

  // Check if all detachable parts have fallen off screen
  checkIfAllFallen(canvasHeight) {
    if (
      !this.fleurDetached ||
      !this.leftLeafDetached ||
      !this.rightLeafDetached
    ) {
      return false;
    }

    const threshold = canvasHeight + 500;

    const fleurOffScreen = this.y + this.fleurOffset.y > threshold;
    const leftLeafOffScreen = this.y + this.leftLeafOffset.y > threshold;
    const rightLeafOffScreen = this.y + this.rightLeafOffset.y > threshold;

    return fleurOffScreen && leftLeafOffScreen && rightLeafOffScreen;
  }

  // Start the centering animation
  startCentering(canvasHeight, size) {
    if (!this.gardeningComplete) {
      this.gardeningComplete = true;
      this.stemCentering = true;
      this.targetCenterY = canvasHeight / 2 - (canvasHeight - size) / 2;
      this.centeringSpeed = (this.targetCenterY - this.y) / 60;
      console.log("Gardening complete! Centering stem...");
    }
  }

  // Check if a point is inside a layer's bounding box
  isPointInLayer(px, py, layerName) {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    const localX = px - this.x;
    const localY = py - this.y;

    let offset;
    if (layerName === "fleur") offset = this.fleurOffset;
    else if (layerName === "leftLeaf") offset = this.leftLeafOffset;
    else if (layerName === "rightLeaf") offset = this.rightLeafOffset;
    else return false;

    const layerX = localX - offset.x;
    const layerY = localY - offset.y;

    if (layerName === "fleur") {
      return layerY < -halfHeight * 0.3 && Math.abs(layerX) < halfWidth * 0.6;
    } else if (layerName === "leftLeaf") {
      return (
        layerX < -halfWidth * 0.2 &&
        layerY > -halfHeight * 0.2 &&
        layerY < halfHeight * 0.4
      );
    } else if (layerName === "rightLeaf") {
      return (
        layerX > halfWidth * 0.2 &&
        layerY > -halfHeight * 0.2 &&
        layerY < halfHeight * 0.4
      );
    }

    return false;
  }

  // Check if a line segment crosses through a layer
  checkSlice(startX, startY, endX, endY) {
    const layers = ["fleur", "leftLeaf", "rightLeaf"];

    for (let layer of layers) {
      const numSamples = 20;
      for (let i = 0; i <= numSamples; i++) {
        const t = i / numSamples;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;

        if (this.isPointInLayer(x, y, layer)) {
          this.detachLayer(layer, endX - startX, endY - startY);
          return true;
        }
      }
    }
    return false;
  }

  // Detach a layer and give it initial velocity based on slice direction
  detachLayer(layerName, sliceVelocityX, sliceVelocityY, ctx) {
    if (layerName === "fleur" && !this.fleurDetached) {
      this.fleurDetached = true;
      this.fleurVelocity = {
        x: sliceVelocityX * 0.05,
        y: sliceVelocityY * 0.05,
      };
      this.fleurAngularVelocity = (Math.random() - 0.5) * 0.15;
      console.log("Fleur detached!");
    } else if (layerName === "leftLeaf" && !this.leftLeafDetached) {
      this.leftLeafDetached = true;
      this.leftLeafVelocity = {
        x: sliceVelocityX * 0.05,
        y: sliceVelocityY * 0.05,
      };
      this.leftLeafAngularVelocity = (Math.random() - 0.5) * 0.15;
      console.log("Left leaf detached!");
    } else if (layerName === "rightLeaf" && !this.rightLeafDetached) {
      this.rightLeafDetached = true;
      this.rightLeafVelocity = {
        x: sliceVelocityX * 0.05,
        y: sliceVelocityY * 0.05,
      };
      this.rightLeafAngularVelocity = (Math.random() - 0.5) * 0.15;
      console.log("Right leaf detached!");
    }
  }

  // Update physics for detached layers
  update(canvasHeight) {
    // Initial rise animation
    if (this.rising) {
      this.y -= this.riseSpeed;

      if (this.y <= this.targetY) {
        this.y = this.targetY;
        this.rising = false;
        console.log("Plant fully risen!");
      }
      return; // Don't process other updates while rising
    }

    // Update falling physics for detached parts
    if (this.fleurDetached) {
      this.fleurVelocity.y += this.gravity;
      this.fleurOffset.x += this.fleurVelocity.x;
      this.fleurOffset.y += this.fleurVelocity.y;
      this.fleurRotation += this.fleurAngularVelocity;
      this.fleurAngularVelocity *= this.angularDamping;
    }

    if (this.leftLeafDetached) {
      this.leftLeafVelocity.y += this.gravity;
      this.leftLeafOffset.x += this.leftLeafVelocity.x;
      this.leftLeafOffset.y += this.leftLeafVelocity.y;
      this.leftLeafRotation += this.leftLeafAngularVelocity;
      this.leftLeafAngularVelocity *= this.angularDamping;
    }

    if (this.rightLeafDetached) {
      this.rightLeafVelocity.y += this.gravity;
      this.rightLeafOffset.x += this.rightLeafVelocity.x;
      this.rightLeafOffset.y += this.rightLeafVelocity.y;
      this.rightLeafRotation += this.rightLeafAngularVelocity;
      this.rightLeafAngularVelocity *= this.angularDamping;
    }

    // Check if all parts have fallen
    if (!this.gardeningComplete && this.checkIfAllFallen(canvasHeight)) {
      this.startCentering(canvasHeight, this.height * 0.9);
    }

    // Animate stem centering
    if (this.stemCentering && !this.stemCentered) {
      this.y += this.centeringSpeed;

      if (
        Math.abs(this.y - this.targetCenterY) < Math.abs(this.centeringSpeed)
      ) {
        this.y = this.targetCenterY;
        this.stemCentered = true;
        this.centeringDelay = 30;
        console.log("Stem centered! Starting delay...");
      }
    }

    // Handle delay before final flower appears
    if (this.stemCentered && this.centeringDelay > 0) {
      this.centeringDelay--;
      if (this.centeringDelay === 0) {
        this.finalFlowerAppearing = true;
        console.log("Final flower appearing!");
      }
    }

    // Fade in final flower
    if (this.finalFlowerAppearing && this.finalFlowerOpacity < 1) {
      this.finalFlowerOpacity += this.fadeInSpeed;
      if (this.finalFlowerOpacity >= 1) {
        this.finalFlowerOpacity = 1;
        this.finalFlowerVisible = true;
        this.finalDelay = 90; // 1 second delay at 60fps
        console.log("Final flower fully visible! Starting final delay...");
      }
    }

    // Handle delay before final fall
    if (this.finalFlowerVisible && this.finalDelay > 0) {
      this.finalDelay--;
      if (this.finalDelay === 0) {
        this.finalFalling = true;
        this.finalFallRotationSpeed = (Math.random() - 0.5) * 0.1;
        console.log("Final flower falling!");
      }
    }

    // Final falling animation
    if (this.finalFalling) {
      this.finalFallVelocity += this.gravity * 1.5; // Fall faster
      this.y += this.finalFallVelocity;
      this.finalFallRotation += this.finalFallRotationSpeed;
    }
  }

  drawLayer(ctx, image, offset, rotation, scale, isDetached = false) {
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    // Apply red filter only to detached parts
    if (isDetached) {
      ctx.filter =
        "hue-rotate(0deg) saturate(100) brightness(0.2) sepia(2) hue-rotate(-50deg) saturate(10)";
    }

    ctx.drawImage(
      image,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    ctx.restore();
  }

  draw(ctx) {
    if (this.loaded) {
      ctx.save();
      ctx.translate(this.x, this.y);

      // Apply final fall rotation to everything
      if (this.finalFalling) {
        ctx.rotate(this.finalFallRotation);
      }

      // Always draw the stem (1.svg)
      if (this.stemLoaded) {
        this.drawLayer(
          ctx,
          this.stem,
          this.stemOffset,
          this.stemRotation,
          this.stemScale
        );
      }

      // Draw detachable layers only if not fallen
      if (this.leftLeafLoaded && !this.gardeningComplete) {
        this.drawLayer(
          ctx,
          this.leftLeaf,
          this.leftLeafOffset,
          this.leftLeafRotation,
          this.leftLeafScale,
          this.leftLeafDetached
        );
      }

      if (this.rightLeafLoaded && !this.gardeningComplete) {
        this.drawLayer(
          ctx,
          this.rightLeaf,
          this.rightLeafOffset,
          this.rightLeafRotation,
          this.rightLeafScale,
          this.rightLeafDetached
        );
      }

      if (this.fleurLoaded && !this.gardeningComplete) {
        this.drawLayer(
          ctx,
          this.fleur,
          this.fleurOffset,
          this.fleurRotation,
          this.fleurScale,
          this.fleurDetached
        );
      }

      // Draw final flower (final1.svg) with fade-in effect on top of stem
      if (this.finalFlowerAppearing && this.finalFlowerLoaded) {
        ctx.save();
        ctx.globalAlpha = this.finalFlowerOpacity;
        ctx.drawImage(
          this.finalFlower,
          -this.width / 2,
          -this.height / 2,
          this.width,
          this.height
        );
        ctx.restore();
      }

      ctx.restore();
    }
  }
}

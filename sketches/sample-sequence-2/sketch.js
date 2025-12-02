import { createEngine } from "../_shared/engine.js";
import Voiture from "./car.js";
import Path from "./path.js";
import Path2 from "./path2.js";
// import { Spring } from "../_shared/spring.js"
// import Emoji from "./smiley.js"
// import Particle from "./particles.js"

const { renderer, run, finish } = createEngine();
const { ctx, canvas } = renderer;

// Create cars array

const cars = [];

// Create a car on the left side, vertically centered
const car1 = new Voiture(50, 0, 170); // x position = 50, y will be set when canvas is ready

// Add more cars if you want (examples commented out)
// const car2 = new Voiture(300, 100, 150); // x, y, custom width
// const car3 = new Voiture(200, 400, 80);

cars.push(car1);
// cars.push(car2);
// cars.push(car3);

// Create the race path
//const racePath = new Path();
const newPath = new Path2();
newPath.loadPath("path.svg");

// Start the animation loop
run(display);

// Center the first car vertically after first frame
let firstFrame = true;

// Track mouse state
let isMouseDown = false;

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mouseleave", handleMouseUp); // Stop dragging if mouse leaves canvas

function handleMouseDown(e) {
  // Set mouse down state
  isMouseDown = true;
  car1.startMoving();
}

function handleMouseMove(e) {
  // Mouse move logic (currently not needed)
}

function handleMouseUp(e) {
  // Set mouse up state and stop car
  isMouseDown = false;
  car1.stopsMoving();
}

function display(dt) {
  // Position car at 10% along path on first frame (so it's visible)
  // if (firstFrame && racePath.loaded && racePath.scale) {
  //   const startPoint = racePath.getPointAtProgress(0.1, racePath.scale, racePath.yOffset);
  //   if (startPoint) {
  //     car1.setPosition(startPoint.x - car1.width / 2, startPoint.y - car1.height / 2);
  //     car1.setAngle(startPoint.angle);
  //     car1.progress = 0.04; // Set progress to match position
  //     firstFrame = false;
  //   }
  // }

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  newPath.draw(ctx);
  // Update all cars first
  if (newPath.loaded) {
    cars.forEach((car) => {
      car.update();

      const point = newPath.getPointAtDistance(car.positionAlongPath);
      car.setPosition(point.x, point.y);
    });
  }

  // Draw the race path with cars for occlusion
  //racePath.draw(ctx, canvas.width, canvas.height, cars);

  // Draw all cars on top
  cars.forEach((car) => {
    car.draw(ctx);
  });
}

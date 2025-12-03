import { createEngine } from "../_shared/engine.js";
import Voiture from "./car.js";
import Path from "./path.js";
import Path2 from "./path2.js";
// import { Spring } from "../_shared/spring.js"
// import Emoji from "./smiley.js"
// import Particle from "./particles.js"

const { renderer, run, finish } = createEngine();
const { ctx, canvas } = renderer;

// Speed threshold constant
const MAX_SPEED_ON_PATH = 23;

// Drawing zone variables - now as percentages (0 to 1)
const DRAW_ZONE_START_PERCENT = 0.29; // Start drawing at 20% along the path
const DRAW_ZONE_END_PERCENT = 0.45; // Stop drawing at 50% along the path
const DRAW_ZONE_2_START_PERCENT = 0.565; // Start drawing at 20% along the path
const DRAW_ZONE_2_END_PERCENT = 0.62; // Start drawing at 20% along the path

// Store total path distance
let totalPathDistance = 0;

// Store drawing progress for each zone
const drawingZones = [
  { start: DRAW_ZONE_START_PERCENT, end: DRAW_ZONE_END_PERCENT, maxDrawn: 0 },
  {
    start: DRAW_ZONE_2_START_PERCENT,
    end: DRAW_ZONE_2_END_PERCENT,
    maxDrawn: 0,
  },
];

let isPathFading = false;
let pathOpacity = 1;
const FADE_SPEED = 0.02; // Adjust this for faster/slower fade

// Create cars array
const cars = [];

// Function to create a new car at the start
function createNewCar() {
  const newCar = new Voiture(0, 0, canvas.width / 15);
  newCar.positionAlongPath = canvas.width / 6.4;
  return newCar;
}

// Create the initial car
cars.push(createNewCar());

// Create the race path
const newPath = new Path2();
newPath.loadPath("path.svg").then(() => {
  // Once path is loaded, get the total distance
  if (newPath.distances && newPath.distances.length > 0) {
    totalPathDistance = newPath.distances[newPath.distances.length - 1];
  }
});

// Start the animation loop
run(display);

// // Center the first car vertically after first frame
// let firstFrame = true;

// Track mouse state
let isMouseDown = false;

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mouseleave", handleMouseUp); // Stop dragging if mouse leaves canvas

function handleMouseDown(e) {
  // Set mouse down state
  isMouseDown = true;
  if (cars.length > 0) {
    cars[0].startMoving(); // Always control the first car in the array
  }
}

function handleMouseMove(e) {
  // Mouse move logic (currently not needed)
}

function handleMouseUp(e) {
  // Set mouse up state and stop car
  isMouseDown = false;
  if (cars.length > 0) {
    cars[0].stopsMoving(); // Always control the first car in the array
  }
}

// Function to check if car is out of bounds
function isCarOutOfBounds(car) {
  const margin = 200; // Give some margin before considering it out of bounds
  return (
    car.x < -margin ||
    car.x > canvas.width + margin ||
    car.y < -margin ||
    car.y > canvas.height + margin
  );
}

// Function to get which zone (if any) the car is in
function getCurrentZone(distance) {
  if (totalPathDistance === 0) return null;

  for (let i = 0; i < drawingZones.length; i++) {
    const zone = drawingZones[i];
    const startDistance = totalPathDistance * zone.start;
    const endDistance = totalPathDistance * zone.end;

    if (distance >= startDistance && distance <= endDistance) {
      return { index: i, startDistance, endDistance };
    }
  }
  return null;
}

function areAllZonesFullyDrawn() {
  if (totalPathDistance === 0) return false;

  return drawingZones.every((zone) => {
    const endDistance = totalPathDistance * zone.end;
    return zone.maxDrawn >= endDistance;
  });
}

function display(dt) {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw path with fading
  if (pathOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = pathOpacity;
    newPath.draw(ctx);
    ctx.restore();

    // Update fade
    if (isPathFading) {
      pathOpacity -= FADE_SPEED;
      if (pathOpacity <= 0) {
        pathOpacity = 0;
      }
    }
  }

  // Update all cars first
  if (newPath.loaded) {
    // Use a reverse loop to safely remove cars while iterating
    for (let i = cars.length - 1; i >= 0; i--) {
      const car = cars[i];
      const previousPosition = car.positionAlongPath;
      car.update();

      // Check if car should go off-road
      if (!car.isOffRoad && car.speed > MAX_SPEED_ON_PATH) {
        car.goOffRoad();
      }

      // Only update position/angle from path if still on road
      if (!car.isOffRoad) {
        const point = newPath.getPointAtDistance(car.positionAlongPath);
        const angle = newPath.getAngleAtDistance(car.positionAlongPath);
        car.setPosition(point.x, point.y);
        car.setAngle(angle.a);

        // Update drawing progress for current zone
        const currentZone = getCurrentZone(car.positionAlongPath);
        if (currentZone && car.speed > 0.1) {
          const zone = drawingZones[currentZone.index];
          // Update the max drawn distance for this zone
          zone.maxDrawn = Math.max(zone.maxDrawn, car.positionAlongPath);
        }
      }

      // Check if car is out of bounds (MOVED OUTSIDE)
      if (isCarOutOfBounds(car)) {
        // Check if all zones are fully drawn
        if (areAllZonesFullyDrawn()) {
          isPathFading = true; // Start fading
        }
        // Remove the old car
        cars.splice(i, 1);

        // Create and add a new car at the beginning of the array
        cars.unshift(createNewCar());

        console.log("Car respawned!");
      }
    }
  }

  // Draw all the red lines (from global array, persists across respawns)
  if (newPath.loaded && totalPathDistance > 0) {
    ctx.save();
    // ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "red";
    ctx.lineWidth = canvas.width / 25;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    drawingZones.forEach((zone) => {
      const startDistance = totalPathDistance * zone.start;
      const endDistance = Math.min(zone.maxDrawn, totalPathDistance * zone.end);

      if (endDistance > startDistance) {
        // Draw a continuous line from start to current progress
        ctx.beginPath();

        // Find the starting point
        const startPoint = newPath.getPointAtDistance(startDistance);
        if (startPoint) {
          ctx.moveTo(startPoint.x, startPoint.y);

          // Draw points along the path up to maxDrawn
          const step = 10; // Draw every 10 pixels for smooth line
          for (let d = startDistance + step; d <= endDistance; d += step) {
            const point = newPath.getPointAtDistance(d);
            if (point) {
              ctx.lineTo(point.x, point.y);
            }
          }

          // Draw the final point
          const finalPoint = newPath.getPointAtDistance(endDistance);
          if (finalPoint) {
            ctx.lineTo(finalPoint.x, finalPoint.y);
          }

          ctx.stroke();
        }
      }
    });

    ctx.restore();
  }

  // Draw all cars on top
  cars.forEach((car) => {
    car.draw(ctx);
  });
}

import { createEngine } from "../_shared/engine.js"
// import { Spring } from "../_shared/spring.js"
import Emoji from "./smiley.js"
import Particle from "./particles.js"

const { renderer, run, finish } = createEngine()
const { ctx, canvas } = renderer
run(display)


canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mouseleave", handleMouseUp); // Stop dragging if mouse leaves canvas

function display() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.restore();

}
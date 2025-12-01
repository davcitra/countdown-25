import { createEngine } from "../_shared/engine.js"
import { Spring } from "../_shared/spring.js"
import Smiley from "./smiley.js"

const { renderer, input, math, run, finish, } = createEngine()
const { ctx, canvas } = renderer
run(update)

const emoji_1 = new Smiley({
  number: 1,
  size: 50,
})

const emoji_2 = new Smiley({
  number: -1,
  size: 50,
})


function printMousePos(event) {
  // document.body.textContent =
  //   "clientX: " + event.clientX +
  //   " - clientY: " + event.clientY;

  console.log("clientX: " + event.clientX +
    " - clientY: " + event.clientY);
}

document.addEventListener("click", printMousePos);

function update(dt) {

  if (input.isPressed()) {
    spring.target = 1
  }
  else {
    spring.target = 1
  }
  spring.step(dt)

  const x = 3* canvas.width / 4;
  const y = canvas.height / 2;
  const scale = Math.max(spring.position/4, 0);
  // const scale = 100;

  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = "white"
  ctx.textBaseline = "middle"
  ctx.font = `${canvas.height}px Helvetica Neue, Helvetica , bold`
  ctx.textAlign = "center"
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.fillText("(:", 0, 0)

  if (scale <= 0) {
    finish()
  }

}

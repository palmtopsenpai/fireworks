/* Initialize Canvas */
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const c = canvas.getContext("2d"),
  iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
  touchOrClick = "ontouchstart" in window ? "touchstart" : "click";

/* Fixes width=0 bug for iOS */
function setSize() {
    canvas.width = iOS ? screen.width : window.innerWidth;
    canvas.height = iOS ? screen.height : window.innerHeight;
}

/* Constants */
const FRICTION = 0.95;
const GRAVITY = 0.5;
const TWOPI = Math.PI * 2;

/* Event Listeners */
window.addEventListener("load", setSize);

canvas.addEventListener(touchOrClick, e => {
  e.stopPropagation;
  e.preventDefault;
  if (touchOrClick === "click") {
    mainDisplay.addFirework(new Firework(e.clientX, e.clientY));
  } else {
    //Necessary for iOS...
    mainDisplay.addFirework(
      new Firework(e.touches[0].clientX, e.touches[0].clientY)
    );
  }
});

window.addEventListener("resize", setSize);

/* Utility */
function random(min, max) {
  return Math.random() * (max - min) + min;
}

function calcXVelocity(angle, denominator) {
  return Math.cos((TWOPI * angle) / denominator);
}

function calcYVelocity(angle, denominator) {
  return Math.sin((TWOPI * angle) / denominator);
}

function lerp(start, end, t) {
  //Linear interpolation (decelerates firework)
  return start * (1 - t) + end * t;
}

function buildHsla(color, alpha) {
  //Allows for alpha value to be modified
  let colorArr = color.split(", ");
  colorArr[3] = alpha;
  return colorArr.join(", ") + ")";
}

/* Main Classees */
class Firework {
  constructor(x, yTarget) {
    this.x = x;
    this.yTarget = yTarget;
    this.y = canvas.height; //Always starts at bottom
    this.isExploded = false;
    this.particleCount = Math.floor(random(8, 16));

    /* Speed, radius, and color are consistent across each particle created from a firework instance */
    this.speed = random(4, 8);
    this.radius = random(4, 6);
    this.color = "hsla(" + Math.floor(random(0, 360)) + ", 100%, 65%, 1)";
  }

  createExplosion() {
    for (let i = 0; i < this.particleCount; i++) {
      let dx = calcXVelocity(i, this.particleCount);
      let dy = calcYVelocity(i, this.particleCount);
      mainDisplay.addParticle(new Particle(this, dx, dy));
    }
    this.isExploded = true; //Flags firework for removal
  }

  update() {
    this.y = lerp(this.y, this.yTarget, 0.07);
    if (!this.isExploded && this.y < this.yTarget + 1) {
      this.createExplosion();
    }
  }

  draw() {
    c.fillStyle = this.color;
    c.fillRect(this.x, this.y, 4, 4);
  }
}

class Particle {
  constructor(firework, dx, dy) {
    this.dx = dx;
    this.dy = dy;

    this.x = firework.x;
    this.y = firework.y;
    this.alpha = 1;
    this.speed = firework.speed;
    this.radius = firework.radius;
    this.color = firework.color;
  }

  update() {
    this.speed *= FRICTION;
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed + GRAVITY;
    if (this.speed < 1) {
      this.alpha -= 0.01;
      this.color = buildHsla(this.color, this.alpha);
    }
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, TWOPI, false);
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
  }
}

class Display {
  //Manages arrays
  constructor() {
    this.fireworks = [];
    this.particles = [];
  }

  addFirework(firework) {
    this.fireworks.push(firework);
  }

  removeFirework(firework) {
    this.fireworks = this.fireworks.filter(x => x !== firework);
  }

  addParticle(particle) {
    this.particles.push(particle);
  }

  removeParticle(particle) {
    this.particles = this.particles.filter(x => x !== particle);
  }

  updateAll() {
    this.fireworks.map(firework => {
      firework.update();
      if (firework.isExploded) this.removeFirework(firework);
    });

    this.particles.map(particle => {
      particle.update();
      if (particle.alpha <= 0) this.removeParticle(particle);
    });
  }

  drawAll() {
    this.fireworks.map(firework => firework.draw());
    this.particles.map(particle => particle.draw());
  }
}

/* Animation */
const mainDisplay = new Display();

function animate() {
  requestAnimationFrame(animate);
  c.clearRect(0, 0, canvas.width, canvas.height);

  mainDisplay.drawAll();
  mainDisplay.updateAll();
}

animate();

const state = { sprites: [], bg_color: "black" };
const assets = {};

const camera = { x: 0, y: 0 }

function createEngine() {
  const canvas = document.createElement("canvas");
  canvas.id = "canvas";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // STATE.forEach((fn) => fn());
  }

  resize();
  window.addEventListener("resize", resize);

  return { canvas, ctx };
}


// Работа с загрузкой изображений
async function loadImage(path) {
  return new Promise((resolve, reject) => {
    if (assets[path]) return resolve(assets[path]);
    const img = new Image();
    img.src = path;
    img.onload = () => {
      assets[path] = img;
      resolve(img);
    }
    img.onerror = () => {
      reject(new Error("Failed to load: " + path));
    }
  })
}
async function loadAll(list) {
  await Promise.all(list.map(loadImage));
}

// Добавление спрайтов 
function addSprite(path, x, y, w, h) {
  state.sprites.push({ path, x, y, w, h });
}

function createRenderer(canvas, ctx, assets, state) {
  function render() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = state.bg_color;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    for (const s of state.sprites) {
      const img = assets[s.path];
      if (!img) continue;

      ctx.drawImage(img, s.x, s.y, s.w, s.h);
    }
  }

  return render;
}


function startLoop(render) {
  function loop() {
    // update();
    render();
    requestAnimationFrame(loop);
  }
  loop();
}

function update() {
  state.sprites[0].x += 1;
}


//Запуск и работа с мини-движком
const { canvas, ctx  } = createEngine();

const render = createRenderer(canvas, ctx, assets, state);
startLoop(render);

async function start() {
  await loadAll(["crab7.png", "tiles_03.png"]);

  // for (let i = 0; i < 20; i++) {
  //   for (let j = 0; j < 20; j++) {
  //     addSprite("tiles_03.png", i * 50, j * 50, 50, 50);
  //   }
  // }

  addSprite("crab7.png", 100, 100, 64, 64);
}

start();
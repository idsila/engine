const state = { 
  sprites: [], 
  
  blocks: [],
  enemys:[],
  interfaces:[],
  
  player: null, 
  bg_color: "black"
};
const assets = {};
const camera = { x: 0, y: 0, zoom:1};
const mouse = { x: 0, y: 0 };



function createEngine() {
  const canvas = document.createElement("canvas");
  canvas.id = "canvas";
  document.body.appendChild(canvas);
  canvas.style.touchAction = "none";
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
function addBlock(path, x, y, w, h) {
  state.blocks.push({ path, x, y, w, h, scaleX: 1, scaleY: 1 });
}

function addPlayer(path, x, y, w, h) {
  state.player = { path, x, y, w, h, scaleX: 1, scaleY: 1 };
}

function createRenderer(canvas, ctx, assets, state) {
  function render() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = state.bg_color;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    
    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    for (const s of state.blocks) {
      const img = assets[s.path];
      if (!img) continue;
      ctx.drawImage(img, s.x, s.y, s.w, s.h);
    }
    
    ctx.drawImage(assets[state.player.path], state.player.x, state.player.y, state.player.w, state.player.h);
    ctx.restore();
    
    


    
    
  }

  return render;
}


function startLoop(render) {
  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }
  loop();
}









//Запуск и работа с мини-движком
const { canvas, ctx  } = createEngine();


const render = createRenderer(canvas, ctx, assets, state);

function update() {
  const p = state.player;

  camera.x = p.x - canvas.clientWidth / 2 + p.w / 2;
  camera.y = p.y - canvas.clientHeight / 2 + p.h / 2;


  
  if (!p.target) return;
  const dx = p.target.x - p.x;
  const dy = p.target.y - p.y;

  const speed = 4;

  if (Math.abs(dx) <= speed) {
    p.x = p.target.x;
  } else {
    p.x += Math.sign(dx) * speed;
  }
  
  if (Math.abs(dy) <= speed) {
    p.y = p.target.y;
  } else {
    p.y += Math.sign(dy) * speed;
  }
}

async function start() {
  await loadAll(["crab7.png", "tiles_03.png", "flip3.png"]);

   for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      addBlock("tiles_03.png", i * 50, j * 50, 50, 50);
     }
   }

  state.player = createPlayer();
  

  startLoop(render);
}

start();




function createPlayer() {
  return {
    path: "crab7.png",
    x: 50,
    y: 50,
    w: 50,
    h: 50,
    speed: 3,
    scaleX: 1, scaleY: 1
  };
}

function movePlayerTo(x, y) {
  const tileSize = 50;

  const tileX = Math.floor(x / tileSize);
  const tileY = Math.floor(y / tileSize);

  state.player.target = {
    x: tileX * tileSize,
    y: tileY * tileSize
  };
}



canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;
  
  const worldX = screenX / camera.zoom + camera.x;
  const worldY = screenY / camera.zoom + camera.y;  

  for(const block of state.blocks){
    if(block.x <= worldX && block.x+block.w >= worldX && block.y <= worldY && block.y+block.h >= worldY ){
      movePlayerTo(worldX,worldY);

      break
    }
  }
});



let pinch = {
  active: false,
  startDistance: 0,
  startZoom: 1
};

function getDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}
canvas.style.touchAction = "none";

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 2) {
    pinch.active = true;
    pinch.startDistance = getDistance(e.touches);
    pinch.startZoom = camera.zoom;
  }
});


canvas.addEventListener("touchmove", (e) => {
  if (!pinch.active || e.touches.length !== 2) return;

  e.preventDefault();

  const dist = getDistance(e.touches);

  const scale = dist / pinch.startDistance;

  camera.zoom = pinch.startZoom * scale;

  camera.zoom = Math.max(0.3, Math.min(3, camera.zoom));
});

canvas.addEventListener("touchend", (e) => {
  if (e.touches.length < 2) {
    pinch.active = false;
  }
});


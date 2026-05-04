const state = { 
  sprites: [], 
  
  blocks: [],
  walls:[],
  enemys:[],
  interfaces:[],
  
  player: null, 
  playerContainer: null,
  bg_color: "black"
};


const assets = {};
const camera = { x: 0, y: 0, zoom:1, mode: "follow" };

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


function createSprite(img, x, y, w, h) {
  return { img, x, y, w, h };
}

function createRenderer(canvas, ctx, assets, state) {
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    //drawContainer(ctx, state.playerContainer);
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





function drawContainer(ctx, container) {
  ctx.save();
  ctx.translate(container.x, container.y);

  // 👉 применяем трансформацию контейнера
  ctx.scale(container.scaleX, container.scaleY);

  // 👉 рисуем всех детей
  for (const child of container.children) {
    //ctx.save();
    //ctx.translate(container.x, container.y);

    //ctx.scale(container.scaleX, container.scaleY);

    ctx.drawImage(child.img, child.x, child.y, child.w, child.h);
    //ctx.restore();

  }
  
  ctx.restore();
  

}







//Запуск и работа с мини-движком
const { canvas, ctx  } = createEngine();


const render = createRenderer(canvas, ctx, assets, state);

function update() {
  const p = state.player;

  if(camera.mode == "follow"){
    camera.x = p.x - canvas.clientWidth/camera.zoom / 2 + p.w / 2;
    camera.y = p.y - canvas.clientHeight/camera.zoom/ 2 + p.h / 2;
  }
  
  
  if (!p.target) return;
  const dx = p.target.x - p.x;
  const dy = p.target.y - p.y;

  const { speed } = state.player;

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


function createContainer(x = 0, y = 0) {
  return {
    x,
    y,
    scaleX: 1,
    scaleY: 1,
    children: []
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
  camera.mode = "follow";
  
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

let drag = {
  active: false,
  lastX: 0,
  lastY: 0
};

function getDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}
canvas.style.touchAction = "none";

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    drag.active = true;
    drag.lastX = e.touches[0].clientX;
    drag.lastY = e.touches[0].clientY;
    camera.mode = "free";
  }
  if (e.touches.length === 2) {
    pinch.active = true;
    pinch.startDistance = getDistance(e.touches);
    pinch.startZoom = camera.zoom;
    camera.mode = "free";
  }
});

canvas.addEventListener("touchmove", (e) => {
  if (pinch.active) return;
  if (!drag.active || e.touches.length !== 1) return
  const x = e.touches[0].clientX;
  const y = e.touches[0].clientY;

  const dx = x - drag.lastX;
  const dy = y - drag.lastY;
  console.log(dx, dy)

  camera.x -= dx / camera.zoom;
  camera.y -= dy / camera.zoom;

  drag.lastX = x;
  drag.lastY = y;
});




canvas.addEventListener("touchmove", (e) => {
  if (!pinch.active || e.touches.length !== 2) return;
  e.preventDefault();
  
  const rect = canvas.getBoundingClientRect();
  const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
  const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
  
  
  
  const worldX_before = centerX / camera.zoom + camera.x;
  const worldY_before = centerY / camera.zoom + camera.y;
  
  
  const dist = getDistance(e.touches);
  const scale = dist / pinch.startDistance;
  camera.zoom = pinch.startZoom * scale;
  camera.zoom = Math.max(0.001, Math.min(500, camera.zoom));
  
  camera.x = worldX_before - centerX / camera.zoom;
  camera.y = worldY_before - centerY / camera.zoom;  
});

canvas.addEventListener("touchend", (e) => {
  if (e.touches.length < 2) {
    pinch.active = false;
    drag.active = false;
  }
});



canvas.addEventListener("touchend", (e) => {
  if (e.touches.length === 0) {
    drag.active = false;
  }
});
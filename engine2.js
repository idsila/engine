class Application {
  
  constructor(){
    this.ctx = null;
    this.canvas = null;
    this.dpr = 1;
    this.width = 0;
    this.height = 0;
  
    this.bgColor = "black";
    this.assets = {};
  
    this.stage = new Container();
  
    this.tickers = [];
    this.events = {};
    
    this.propagation = true;
  
    this.#initApp();
    
  }
  
  #initApp(){
    this.canvas = document.createElement("canvas");
    this.canvas.id = "canvas";
    document.body.appendChild(this.canvas);
    this.canvas.style.touchAction = "none";
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => {  this.resize() });
    
    this.ticker = {
      add: (callback) =>{
        this.tickers.push(callback);
      }
    } 

    
    this.addEvent("click", "main", (event) => {
      this.find(event, event.clientX, event.clientY);
      // console.log(e.clientX, e.clientY)
    })

  }
  
  resize() {
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }
  
  // Загрузка Изображений 
  async loadImage(path) {
    return new Promise((resolve, reject) => {
      if (this.assets[path]) return resolve(this.assets[path]);
      const img = new Image();
      img.src = path;
      img.onload = () => {
        this.assets[path] = img;
        resolve(img);
      }
      img.onerror = () => {
        reject(new Error("Failed to load: " + path));
      }
    })
  }
  async loadAll(list) {
    await Promise.all(list.map((path) => this.loadImage(path) ));
  }
  
  
  
  
  // Цикл для жизни приложения и отрисовки
  startLoop(update) {
    const loop = () => {
      this.clear();
      update();
      this.render();
      this.tickers.forEach(fn => fn())
      requestAnimationFrame(loop);
    };
    loop();
  }  
  
  
  // Очистака кадра
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }
  
  
  // Добавление и удаление эвентов 
  addEvent(type, name, callback){
    const path = `${type}/${name}`;
    if(this.events[path]) return;
    const bound = callback.bind(this);
    this.events[path] = bound;
    this.canvas.addEventListener(type, bound);
  }
  removeEvent(type, name) {
    const path = `${type}/${name}`;
    const callback = this.events[path];
    if (!callback) return;
    this.canvas.removeEventListener(type, callback);
    delete this.events[path];
  }
  
  
  
  
  addChild(entity) {
    this.stage.addChild(entity);
  }
  render(){
    this.quantityStage = 0;
    this.renderObject(this.stage);
  }
  renderObject2(obj) {
    this.quantityStage+=1;
    
    const ctx = this.ctx;
    ctx.save();
  
    // 👉 применяем трансформацию объекта
    
    
    ctx.translate(obj.position.x, obj.position.y);
    ctx.rotate(obj.rotation);
    ctx.scale(obj.scale.x, obj.scale.y);
    const offsetX = obj.width * obj.anchor.x;
    const offsetY = obj.height * obj.anchor.y;


    // 👉 рисуем сам объект
    if (obj?.resource) {
      
      ctx.drawImage(obj.resource, -offsetX, -offsetY, obj.width, obj.height);
    }
  
    // 👉 рисуем детей (уже в системе координат родителя!)
    for (const child of obj.children) {
      this.renderObject(child);
    }
  
    ctx.restore();
  }
  renderObject(obj) {
  const ctx = this.ctx;
  ctx.save();
  
  const ax = obj.width * obj.anchor.x;
  const ay = obj.height * obj.anchor.y;
  
  ctx.translate(
  obj.position.x - ax * obj.scale.x,
  obj.position.y - ay * obj.scale.y
);
ctx.scale(obj.scale.x, obj.scale.y);
// после НЕ надо дополнительно сдвигать  
  if (obj?.resource) {
    ctx.drawImage(obj.resource, 0, 0, obj.width, obj.height);
  }
  
  for (const child of obj.children) {
    this.renderObject(child);
  }
  
  ctx.restore();
}
  
  // Поиск элемента на который я нажал
  find2(event, x = 0, y = 0){
    this.propagation = true;
    for (const obj of this.stage.children.toReversed()) {
      this.findObject(event, x, y, obj);
    }
  }
  findObject2(event, x, y, obj, transform = { x: 0, y: 0, scaleX: 1, scaleY: 1 }){
    if(this.propagation){
      // Мв не учитываем rotation то есть поворот
    
      const placeX =
  transform.x +
  obj.position.x * transform.scaleX;

const placeY =
  transform.y +
  obj.position.y * transform.scaleY;

const nextTransform = {
  x: placeX,
  y: placeY,
  scaleX: transform.scaleX * obj.scale.x,
  scaleY: transform.scaleY * obj.scale.y
};

const anchorX = obj.anchor.x * obj.width;
const anchorY = obj.anchor.y * obj.height;

const x1 = -anchorX;
const x2 = x1 + obj.width;

const y1 = -anchorY;
const y2 = y1 + obj.height;

const realX1 = x1 * nextTransform.scaleX;
const realX2 = x2 * nextTransform.scaleX;

const realY1 = y1 * nextTransform.scaleY;
const realY2 = y2 * nextTransform.scaleY;

const left =
  Math.min(realX1, realX2) + placeX;

const right =
  Math.max(realX1, realX2) + placeX;

const top =
  Math.min(realY1, realY2) + placeY;

const bottom =
  Math.max(realY1, realY2) + placeY;

if (
  x >= left &&
  x <= right &&
  y >= top &&
  y <= bottom
) {
        obj.events.forEach((obj) => {
          if(obj.type === event.type){
            obj.callback(event);
          }
        });
        if(!obj.propagation){
          this.propagation = false;
          return 0;
        }
      }
    

    for (const child of obj.children.toReversed()) {
      this.findObject(event, x, y,  child, nextTransform);
    }

    
    }
  }
  
  
  
  computeWorldTransform(obj, parent) {
  const scaleX = parent.scaleX * obj.scale.x;
  const scaleY = parent.scaleY * obj.scale.y;
  
  const x = parent.x + obj.position.x * parent.scaleX;
  const y = parent.y + obj.position.y * parent.scaleY;
  
  return {
    x,
    y,
    scaleX,
    scaleY
  };
}



findObject3(event, x, y, obj, t = { x: 0, y: 0, sx: 1, sy: 1 }) {
  if (!this.propagation) return;
  
  // --- world position (как в render translate)
  const worldX = t.x + obj.position.x * t.sx;
  const worldY = t.y + obj.position.y * t.sy;
  
  // --- accumulate scale (как в render scale)
  const sx = t.sx * obj.scale.x;
  const sy = t.sy * obj.scale.y;
  
  // --- anchor В МИРЕ
  const ax = obj.anchor.x * obj.width;
  const ay = obj.anchor.y * obj.height;
  
  // --- базовый rect в local space
  let left = -ax;
  let top = -ay;
  let right = left + obj.width;
  let bottom = top + obj.height;
  
  // --- scale transform rect (ВАЖНО: как canvas)
  const x1 = left * sx;
  const x2 = right * sx;
  const y1 = top * sy;
  const y2 = bottom * sy;
  
  left = Math.min(x1, x2) + worldX;
  right = Math.max(x1, x2) + worldX;
  top = Math.min(y1, y2) + worldY;
  bottom = Math.max(y1, y2) + worldY;
  
  // --- HIT TEST
  if (x >= left && x <= right && y >= top && y <= bottom) {
    
    for (const e of obj.events) {
      if (e.type === event.type) {
        e.callback(event);
      }
    }
    
    // propagation как у тебя
    if (!obj.propagation) {
      this.propagation = false;
      return;
    }
  }
  
  // --- children
  for (const child of obj.children.toReversed()) {
    this.findObject(event, x, y, child, {
      x: worldX,
      y: worldY,
      sx,
      sy
    });
  }
}
  
  
  
  
  
  find(event, x = 0, y = 0) {
  this.propagation = true;
  this.findObject(event, x, y, this.stage, 0, 0, 1, 1);
}

findObject(event, x, y, obj, parentWorldX = 0, parentWorldY = 0, parentScaleX = 1, parentScaleY = 1) {
  if (!this.propagation) return;
  
  // Мировая позиция локального (0,0) объекта
  const worldX = parentWorldX + obj.position.x * parentScaleX;
  const worldY = parentWorldY + obj.position.y * parentScaleY;
  const scaleX = parentScaleX * obj.scale.x;
  const scaleY = parentScaleY * obj.scale.y;
  
  // Преобразуем точку мыши в локальные координаты объекта (без учёта anchor)
  let localX = (x - worldX) / scaleX;
  let localY = (y - worldY) / scaleY;
  
  // Применяем anchor (смещение начала координат)
  const localWithAnchorX = localX + obj.anchor.x * obj.width;
  const localWithAnchorY = localY + obj.anchor.y * obj.height;
  
  // Проверяем попадание в прямоугольник [0, width] × [0, height]
  if (localWithAnchorX >= 0 && localWithAnchorX <= obj.width &&
    localWithAnchorY >= 0 && localWithAnchorY <= obj.height) {
    
    // Вызываем все обработчики события на объекте
    for (const e of obj.events) {
      if (e.type === event.type) {
        e.callback(event);
      }
    }
    
    // Останавливаем распространение, если нужно
    if (!obj.propagation) {
      this.propagation = false;
      return;
    }
  }
  
  // Рекурсивно проверяем детей (в обратном порядке для zIndex)
  for (const child of obj.children.slice().reverse()) {
    this.findObject(event, x, y, child, worldX, worldY, scaleX, scaleY);
    if (!this.propagation) break;
  }
}
  
  
  // Отрисовка сцен
  drawScene(array){
    
  }
  removeScene(){
    this.tickers = [];
  }
}



class Container {
  constructor(){
    this.width = 0;
    this.height = 0;
    this.rotation = 0;
    this.propagation = true;
    this.scale = { x: 1, y: 1 };
    this.position = { x: 0, y: 0 };
    this.anchor = { x: 0, y: 0 };
    this.zIndex = 1;
    this.events = [];
    this.children = [];
    this.stage = {};
    return this;
  }
  
  
  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }
  setScale(x, y) {
    this.scale.x = x;
    this.scale.y = y;
  }
  setAnchor(x, y) {
    this.anchor.x = x;
    this.anchor.y = y;
  }
  stopPropagation(){
    this.propagation = false;
  }

  on(type, callback){
    this.events.push({ type, callback });
  }
  
  
  addChild(entity) {
    this.children.push(entity);
    this.children.sort((a, b) => {
      return a.zIndex - b.zIndex;
    });
  }
}


class Sprite extends Container{
  constructor(resource){
    super();
    this.resource = resource;
  }
}








let player, playerBox = null;
let app = null;

async function startGame(param) {
  app = new Application();
  await app.loadAll(["crab7.png", "tiles_03.png", "flip3.png"])
  
  const camera = new Container();
  camera.setPosition(0, 0);
  camera.setScale(1, 1);
  camera.setAnchor(0, 0);
  
  world = new Container();
  camera.addChild(world);
  app.addChild(camera);

  const s = new Sprite(app.assets["flip3.png"]);
  s.zIndex = 2;
  s.setPosition(0,0);
  
  s.width = 100;
  s.height = 100;
  world.addChild(s);


  const s1 = new Sprite(app.assets["tiles_03.png"]);
  s1.zIndex = 3;
  s1.setPosition(0, 0);
  s1.width = 100;
  s1.height = 100;
  
  s1.on("click",(e) => {
    //playerBox.position.x++;
    console.log("sprite1")
  })
  
  world.addChild(s1);
  
  
  // playerBox = new Container();
  playerBox = new Sprite(app.assets["tiles_03.png"]);

  playerBox.zIndex = 30;
  playerBox.setPosition(200, 200);
  playerBox.width = 100;
  playerBox.height = 100;
  playerBox.setAnchor(0.5, 0.5)
  playerBox.setScale(-1, 1);
  

  playerBox.stopPropagation();

  player = new Sprite(app.assets["crab7.png"]);
  player.width = 100;
  player.height = 100;
  player.setPosition(0, 0);
  player.setScale(1, 1);
  
  // player.setAnchor(0.5, 0.5)
  //player.setScale(-1, 1);
  playerBox.on("click",(e) => {
    //playerBox.position.x++;
    console.log("playerBox")
  })
  
  player.on("click",(e) => {
    //playerBox.position.x++;
    console.log("player")
  })
  
  
  playerBox.addChild(player);
  world.addChild(playerBox);

  app.ticker.add(() => {
  })


  
  
  app.startLoop(() => {
    //player.position(player._position.x+1, 0)
  })
}
startGame()

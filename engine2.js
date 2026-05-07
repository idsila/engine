class Application {
  ctx = null;
  canvas = null;
  dpr = 1;
  width = 0;
  height = 0;
  
  bgColor = "black";
  assets = {};
  
  
  stage = {};
  levels = [];
  
  tickers = [];
  events = {};
  
  
  constructor(){
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
  
  
  addChild(entity){
    if(!this.stage[entity.zIndex]) {
      this.stage[entity.zIndex] = [];
      this.stage[entity.zIndex].push(entity);
    } else {
      this.stage[entity.zIndex].push(entity);
    }
    this.levels = Object.keys(this.stage).sort((a, b) => {
      if (a * 1 > b * 1) return 1
      if (a * 1 == b * 1) return 0
      if (a * 1 < b * 1) return -1
    });
  }
  render(){
    for(const id of this.levels){
      for (const obj of this.stage[id]) {
        this.renderObject(obj);
      }
    }
  }
  renderObject(obj) {
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
  
  
  // Поиск элемента на который я нажал
  find(event, x = 0, y = 0){
    for (const id of this.levels.toReversed()) {
      for (const obj of this.stage[id]) {
        this.findObject(event, x, y, obj);
      }
    }
  }
  findObject(event, x, y, obj, parent = { position: { x: 0, y:0 }, scale: { x: 1, y: 1 }}){
    // У нас на изменение позиции влияет scale anchor

    if(obj.position.x + parent.position.x <= x && obj.position.x+parent.position.x+obj.width >= x && obj.position.y+parent.position.y <= y && obj.position.y+parent.position.y+obj.height >= y){
      // console.log(x,(obj.position.x <= x && obj.position.x+obj.width >= x), y, (obj.position.y <= y && obj.position.y+obj.height >= y),' ___ ', obj.position.x, obj.position.y)
      //obj.rotation = 0.5;
      obj.events.forEach((fn) => {
        fn(event);
      });
      // console.log(obj.events)
    }
    for (const child of obj.children) {
      this.findObject(event, x, y,  child, obj);
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
  width =  0;
  height = 0;
  rotation = 0;
  scale = { x: 1, y: 1 };
  position = { x: 0, y: 0 };
  anchor = { x: 0, y: 0 }; 
  zIndex = 1;
  events = [];
  children = [];
  
  
  constructor(){
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

  on(callback){
    this.events.push(callback);
    // Тут логика 
  }
  addChild(entity){
    this.children.push(entity);
  }
  
}


class Sprite extends Container{
  resource = null;
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
  
  const world = new Container();
  camera.addChild(world);
  app.addChild(camera);

  const s = new Sprite(app.assets["flip3.png"]);
  s.zIndex = 2;
  s.setPosition(0,0);
  
  s.width = 100;
  s.height = 100;
  world.addChild(s);


  const s1 = new Sprite(app.assets["flip3.png"]);
  s1.zIndex = 3;
  s1.setPosition(100, 0);
  s1.width = 100;
  s1.height = 100;
  world.addChild(s1);
  
  
  // playerBox = new Container();
  playerBox = new Sprite(app.assets["tiles_03.png"]);

  playerBox.zIndex = 30;
  playerBox.setPosition(100, 100);
  playerBox.width = 100;
  playerBox.height = 100;

  player = new Sprite(app.assets["crab7.png"]);
  player.width = 100;
  player.height = 100;
  player.setPosition(0, 0);
  player.setScale(1, 1);
  // player.setAnchor(0.5, 0.5)
  //player.setScale(-1, 1);
  player.on((e) => {
    
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

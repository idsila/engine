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
    
    this.input = {
      x: 0,
      y: 0,

      down: false,
      pressed: false,
      released: false,

      hovered: null,
      focused: null,

      touches: []
    }
  
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

    
    this.initInputEvents();
  }
  
  initInputEvents() {
  
  // Палец / мышь двигается
  this.canvas.addEventListener("pointermove", (e) => {
    
    this.input.x = e.clientX;
    this.input.y = e.clientY;
    
  });
  
  
  // Нажатие
  this.canvas.addEventListener("pointerdown", (e) => {
    
    this.input.x = e.clientX;
    this.input.y = e.clientY;
    
    this.input.down = true;
    
    // pressed = только 1 кадр
    this.input.pressed = true;
    
  });
  
  
  // Отжатие
  this.canvas.addEventListener("pointerup", (e) => {
    
    this.input.x = e.clientX;
    this.input.y = e.clientY;
    
    this.input.down = false;
    
    // released = только 1 кадр
    this.input.released = true;
    
  });
  
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
      this.updateInput()
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
  renderObject(obj) {
    const ctx = this.ctx;
    ctx.save();
  
    const ax = obj.width * obj.anchor.x;
    const ay = obj.height * obj.anchor.y;
  
    ctx.translate(obj.position.x - ax * obj.scale.x, obj.position.y - ay * obj.scale.y);
    ctx.scale(obj.scale.x, obj.scale.y);

    if (obj?.resource) {
      ctx.drawImage(obj.resource, 0, 0, obj.width, obj.height);
    }
  
    for (const child of obj.children) {
      this.renderObject(child);
    }
  
    ctx.restore();
  }
  
  // updateInput
  updateInput() {
    // Ищем объект под курсором
    const hovered = this.findTopObject(this.input.x, this.input.y);
  
  
    // =========================================
    // HOVER SYSTEM
    // =========================================
  
    // Если объект под курсором изменился
    if (hovered !== this.input.hovered) {
    
      // Старый объект покинут
      if (this.input.hovered) {
      
        this.dispatchEvent(this.input.hovered, "pointerleave");
      
      }
    
      // Новый объект наведен
      if (hovered) {
      
        this.dispatchEvent(hovered, "pointerenter");
      
      }
    
      this.input.hovered = hovered;
    }
  
  
    // =========================================
    // POINTER MOVE
    // =========================================
  
    if (hovered) {
    
      this.dispatchEvent(hovered, "pointermove");
    
    }
  
  
    // =========================================
    // POINTER DOWN
    // =========================================
  
    if (this.input.pressed) {
    
      if (hovered) {
      
        // Запоминаем кто был нажат
        this.input.target = hovered;
      
        this.dispatchEvent(hovered, "pointerdown");
      
      }
    
    }
  
  
    // =========================================
    // POINTER UP
    // =========================================
  
    if (this.input.released) {
    
      if (this.input.target) {
      
        this.dispatchEvent(this.input.target, "pointerup");
      
      
        // CLICK
        // Если нажали и отпустили на одном объекте
        if (hovered === this.input.target) {
          this.dispatchEvent( hovered, "click");
        }
      
      }
    
      this.input.target = null;
    
    }
  
  
    // =========================================
    // RESET FRAME FLAGS
    // =========================================
  
    this.input.pressed = false;
    this.input.released = false;
  
  }


  findTopObject(x, y) {
    // reverse потому что верхние объекты
    // обычно последние в массиве
  
    for (const obj of this.stage.children.toReversed()) {
      const found = this.findObject(x, y, obj);
      if (found) {
        return found;
      }
    }
  
    return null;
  }

  findObject(x, y, obj, t = { x: 0, y: 0, sx: 1, sy: 1 }) {
  
  // =========================================
  // WORLD TRANSFORM
  // =========================================
  
  const ax = obj.anchor.x * obj.width;
  const ay = obj.anchor.y * obj.height;
  
  const sx = t.sx * obj.scale.x;
  const sy = t.sy * obj.scale.y;
  
  const nextX =
    t.x +
    (obj.position.x - ax * obj.scale.x) * t.sx;
  
  const nextY =
    t.y +
    (obj.position.y - ay * obj.scale.y) * t.sy;
  
  
  // =========================================
  // CHILDREN FIRST
  // =========================================
  
  // Сначала проверяем детей
  // потому что они визуально сверху
  
  for (const child of obj.children.toReversed()) {
    
    const found = this.findObject(
      x,
      y,
      child,
      {
        x: nextX,
        y: nextY,
        sx,
        sy
      }
    );
    
    if (found) {
      return found;
    }
    
  }
  
  
  // =========================================
  // HIT TEST
  // =========================================
  
  let left = nextX;
  let top = nextY;
  
  let right = nextX + obj.width * sx;
  let bottom = nextY + obj.height * sy;
  
  
  // negative scale support
  
  if (left > right) {
    [left, right] = [right, left];
  }
  
  if (top > bottom) {
    [top, bottom] = [bottom, top];
  }
  
  
  // =========================================
  // OBJECT FOUND
  // =========================================
  
  if (
    x >= left &&
    x <= right &&
    y >= top &&
    y <= bottom
  ) {
    
    return obj;
    
  }
  
  return null;
}

  dispatchEvent(target, type) {
    const event = {
      type,
      target,
      stopped: false,
      stopPropagation() {
        this.stopped = true;
      }
    };
  
  
    let current = target;
    
    // bubbling вверх по дереву
    while (current) {
    
      current.emit(type, event);
      if (event.stopped) {
        break;
      }
      current = current.parent;
    }
  }
  
  
  
  
  
  // Поиск элемента на который я нажал
  findOld(event, x = 0, y = 0){
    this.propagation = true;
    for (const obj of this.stage.children.toReversed()) {
      this.findObject(event, x, y, obj);
    }
  }
  findObjectOld(event, x, y, obj, t = { x: 0, y: 0, sx: 1, sy: 1 }) {
    if (!this.propagation) return;
    // console.log(event.type)
    //console.log("event" ,  event.clientX, event.touches)


    // --- anchor в local
    const ax = obj.anchor.x * obj.width;
    const ay = obj.anchor.y * obj.height;

    // --- accumulate scale (как в render scale)
    const sx = t.sx * obj.scale.x;
    const sy = t.sy * obj.scale.y;

    // --- world translate, строго как в renderObject (translate с anchor*scale)
    const nextX = t.x + (obj.position.x - ax * obj.scale.x) * t.sx;
    const nextY = t.y + (obj.position.y - ay * obj.scale.y) * t.sy;



    // --- базовый rect в local space (как в renderObject: drawImage от 0,0)
    let left = 0;
    let top = 0;
    let right = obj.width;
    let bottom = obj.height;
  
    // --- scale transform rect (ВАЖНО: как canvas)
    const x1 = left * sx;
    const x2 = right * sx;
    const y1 = top * sy;
    const y2 = bottom * sy;
  
    left = Math.min(x1, x2) + nextX;
    right = Math.max(x1, x2) + nextX;
    top = Math.min(y1, y2) + nextY;
    bottom = Math.max(y1, y2) + nextY;
  
  
   
    // --- HIT TEST
    if (x >= left && x <= right && y >= top && y <= bottom) {
      // console.log(obj.title, ": ", obj.events);   
      
      for (const e of obj.events) {
        // console.log("OBJ", e.type, " === ", event.type)
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
        x: nextX,
        y: nextY,
        sx,
        sy
      });
    }
  }

  // event
  findEvent(event){
    console.log('event')
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
    this.title = null;
    this.width = 0;
    this.height = 0;
    this.rotation = 0;
    this.propagation = true;
    this.scale = { x: 1, y: 1 };
    this.position = { x: 0, y: 0 };
    this.anchor = { x: 0, y: 0 };
    this.zIndex = 1;
    this.events = new Map();
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

  on(type, callback) {
    if (!this.events.has(type)) {
      this.events.set(type, []);
    }
    this.events.get(type).push(callback);
  }
  
  emit(type, event) {
    const listeners = this.events.get(type);
    if (!listeners) return;
    for (const callback of listeners) {
      callback(event);
    }
  }

  
  
  addChild(entity) {
    entity.parent = this;
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

async function startGame() {
  app = new Application();
  await app.loadAll(["crab7.png", "tiles_03.png", "flip3.png"])
  
  const camera = new Container();
  camera.title = "camera";
  camera.setPosition(0, 0);
  camera.setScale(1, 1);
  camera.setAnchor(0, 0);
  
  world = new Container();
  world.title = "world";
  camera.addChild(world);
  app.addChild(camera);

  const s = new Sprite(app.assets["flip3.png"]);
  s.title = "s";
  s.zIndex = 2;
  s.setPosition(0,0);
  
  s.width = 100;
  s.height = 100;
  world.addChild(s);


  const s1 = new Sprite(app.assets["tiles_03.png"]);
  s1.title = "s1";
  s1.zIndex = 3;
  s1.setPosition(0, 0);
  s1.width = 100;
  s1.height = 100;
  
  s1.on("pointerenter",(e) => {
    //playerBox.position.x++;
    console.log("pointerenter: sprite1")
  })
  
  world.addChild(s1);
  
  
  // playerBox = new Container();
  playerBox = new Sprite(app.assets["tiles_03.png"]);
  playerBox.title = "playerBox";
  playerBox.zIndex = 30;
  playerBox.setPosition(100, 100);
  playerBox.width = 100;
  playerBox.height = 100;
  playerBox.setAnchor(0, 0)
  playerBox.setScale(1, 1);
  
  

  playerBox.stopPropagation();

  player = new Sprite(app.assets["crab7.png"]);
  player.title = "player";
  player.width = 100;
  player.height = 100;
  player.setPosition(50, 50);
  player.setAnchor(0.5, 0.5)
  player.setScale(1, 1);
  //player.stopPropagation();
  
  // player.setAnchor(0.5, 0.5)
  //player.setScale(-1, 1);
  playerBox.on("click",(e) => {
    console.log("click: playerBox ")
  })
  
  
  player.on("click",(e) => {
  //   //playerBox.position.x++;
     console.log("click: player")
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

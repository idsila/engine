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
    
    this.camera = { position:{x:0,y:0}, scale:{x:1,y:1} }  
    
    this.place = new Container();
    this.stage.addChild(this.place);
    
    this.ui = new Container();
    this.stage.addChild(this.ui);
    
    
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
  
  
  getCameraTransform() {
    return {
      x: this.camera.position.x,
      y: this.camera.position.y,
      scaleX: this.camera.scale.x,
      scaleY: this.camera.scale.y
    };
  }
  
  screenToWorld(x, y) {
  return {
    x: x / this.camera.scale.x + this.camera.position.x,
    y: y / this.camera.scale.y + this.camera.position.y
  };
}
  
  follow(target, smooth = 0.1) {
  const tx = target.world.x - this.width / 2;
  const ty = target.world.y - this.height / 2;
  
  this.camera.position.x += (tx - this.camera.position.x) * smooth;
  this.camera.position.y += (ty - this.camera.position.y) * smooth;
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
    let last = performance.now();
    const loop = (now) => {
      
      const delta = (now - last) / 1000;
      last = now;
      
      this.delta = delta
      
      this.clear();
      
      update(delta);
      this.updateTransforms(this.stage);
      this.updateInput();
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
  render() {
  const cam = this.camera;
  
  // 1. WORLD PASS (с камерой)
  this.ctx.save();
  this.ctx.scale(cam.scale.x, cam.scale.y);
  this.ctx.translate(-cam.position.x, -cam.position.y);
  
  this.renderObject(this.place);
  
  this.ctx.restore();
  
  // 2. UI PASS (без камеры)
  this.ctx.save();
  this.renderObject(this.ui);
  this.ctx.restore();
}
  renderObject(obj) {
  const ctx = this.ctx;
  
  if (obj.resource) {
    ctx.drawImage(
  obj.resource,
  obj.frame.x,
  obj.frame.y,
  obj.frame.width,
  obj.frame.height,
  
  obj.world.x,
  obj.world.y,
  obj.width * obj.world.scaleX,
  obj.height * obj.world.scaleY
);
  }
  
  for (const child of obj.children) {
    this.renderObject(child);
  }
}
  
  // updateInput
  updateInput() {
    // Ищем объект под курсором
    const world = this.screenToWorld(this.input.x, this.input.y);
    const hovered = this.findTopObject(world.x, world.y);
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

  findObject(x, y, obj) {
  
  for (const child of obj.children.toReversed()) {
    
    const found =
      this.findObject(x, y, child);
    
    if (found) {
      return found;
    }
    
  }
  
  
  if (this.hitTest(obj, x, y)) {
    return obj;
  }
  
  return null;
}
  
  
  hitTest(obj, x, y) {
  
  let left = obj.world.x;
  let top = obj.world.y;
  
  let right =
    left +
    obj.width * obj.world.scaleX;
  
  let bottom =
    top +
    obj.height * obj.world.scaleY;
  
  
  if (left > right) {
    [left, right] = [right, left];
  }
  
  if (top > bottom) {
    [top, bottom] = [bottom, top];
  }
  
  
  return (
    x >= left &&
    x <= right &&
    y >= top &&
    y <= bottom
  );
  
}


  dispatchEvent(target, type) {
    const event = {
      type,
      target,
      x: this.input.x,
      y: this.input.y,
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
  
  // updTrans
  updateTransforms(
  obj,
  parent = {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1
  }
) {
  
  // =====================================
  // LOCAL
  // =====================================
  
  const ax = obj.anchor.x * obj.width;
  const ay = obj.anchor.y * obj.height;
  
  
  // =====================================
  // WORLD SCALE
  // =====================================
  
  obj.world.scaleX =
    parent.scaleX * obj.scale.x;
  
  obj.world.scaleY =
    parent.scaleY * obj.scale.y;
  
  
  // =====================================
  // WORLD POSITION
  // =====================================
  
  obj.world.x =
    parent.x +
    (
      obj.position.x -
      ax * obj.scale.x
    ) * parent.scaleX;
  
  
  obj.world.y =
    parent.y +
    (
      obj.position.y -
      ay * obj.scale.y
    ) * parent.scaleY;
  
  
  // =====================================
  // CHILDREN
  // =====================================
  
  for (const child of obj.children) {
    
    this.updateTransforms(
      child,
      {
        x: obj.world.x,
        y: obj.world.y,
        
        scaleX: obj.world.scaleX,
        scaleY: obj.world.scaleY
      }
    );
    
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
    this.title = null;
    this.width = 0;
    this.height = 0;
    this.rotation = 0;
    this.scale = { x: 1, y: 1 };
    this.position = { x: 0, y: 0 };
    this.anchor = { x: 0, y: 0 };
    this.zIndex = 1;
    this.events = new Map();
    this.parent = null;
    this.children = [];
    this.stage = {};
    
    this.world = {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1
    };
    
    
    
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
    this.frame = {
      x: 0,
      y: 0,
      width: resource ? resource.width : 0,
      height: resource ? resource.height : 0
    };
    this.width = this.frame.width;
    this.height = this.frame.height;
  }
  setFrame(x, y, width, height) {
    this.frame.x = x;
    this.frame.y = y;
    this.frame.width = width;
    this.frame.height = height;
  }
  
}



class Tilemap extends Container {
  
  constructor(texture, tileSize = 16) {
    super();
    this.texture = texture;
    this.tileSize = tileSize;
    this.map = [];
  }
  setMap(map) {
    this.map = map;
    this.buildMap();
  }
  
  buildMap() {
    this.children = [];
    for (let y = 0; y < this.map.length; y++) {
    
      for (let x = 0; x < this.map[y].length; x++) {
      
        const id = this.map[y][x];
      
        const tile = new Sprite(this.texture);
      
        tile.width = this.tileSize;
        tile.height = this.tileSize;
      
        tile.setPosition(x * this.tileSize, y * this.tileSize );
      
        // FLOOR
        if (id === 0) {
          tile.setFrame(16*6, 0,16,16);
        }
      
        // WALL
        if (id === 1) {
          tile.setFrame(0,16*4,16,16);
        }
      
        this.addChild(tile);
      }
    }
  }
  
}







let player, playerBox = null;
let app = null;

async function startGame() {
  app = new Application();
  await app.loadAll(["tiles_sewers.png","crab7.png", "tiles_03.png", "flip3.png"])
  
  const map = [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1]
  ];
  
  const tilemap = new Tilemap(app.assets["tiles_sewers.png"],50);

  tilemap.setMap(map);
  app.place.addChild(tilemap);
  
  


  
  
  
  // playerBox = new Container();
  playerBox = new Sprite(app.assets["tiles_03.png"]);
  playerBox.title = "playerBox";
  playerBox.zIndex = 30;
  playerBox.setPosition(300, 300);
  playerBox.width = 100;
  playerBox.height = 100;
  playerBox.setAnchor(0, 0)
  playerBox.setScale(1, 1);
  
  

  //playerBox.stopPropagation();

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
    e.stopPropagation();

    console.log("click: playerBox ")
  })
  
  
  player.on("click",(e) => {
  //   //playerBox.position.x++;
    //e.stopPropagation();

     console.log("click: player")
  })
  
  
  playerBox.addChild(player);
  app.place.addChild(playerBox);

  app.ticker.add(() => {
    app.follow(playerBox, 0.1);
    console.log('j')
  })


  
  
  app.startLoop(() => {
    //player.position(player._position.x+1, 0)
  })
}
startGame()

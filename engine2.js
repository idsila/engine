class Application {
  
  constructor(){
    this.ctx = null;
    this.canvas = null;
    this.dpr = 1;
    this.width = 0;
    this.height = 0;
    this.worldAlpha = 1;
  
    this.bgColor = "black";
    this.assets = {};
  
    this.stage = new Container();
  
    this.tickers = [];
    this.events = {};
    this.world = {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      alpha: 1
    };
    
    
    this.input = { x: 0, y: 0, down: false, pressed: false, released: false, hovered: null, focused: null, touches: [] }
    // Для камеры
    this.pointers = new Map();
    this.lastDistance = 0;
    
  
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
    
    
    this.place = new Container();
    this.stage.addChild(this.place);
    
    this.ui = new Container();
    this.stage.addChild(this.ui);

    this.place.interactive = false;
    this.ui.interactive = false;
    
    
    this.ticker = {
      add: (callback) =>{
        this.tickers.push(callback);
      }
    }

    //Работа с камерой
    this.camera = { x: 0, y: 0, zoom: 1, mode: "free", target: null };
    this.drag = { active: false, lastX: 0, lastY: 0 };
    
    this.initInputEvents();
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
  initInputEvents() {
  
    // Нажатие
    this.canvas.addEventListener("pointerdown", (e) => {
      this.input.x = e.clientX;
      this.input.y = e.clientY;

      this.input.down = true;    
      // pressed = только 1 кадр
      this.input.pressed = true;
      
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.pointers.size === 1 && this.camera.mode === "free") {
        this.drag.active = true;
        this.drag.lastX = e.clientX;
        this.drag.lastY = e.clientY;
      }
    });

    // Палец / мышь двигается
    this.canvas.addEventListener("pointermove", (e) => {
      this.input.x = e.clientX;
      this.input.y = e.clientY;
      
      if (this.pointers.has(e.pointerId)) {
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
  
      // DRAG (только free + 1 палец)
      if (this.drag.active && this.pointers.size === 1) {
        const dx = e.clientX - this.drag.lastX;
        const dy = e.clientY - this.drag.lastY;
    
        this.updateCameraDrag(dx, dy);
    
        this.drag.lastX = e.clientX;
        this.drag.lastY = e.clientY;
      }
    });
  
  
    // Отжатие
    this.canvas.addEventListener("pointerup", (e) => {
      this.input.x = e.clientX;
      this.input.y = e.clientY;
    
      this.input.down = false;

      // released = только 1 кадр
      this.input.released = true; 

      this.pointers.delete(e.pointerId);
  
      if (this.pointers.size === 0) {
        this.drag.active = false;
      }
  
      if (this.pointers.size === 1) {
        const p = [...this.pointers.values()][0];

        this.drag.lastX = p.x;
        this.drag.lastY = p.y;
    
        if (this.camera.mode === "free") {
          this.drag.active = true;
        }
      }
      
      if (this.pointers.size < 2) {
        this.lastDistance = 0;
      }
      
    });
  
  }
  
  
 

  setCameraMode(mode, target = null) {
    this.camera.mode = mode;
    this.camera.target = target;
  
    // сброс drag состояния при смене режима
    this.drag.active = false;
    this.lastDistance = 0;
  }

  updateCameraFollow() {
    if (this.camera.mode !== "follow" || !this.camera.target) return;
  
    const target = this.camera.target;
  
    const ax = target.anchor.x * target.width;
    const ay = target.anchor.y * target.height;
  
    const tx = target.world.x - ax * target.world.scaleX + (target.width * target.world.scaleX) / 2;
    const ty = target.world.y - ay * target.world.scaleY + (target.height * target.world.scaleY) / 2;
  
    const cx = this.width / (2 * this.camera.zoom);
    const cy = this.height / (2 * this.camera.zoom);
  
    const desiredX = tx - cx;
    const desiredY = ty - cy;
  
    this.camera.x += (desiredX - this.camera.x) * 0.1;
    this.camera.y += (desiredY - this.camera.y) * 0.1;
  }
  updateCameraDrag(dx, dy) {
    if (this.camera.mode !== "free") return;
    this.camera.x -= dx / this.camera.zoom;
    this.camera.y -= dy / this.camera.zoom;
  }
  updatePinchZoom() {
    if (this.pointers.size !== 2) {
      this.lastDistance = 0;
      return;
    }
  
    const pts = [...this.pointers.values()];
    const p1 = pts[0];
    const p2 = pts[1];
  
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
  
    const centerX = (p1.x + p2.x) / 2;
    const centerY = (p1.y + p2.y) / 2;
  
    const rect = this.canvas.getBoundingClientRect();
  
    const sx = centerX - rect.left;
    const sy = centerY - rect.top;
  
    const worldBefore = this.screenToWorld(centerX, centerY);
  
    if (!this.lastDistance) {
      this.lastDistance = dist;
      return;
    }
  
    const scale = dist / this.lastDistance;
  
    this.camera.zoom *= scale;
  
    this.camera.zoom = Math.max(0.3, Math.min(5, this.camera.zoom));
  
    const worldAfter = this.screenToWorld(centerX, centerY);
  
    this.camera.x += worldBefore.x - worldAfter.x;
    this.camera.y += worldBefore.y - worldAfter.y;
  
    this.lastDistance = dist;
  }
  screenToWorld(x, y) {
    const rect = this.canvas.getBoundingClientRect();
  
    const sx = x - rect.left;
    const sy = y - rect.top;
  
    return {
      x: sx / this.camera.zoom + this.camera.x,
      y: sy / this.camera.zoom + this.camera.y
    };
  } 
  



  // Ниже функции которые ни где не задействованы, но могут пригодиться для разных режимов камеры
  getCameraTransform() {
    return {
      x: this.camera.position.x,
      y: this.camera.position.y,
      scaleX: this.camera.scale.x,
      scaleY: this.camera.scale.y
    };
  }

  follow(target, smooth = 0.1) {
    const tx = target.world.x - this.width / (2 * this.camera.zoom) + (target.width / 2);
    const ty = target.world.y - this.height / (2 * this.camera.zoom) + (target.height / 2);
  
    this.camera.x += (tx - this.camera.x) * smooth;
    this.camera.y += (ty - this.camera.y) * smooth;
  }
  // =========================================
  
  


  
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
      this.tickers.forEach(fn => fn());
      if (this.camera.mode === "free") {
        this.updatePinchZoom();
      } else if(this.camera.mode === "follow"){
        this.updateCameraFollow();
      }
      this.updateTransforms(this.stage);
      this.updateInput();
      
      this.render();
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
  
  
  
  
  
  
  
  addChild(entity) {
    this.stage.addChild(entity);
  }



  render() {
    // WORLD
    this.renderObject(this.place, true);
    // UI
    this.renderObject(this.ui, false);
  }
  renderObject(obj, useCamera = true) {

    if (!obj.visible) return;

    const ctx = this.ctx;

    let x = obj.world.x;
    let y = obj.world.y;
    let scaleX = obj.world.scaleX;
    let scaleY = obj.world.scaleY;

    // Камера только для world
    if (useCamera) {
      x = (x - this.camera.x) * this.camera.zoom;
      y = (y - this.camera.y) * this.camera.zoom;

      scaleX *= this.camera.zoom;
      scaleY *= this.camera.zoom;
    }
    ctx.save();
    ctx.setTransform( scaleX * this.dpr, 0, 0, scaleY * this.dpr, x * this.dpr, y * this.dpr );
    ctx.globalAlpha = obj.world.alpha;
    if(obj.resource){
      ctx.drawImage( obj.resource, obj.frame.x, obj.frame.y, obj.frame.width, obj.frame.height, 0, 0, obj.width, obj.height );
    }
    if (obj instanceof Text) {
      ctx.fillStyle = obj.color;
      ctx.font = `${obj.fontSize}px ${obj.fontFamily}`;
      ctx.textAlign = obj.align;
      ctx.textBaseline = "top";
      ctx.fillText(obj.text, 0, 0);
    }
    ctx.restore();
    

    for (const child of obj.children) {
      this.renderObject(child, useCamera);
    }
  }
  

  updateInput() {
    const screenX = this.input.x;
    const screenY = this.input.y;

    const world = this.screenToWorld(screenX, screenY);

    let hovered = this.findObject(screenX, screenY, this.ui);

    if (!hovered) {
      hovered = this.findObject(world.x, world.y, this.place);
    }

    if (hovered !== this.input.hovered) {
      if (this.input.hovered) {
        this.dispatchEvent(this.input.hovered, "pointerleave");
      }

      if (hovered) {
        this.dispatchEvent(hovered, "pointerenter");
      }

      this.input.hovered = hovered;
    }

    if (hovered) {
      this.dispatchEvent(hovered, "pointermove");
    }

    if (this.input.pressed) {
      if (hovered) {
        this.input.target = hovered;
        this.dispatchEvent(hovered, "pointerdown");
      }
    }

    if (this.input.released) {
      if (this.input.target) {
        this.dispatchEvent(this.input.target, "pointerup");

        if (hovered === this.input.target) {
          this.dispatchEvent(hovered, "click");
        }
      }

      this.input.target = null;
    }

    this.input.pressed = false;
    this.input.released = false;
  }


  findTopObject(x, y) {
    for (const obj of this.stage.children.toReversed()) {
      const found = this.findObject(x, y, obj);
      if (found) {
        return found;
      }
    }
    return null;
  }

  findObject(x, y, obj) {
    if (!obj.visible) return null;
    for (const child of obj.children.toReversed()) {
      const found = this.findObject(x, y, child);
      if (found) {
        return found;
      }
    }
    if (obj.interactive && this.hitTest(obj, x, y)) {
      return obj;
    }
    return null;
  }
  
  
  hitTest(obj, x, y) {
    let left = obj.world.x;
    let top = obj.world.y;
  
    let right = left + obj.width * obj.world.scaleX;
    let bottom = top + obj.height * obj.world.scaleY;
  
  
    if (left > right) {
      [left, right] = [right, left];
    }
    if (top > bottom) {
      [top, bottom] = [bottom, top];
    }
  
  
    return ( x >= left && x <= right && y >= top && y <= bottom );
  }


  dispatchEvent(target, type) {
    const event = { type, target, x: this.input.x, y: this.input.y, stopped: false,
      stopPropagation() {
        this.stopped = true; 
      } 
    };
  
  
    let current = target;
    
    // bubbling вверх по дереву вроде
    while (current) {
      current.emit(type, event);
      if (event.stopped) {
        break;
      }
      current = current.parent;
    }
  }
  
  // updTrans
  updateTransforms(obj, parent = { x: 0, y: 0, scaleX: 1, scaleY: 1, alpha: 1 }) {
    const ax = obj.anchor.x * obj.width;
    const ay = obj.anchor.y * obj.height;
  
    obj.world.scaleX = parent.scaleX * obj.scale.x;
    obj.world.scaleY = parent.scaleY * obj.scale.y;
    obj.world.alpha = parent.alpha * obj.alpha;
    
    obj.world.x = parent.x + (obj.position.x - ax * obj.scale.x) * parent.scaleX;
    obj.world.y = parent.y + (obj.position.y - ay * obj.scale.y) * parent.scaleY;
  
    for (const child of obj.children) {
      this.updateTransforms( child, { x: obj.world.x, y: obj.world.y, scaleX: obj.world.scaleX, scaleY: obj.world.scaleY,alpha: obj.world.alpha });
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
    this.destroyed = false;
    this.visible = true;
    this.interactive = true;
    this.title = null;
    this.alpha = 1;
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
  off(type, callback) {
    const listeners = this.events.get(type);

    if (!listeners) return;
    const index = listeners.indexOf(callback);

    if (index !== -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this.events.delete(type);
    }
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
  removeChild(entity) {
    const index = this.children.indexOf(entity);

    if (index !== -1) {
      entity.parent = null;
      this.children.splice(index, 1);
    }
  }
  destroy() {

    if (this.destroyed) return;

    this.destroyed = true;
    this.visible = false;
    this.interactive = false;

    for (const child of [...this.children]) {
      child.destroy();
    }


    this.events.clear();

    if (this.parent) {
      this.parent.removeChild(this);
    }

    this.parent = null;
    //this.resource = null;
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
  destroy() {
    super.destroy();
  }
  
}

class Text extends Container {
  constructor(text = "") {
    super();
    this.text = text;
    this.fontSize = 32;
    this.fontFamily = "Arial";
    this.color = "white";
    this.align = "left";
    this.resource = null;

    this.updateMetrics();
  }
  updateMetrics() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    ctx.font = `${this.fontSize}px ${this.fontFamily}`;

    this.width = ctx.measureText(this.text).width;
    this.height = this.fontSize;
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
  
  //Ui
  ui = new Sprite(app.assets["tiles_03.png"]);
  ui.title = "ui";
  // ui.zIndex = 99;
  ui.setPosition(0, 0);
  ui.width = 500;
  ui.height = 100;
  
  ui.on("click", e => {
    
    console.log("UI")
    e.stopPropagation();
  })
  //app.ui.addChild(ui);

  const txt = new Text("Pixel Dungeon");

  txt.setPosition(0, 0);

  txt.fontSize = 58;
  

  app.ui.addChild(txt);


  
  
  
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
  // player.setScale(-1, 1);
  playerBox.on("click",(e) => {
    //e.stopPropagation();

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
    //app.follow(playerBox, 0.5);
    //console.log('j')
  })


  
  
  app.startLoop(() => {
    //player.position(player._position.x+1, 0)
  })
}
startGame()

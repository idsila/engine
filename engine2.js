class Application {
  
  constructor(){
    this.ctx = null;
    this.canvas = null;
    this.dpr = 1;
    this.width = 0;
    this.height = 0;
    this.worldAlpha = 1;
    this.currentScene = null;
  
    this.bgColor = "#000";
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
    
    
    this.input = { x: 0, y: 0, down: false, pressed: false, released: false, hovered: null, capturedByUI: false, focused: null, touches: [] }
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
    
    
    this.world = new Container();
    this.stage.addChild(this.world);
    
    this.ui = new Container();
    this.stage.addChild(this.ui);

    this.world.interactive = false;
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
      this.input.pressed = true;
      
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const uiTarget = this.findObject( e.clientX, e.clientY, this.ui );
      this.input.capturedByUI = !!uiTarget;
      if (!this.input.capturedByUI) {
        if (this.pointers.size === 1 && this.camera.mode === "free") {
          this.drag.active = true;
          this.drag.lastX = e.clientX;
          this.drag.lastY = e.clientY;
        }
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
      if (this.drag.active && this.pointers.size === 1 && !this.input.capturedByUI) {
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
      this.input.released = true; 
      this.input.capturedByUI = false;

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
  getAsset(name) {
    return this.assets[name];
  }
  
  updateObjects(obj, delta) {
    obj.update(delta);
    for (const child of obj.children) {
      this.updateObjects(child, delta);
    }
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
      if (this.currentScene) {
        this.currentScene.update(delta);
      }
      if (this.currentScene) {
        this.updateObjects(this.currentScene.world, delta);
        this.updateObjects(this.currentScene.ui, delta);

        this.updateTransforms(this.currentScene.world);
        this.updateTransforms(this.currentScene.ui);
      }
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
    if (!this.currentScene) return;
    this.renderObject(this.currentScene.world, true);
    this.renderObject(this.currentScene.ui, false);
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
    ctx.imageSmoothingEnabled = false; // ← добавь сюда
    ctx.globalAlpha = obj.world.alpha;
    if (obj instanceof NineSlicePlane) {
      obj.render(ctx);
    } else if(obj.texture && obj.texture.resource){
      ctx.drawImage( obj.texture.resource, obj.texture.frame.x, obj.texture.frame.y, obj.texture.frame.width, obj.texture.frame.height, 0, 0, obj.width, obj.height );
    }
    if (obj instanceof Text) {

      ctx.font = `${obj.fontSize}px ${obj.fontFamily}`;
      ctx.textAlign = obj.align;
      ctx.textBaseline = "top";

      // OUTLINE
      if (obj.stroke && obj.strokeWidth > 0) {
        ctx.strokeStyle = obj.stroke;
        ctx.lineWidth = obj.strokeWidth;
        ctx.lineJoin = "round";

        ctx.strokeText(obj.text, 0, 0);
      }

      // FILL
      ctx.fillStyle = obj.color;
      ctx.fillText(obj.text, 0, 0);
    }
    ctx.restore();
    

    for (const child of obj.children) {
      this.renderObject(child, useCamera);
    }
  }

  renderNineSlice(obj, ctx) {

  const img = obj.texture.resource;

  const fx = obj.texture.frame.x;
  const fy = obj.texture.frame.y;

  const sw = obj.texture.frame.width;
  const sh = obj.texture.frame.height;

  const left = obj.slice.left;
  const top = obj.slice.top;
  const right = obj.slice.right;
  const bottom = obj.slice.bottom;

  const dw = obj.width;
  const dh = obj.height;

  const centerSrcW = sw - left - right;
  const centerSrcH = sh - top - bottom;

  const centerDstW = dw - left - right;
  const centerDstH = dh - top - bottom;

  const drawPart = (
    sx, sy, sw, sh,
    dx, dy, dw, dh,
    mode = "stretch"
  ) => {

    if (dw <= 0 || dh <= 0) return;

    // STRETCH
    if (mode === "stretch") {

      ctx.drawImage(
        img,
        sx, sy, sw, sh,
        dx, dy, dw, dh
      );

    }

    // TILE
    else if (mode === "tile") {

      for (let xx = 0; xx < dw; xx += sw) {

        for (let yy = 0; yy < dh; yy += sh) {

          const tw = Math.min(sw, dw - xx);
          const th = Math.min(sh, dh - yy);

          ctx.drawImage(
            img,

            sx,
            sy,

            tw,
            th,

            dx + xx,
            dy + yy,

            tw,
            th
          );
        }
      }

    }

  };

  const modes = obj.modes || {};

  // TOP LEFT
  drawPart(
    fx,
    fy,
    left,
    top,

    0,
    0,
    left,
    top,

    "stretch"
  );

  // TOP
  drawPart(
    fx + left,
    fy,
    centerSrcW,
    top,

    left,
    0,
    centerDstW,
    top,

    modes.top || "stretch"
  );

  // TOP RIGHT
  drawPart(
    fx + sw - right,
    fy,
    right,
    top,

    dw - right,
    0,
    right,
    top,

    "stretch"
  );

  // LEFT
  drawPart(
    fx,
    fy + top,
    left,
    centerSrcH,

    0,
    top,
    left,
    centerDstH,

    modes.left || "stretch"
  );

  // CENTER
  drawPart(
    fx + left,
    fy + top,
    centerSrcW,
    centerSrcH,

    left,
    top,
    centerDstW,
    centerDstH,

    modes.center || "stretch"
  );

  // RIGHT
  drawPart(
    fx + sw - right,
    fy + top,
    right,
    centerSrcH,

    dw - right,
    top,
    right,
    centerDstH,

    modes.right || "stretch"
  );

  // BOTTOM LEFT
  drawPart(
    fx,
    fy + sh - bottom,
    left,
    bottom,

    0,
    dh - bottom,
    left,
    bottom,

    "stretch"
  );

  // BOTTOM
  drawPart(
    fx + left,
    fy + sh - bottom,
    centerSrcW,
    bottom,

    left,
    dh - bottom,
    centerDstW,
    bottom,

    modes.bottom || "stretch"
  );

  // BOTTOM RIGHT
  drawPart(
    fx + sw - right,
    fy + sh - bottom,
    right,
    bottom,

    dw - right,
    dh - bottom,
    right,
    bottom,

    "stretch"
  );
}
  

  updateInput() {
    const screenX = this.input.x;
    const screenY = this.input.y;

    const world = this.screenToWorld(screenX, screenY);

    let hovered = this.findObject(screenX, screenY, this.ui);

    if (!hovered) {
      hovered = this.findObject(world.x, world.y, this.currentScene.world);
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
  changeScene(scene) {
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.zoom = 1;
    if (this.currentScene) {
      this.currentScene.destroy();
    }

    this.currentScene = scene;

    scene.create();

    this.world.addChild(scene.world);
    this.ui.addChild(scene.ui);
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
  update(delta) {}

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


class Texture {
  constructor(resource, x = 0, y = 0, width = null, height = null) {

    this.resource = resource;

    this.frame = {
      x,
      y,
      width: width ?? resource.width,
      height: height ?? resource.height
    };
  }
}

class Sprite extends Container{
  constructor(texture){
    super();
    this.texture = texture;

    this.width = texture.frame.width;
    this.height = texture.frame.height;

  }
  destroy() {
    super.destroy();
  }
  
}

class AnimatedSprite extends Sprite {
  constructor(textures = []) {
    super(textures[0]);
    this.textures = textures;
    this.currentFrame = 0;
    this.animationSpeed = 10;
    this.playing = true;
    this.loop = true;
    this.elapsed = 0;
  }

  update(delta) {
    if (!this.playing) return;
    this.elapsed += delta;
    const frameTime = 1 / this.animationSpeed;
    while (this.elapsed >= frameTime) {
      this.elapsed -= frameTime;
      this.currentFrame++;
      if (this.currentFrame >= this.textures.length) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.textures.length - 1;
          this.playing = false;
        }
      }
      this.texture = this.textures[this.currentFrame];
    }
  }

  play() {
    this.playing = true;
  }

  stop() {
    this.playing = false;
  }

  gotoAndStop(frame) {
    this.currentFrame = frame;
    this.texture = this.textures[frame];
    this.playing = false;
  }

  gotoAndPlay(frame) {
    this.currentFrame = frame;
    this.texture = this.textures[frame];
    this.playing = true;
  }
}


class Text extends Container {
  constructor(text = "") {
    super();
    this.text = text;
    this.fontSize = 32;
    this.fontFamily = "Arial";
    this.color = "white";

    this.stroke = "black";
    this.strokeWidth = 4;

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

class NineSlicePlane extends Container {
  constructor(texture, left, top, right, bottom) {
    super();
    this.texture = texture;
    this.slice = { left, top, right, bottom };
    this.width = texture.frame.width;
    this.height = texture.frame.height;
  }

  render(ctx) {
    const tex = this.texture;
    if (!tex || !tex.resource) return;

    const img = tex.resource;
    const { x: fx, y: fy, width: fw, height: fh } = tex.frame;
    const { left: l, top: t, right: r, bottom: b } = this.slice;

    const dw = this.width;
    const dh = this.height;

    const cSrcW = fw - l - r;
    const cSrcH = fh - t - b;
    const cDstW = dw - l - r;
    const cDstH = dh - t - b;

    const draw = (sx, sy, sw, sh, dx, dy, dw, dh) => {
      if (sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0) return;
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    };

    // Углы — не трогаем
    draw(fx,        fy,        l,     t,     0,    0,    l,     t    );
    draw(fx+fw-r,   fy,        r,     t,     dw-r, 0,    r,     t    );
    draw(fx,        fy+fh-b,   l,     b,     0,    dh-b, l,     b    );
    draw(fx+fw-r,   fy+fh-b,   r,     b,     dw-r, dh-b, r,     b    );

    // Края — растягиваем
    draw(fx+l,      fy,        cSrcW, t,     l,    0,    cDstW, t    ); // top
    draw(fx+l,      fy+fh-b,   cSrcW, b,     l,    dh-b, cDstW, b    ); // bottom
    draw(fx,        fy+t,      l,     cSrcH, 0,    t,    l,     cDstH); // left
    draw(fx+fw-r,   fy+t,      r,     cSrcH, dw-r, t,    r,     cDstH); // right

    // Центр — растягиваем как в Pixi
    draw(fx+l,      fy+t,      cSrcW, cSrcH, l,    t,    cDstW, cDstH);
  }

}


class Scene extends Container {
  constructor() {
    super();
    this.world = new Container();
    this.ui = new Container();

    this.addChild(this.world);
    this.addChild(this.ui);
  }

  create() {}
  update(delta) {}
  destroy() {
    this.world.destroy();
    this.ui.destroy();
  }
}





// Game
class MenuScene extends Scene {
  create() {
    const txt = new Text("MENU");
    txt.setPosition(100, 100);
    this.ui.addChild(txt);
  }

  update(delta) {}
}

class GameScene extends Scene {
  create() {
    const button = new NineSlicePlane(new Texture(app.getAsset("UI.png"),20, 0, 9, 9), 3,3,3,3);

    button.width = 100;
    button.height = 32;
    
    button.setScale(6, 6); // масштаб отдельно
    button.setPosition(100, 100);

    this.ui.addChild(button);
    

    // let ui = new Sprite(app.getAsset("tiles_03.png"));
    // ui.title = "playerBox";
    // ui.zIndex = 30;
    // ui.setPosition(0, 0);
    // ui.width = 1000;
    // ui.height = 200;
    //this.ui.addChild(ui);



    let txt = new Text("GAME ENGINE");
    txt.setPosition(0, 0);
    txt.fontFamily = "pdfont";
    txt.strokeWidth = 5;
    txt.fontSize = 38;
    this.world.addChild(txt);


    let txt2 = new Text("Pixel Dungeon");
    txt2.setPosition(300, 280);
    txt2.fontFamily = "pdfont";
    txt2.strokeWidth = 1;
    txt2.fontSize = 18;
    this.world.addChild(txt2);


  
  
  
    // playerBox = new Container();
    const texture = new Texture(app.getAsset("crab7.png"));
    playerBox = new Sprite(texture);
    playerBox.title = "playerBox";
    playerBox.zIndex = 30;
    playerBox.setPosition(300, 300);
    playerBox.width = 100;
    playerBox.height = 100;
    playerBox.setAnchor(0, 0)
    playerBox.setScale(1, 1);
  
  

    //playerBox.stopPropagation();

    // player = new Sprite(app.getAsset("crab7.png"));
    // player.title = "player";
    // player.width = 100;
    // player.height = 100;
    // player.setPosition(50, 50);
    // player.setAnchor(0.5, 0.5)
    // player.setScale(1, 1);
    //player.stopPropagation();
  
    // player.setAnchor(0.5, 0.5)
    // player.setScale(-1, 1);
    playerBox.on("click",(e) => {
      //e.stopPropagation();

      console.log("click: playerBox ")
    })
  
  
    //player.on("click",(e) => {
      //   //playerBox.position.x++;
      //e.stopPropagation();

      //console.log("click: player")
    //})
  
  
    //playerBox.addChild(player);
    this.world.addChild(playerBox);

  

  }

  update(delta) {}
}















let player, playerBox = null;
let app = null;

async function startGame() {
  app = new Application();
  await app.loadAll(["UI.png","tiles_sewers.png","crab7.png", "tiles_03.png", "flip3.png"])
  
  
  const menu = new GameScene();
  app.changeScene(menu);
  
  app.startLoop(() => {
    //player.position(player._position.x+1, 0)
  })
}
startGame()

class Container {
  children = [];
  constructor(){}
  
  addChild(entity){
    children.push(entity);
  }
}



class Text {
  fontFamily =  null;
  fill = null;
  fontSize = null;
  stroke = null;        
  strokeThickness = 0;
  
  constructor(text, style){
    
  }
  
  
}


class NineSlicePlane {
  constructor(source, x, y, w, h){
    
  }
}



// Game Logic


state = {
  sprites: [],
  blocks: [],
  walls: [],
  enemys: [],
  interfaces: [],
  player: null,
  playerContainer: null,
  bgColor: null,
  tileSize: 50,
};
class Game {
  constructor(){}
}









// Rendering Engine old
  renderOLd() {
    const cam = this.camera;
  
    // 1. WORLD PASS (с камерой)
    this.ctx.save();
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);
    this.renderObject(this.place);
    this.ctx.restore();
  
    // 2. UI PASS (без камеры)
    this.ctx.save();
    this.renderObject(this.ui);
    this.ctx.restore();
  }
  renderObjectOld(obj) {
    if (!obj.visible) return;
    const ctx = this.ctx;
  
    if (obj.resource) {
      ctx.save();
      ctx.translate(obj.world.x, obj.world.y);
      ctx.scale(obj.world.scaleX, obj.world.scaleY);
      ctx.drawImage( obj.resource, obj.frame.x, obj.frame.y, obj.frame.width, obj.frame.height, 0, 0, obj.width, obj.height );
      ctx.restore();
    }
  
    for (const child of obj.children) {
      this.renderObject(child);
    }
  }
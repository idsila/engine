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





// find4(event, x = 0, y = 0) {
//   this.propagation = true;
//   this.findObject(event, x, y, this.stage, 0, 0, 1, 1);
// }

// findObject4(event, x, y, obj, parentWorldX = 0, parentWorldY = 0, parentScaleX = 1, parentScaleY = 1) {
//   if (!this.propagation) return;
  
//   // Мировая позиция локального (0,0) объекта
//   const worldX = parentWorldX + obj.position.x * parentScaleX;
//   const worldY = parentWorldY + obj.position.y * parentScaleY;
//   const scaleX = parentScaleX * obj.scale.x;
//   const scaleY = parentScaleY * obj.scale.y;
  
//   // Преобразуем точку мыши в локальные координаты объекта (без учёта anchor)
//   let localX = (x - worldX) / scaleX;
//   let localY = (y - worldY) / scaleY;
  
//   // Применяем anchor (смещение начала координат)
//   const localWithAnchorX = localX + obj.anchor.x * obj.width;
//   const localWithAnchorY = localY + obj.anchor.y * obj.height;
  
//   // Проверяем попадание в прямоугольник [0, width] × [0, height]
//   if (localWithAnchorX >= 0 && localWithAnchorX <= obj.width &&
//     localWithAnchorY >= 0 && localWithAnchorY <= obj.height) {
    
//     // Вызываем все обработчики события на объекте
//     for (const e of obj.events) {
//       if (e.type === event.type) {
//         e.callback(event);
//       }
//     }
    
//     // Останавливаем распространение, если нужно
//     if (!obj.propagation) {
//       this.propagation = false;
//       return;
//     }
//   }
  
//   // Рекурсивно проверяем детей (в обратном порядке для zIndex)
//   for (const child of obj.children.slice().reverse()) {
//     this.findObject(event, x, y, child, worldX, worldY, scaleX, scaleY);
//     if (!this.propagation) break;
//   }
// }







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
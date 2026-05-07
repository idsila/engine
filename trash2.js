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




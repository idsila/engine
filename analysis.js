const button = new NineSlicePlane(new Texture(app.getAsset("UI.png"),20, 9, 9, 9), 3,3,3,3);
this.ui.addChild(optionBtn(button, 3, 100, 0.90, 20, "Войти в игру", 22, 4));
  

    function optionBtn(obj, scale, y, width = 0.90, height = 32, 
    
    text = 'Пусто', size = 16, stroke = 6){
      const title = new Text(text);
      const icon =  new Sprite(new Texture(app.getAsset("icons.png"), 68, 0, 17, 16));
      obj.width = app.width/scale*width;
      obj.height = height;
      
      obj.setScale(scale, scale); // масштаб отдельно
      obj.setPosition(app.width*((1-width)/2), y);
      
      title.fontFamily = "pdfont";
      title.fontSize = size / scale;
      title.strokeWidth = stroke / scale;
      title.updateMetrics();
      
      icon.width = 15;
      icon.height = 15;
      icon.setPosition((obj.width - (icon.width+title.width)) / 2, (obj.height - icon.height) / 2);
      obj.addChild(icon);
      
      title.setPosition(((obj.width+icon.width+5)- title.width) / 2, (obj.height - title.height) / 2);


      obj.addChild(title);
      

      return obj;
    }
    



class createButton extends NineSlicePlane {
  constructor(texture, left, top, right, bottom){
    super(texture, left, top, right, bottom);
    this.icon = null;
    this.title = null;
  }
  addIcon(){
    
  }
  addTitle(){
    
  }
  
}



function createButton(sprite, width, height, scale, y, title, icon) {
  sprite.width = app.width / scale * width;
  sprite.height = height;
  
  sprite.setScale(scale, scale);
  sprite.setPosition(app.width * ((1 - width) / 2), y);
  
  icon.setPosition((sprite.width - (icon.width + title.width)) / 2,(sprite.height - icon.height) / 2);
  
  sprite.addChild(icon);
  
  title.setPosition(((sprite.width + icon.width + 5) - title.width) / 2,(sprite.height - title.height) / 2);
  
  sprite.addChild(title);
  
  return sprite;
}
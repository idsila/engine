function init(bg_color = "black") {
  const canvas = document.createElement("canvas");
  canvas.id = "canvas";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // CSS размер (видимый)
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    // реальное разрешение (важно!)
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = bg_color;
    ctx.fillRect(0, 0, width, height);
  }

  resize();
  window.addEventListener("resize", resize);

  return { canvas, ctx };
}

const { canvas, ctx } = init();


async function drawImage(path, x, y, windth, height) {
  const image = new Image();
  image.src = path;
  image.onload = () => {
    ctx.drawImage(image, x, y, windth, height);
    
  }
}

drawImage("crab7.png", 0, 0, 100, 100);
drawImage("flip3.png", 0, 100, 100, 100);
drawImage("tiles_03.png", 100, 0, 100, 100);
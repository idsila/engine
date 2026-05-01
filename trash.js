function drawImage(path, x, y, windth, height) {
  ctx.drawImage(assets[path], x, y, windth, height);
  STATE.push(() => {
    ctx.drawImage(assets[path], x, y, windth, height);
  });
}

// drawImage("crab7.png", 0, 0, 100, 100);
// drawImage("crab7.png", 100, 0, 100, 100);
// drawImage("flip3.png", 0, 100, 100, 100);
// drawImage("tiles_03.png", 100, 0, 100, 100);

function setFiled() {
  for (let i = 0; i != 100; i++) {
    for (let j = 0; j != 100; j++) {
      drawImage("tiles_03.png", i * 50, j * 50, 50, 50);
    }
  }
}
// setFiled();

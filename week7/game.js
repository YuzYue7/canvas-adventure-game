/*
🎮 Canvas Adventure Game 使用说明：

▶ 移动：W、A、S、D 键
▶ 射击：空格键（Space）
▶ 目标：收集所有金币 💰 并击败所有敌人 💀
▶ 阵亡：碰到敌人后会 Game Over，按 R 键复活
▶ 通关：完成三关即可获胜 🎉
▶ 重玩：游戏通关后按 R 键重新开始
*/

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let level = 1;
let score = 0;
let gameOver = false;
let playerDead = false;
let levelStartTime = Date.now();
let totalStartTime = Date.now();
let totalTime = 0;

let player = { x: 300, y: 350, size: 30, speed: 4 };
let keys = {};
let enemies = [];
let coins = [];
let bullets = [];

// 🎯 UI 元素
const statusText = document.getElementById("statusText");
const historyList = document.getElementById("historyList");

// --- 历史记录 ---
function updateHistoryDisplay() {
  const history = JSON.parse(localStorage.getItem("gameHistory") || "[]");
  if (history.length === 0) {
    historyList.innerHTML = "<i>No record yet</i>";
  } else {
    historyList.innerHTML = history.map(
      (r, i) => `<p>${i + 1}. ${r.date} – ${r.time}s</p>`
    ).join("");
  }
}

function saveHistory(time) {
  let history = JSON.parse(localStorage.getItem("gameHistory") || "[]");
  history.push({
    date: new Date().toLocaleString(),
    time: time
  });
  localStorage.setItem("gameHistory", JSON.stringify(history.slice(-5)));
  updateHistoryDisplay();
}

updateHistoryDisplay();

// --- 控制键 ---
document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.code === "Space" && !gameOver && !playerDead) {
    bullets.push({ x: player.x + player.size / 2, y: player.y, dy: -6 });
  }
  if (e.key.toLowerCase() === "r" && (gameOver || playerDead)) {
    restartGame();
  }
});

document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// --- 初始化关卡 ---
function initLevel() {
  bullets = [];
  coins = [];
  enemies = [];
  playerDead = false;
  gameOver = false;

  const numEnemies = level + 1;
  const numCoins = level * 2 + 2;

  for (let i = 0; i < numEnemies; i++) {
    enemies.push({
      x: Math.random() * (canvas.width - 30),
      y: Math.random() * 200,
      size: 25,
      dx: 1.5 + level,
      dy: 1 + Math.random() * level
    });
  }

  for (let i = 0; i < numCoins; i++) {
    coins.push({
      x: Math.random() * (canvas.width - 20) + 10,
      y: Math.random() * (canvas.height - 150) + 50,
      size: 10,
      collected: false,
      points: 5 + level * 3
    });
  }

  player.x = 300;
  player.y = 350;
  levelStartTime = Date.now();
}

// --- 重置游戏 ---
function restartGame() {
  level = 1;
  score = 0;
  totalTime = 0;
  initLevel();
  gameLoop();
}

// --- 移动逻辑 ---
function movePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  if (player.x < 0) player.x = 0;
  if (player.x + player.size > canvas.width) player.x = canvas.width - player.size;
  if (player.y < 0) player.y = 0;
  if (player.y + player.size > canvas.height) player.y = canvas.height - player.size;
}

function moveEnemies() {
  enemies.forEach(e => {
    e.x += e.dx;
    e.y += e.dy;
    if (e.x < 0 || e.x > canvas.width - e.size) e.dx *= -1;
    if (e.y < 0 || e.y > canvas.height - e.size) e.dy *= -1;
  });
}

function moveBullets() {
  bullets.forEach(b => b.y += b.dy);
  bullets = bullets.filter(b => b.y > 0);
}

// --- 绘制函数 ---
function drawCenteredText(text, y, size = 24, color = "white") {
  ctx.fillStyle = color;
  ctx.font = `${size}px Arial`;
  const textWidth = ctx.measureText(text).width;
  ctx.fillText(text, (canvas.width - textWidth) / 2, y);
}

function drawPlayer() {
  ctx.fillStyle = "cyan";
  ctx.fillRect(player.x, player.y, player.size, player.size);
}

function drawEnemies() {
  ctx.fillStyle = "red";
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.size, e.size));
}

function drawCoins() {
  ctx.fillStyle = "gold";
  coins.forEach(c => {
    if (!c.collected) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawBullets() {
  ctx.fillStyle = "lime";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 10));
}

function updateHUD() {
  const levelTime = ((Date.now() - levelStartTime) / 1000).toFixed(1);
  statusText.innerHTML = `
    <p>Level: ${level}</p>
    <p>Score: ${score}</p>
    <p>Time: ${levelTime}s</p>
  `;
}

// --- 碰撞检测 ---
function checkCoinCollisions() {
  coins.forEach(c => {
    if (!c.collected &&
      player.x < c.x + c.size &&
      player.x + player.size > c.x &&
      player.y < c.y + c.size &&
      player.y + player.size > c.y) {
      c.collected = true;
      score += c.points;
    }
  });
}

function checkEnemyHit() {
  enemies.forEach(e => {
    if (
      player.x < e.x + e.size &&
      player.x + player.size > e.x &&
      player.y < e.y + e.size &&
      player.y + player.size > e.y
    ) {
      playerDead = true;
      showDeathScreen();
    }
  });
}

function checkBulletHit() {
  bullets.forEach(b => {
    enemies.forEach(e => {
      if (
        b.x < e.x + e.size &&
        b.x + 4 > e.x &&
        b.y < e.y + e.size &&
        b.y + 10 > e.y
      ) {
        e.dead = true;
        b.y = -100;
        score += 10;
      }
    });
  });
  enemies = enemies.filter(e => !e.dead);
}

// --- 关卡与结束 ---
function checkLevelComplete() {
  const allCoinsCollected = coins.every(c => c.collected);
  const allEnemiesDefeated = enemies.length === 0;
  if (allCoinsCollected && allEnemiesDefeated) {
    totalTime += (Date.now() - levelStartTime);
    if (level < 3) {
      level++;
      initLevel();
    } else {
      endGame();
    }
  }
}

function showDeathScreen() {
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawCenteredText("💀 YOU DIED 💀", 180, 40, "red");
  drawCenteredText("Press R to Revive", 250, 26, "white");
}

function endGame() {
  gameOver = true;
  totalTime += (Date.now() - levelStartTime);
  const seconds = (totalTime / 1000).toFixed(1);
  saveHistory(seconds);

  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawCenteredText("🏆 YOU WIN! 🏆", 170, 40, "gold");
  drawCenteredText(`Total Time: ${seconds}s`, 230, 24, "white");
  drawCenteredText(`Final Score: ${score}`, 270, 24, "white");
  drawCenteredText("Press R to Restart", 320, 22, "#ccc");
}

// --- 主循环 ---
function gameLoop() {
  if (gameOver || playerDead) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  movePlayer();
  moveEnemies();
  moveBullets();

  checkCoinCollisions();
  checkEnemyHit();
  checkBulletHit();
  checkLevelComplete();

  drawCoins();
  drawEnemies();
  drawBullets();
  drawPlayer();
  updateHUD();

  requestAnimationFrame(gameLoop);
}

// 启动
initLevel();
gameLoop();

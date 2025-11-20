const storeIdMapping = {
  1: "Steam",
  2: "Xbox Store",
  3: "PlayStation Store",
  4: "App Store",
  5: "GOG",
  6: "Nintendo Store",
  7: "Xbox 360 Store",
  8: "Google Play",
  9: "itch.io",
  11: "Epic Games",
};

const apiKey = "4d79f0d629c741e1be8ae8bf14818815";
const jsonUrl = "games.json";
let gamesData = [];

// ---------------------------
// Helpers
// ---------------------------
function isPhotoWallMode() {
  return document.body.classList.contains("photo-wall");
}

// ---------------------------
// Dark Mode
// ---------------------------
function initializeDarkMode() {
  const isDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (isDark) document.body.classList.add("dark-mode");
}

document.getElementById("toggleDarkMode").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Sort menu
const sortMenu = document.getElementById("sortMenu");
document.getElementById("sortToggle").addEventListener("click", () => {
  sortMenu.style.display = sortMenu.style.display === "flex" ? "none" : "flex";
});

// Photo-wall toggle
const photoWallBtn = document.getElementById("togglePhotoWall");
if (photoWallBtn) {
  photoWallBtn.addEventListener("click", () => {
    document.body.classList.toggle("photo-wall");
    queueMasonryLayout();
  });
}

// ---------------------------
// Load Games
// ---------------------------
async function loadGames() {
  const response = await fetch(jsonUrl);
  gamesData = await response.json();

  gamesData.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderGames(gamesData);
}

// ---------------------------
// Render Games
// ---------------------------
function renderGames(games) {
  const gameGrid = document.getElementById("gameGrid");
  gameGrid.innerHTML = "";

  games.forEach((game) => {
    const card = document.createElement("div");
    card.classList.add("game-card");
    card.dataset.rating = game.rating ?? 0;

    const img = document.createElement("img");
    const placeholder = `
      <svg xmlns="http://www.w3.org/2000/svg" width="250" height="150">
        <rect width="250" height="150" fill="#e0e0e0"/>
      </svg>`;
    img.src = `data:image/svg+xml;base64,${btoa(placeholder)}`;
    img.alt = game.name;
    card.appendChild(img);

    const info = document.createElement("div");
    info.classList.add("game-info");
    info.innerHTML = `
      <h3>${game.name}</h3>
      <p>评分: ${game.rating}/10</p>
      <p>最后游玩时间: ${game.date}</p>
    `;
    card.appendChild(info);

    const gameGrid = document.getElementById("gameGrid");
    gameGrid.appendChild(card);

    card.addEventListener("click", () => showModal(game, img.src));

    if (game.id) {
      fetchGameDetails(game.id).then((details) => {
        if (details.background_image) {
          img.onload = () => {
            computeBaseSize(card, img, game.rating);
            queueMasonryLayout();
          };
          img.src = details.background_image;
        }
      });
    }
  });

  // 占位图阶段先做一次布局
  queueMasonryLayout();
}

// ---------------------------
// 根据评分预计算一个“基准高度”供照片墙模式使用
// ---------------------------
function computeBaseSize(card, img, rating) {
  const r = parseFloat(rating || 0);

  // 评分越高，基准越高
  let scale = 1.0;
  if (r >= 9) scale = 1.6;
  else if (r >= 8) scale = 1.3;
  else if (r >= 7) scale = 1.1;
  else if (r >= 6) scale = 1.0;
  else scale = 0.8;

  const aspect =
    img.naturalWidth && img.naturalHeight
      ? img.naturalWidth / img.naturalHeight
      : 16 / 9;

  const baseHeight = 220 * scale;

  card.dataset.aspect = aspect;
  card.dataset.baseHeight = baseHeight;
}

// ---------------------------
// RAWG details
// ---------------------------
async function fetchGameDetails(id) {
  const url = `https://api.rawg.io/api/games/${id}?key=${apiKey}`;
  try {
    const res = await fetch(url);
    return res.json();
  } catch (err) {
    console.error("RAWG detail error for id", id, err);
    return {};
  }
}

async function fetchStoreLinks(gameId) {
  const url = `https://api.rawg.io/api/games/${gameId}/stores?key=${apiKey}`;
  try {
    const res = await fetch(url);
    const d = await res.json();
    return d.results || [];
  } catch (err) {
    console.error("Store links error:", err);
    return [];
  }
}

// ---------------------------
// Modal
// ---------------------------
async function showModal(game, imageUrl) {
  const modal = document.getElementById("gameModal");
  const content = document.getElementById("modalContent");

  content.innerHTML = `
    <img src="${imageUrl}">
    <h3>${game.name}</h3>
    <p>评分: ${game.rating}/10</p>
    <p>最后游玩时间: ${game.date}</p>
    <p>${game.description.replace(/\n/g, "<br>")}</p>
    <div id="storeLinks"><strong>商店链接:</strong> 加载中...</div>
  `;

  modal.classList.add("active");
  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove("active");
  };

  if (game.id) {
    const stores = await fetchStoreLinks(game.id);
    const box = document.getElementById("storeLinks");
    if (stores.length > 0) {
      box.innerHTML =
        "<strong>商店链接:</strong> " +
        stores
          .map(
            (s) =>
              `<a href="${s.url}" target="_blank">${
                storeIdMapping[s.store_id] || "商店"
              }</a>`
          )
          .join(" ");
    } else {
      box.innerHTML = "<strong>商店链接:</strong> 暂无信息";
    }
  }
}

// ---------------------------
// 默认模式：列式 Masonry（统一高度，自然风格）
// ---------------------------
function applyDefaultMasonryLayout() {
  const grid = document.getElementById("gameGrid");
  const cards = Array.from(grid.children);
  const colW = 250;
  const gap = 20;

  const GW = grid.clientWidth;
  if (!GW) return;

  const cols = Math.max(1, Math.floor((GW + gap) / (colW + gap)));
  const H = new Array(cols).fill(20); // 第一行上面空 20px

  cards.forEach((card) => {
    card.style.position = "absolute";
    card.style.width = colW + "px";
    card.style.height = "auto"; // 默认模式用内容自然高度

    const img = card.querySelector("img");
    if (img) {
      img.style.width = "100%";
      img.style.height = "auto";
      img.style.objectFit = "cover";
    }

    const col = H.indexOf(Math.min(...H));
const layoutWidth = cols * (colW + gap) - gap;

// ⭐ 容器宽度
const containerWidth = grid.clientWidth;

// ⭐ 计算水平居中的偏移量
const centerOffset = Math.max(0, (containerWidth - layoutWidth) / 2);

// ⭐ 最终 left（居中）
const L = centerOffset + col * (colW + gap);


    const T = H[col];

    card.style.left = L + "px";
    card.style.top = T + "px";

    H[col] = T + card.offsetHeight + gap;
  });

  grid.style.position = "relative";
  grid.style.height = Math.max(...H) + "px";
}

// ---------------------------
// 照片墙模式：列式 Masonry + 按评分不同高度（有交错）
// ---------------------------
function applyPhotoWallMasonryLayout() {
  const grid = document.getElementById("gameGrid");
  const cards = Array.from(grid.children);
  const colW = 480;   // 稍微窄一点，看起来更像图片墙
  const gap = 0;

  const GW = grid.clientWidth;
  if (!GW) return;

  const cols = Math.max(1, Math.floor((GW + gap) / (colW + gap)));
  const H = new Array(cols).fill(0); // 顶部留白
  const leftOffset = 0;

  cards.forEach((card) => {
    const baseH = parseFloat(card.dataset.baseHeight || "220");

    card.style.position = "absolute";
    card.style.width = colW + "px";
    card.style.height = baseH + "px";

    const img = card.querySelector("img");
    if (img) {
      img.style.width = "100%";
      img.style.height = "100%"; // 填满卡片高度
      img.style.objectFit = "cover";
    }

    const col = H.indexOf(Math.min(...H));
    const L = col * (colW + gap)+leftOffset;
    const T = H[col];

    card.style.left = L + "px";
    card.style.top = T + "px";

    H[col] = T + baseH + gap;
  });

  grid.style.position = "relative";
  grid.style.height = Math.max(...H) + "px";
}

// ---------------------------
// Dispatcher
// ---------------------------
function applyMasonryLayout() {
  if (isPhotoWallMode()) {
    applyPhotoWallMasonryLayout();
  } else {
    applyDefaultMasonryLayout();
  }
}

let masonryTimer = null;
function queueMasonryLayout() {
  if (masonryTimer) clearTimeout(masonryTimer);
  masonryTimer = setTimeout(applyMasonryLayout, 50);
}

window.addEventListener("resize", queueMasonryLayout);

// ---------------------------
// Sorting
// ---------------------------
document.getElementById("sortByName").addEventListener("click", () => {
  renderGames([...gamesData].sort((a, b) => a.name.localeCompare(b.name)));
  sortMenu.style.display = "none";
});

document.getElementById("sortByRating").addEventListener("click", () => {
  renderGames([...gamesData].sort((a, b) => b.rating - a.rating));
  sortMenu.style.display = "none";
});

document.getElementById("sortByDate").addEventListener("click", () => {
  renderGames([...gamesData].sort((a, b) => new Date(b.date) - new Date(a.date)));
  sortMenu.style.display = "none";
});

// ---------------------------
// Init
// ---------------------------
initializeDarkMode();
loadGames();

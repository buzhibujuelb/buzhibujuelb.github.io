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
  11: "Epic Games"
};

const apiKey = "4d79f0d629c741e1be8ae8bf14818815";
const jsonUrl = "games.json";
let gamesData = [];

// Initialize dark mode
function initializeDarkMode() {
  const isDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (isDarkMode) {
    document.body.classList.add("dark-mode");
  }
}

// Dark mode toggle
document.getElementById("toggleDarkMode").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Sort menu toggle
const sortMenu = document.getElementById("sortMenu");
document.getElementById("sortToggle").addEventListener("click", () => {
  sortMenu.style.display = sortMenu.style.display === "flex" ? "none" : "flex";
});

async function loadGames() {
  const response = await fetch(jsonUrl);
  gamesData = await response.json();
  gamesData = gamesData.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderGames(gamesData);
}

function renderGames(games) {
  const gameGrid = document.getElementById("gameGrid");
  gameGrid.innerHTML = "";

  games.forEach((game) => {
    const card = document.createElement("div");
    card.classList.add("game-card");

    const img = document.createElement("img");
    const svgPlaceholder = `
      <svg xmlns="http://www.w3.org/2000/svg" width="250" height="150" viewBox="0 0 250 150" fill="none">
        <rect width="250" height="150" fill="#e0e0e0"/>
        <text x="50%" y="50%" fill="#aaa" font-size="20" font-family="Arial, sans-serif" dominant-baseline="middle" text-anchor="middle">
          Loading...
        </text>
      </svg>`;
    img.src = `data:image/svg+xml;base64,${btoa(svgPlaceholder)}`;
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

    gameGrid.appendChild(card);

    card.addEventListener("click", () => showModal(game, img.src));

    if (game.id) {
      fetchGameDetails(game.id).then((details) => {
        if (details.background_image) {
          img.src = details.background_image;
        }
      });
    }
  });
}

async function fetchGameDetails(id) {
  const url = `https://api.rawg.io/api/games/${id}?key=${apiKey}`;
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch details for game ID ${id}:`, error);
    return {};
  }
}

async function fetchStoreLinks(gameId) {
  const url = `https://api.rawg.io/api/games/${gameId}/stores?key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Failed to fetch store links for game ID ${gameId}:`, error);
    return [];
  }
}

async function showModal(game, imageUrl) {
  const modal = document.getElementById("gameModal");
  const modalContent = document.getElementById("modalContent");

  modalContent.innerHTML = `
    <img src="${imageUrl}" alt="${game.name}">
    <h3>${game.name}</h3>
    <p>评分: ${game.rating}/10</p>
    <p>最后游玩时间: ${game.date}</p>
    <p>${game.description.replace(/\n/g, "<br>")}</p>
    <div id="storeLinks"><strong>商店链接:</strong> 加载中...</div>
  `;

  modal.classList.add("active");

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  if (game.id) {
    const storeLinks = await fetchStoreLinks(game.id);
    const storeLinkContainer = document.getElementById("storeLinks");

    if (storeLinks.length > 0) {
      const storeButtons = storeLinks
        .map(
          (store) =>
            `<a href="${store.url}" target="_blank">${storeIdMapping[store.store_id] || "未知商店"}</a>`
        )
        .join(" ");

      storeLinkContainer.innerHTML = `<strong>商店链接:</strong> ${storeButtons}`;
    } else {
      storeLinkContainer.innerHTML = `<strong>商店链接:</strong> 暂无商店信息`;
    }
  }
}

// Sorting functions
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

initializeDarkMode();
loadGames();


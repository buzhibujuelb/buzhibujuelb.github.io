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
let gameRenderVersion = 0;
let coverLoadGeneration = 0;
let pendingCoverLoads = 0;
const gameDetailsCache = new Map();
let photoWallLayoutCache = null;

// ---------------------------
// Helpers
// ---------------------------
function isPhotoWallMode() {
  return document.body.classList.contains("photo-wall");
}

function getGameDateValue(date) {
  const [year, month = "1"] = String(date)
    .trim()
    .split(/[.\/-]/)
    .map(Number);

  if (!Number.isFinite(year) || !Number.isFinite(month)) return 0;
  return year * 12 + month;
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
const sortToggleBtn = document.getElementById("sortToggle");
sortToggleBtn.addEventListener("click", () => {
  if (isPhotoWallMode()) return;
  sortMenu.style.display = sortMenu.style.display === "flex" ? "none" : "flex";
});

// Photo-wall toggle
const photoWallBtn = document.getElementById("togglePhotoWall");
function updatePhotoWallControls() {
  const photoMode = isPhotoWallMode();
  sortToggleBtn.hidden = photoMode;
  if (photoMode) sortMenu.style.display = "none";

  if (!photoWallBtn) return;
  const icon = photoWallBtn.querySelector("i");
  const label = photoMode ? "切换到图文模式" : "切换到纯图片模式";
  if (icon) {
    icon.className = photoMode ? "fas fa-address-card" : "fas fa-image";
  }
  photoWallBtn.title = label;
  photoWallBtn.setAttribute("aria-label", label);
}

if (photoWallBtn) {
  photoWallBtn.addEventListener("click", () => {
    document.body.classList.toggle("photo-wall");
    updatePhotoWallControls();
    queueMasonryLayout(true);
  });
}
updatePhotoWallControls();

// ---------------------------
// Load Games
// ---------------------------
async function loadGames() {
  const response = await fetch(jsonUrl);
  gamesData = await response.json();

  gamesData.sort((a, b) => getGameDateValue(b.date) - getGameDateValue(a.date));
  renderGames(gamesData);
}

// ---------------------------
// Render Games
// ---------------------------
function renderGames(games) {
  const gameGrid = document.getElementById("gameGrid");
  gameGrid.innerHTML = "";
  gameRenderVersion += 1;
  photoWallLayoutCache = null;
  const currentCoverGeneration = ++coverLoadGeneration;
  const photoLayoutNeedsFinalAspectRefresh = games.some(
    (game) => !Number.isFinite(Number(game.image_aspect))
  );
  pendingCoverLoads = games.filter(
    (game) => game.background_image || game.id
  ).length;

  const finishCoverLoad = () => {
    if (currentCoverGeneration !== coverLoadGeneration) return;
    pendingCoverLoads = Math.max(0, pendingCoverLoads - 1);
    // 默认瀑布流的自然高度会随图片改变，需要及时补排；照片墙则等本批
    // 封面全部就绪后只做一次最终规划，避免灰框阶段反复整墙跳动。
    if (
      !isPhotoWallMode() ||
      (pendingCoverLoads === 0 && photoLayoutNeedsFinalAspectRefresh)
    ) {
      queueMasonryLayout();
    }
  };

  games.forEach((game) => {
    const card = document.createElement("div");
    card.classList.add("game-card");
    card.dataset.rating = game.rating ?? 0;
    if (Number.isFinite(Number(game.image_aspect))) {
      card.dataset.aspect = Number(game.image_aspect);
    }

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

    const loadCover = (coverUrl) => {
      if (!coverUrl) {
        finishCoverLoad();
        return;
      }
      img.onload = () => {
        if (!card.dataset.aspect) computeImageAspect(card, img);
        finishCoverLoad();
      };
      img.onerror = finishCoverLoad;
      img.src = coverUrl;
    };

    if (game.background_image) {
      loadCover(game.background_image);
    } else if (game.id) {
      fetchGameDetails(game.id)
        .then((details) => loadCover(details.background_image))
        .catch(finishCoverLoad);
    }
  });

  // 占位图阶段先做一次布局
  queueMasonryLayout();
}

// ---------------------------
// 记录图片比例，照片墙会据此选择横向或纵向的小卡片
// ---------------------------
function computeImageAspect(card, img) {
  const aspect =
    img.naturalWidth && img.naturalHeight
      ? img.naturalWidth / img.naturalHeight
      : 16 / 9;

  card.dataset.aspect = aspect;
}

// ---------------------------
// RAWG details
// ---------------------------
async function fetchGameDetails(id) {
  if (gameDetailsCache.has(id)) return gameDetailsCache.get(id);

  const url = `https://api.rawg.io/api/games/${id}?key=${apiKey}`;
  const request = (async () => {
    try {
      const res = await fetch(url);
      const result = await res.json();
      return result;
    } catch (err) {
      console.error("RAWG detail error for id", id, err);
      return {};
    }
  })();
  gameDetailsCache.set(id, request);
  return request;
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
const gameModal = document.getElementById("gameModal");
const modalCloseButton = document.getElementById("modalClose");

function closeModal() {
  gameModal.classList.remove("active");
  gameModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

modalCloseButton.addEventListener("click", closeModal);
gameModal.addEventListener("click", (event) => {
  if (event.target === gameModal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && gameModal.classList.contains("active")) {
    closeModal();
  }
});

async function showModal(game, imageUrl) {
  const content = document.getElementById("modalContent");

  content.innerHTML = `
    <img src="${imageUrl}">
    <h3>${game.name}</h3>
    <p>评分: ${game.rating}/10</p>
    <p>最后游玩时间: ${game.date}</p>
    <p>${game.description.replace(/\n/g, "<br>")}</p>
    <div id="storeLinks"><strong>商店链接:</strong> 加载中...</div>
  `;

  gameModal.classList.add("active");
  gameModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  content.scrollTop = 0;
  modalCloseButton.focus();

  if (game.id) {
    const stores = await fetchStoreLinks(game.id);
    const box = content.querySelector("#storeLinks");
    if (!box) return;
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
// 默认模式：按行分配到各列，再让每列独立向下堆叠
// 这样既保持从左到右的排序顺序，也保留紧凑的瀑布流效果
// ---------------------------
function applyDefaultMasonryLayout() {
  const grid = document.getElementById("gameGrid");
  const cards = Array.from(grid.children);
  const colW = 250;
  const gap = 20;

  const GW = grid.clientWidth;
  if (!GW) return;

  const cols = Math.max(1, Math.floor((GW + gap) / (colW + gap)));
  const layoutWidth = cols * (colW + gap) - gap;
  const centerOffset = Math.max(0, (GW - layoutWidth) / 2);
  const columnHeights = new Array(cols).fill(20);

  grid.style.display = "block";
  grid.style.gridTemplateColumns = "";
  grid.style.gridAutoRows = "";
  grid.style.gridAutoFlow = "";
  grid.style.gap = "";
  grid.style.background = "";
  grid.style.overflow = "";

  cards.forEach((card, index) => {
    card.style.position = "absolute";
    card.style.width = colW + "px";
    card.style.height = "auto"; // 默认模式用内容自然高度
    card.style.gridColumn = "";
    card.style.gridRow = "";
    card.style.order = "";

    const img = card.querySelector("img");
    if (img) {
      img.style.width = "100%";
      img.style.height = "auto";
      img.style.objectFit = "cover";
    }

    // 循环分列而不是选择当前最短列，确保排序结果始终从左到右推进
    const col = index % cols;
    const top = columnHeights[col];
    card.style.left = centerOffset + col * (colW + gap) + "px";
    card.style.top = top + "px";
    columnHeights[col] = top + card.offsetHeight + gap;
  });

  grid.style.position = "relative";
  grid.style.height = Math.max(...columnHeights) + "px";
}

// ---------------------------
function getPhotoWallRatingScale(rating) {
  return Math.min(1.04, Math.max(0.96, 1 + (rating - 8) * 0.01));
}

const PHOTO_WALL_ASPECT_SOFT_LIMIT = Math.log(1.1);
const PHOTO_WALL_ASPECT_EXCESS_WEIGHT = 48;
function getPhotoWallAspectDistortionLoss(aspectFactor) {
  const logError = Math.abs(Math.log(aspectFactor));
  return (
    logError ** 2 +
    PHOTO_WALL_ASPECT_EXCESS_WEIGHT *
      Math.max(0, logError - PHOTO_WALL_ASPECT_SOFT_LIMIT) ** 2
  );
}

function optimizePhotoWallRatingAssignments(placements) {
  if (placements.length < 2) return;
  const slotMetrics = placements.map((placement) => ({
    area: placement.width * placement.height,
    aspect: placement.width / placement.height,
  }));
  const originalItems = placements.map(({ item }) => item);
  const itemIndices = new Map(
    originalItems.map((item, index) => [item, index])
  );
  // 槽位尺寸和原图比例在交换过程中都不会变；把昂贵的 log 损失预先
  // 算成矩阵，后面的多轮两两比较只做查表，不改变原来的决策规则。
  const distortionLosses = slotMetrics.map((slot) =>
    originalItems.map((item) =>
      getPhotoWallAspectDistortionLoss(slot.aspect / item.aspect)
    )
  );

  const ratingSlope = 0.05;
  const lowRatingThreshold = 7.5;
  const lowRatingPenaltyWeight = 1;
  const lowRatingAreaLimit = 1.5;
  const ratings = [...new Set(placements.map(({ item }) => item.rating))];
  const counts = new Map(
    ratings.map((rating) => [
      rating,
      placements.filter(({ item }) => item.rating === rating).length,
    ])
  );
  const totalArea = placements.reduce(
    (sum, placement) => sum + placement.width * placement.height,
    0
  );
  const meanArea = totalArea / placements.length;
  const weightSum = ratings.reduce(
    (sum, rating) =>
      sum + counts.get(rating) * Math.exp(ratingSlope * (rating - 8)),
    0
  );
  const desiredAverageAreas = new Map(
    ratings.map((rating) => [
      rating,
      (totalArea * Math.exp(ratingSlope * (rating - 8))) / weightSum,
    ])
  );
  const areaTotals = new Map(
    ratings.map((rating) => [
      rating,
      placements
        .filter(({ item }) => item.rating === rating)
        .reduce(
          (sum, placement) => sum + placement.width * placement.height,
          0
        ),
    ])
  );

  const getGroupCost = (rating, areaTotal) => {
    const averageArea = areaTotal / counts.get(rating);
    return (
      counts.get(rating) *
      Math.log(averageArea / desiredAverageAreas.get(rating)) ** 2
    );
  };
  const getLowRatingCost = (rating, area) => {
    if (rating > lowRatingThreshold) return 0;
    return (
      lowRatingPenaltyWeight *
      Math.max(0, area / (meanArea * lowRatingAreaLimit) - 1) ** 2
    );
  };

  // 在宽高比兼容的封面之间交换槽位：先让每个评分档的平均面积形成
  // 温和的单调梯度，再阻止 7.5 分及以下的封面独占异常大的块。
  for (let pass = 0; pass < placements.length; pass += 1) {
    let changed = false;

    for (let i = 0; i < placements.length; i += 1) {
      for (let j = i + 1; j < placements.length; j += 1) {
        const first = placements[i];
        const second = placements[j];
        const firstRating = first.item.rating;
        const secondRating = second.item.rating;
        if (firstRating === secondRating) continue;

        const firstSlotAspect = slotMetrics[i].aspect;
        const secondSlotAspect = slotMetrics[j].aspect;
        const firstSwapFactor = firstSlotAspect / second.item.aspect;
        const secondSwapFactor = secondSlotAspect / first.item.aspect;
        if (
          firstSwapFactor < 0.9 ||
          firstSwapFactor > 1.1 ||
          secondSwapFactor < 0.9 ||
          secondSwapFactor > 1.1
        ) {
          continue;
        }

        const firstArea = slotMetrics[i].area;
        const secondArea = slotMetrics[j].area;
        const firstTotal = areaTotals.get(firstRating);
        const secondTotal = areaTotals.get(secondRating);
        const nextFirstTotal = firstTotal - firstArea + secondArea;
        const nextSecondTotal = secondTotal - secondArea + firstArea;
        const currentCost =
          getGroupCost(firstRating, firstTotal) +
          getGroupCost(secondRating, secondTotal) +
          getLowRatingCost(firstRating, firstArea) +
          getLowRatingCost(secondRating, secondArea);
        const swappedCost =
          getGroupCost(firstRating, nextFirstTotal) +
          getGroupCost(secondRating, nextSecondTotal) +
          getLowRatingCost(firstRating, secondArea) +
          getLowRatingCost(secondRating, firstArea);

        if (swappedCost < currentCost - 1e-9) {
          [first.item, second.item] = [second.item, first.item];
          areaTotals.set(firstRating, nextFirstTotal);
          areaTotals.set(secondRating, nextSecondTotal);
          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  const getRatingOrderLoss = (
    highRating,
    highArea,
    lowRating,
    lowArea
  ) => {
    const ratingDifference = highRating - lowRating;
    if (ratingDifference <= 0) return 0;
    const desiredMargin = ratingDifference * 0.015;
    const inversion = Math.max(
      0,
      Math.log(lowArea / highArea) + desiredMargin
    );
    return 2 * ratingDifference * inversion ** 2;
  };

  // 最后用软损失消除单张评分倒置。10% 是二次惩罚开始变陡的位置，
  // 不是硬边界；若修复评分倒置的收益更大，仍允许更明显的裁切。
  for (let pass = 0; pass < placements.length; pass += 1) {
    let changed = false;

    for (let i = 0; i < placements.length; i += 1) {
      for (let j = i + 1; j < placements.length; j += 1) {
        const first = placements[i];
        const second = placements[j];
        const highPlacement =
          first.item.rating > second.item.rating ? first : second;
        const lowPlacement = highPlacement === first ? second : first;
        const highIndex = highPlacement === first ? i : j;
        const lowIndex = highPlacement === first ? j : i;
        const highArea = slotMetrics[highIndex].area;
        const lowArea = slotMetrics[lowIndex].area;

        if (
          highPlacement.item.rating === lowPlacement.item.rating ||
          highArea >= lowArea
        ) {
          continue;
        }

        const highItemIndex = itemIndices.get(highPlacement.item);
        const lowItemIndex = itemIndices.get(lowPlacement.item);
        const currentLoss =
          distortionLosses[highIndex][highItemIndex] +
          distortionLosses[lowIndex][lowItemIndex] +
          getRatingOrderLoss(
            highPlacement.item.rating,
            highArea,
            lowPlacement.item.rating,
            lowArea
          );
        const swappedLoss =
          distortionLosses[highIndex][lowItemIndex] +
          distortionLosses[lowIndex][highItemIndex] +
          getRatingOrderLoss(
            highPlacement.item.rating,
            lowArea,
            lowPlacement.item.rating,
            highArea
          );

        if (swappedLoss >= currentLoss - 1e-9) {
          continue;
        }

        [highPlacement.item, lowPlacement.item] = [
          lowPlacement.item,
          highPlacement.item,
        ];
        changed = true;
      }
    }

    if (!changed) break;
  }

}

function applyPhotoWallPlacements(placements) {
  placements.forEach(({ item, left, top, width, height }) => {
    const card = item.card;
    card.style.position = "absolute";
    card.style.left = left + "px";
    card.style.top = top + "px";
    card.style.width = width + "px";
    card.style.height = height + "px";
    card.style.gridColumn = "";
    card.style.gridRow = "";
    card.style.order = "";

    const img = card.querySelector("img");
    if (img) {
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
    }
  });
}

// 照片墙模式：二维嵌套矩形拼贴，允许 T 形接缝而非全局等高行
// ---------------------------
function applyPhotoWallMasonryLayout() {
  const grid = document.getElementById("gameGrid");
  const cards = Array.from(grid.children);
  const targetHeight = Math.max(480, window.innerHeight);
  const gap = 2;

  // 先切换容器尺寸，再读取宽度；否则滚动条消失时会少算约 15px
  grid.style.position = "relative";
  grid.style.height = targetHeight + "px";
  grid.style.display = "block";
  grid.style.gridTemplateColumns = "";
  grid.style.gridAutoRows = "";
  grid.style.gridAutoFlow = "";
  grid.style.gap = "";
  grid.style.background = "#000";
  grid.style.overflow = "hidden";

  const GW = grid.clientWidth;
  if (!GW) return;

  const layoutCacheKey = [
    gameRenderVersion,
    GW,
    targetHeight,
    ...cards.map(
      (card) => `${card.dataset.rating}:${card.dataset.aspect || 16 / 9}`
    ),
  ].join("|");
  if (photoWallLayoutCache?.key === layoutCacheKey) {
    applyPhotoWallPlacements(photoWallLayoutCache.placements);
    return;
  }

  const rankedItems = cards
    .map((card, index) => {
      const sourceAspect = parseFloat(
        card.dataset.aspect || String(16 / 9)
      );
      return {
        card,
        index,
        rating: parseFloat(card.dataset.rating || "0"),
        // 使用原始宽高比，不把特别横或特别竖的封面先裁进固定范围。
        aspect:
          Number.isFinite(sourceAspect) && sourceAspect > 0
            ? sourceAspect
            : 16 / 9,
      };
    })
    .map((item) => ({
      ...item,
      layoutAspect: item.aspect * getPhotoWallRatingScale(item.rating),
    }))
    .sort((a, b) => b.rating - a.rating || a.index - b.index);

  // 高分图仍会按 ratingScale 稍微变大，但不能让它们刚好全落进单图大槽。
  // 用与总数互质的步长打散评分序列，让不同大小的槽位得到均匀的评分分布。
  const greatestCommonDivisor = (a, b) => {
    while (b) [a, b] = [b, a % b];
    return a;
  };
  let itemStride = Math.max(1, Math.floor(rankedItems.length / 5));
  while (
    itemStride < rankedItems.length &&
    greatestCommonDivisor(itemStride, rankedItems.length) !== 1
  ) {
    itemStride += 1;
  }
  const items = Array.from(
    { length: rankedItems.length },
    (_, position) =>
      rankedItems[(1 + position * itemStride) % rankedItems.length]
  );

  // 不同屏幕比例需要不同的 1/2/3 图节奏。只在少量经过筛选的模板中搜索，
  // 既能保留 T 形拼贴的视觉节奏，也不会在 resize 时做昂贵的穷举。
  const patternTemplates = [
    [5, 2, 7, 3],
    [16, 2, 2, 0],
    [5, 0, 7, 1],
    [9, 1, 3, 2],
    [7, 2, 4, 1],
    [16, 2, 4, 3],
    [16, 3, 4, 2],
    [2, 0, 3, 1],
  ];
  const createMosaicRows = ([
    singlePeriod,
    singleOffset,
    triplePeriod,
    tripleOffset,
  ]) => {
    const rows = [];
    let cursor = 0;
    let rowIndex = 0;

    while (cursor < items.length) {
      let itemCount =
        rowIndex % singlePeriod === singleOffset
          ? 1
          : rowIndex % triplePeriod === tripleOffset
            ? 3
            : 2;
      itemCount = Math.min(itemCount, items.length - cursor);
      const rowItems = items.slice(cursor, cursor + itemCount);
      const aspectSum = rowItems.reduce(
        (sum, item) => sum + item.layoutAspect,
        0
      );
      rows.push({
        items: rowItems,
        sequence: rowIndex,
        coefficient: 1 / aspectSum,
      });
      cursor += itemCount;
      rowIndex += 1;
    }

    return rows;
  };

  const getNaturalColumnWidth = (column) => {
    let inverseAspectSum = 0;
    let innerGapAdjustment = 0;

    column.rows.forEach((row) => {
      const aspectSum = row.items.reduce(
        (sum, item) => sum + item.layoutAspect,
        0
      );
      inverseAspectSum += 1 / aspectSum;
      innerGapAdjustment += (gap * (row.items.length - 1)) / aspectSum;
    });

    return (
      (targetHeight - gap * (column.rows.length - 1) + innerGapAdjustment) /
      inverseAspectSum
    );
  };

  const createColumns = (mosaicRows, columnCount) => {
    const columns = Array.from({ length: columnCount }, (_, index) => ({
      index,
      rows: [],
      load: 0,
    }));

    [...mosaicRows]
      .sort((a, b) => b.coefficient - a.coefficient)
      .forEach((row) => {
        const target = columns.reduce((best, column) =>
          column.load < best.load ? column : best
        );
        target.rows.push(row);
        target.load += row.coefficient;
      });

    columns.forEach((column) => {
      column.rows.sort((a, b) => a.sequence - b.sequence);
      column.naturalWidth = getNaturalColumnWidth(column);
    });

    const availableWidth = GW - gap * (columnCount - 1);
    const horizontalScale =
      availableWidth /
      columns.reduce((sum, column) => sum + column.naturalWidth, 0);

    let maximumAspectDeviation = 0;
    let aspectDistortionLoss = 0;
    let individualOversizePenalty = 0;
    const meanTileArea = (GW * targetHeight) / items.length;
    const areaByRating = new Map();
    columns.forEach((column) => {
      const finalWidth = column.naturalWidth * horizontalScale;
      const rawHeights = column.rows.map((row) => {
        const aspectSum = row.items.reduce(
          (sum, item) => sum + item.layoutAspect,
          0
        );
        return (finalWidth - gap * (row.items.length - 1)) / aspectSum;
      });
      const verticalScale =
        (targetHeight - gap * (column.rows.length - 1)) /
        rawHeights.reduce((sum, height) => sum + height, 0);

      column.rows.forEach((row, rowIndex) => {
        const rawHeight = rawHeights[rowIndex];
        row.items.forEach((item) => {
          const aspectFactor =
            getPhotoWallRatingScale(item.rating) / verticalScale;
          maximumAspectDeviation = Math.max(
            maximumAspectDeviation,
            Math.abs(aspectFactor - 1)
          );
          aspectDistortionLoss +=
            getPhotoWallAspectDistortionLoss(aspectFactor);

          const estimatedArea =
            rawHeight * item.layoutAspect * rawHeight * verticalScale;
          const maximumAreaMultiple =
            item.rating >= 9.5
              ? Infinity
              : item.rating >= 9
                ? 3
                : item.rating >= 8.5
                  ? 2.5
                  : item.rating >= 8
                    ? 2
                    : item.rating >= 7.5
                      ? 1.5
                      : item.rating >= 7
                        ? 1.35
                        : 1.25;
          if (Number.isFinite(maximumAreaMultiple)) {
            individualOversizePenalty +=
              Math.max(
                0,
                estimatedArea / (meanTileArea * maximumAreaMultiple) - 1
              ) ** 2;
          }
          const ratingArea = areaByRating.get(item.rating) || {
            total: 0,
            count: 0,
          };
          ratingArea.total += estimatedArea;
          ratingArea.count += 1;
          areaByRating.set(item.rating, ratingArea);
        });
      });
    });

    const rating10Area = areaByRating.get(10);
    const rating8Area = areaByRating.get(8);
    const ratingAreaRatio =
      rating10Area && rating8Area
        ? rating10Area.total /
          rating10Area.count /
          (rating8Area.total / rating8Area.count)
        : 1.1;

    return {
      columns,
      horizontalScale,
      maximumAspectDeviation,
      aspectDistortionLoss,
      ratingAreaRatio,
      individualOversizePenalty,
    };
  };

  let bestLayout = null;
  const preferredColumnCount = Math.max(
    2,
    Math.min(
      12,
      Math.round(Math.sqrt((items.length * (GW / targetHeight)) / 7))
    )
  );
  const maximumColumns = Math.min(
    12,
    Math.max(2, Math.ceil(Math.sqrt(items.length)) + 1)
  );
  patternTemplates.forEach((pattern) => {
    const mosaicRows = createMosaicRows(pattern);
    for (
      let columnCount = 2;
      columnCount <= maximumColumns;
      columnCount += 1
    ) {
      const candidate = createColumns(mosaicRows, columnCount);
      // 严格按“最终宽高比 / 原宽高比”限制在 0.9～1.1，而非限制绝对尺寸。
      const scalePenalty = Math.abs(Math.log(candidate.horizontalScale));
      const columnPenalty =
        Math.abs(columnCount - preferredColumnCount) * 0.05;
      // 评分只做温和区分：10 分封面的平均面积目标约为 8 分的 1.1 倍。
      const ratingPenalty =
        Math.abs(Math.log(candidate.ratingAreaRatio / 1.1)) * 0.5;
      const individualSizePenalty =
        candidate.individualOversizePenalty * 0.3;
      const aspectPenalty = candidate.aspectDistortionLoss;
      const visualScore =
        scalePenalty +
        columnPenalty +
        ratingPenalty +
        individualSizePenalty +
        aspectPenalty;

      if (!bestLayout || visualScore < bestLayout.score) {
        bestLayout = { ...candidate, score: visualScore };
      }
    }
  });

  const placements = [];
  let columnLeft = 0;
  bestLayout.columns.forEach((column, columnIndex) => {
    const isLastColumn = columnIndex === bestLayout.columns.length - 1;
    const columnWidth = isLastColumn
      ? GW - columnLeft
      : column.naturalWidth * bestLayout.horizontalScale;
    const rawHeights = column.rows.map((row) => {
      const aspectSum = row.items.reduce(
        (sum, item) => sum + item.layoutAspect,
        0
      );
      return (columnWidth - gap * (row.items.length - 1)) / aspectSum;
    });
    const availableColumnHeight =
      targetHeight - gap * (column.rows.length - 1);
    const verticalScale =
      availableColumnHeight /
      rawHeights.reduce((sum, height) => sum + height, 0);
    let rowTop = 0;

    column.rows.forEach((row, localRowIndex) => {
      const rawHeight = rawHeights[localRowIndex];
      const rowHeight = rawHeight * verticalScale;
      let itemLeft = columnLeft;

      row.items.forEach((item, itemIndex) => {
        const isLastItem = itemIndex === row.items.length - 1;
        const itemWidth = isLastItem
          ? columnLeft + columnWidth - itemLeft
          : rawHeight * item.layoutAspect;
        placements.push({
          item,
          left: itemLeft,
          top: rowTop,
          width: itemWidth,
          height: rowHeight,
        });

        itemLeft += itemWidth + gap;
      });

      rowTop +=
        rowHeight + (localRowIndex < column.rows.length - 1 ? gap : 0);
    });

    columnLeft += columnWidth + gap;
  });

  optimizePhotoWallRatingAssignments(placements);
  applyPhotoWallPlacements(placements);
  photoWallLayoutCache = { key: layoutCacheKey, placements };
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
function queueMasonryLayout(immediate = false) {
  if (masonryTimer) clearTimeout(masonryTimer);
  if (immediate) {
    masonryTimer = null;
    applyMasonryLayout();
    return;
  }
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
  renderGames(
    [...gamesData].sort(
      (a, b) => getGameDateValue(b.date) - getGameDateValue(a.date)
    )
  );
  sortMenu.style.display = "none";
});

// ---------------------------
// Init
// ---------------------------
initializeDarkMode();
loadGames();

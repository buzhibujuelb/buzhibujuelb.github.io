const state = {
  collection: "pilgrimage",
  view: "work",
  filter: null,
  siteFilter: null,
  photos: [],
  workCovers: {},
  workOrder: new Map(),
  heroSelections: new Map(),
  visible: [],
  lightboxIndex: 0,
};

const workCoverIds = {
  "ATRI -My Dear Moments-": "atri-choshi-06",
  "Girls Band Cry": "gbc-kamisuwa-13",
  "天气之子": "weathering-ginza-01",
};

const collectionViews = {
  pilgrimage: ["work", "time", "place"],
  cosplay: ["work", "time", "place"],
  drawings: ["all", "time", "work"],
};

function defaultViewFor(collection) {
  return collection === "drawings" ? "all" : "work";
}

const countryRules = [
  { country: "日本", regions: ["東京都", "千葉県", "長野県", "愛知県", "兵庫県", "京都府"] },
  { country: "美国", regions: ["California", "Illinois", "Georgia"] },
  { country: "中国", regions: ["四川省"] },
];

const els = {
  hero: document.querySelector("#hero"),
  heroRail: document.querySelector("#heroRail"),
  heroTitle: document.querySelector("#heroTitle"),
  photoCount: document.querySelector("#photoCount"),
  photoLabel: document.querySelector("#photoLabel"),
  workCount: document.querySelector("#workCount"),
  workLabel: document.querySelector("#workLabel"),
  placeCount: document.querySelector("#placeCount"),
  placeLabel: document.querySelector("#placeLabel"),
  grid: document.querySelector("#galleryGrid"),
  chips: document.querySelector("#filterChips"),
  clear: document.querySelector("#clearFilter"),
  filterRow: document.querySelector(".filter-row"),
  empty: document.querySelector("#emptyState"),
  mapSection: document.querySelector("#mapSection"),
  placeList: document.querySelector("#placeList"),
  sectionCode: document.querySelector("#sectionCode"),
  lightbox: document.querySelector("#lightbox"),
  lightboxImage: document.querySelector("#lightboxImage"),
  lightboxWork: document.querySelector("#lightboxWork"),
  lightboxCaption: document.querySelector("#lightboxCaption"),
  lightboxMeta: document.querySelector("#lightboxMeta"),
};

let map = null;
let markers = [];
const lightboxPreloads = new Map();
const lightboxPreloadLimit = 12;
let lightboxRequestId = 0;

function uniqueBy(field) {
  return [...new Set(photosForCollection().map((photo) => photo[field]).filter(Boolean))];
}

function photosForCollection() {
  return state.photos.filter((photo) => {
    const collections = photo.collections || [photo.collection || "pilgrimage"];
    return collections.includes(state.collection);
  });
}

function formatMonth(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}年${Number(match[2])}月` : value;
}

function formatDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}.${Number(match[2])}.${Number(match[3])}` : formatMonth(value);
}

function monthKey(value) {
  return String(value || "日期未记录").slice(0, 7);
}

function formatLocation(photo) {
  return [photo.place, photo.site].filter(Boolean).join(" · ");
}

function mapLocationForPhoto(photo) {
  return photo.mapSite || photo.site || photo.place;
}

function countryForPhoto(photo) {
  if (photo.country) return photo.country;
  const region = String(photo.place || "").split(" · ")[0];
  return countryRules.find((rule) => rule.regions.includes(region))?.country || "其他";
}

function fieldForView() {
  if (state.view === "all") return null;
  return state.view === "work" ? "work" : state.view === "time" ? "date" : "place";
}

function updateUrl() {
  const params = new URLSearchParams();
  if (state.collection !== "pilgrimage") params.set("collection", state.collection);
  if (state.view !== defaultViewFor(state.collection)) params.set("view", state.view);
  if (state.filter && fieldForView()) params.set(fieldForView(), state.filter);
  if (state.view === "place" && state.filter && state.siteFilter) params.set("site", state.siteFilter);
  history.replaceState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}`);
}

function readUrl() {
  const params = new URLSearchParams(location.search);
  const requestedCollection = params.get("collection") || "pilgrimage";
  state.collection = collectionViews[requestedCollection] ? requestedCollection : "pilgrimage";
  const requestedView = params.get("view") || defaultViewFor(state.collection);
  state.view = collectionViews[state.collection].includes(requestedView)
    ? requestedView
    : defaultViewFor(state.collection);
  state.filter = state.view === "time" || state.view === "all" ? null : params.get(fieldForView());
  state.siteFilter = state.view === "place" && state.filter ? params.get("site") : null;
}

const workTitleLines = {
  "你的名字。": ["你的名字。"],
  "天气之子": ["天气之子"],
  "ATRI -My Dear Moments-": ["ATRI", "MY DEAR MOMENTS"],
  "Girls Band Cry": ["GIRLS BAND", "CRY"],
  "Resident Evil 4": ["RESIDENT EVIL", "4"],
  "Watch Dogs": ["WATCH", "DOGS"],
  "败犬女主太多了！": ["败犬女主", "太多了！"],
  "千恋＊万花": ["千恋＊万花"],
  "Xenoblade Chronicles 3": ["XENOBLADE", "CHRONICLES 3"],
  "【我推的孩子】": ["【我推的孩子】"],
  "孤独摇滚！": ["孤独摇滚！"],
  "辉夜大小姐想让我告白": ["辉夜大小姐", "想让我告白"],
  "Watch Dogs 2": ["WATCH DOGS", "2"],
};

function setHeroTitle(lines, label, workDetail = false) {
  els.heroTitle.innerHTML = lines.map((line) => `<span>${escapeHtml(line)}</span>`).join("");
  els.heroTitle.setAttribute("aria-label", label);
  els.heroTitle.classList.toggle("is-work-title", workDetail);
  els.heroTitle.classList.toggle("is-cjk", lines.some((line) => /[\u3000-\u9fff]/.test(line)));
}

function heroPhotosFor(key, photos, refresh = false) {
  if (refresh || !state.heroSelections.has(key)) {
    const previous = state.heroSelections.get(key);
    const shuffled = [...photos];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    if (previous?.[0] && shuffled[0]?.id === previous[0].id) {
      const differentIndex = shuffled.findIndex((photo) => photo.id !== previous[0].id);
      if (differentIndex > 0) {
        [shuffled[0], shuffled[differentIndex]] = [shuffled[differentIndex], shuffled[0]];
      }
    }
    state.heroSelections.set(key, shuffled.slice(0, 6));
  }
  return state.heroSelections.get(key);
}

function renderHeroPanels(photos) {
  els.heroRail.innerHTML = photos.map((photo) => `
    <span class="hero-panel"><img src="${escapeHtml(photo.thumb || photo.src)}" alt="" width="${photo.width}" height="${photo.height}" decoding="async"></span>
  `).join("");
}

function renderHero() {
  const collectionPhotos = photosForCollection();
  const drawings = state.collection === "drawings";
  els.hero.classList.toggle("is-drawings", drawings);

  if (drawings) {
    const characters = new Set(collectionPhotos.map((photo) => photo.character).filter(Boolean));
    const years = new Set(collectionPhotos.map((photo) => String(photo.date || "").slice(0, 4)).filter(Boolean));
    els.photoCount.textContent = collectionPhotos.length;
    els.photoLabel.textContent = "DRAWINGS";
    els.workCount.textContent = characters.size;
    els.workLabel.textContent = "CHARACTERS";
    els.placeCount.textContent = years.size;
    els.placeLabel.textContent = "YEARS";
    els.hero.classList.remove("is-work-detail");
    setHeroTitle(["DRAWINGS"], "Drawings");
    renderHeroPanels(heroPhotosFor("collection:drawings", collectionPhotos, true));
    document.title = "Drawings / 绘画 · Visual Archive";
    return;
  }

  const selectedWork = state.view === "work" ? state.filter : null;
  const selectedPlace = state.view === "place" ? state.filter : null;
  const selectedSite = selectedPlace ? state.siteFilter : null;
  const photos = selectedWork
    ? collectionPhotos.filter((photo) => photo.work === selectedWork)
    : selectedPlace
      ? collectionPhotos.filter((photo) => photo.place === selectedPlace
        && (!selectedSite || mapLocationForPhoto(photo) === selectedSite))
      : collectionPhotos;

  els.photoCount.textContent = photos.length;
  els.photoLabel.textContent = "PHOTOGRAPHS";

  if (selectedWork) {
    const places = new Set(photos.map(formatLocation).filter(Boolean));
    const months = new Set(photos.map((photo) => photo.date).filter(Boolean));
    els.workCount.textContent = months.size;
    els.workLabel.textContent = months.size === 1 ? "MONTH" : "MONTHS";
    els.placeCount.textContent = places.size;
    els.placeLabel.textContent = places.size === 1 ? "PLACE" : "PLACES";

    const fallback = photos.find((photo) => photo.cover)
      || photos.find((photo) => photo.featured)
      || photos[0];
    const officialCover = state.workCovers[selectedWork];
    const coverSrc = officialCover?.heroSrc || officialCover?.src || fallback?.thumb || fallback?.src;
    els.hero.classList.add("is-work-detail");
    els.heroRail.innerHTML = coverSrc ? `
      <span class="hero-cover"><img src="${escapeHtml(coverSrc)}" alt="" decoding="async" fetchpriority="high" style="object-position:${escapeHtml(officialCover?.heroObjectPosition || officialCover?.objectPosition || "50% 50%")}"></span>
    ` : "";
    setHeroTitle(workTitleLines[selectedWork] || [selectedWork], selectedWork, true);
    document.title = `${selectedWork} · Visual Archive`;
    return;
  }

  if (selectedPlace) {
    const works = new Set(photos.map((photo) => photo.work).filter(Boolean));
    const sites = new Set(photos.map(mapLocationForPhoto).filter(Boolean));
    els.workCount.textContent = works.size;
    els.workLabel.textContent = works.size === 1 ? "TITLE" : "TITLES";
    els.placeCount.textContent = sites.size;
    els.placeLabel.textContent = sites.size === 1 ? "SITE" : "SITES";
    els.hero.classList.remove("is-work-detail");
    const locationTitle = selectedSite || selectedPlace;
    setHeroTitle([locationTitle], locationTitle, true);
    renderHeroPanels(heroPhotosFor(`place:${state.collection}:${selectedPlace}:${selectedSite || "all"}`, photos));
    document.title = `${locationTitle} · Visual Archive`;
    return;
  }

  els.workCount.textContent = new Set(photos.map((photo) => photo.work).filter(Boolean)).size;
  els.workLabel.textContent = "TITLES";
  els.placeCount.textContent = new Set(photos.map((photo) => photo.place).filter(Boolean)).size;
  els.placeLabel.textContent = "PLACES";
  els.hero.classList.remove("is-work-detail");
  const titleLines = state.collection === "cosplay" ? ["COSPLAY", "ARCHIVE"] : ["SEICHI", "JUNREI"];
  setHeroTitle(titleLines, titleLines.join(" "));
  document.title = state.collection === "cosplay" ? "Cosplay · Visual Archive" : "Seichi junrei · 圣地巡礼";
  renderHeroPanels(heroPhotosFor(`collection:${state.collection}`, photos, true));
}

function renderControls() {
  document.querySelectorAll("[data-collection]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.collection === state.collection);
  });
  const availableViews = collectionViews[state.collection];
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.hidden = !availableViews.includes(button.dataset.view);
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });
  document.querySelector('[data-view="work"]').textContent = state.collection === "drawings" ? "按原作" : "按作品";

  const collectionCode = state.collection === "pilgrimage" ? "SJ" : state.collection === "cosplay" ? "COS" : "DRW";
  const viewCode = state.view === "all"
    ? "INDEX"
    : state.view === "work" ? (state.filter || "TITLES")
      : state.view === "time" ? "DATES" : (state.siteFilter || state.filter || "PLACES");
  els.sectionCode.textContent = `${collectionCode} / ${viewCode}`;

  els.chips.innerHTML = "";
  if (state.collection === "drawings" && state.view === "work") {
    const works = uniqueBy("work").sort((left, right) => left.localeCompare(right, "zh-CN"));
    els.chips.innerHTML = works.map((work) => `
      <button type="button" class="${state.filter === work ? "is-active" : ""}" data-filter="${escapeHtml(work)}">${escapeHtml(work)}</button>
    `).join("");
    els.filterRow.hidden = false;
    els.clear.hidden = !state.filter;
    els.clear.textContent = "清除筛选";
  } else {
    els.clear.hidden = !(state.view === "work" && state.filter);
    els.filterRow.hidden = state.view !== "work" || !state.filter;
    els.clear.textContent = "返回全部作品";
  }
  els.mapSection.hidden = state.collection === "drawings" || state.view !== "place";

  if (!els.mapSection.hidden) {
    requestAnimationFrame(() => {
      initMap();
      map.invalidateSize();
    });
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[char]);
}

function applyFilter() {
  const photos = photosForCollection();
  if (state.view === "place") {
    if (state.filter && state.siteFilter
      && !photos.some((photo) => photo.place === state.filter && mapLocationForPhoto(photo) === state.siteFilter)) {
      const legacySitePhoto = photos.find((photo) => photo.place === state.filter && photo.site === state.siteFilter);
      if (legacySitePhoto) {
        state.siteFilter = mapLocationForPhoto(legacySitePhoto);
        renderControls();
      }
    }
    state.visible = photos.filter((photo) => (!state.filter || photo.place === state.filter)
      && (!state.siteFilter || mapLocationForPhoto(photo) === state.siteFilter));
  } else if (!state.filter) {
    state.visible = [...photos];
  } else {
    const field = fieldForView();
    state.visible = photos.filter((photo) => photo[field] === state.filter);
  }
  if (state.view === "time") {
    state.visible.sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")));
  }
  renderHero();
  renderGallery();
  renderPlaceList();
  updateMapMarkers();
  updateUrl();
}

function photoCardMarkup(photo, index) {
  const drawing = (photo.collections || []).includes("drawings");
  const alt = drawing
    ? `${photo.work} ${photo.character}绘画`
    : (photo.caption || `${photo.work}圣地巡礼拼接图`);
  const title = drawing ? photo.character : photo.work;
  const meta = drawing
    ? `${photo.work} · ${formatDate(photo.date)}`
    : `${formatLocation(photo)} · ${formatMonth(photo.date)}`;
  return `
    <button class="photo-card${drawing ? " drawing-card" : ""}" type="button" data-index="${index}" style="aspect-ratio:${photo.width}/${photo.height}">
      <img src="${escapeHtml(photo.thumb || photo.src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" width="${photo.width}" height="${photo.height}">
      <span class="photo-card-copy">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(meta)}</span>
      </span>
    </button>
  `;
}

function renderGallery() {
  els.empty.hidden = state.visible.length > 0;
  els.grid.hidden = state.visible.length === 0;
  const workIndex = state.collection !== "drawings"
    && state.view === "work" && !state.filter && state.visible.length > 0;
  const timeIndex = state.view === "time" && state.visible.length > 0;
  const drawingsIndex = state.collection === "drawings" && state.view === "all";
  els.grid.classList.toggle("is-work-index", workIndex);
  els.grid.classList.toggle("is-time-index", timeIndex);
  els.grid.classList.toggle("is-drawings-index", drawingsIndex);

  if (workIndex) {
    const works = uniqueBy("work").sort((left, right) =>
      (state.workOrder.get(left) ?? 0) - (state.workOrder.get(right) ?? 0));
    els.grid.innerHTML = works.map((work) => {
      const photos = photosForCollection().filter((photo) => photo.work === work);
      const cover = photos.find((photo) => photo.id === workCoverIds[work])
        || photos.find((photo) => photo.cover)
        || photos.find((photo) => photo.featured)
        || photos[0];
      const officialCover = state.workCovers[work];
      const coverSrc = officialCover?.src || cover.thumb || cover.src;
      const placeCount = new Set(photos.map(formatLocation)).size;
      return `
        <button class="work-card" type="button" data-work="${escapeHtml(work)}" style="--work-cover-image:url('${escapeHtml(coverSrc)}')">
          <span class="work-card-media">
            <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(`${work}官方视觉图`)}" loading="lazy" decoding="async" style="object-position:${escapeHtml(officialCover?.objectPosition || "50% 50%")};object-fit:${escapeHtml(officialCover?.fit || "cover")}"
              ${officialCover?.source ? `data-source="${escapeHtml(officialCover.source)}"` : ""}>
          </span>
          <span class="work-card-copy">
            <strong>${escapeHtml(work)}</strong>
            <span>${photos.length} PHOTOGRAPHS<br>${placeCount} ${placeCount === 1 ? "LOCATION" : "LOCATIONS"}</span>
          </span>
        </button>
      `;
    }).join("");
    return;
  }

  if (timeIndex) {
    const monthGroups = new Map();
    state.visible.forEach((photo, index) => {
      const month = monthKey(photo.date);
      if (!monthGroups.has(month)) monthGroups.set(month, []);
      monthGroups.get(month).push({ photo, index });
    });
    const itemLabel = state.collection === "drawings" ? "DRAWINGS" : "PHOTOGRAPHS";
    els.grid.innerHTML = [...monthGroups.entries()].map(([month, items]) => `
      <section class="month-group" aria-labelledby="month-${escapeHtml(month)}">
        <header class="month-heading">
          <h2 id="month-${escapeHtml(month)}">${escapeHtml(formatMonth(month))}</h2>
          <p>${items.length} <span>${itemLabel}</span></p>
        </header>
        <div class="month-grid">
          ${items.map(({ photo, index }) => photoCardMarkup(photo, index)).join("")}
        </div>
      </section>
    `).join("");
    return;
  }

  els.grid.innerHTML = state.visible.map((photo, index) => photoCardMarkup(photo, index)).join("");
}

function renderPlaceList() {
  if (state.view !== "place") return;
  const photos = photosForCollection();
  const places = new Map();
  photos.forEach((photo) => {
    if (!photo.place) return;
    if (!places.has(photo.place)) places.set(photo.place, { country: countryForPhoto(photo), photos: [] });
    places.get(photo.place).photos.push(photo);
  });

  const countries = new Map();
  places.forEach((entry, place) => {
    if (!countries.has(entry.country)) countries.set(entry.country, []);
    countries.get(entry.country).push({ place, count: entry.photos.length });
  });
  const countryOrder = ["日本", "美国", "中国", "其他"];
  const countryGroups = [...countries.entries()].sort(([left], [right]) =>
    countryOrder.indexOf(left) - countryOrder.indexOf(right));

  els.placeList.innerHTML = `
    <button type="button" class="place-reset ${state.filter ? "" : "is-active"}" data-place="">
      <span>全部地点</span><small>${places.size}</small>
    </button>
    ${countryGroups.map(([country, entries], countryIndex) => `
      <details class="place-country" ${entries.some(({ place }) => place === state.filter) || (!state.filter && countryIndex === 0) ? "open" : ""}>
        <summary>
          <span>${escapeHtml(country)}</span>
          <small>${entries.length} ${entries.length === 1 ? "PLACE" : "PLACES"}</small>
        </summary>
        <div class="place-country-items">
          ${entries.map(({ place, count }) => `
            <button type="button" data-place="${escapeHtml(place)}" class="${state.filter === place ? "is-active" : ""}">
              <span>${escapeHtml(place)}</span><small>${count}</small>
            </button>
          `).join("")}
        </div>
      </details>
    `).join("")}
  `;
}

function initMap() {
  if (map || !window.L) return;
  map = L.map("map", { scrollWheelZoom: false, zoomControl: true }).setView([35.9, 139.8], 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  updateMapMarkers();
}

function updateMapMarkers() {
  if (!map) return;
  markers.forEach((marker) => marker.remove());
  markers = [];
  const locations = new Map();
  const photos = photosForCollection();
  photos.forEach((photo) => {
    if (!photo.coordinates || !photo.place) return;
    const site = mapLocationForPhoto(photo);
    const key = [photo.place, site, ...photo.coordinates].join("|");
    if (!locations.has(key)) {
      locations.set(key, {
        place: photo.place,
        site,
        coordinates: photo.coordinates,
        count: 0,
      });
    }
    locations.get(key).count += 1;
  });
  const bounds = [];
  const styles = getComputedStyle(document.documentElement);
  const markerBlue = styles.getPropertyValue("--blue").trim() || "#1455d9";
  const markerPaper = styles.getPropertyValue("--sheet").trim() || "#f8f9f7";
  const markerRed = styles.getPropertyValue("--red").trim() || "#ec3f32";
  locations.forEach((location) => {
    const selectedPlace = state.filter === location.place;
    const focused = selectedPlace && state.siteFilter === location.site;
    const active = selectedPlace && (!state.siteFilter || focused);
    const marker = L.circleMarker(location.coordinates, {
      radius: focused ? 11 : active ? 9 : 7,
      color: focused ? markerPaper : markerBlue,
      weight: focused ? 3 : 2,
      fillColor: active ? markerRed : markerPaper,
      fillOpacity: 1,
    }).addTo(map);
    const label = location.site === location.place
      ? location.place
      : `${location.place} · ${location.site}`;
    marker.bindTooltip(`${label} · ${location.count} 张`, { direction: "top" });
    marker.on("click", () => setSiteFilter(location.place, location.site));
    markers.push(marker);
    bounds.push(location.coordinates);
  });
  if (state.view === "place" && state.filter && state.siteFilter) {
    const selectedLocations = [...locations.values()]
      .filter((location) => location.place === state.filter && location.site === state.siteFilter)
      .map((location) => location.coordinates);
    if (selectedLocations.length === 1) {
      map.setView(selectedLocations[0], 15, { animate: true });
    } else if (selectedLocations.length > 1) {
      map.fitBounds(selectedLocations, { padding: [72, 72], maxZoom: 15 });
    }
    return;
  }
  if (state.view === "place" && state.filter) {
    const selectedBounds = [...locations.values()]
      .filter((location) => location.place === state.filter)
      .map((location) => location.coordinates);
    if (selectedBounds.length === 1) {
      map.setView(selectedBounds[0], 13);
    } else if (selectedBounds.length > 1) {
      map.fitBounds(selectedBounds, { padding: [54, 54], maxZoom: 13 });
    }
    return;
  }
  if (bounds.length) map.fitBounds(bounds, { padding: [54, 54], maxZoom: 12 });
}

function setFilter(value) {
  state.filter = state.filter === value ? null : value;
  state.siteFilter = null;
  renderControls();
  applyFilter();
}

function setPlaceFilter(value) {
  if (!value) {
    state.filter = null;
    state.siteFilter = null;
  } else if (state.filter === value && !state.siteFilter) {
    state.filter = null;
  } else {
    state.filter = value;
    state.siteFilter = null;
  }
  renderControls();
  applyFilter();
}

function setSiteFilter(place, site) {
  state.filter = place;
  state.siteFilter = site;
  renderControls();
  applyFilter();
}

function lightboxPhotoCopy(photo) {
  const drawing = (photo.collections || []).includes("drawings");
  const caption = photo.character || photo.caption || photo.site || photo.place;
  const location = photo.character ? formatLocation(photo) : photo.place;
  return {
    alt: drawing ? `${photo.work} ${photo.character}绘画` : (caption || `${photo.work}圣地巡礼拼接图`),
    work: photo.work,
    caption,
    meta: drawing
      ? formatDate(photo.date)
      : [photo.event, location, formatMonth(photo.date)].filter(Boolean).join(" · "),
  };
}

function displayLightboxPhoto(photo, src) {
  const copy = lightboxPhotoCopy(photo);
  els.lightboxImage.src = src;
  els.lightboxImage.alt = copy.alt;
  els.lightboxWork.textContent = copy.work;
  els.lightboxCaption.textContent = copy.caption;
  els.lightboxMeta.textContent = copy.meta;
}

function preloadFullImage(photo, highPriority = false) {
  const existing = lightboxPreloads.get(photo.src);
  if (existing) return existing.ready;

  const image = new Image();
  image.decoding = "async";
  if ("fetchPriority" in image) image.fetchPriority = highPriority ? "high" : "auto";
  const loaded = new Promise((resolve, reject) => {
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error(`Unable to load ${photo.src}`)), { once: true });
  });
  image.src = photo.src;

  const ready = loaded.then(async (loadedImage) => {
    if (typeof loadedImage.decode === "function") {
      try {
        await loadedImage.decode();
      } catch {
        // A successful load is still safe to display when decode() is unavailable or interrupted.
      }
    }
    return loadedImage;
  });
  const entry = { image, ready };
  lightboxPreloads.set(photo.src, entry);
  ready.catch(() => {
    if (lightboxPreloads.get(photo.src) === entry) lightboxPreloads.delete(photo.src);
  });

  while (lightboxPreloads.size > lightboxPreloadLimit) {
    const oldestSrc = lightboxPreloads.keys().next().value;
    if (oldestSrc === photo.src) break;
    lightboxPreloads.delete(oldestSrc);
  }
  return ready;
}

function preloadAdjacentPhotos(index) {
  const count = state.visible.length;
  if (count < 2) return;
  [-2, -1, 1, 2].forEach((offset) => {
    const adjacent = state.visible[(index + offset + count) % count];
    if (adjacent) preloadFullImage(adjacent).catch(() => {});
  });
}

async function loadLightboxPhoto(index, { useThumbnail = false } = {}) {
  const photo = state.visible[index];
  if (!photo) return;
  const requestId = ++lightboxRequestId;

  if (useThumbnail) displayLightboxPhoto(photo, photo.thumb || photo.src);
  els.lightbox.classList.add("is-loading");
  els.lightbox.setAttribute("aria-busy", "true");

  try {
    await preloadFullImage(photo, true);
    if (requestId !== lightboxRequestId || !els.lightbox.open) return;
    displayLightboxPhoto(photo, photo.src);
  } catch (error) {
    if (requestId !== lightboxRequestId || !els.lightbox.open) return;
    console.warn(error);
    displayLightboxPhoto(photo, photo.thumb || photo.src);
  }

  if (requestId !== lightboxRequestId || !els.lightbox.open) return;
  els.lightbox.classList.remove("is-loading");
  els.lightbox.setAttribute("aria-busy", "false");
  preloadAdjacentPhotos(index);
}

function openLightbox(index) {
  state.lightboxIndex = index;
  const photo = state.visible[index];
  if (!photo) return;
  displayLightboxPhoto(photo, photo.thumb || photo.src);
  if (!els.lightbox.open) els.lightbox.showModal();
  loadLightboxPhoto(index, { useThumbnail: true });
}

function stepLightbox(direction) {
  if (!state.visible.length) return;
  state.lightboxIndex = (state.lightboxIndex + direction + state.visible.length) % state.visible.length;
  loadLightboxPhoto(state.lightboxIndex);
}

document.addEventListener("click", (event) => {
  const collection = event.target.closest("[data-collection]");
  if (collection) {
    state.collection = collection.dataset.collection;
    state.view = defaultViewFor(state.collection);
    state.filter = null;
    state.siteFilter = null;
    renderControls();
    applyFilter();
    return;
  }
  const view = event.target.closest("[data-view]");
  if (view) {
    state.view = view.dataset.view;
    state.filter = null;
    state.siteFilter = null;
    renderControls();
    applyFilter();
    return;
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) return setFilter(filter.dataset.filter);
  const place = event.target.closest("[data-place]");
  if (place) return setPlaceFilter(place.dataset.place || null);
  const work = event.target.closest("[data-work]");
  if (work) return setFilter(work.dataset.work);
  const card = event.target.closest(".photo-card");
  if (card) return openLightbox(Number(card.dataset.index));
});

els.clear.addEventListener("click", () => setFilter(null));
document.querySelector(".theme-toggle").addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme === "dark";
  document.documentElement.dataset.theme = dark ? "light" : "dark";
  localStorage.setItem("gallery-theme", dark ? "light" : "dark");
  updateMapMarkers();
});
document.querySelector(".lightbox-close").addEventListener("click", () => els.lightbox.close());
document.querySelector(".lightbox-prev").addEventListener("click", () => stepLightbox(-1));
document.querySelector(".lightbox-next").addEventListener("click", () => stepLightbox(1));
els.lightbox.addEventListener("click", (event) => { if (event.target === els.lightbox) els.lightbox.close(); });
els.lightbox.addEventListener("close", () => {
  lightboxRequestId += 1;
  els.lightbox.classList.remove("is-loading");
  els.lightbox.removeAttribute("aria-busy");
  els.lightboxImage.removeAttribute("src");
  els.lightboxImage.alt = "";
  els.lightboxWork.textContent = "";
  els.lightboxCaption.textContent = "";
  els.lightboxMeta.textContent = "";
});
document.addEventListener("keydown", (event) => {
  if (!els.lightbox.open) return;
  if (event.key === "ArrowLeft") stepLightbox(-1);
  if (event.key === "ArrowRight") stepLightbox(1);
});

const savedTheme = localStorage.getItem("gallery-theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
readUrl();

try {
  const [photosResponse, coversResponse, drawings] = await Promise.all([
    fetch("photos.json"),
    fetch("work-covers.json"),
    fetch("drawings.json").then((response) => response.ok ? response.json() : []),
  ]);
  state.photos = [...await photosResponse.json(), ...drawings];
  state.workCovers = await coversResponse.json();
  state.workOrder = new Map(
    [...new Set(state.photos.map((photo) => photo.work).filter(Boolean))]
      .map((work) => [work, Math.random()]));
} catch (error) {
  console.error("Unable to load gallery data", error);
}

renderControls();
applyFilter();

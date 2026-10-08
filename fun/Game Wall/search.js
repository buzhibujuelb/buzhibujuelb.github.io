// 在控制台调用 searchGame("游戏名")，同时搜索 RAWG 和 VNDB。
window.searchGame = async function searchGame(query, pageSize = 5) {
  const normalizedQuery = String(query || "").trim();
  const normalizedPageSize = Math.min(
    20,
    Math.max(1, Number.parseInt(pageSize, 10) || 5)
  );

  if (!normalizedQuery) {
    console.warn('请输入游戏名，例如：searchGame("pico park")');
    return { rawg: [], vndb: [] };
  }

  const rawgRequest = fetch("api-config.json")
    .then(async (response) => {
      if (!response.ok) throw new Error("无法读取 api-config.json");
      return response.json();
    })
    .then((config) => {
      if (!config.rawg_api_key) throw new Error("缺少 RAWG API key");
      return fetch(
        `https://api.rawg.io/api/games?key=${encodeURIComponent(
          config.rawg_api_key
        )}&search=${encodeURIComponent(
          normalizedQuery
        )}&page_size=${normalizedPageSize}`
      );
    })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`RAWG HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    });

  const vndbRequest = fetch("https://api.vndb.org/kana/vn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filters: ["search", "=", normalizedQuery],
      fields: "id,title,alttitle,released,rating,votecount",
      sort: "searchrank",
      results: normalizedPageSize,
    }),
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`VNDB HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return data.results || [];
  });

  const [rawgResult, vndbResult] = await Promise.allSettled([
    rawgRequest,
    vndbRequest,
  ]);

  const rawgGames = rawgResult.status === "fulfilled" ? rawgResult.value : [];
  const vndbGames = vndbResult.status === "fulfilled" ? vndbResult.value : [];

  console.group(`搜索 "${normalizedQuery}"`);

  console.group("RAWG");
  if (rawgResult.status === "rejected") {
    console.error("RAWG 搜索失败：", rawgResult.reason);
  } else if (rawgGames.length === 0) {
    console.log("未找到结果。");
  } else {
    rawgGames.forEach((game, index) => {
      console.log(
        `[${index + 1}] ${game.name} (id: ${game.id}, rating: ${game.rating}, released: ${game.released || "未知"})`
      );
    });
  }
  console.groupEnd();

  console.group("VNDB");
  if (vndbResult.status === "rejected") {
    console.error("VNDB 搜索失败：", vndbResult.reason);
  } else if (vndbGames.length === 0) {
    console.log("未找到结果。");
  } else {
    vndbGames.forEach((game, index) => {
      const alternativeTitle = game.alttitle ? ` / ${game.alttitle}` : "";
      const rating = Number.isFinite(game.rating)
        ? (game.rating / 10).toFixed(2)
        : "暂无";

      console.log(
        `[${index + 1}] ${game.title}${alternativeTitle} (vndb_id: ${game.id}, rating: ${rating}, votes: ${game.votecount}, released: ${game.released || "未知"})`
      );
    });
  }
  console.groupEnd();
  console.groupEnd();

  return { rawg: rawgGames, vndb: vndbGames };
};

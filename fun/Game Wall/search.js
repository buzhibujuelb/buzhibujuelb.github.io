// 将 RAWG 搜索函数挂到 window 上以供控制台调用
window.searchGameOnRawg = async function(query, pageSize = 5) {
  const searchUrl = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=${pageSize}`;
  try {
    const response = await fetch(searchUrl);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      console.log(`搜索 "${query}" 得到结果：`);
      data.results.forEach((game, index) => {
        console.log(`[${index + 1}] ${game.name} (id: ${game.id}, rating: ${game.rating}, released: ${game.released})`);
      });
    } else {
      console.log(`未找到与 "${query}" 匹配的游戏。`);
    }
  } catch (error) {
    console.error("搜索出错:", error);
  }
}

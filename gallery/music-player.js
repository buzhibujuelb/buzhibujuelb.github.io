(() => {
  const dock = document.querySelector("#musicDock");
  const toggle = document.querySelector("#musicDockToggle");
  const player = document.querySelector("#galleryPlayer");
  const status = document.querySelector("#musicStatus");
  if (!dock || !toggle || !player || !status) return;

  const songName = (event) => event.detail?.song?.name || player.getCurrentSong?.()?.name || "网易云歌单";
  const setStatus = (message, state = "paused") => {
    status.textContent = message;
    dock.dataset.playerState = state;
  };

  let playbackUnlockArmed = false;
  const removePlaybackUnlock = () => {
    document.removeEventListener("click", unlockPlayback);
    document.removeEventListener("keydown", unlockPlayback);
    playbackUnlockArmed = false;
  };
  const unlockPlayback = (event) => {
    if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
    removePlaybackUnlock();
    if (dock.querySelector(".nmpv3-is-playing")) return;
    player.play?.().catch(() => setStatus("READY · 点播放开始", "paused"));
  };
  const armPlaybackUnlock = () => {
    if (playbackUnlockArmed) return;
    playbackUnlockArmed = true;
    document.addEventListener("click", unlockPlayback);
    document.addEventListener("keydown", unlockPlayback);
  };

  const syncPlayerTheme = () => {
    player.setAttribute("theme", document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  };

  const setCollapsed = (collapsed) => {
    dock.classList.toggle("is-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "展开播放器" : "收起播放器");
    toggle.textContent = collapsed ? "+" : "−";
    localStorage.setItem("gallery-player-collapsed", String(collapsed));
  };

  setCollapsed(localStorage.getItem("gallery-player-collapsed") === "true");
  toggle.addEventListener("click", () => setCollapsed(!dock.classList.contains("is-collapsed")));

  syncPlayerTheme();
  new MutationObserver(syncPlayerTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  player.addEventListener("nmpv3:playlistchange", (event) => {
    const count = event.detail?.playlist?.songs?.length;
    setStatus(`${count ? `${count} TRACKS` : "PLAYLIST READY"} · 正在尝试自动播放`, "paused");
  });
  player.addEventListener("nmpv3:songchange", (event) => {
    setStatus(`READY · ${songName(event)}`, "paused");
    window.setTimeout(() => {
      const state = player.getState?.();
      if (!state?.isPlaying && !dock.querySelector(".nmpv3-is-playing")) {
        setStatus(`READY · ${songName(event)} · 首次操作后自动播放`, "paused");
        armPlaybackUnlock();
      }
    }, 1400);
  });
  player.addEventListener("nmpv3:play", (event) => {
    removePlaybackUnlock();
    setStatus(`PLAYING · ${songName(event)}`, "playing");
  });
  player.addEventListener("nmpv3:pause", (event) => setStatus(`PAUSED · ${songName(event)}`, "paused"));
  player.addEventListener("nmpv3:error", (event) => {
    console.error("Gallery music player error", event.detail?.error || event.detail?.message);
    setStatus("音源暂不可用 · 可切换下一首重试", "error");
  });
})();

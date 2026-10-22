(() => {
  const API_BASE = "https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php";
  const PLAYLIST_URL = "music-playlist.json";
  const CURATED_PLAYLIST_URL = "music-curated.json";
  const PLAYER_STATE_KEY = "gallery-player-state-v1";
  const restrictedFees = new Set([1, 4, 8]);

  const dock = document.querySelector("#musicDock");
  const toggle = document.querySelector("#musicDockToggle");
  const status = document.querySelector("#musicStatus");
  const title = document.querySelector("#musicTitle");
  const artist = document.querySelector("#musicArtist");
  const album = document.querySelector("#musicAlbum");
  const cover = document.querySelector("#musicCover");
  const videoWrap = document.querySelector("#musicVideoWrap");
  const bilibiliContainer = document.querySelector("#bilibiliPlayer");
  const playButton = document.querySelector("#musicPlay");
  const previousButton = document.querySelector("#musicPrevious");
  const nextButton = document.querySelector("#musicNext");
  const progress = document.querySelector("#musicProgress");
  const currentTime = document.querySelector("#musicCurrentTime");
  const totalTime = document.querySelector("#musicTotalTime");
  const volume = document.querySelector("#musicVolume");
  const modeButton = document.querySelector("#musicMode");
  const playlistButton = document.querySelector("#musicPlaylistToggle");
  const playlist = document.querySelector("#musicPlaylist");
  const sourceLink = document.querySelector("#musicSource");
  if (!dock || !toggle || !status || !playButton) return;

  const audio = new Audio();
  audio.preload = "metadata";
  let tracks = [];
  let savedPlayback = null;
  try {
    savedPlayback = JSON.parse(localStorage.getItem(PLAYER_STATE_KEY));
  } catch {
    localStorage.removeItem(PLAYER_STATE_KEY);
  }
  let index = -1;
  let mode = savedPlayback?.mode || localStorage.getItem("gallery-player-mode") || "list";
  let shuffleOrder = [];
  let shufflePosition = 0;
  let currentProvider = "netease";
  let youtubePlayer = null;
  let youtubeReady = false;
  let bilibiliFrame = null;
  let bilibiliElapsed = 0;
  let bilibiliStartedAt = 0;
  let bilibiliPlaying = false;
  let sourceGeneration = 0;
  let playbackRequested = false;
  let pendingStartTime = null;
  let lastStateSave = 0;

  const icons = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    previous: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM19 6.4v11.2L10.4 12z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM5 17.6V6.4l8.6 5.6z"/></svg>',
  };

  previousButton.innerHTML = icons.previous;
  nextButton.innerHTML = icons.next;
  playButton.innerHTML = icons.play;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
  };

  const currentTrack = () => tracks[index] || null;
  const trackKey = (track) => String(track?.neteaseId || track?.id || track?.youtubeVideoId || "");
  const isPlaying = () => {
    if (currentProvider === "youtube") return youtubePlayer?.getPlayerState?.() === window.YT?.PlayerState?.PLAYING;
    if (currentProvider === "bilibili") return bilibiliPlaying;
    return !audio.paused;
  };

  const playbackTime = () => {
    if (pendingStartTime !== null) return pendingStartTime;
    if (currentProvider === "youtube" && youtubeReady) return youtubePlayer.getCurrentTime?.() || 0;
    if (currentProvider === "bilibili") {
      return bilibiliElapsed + (bilibiliPlaying ? (Date.now() - bilibiliStartedAt) / 1_000 : 0);
    }
    return audio.currentTime || 0;
  };

  const savePlayback = (force = false, time = playbackTime()) => {
    if (!currentTrack()) return;
    const now = Date.now();
    if (!force && now - lastStateSave < 5000) return;
    lastStateSave = now;
    localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify({
      trackId: trackKey(currentTrack()),
      time: Math.max(0, Math.round(time * 10) / 10),
      mode,
      shouldResume: playbackRequested,
      shuffleOrder: shuffleOrder.map((trackIndex) => trackKey(tracks[trackIndex])).filter(Boolean),
      shufflePosition,
    }));
  };

  const makeShuffleOrder = (startIndex = index) => {
    const rest = tracks.map((_, trackIndex) => trackIndex).filter((trackIndex) => trackIndex !== startIndex);
    for (let i = rest.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    shuffleOrder = [startIndex, ...rest];
    shufflePosition = 0;
  };

  const restoreShuffleOrder = () => {
    const byId = new Map(tracks.map((track, trackIndex) => [trackKey(track), trackIndex]));
    const restored = (savedPlayback?.shuffleOrder || []).map((id) => byId.get(String(id)));
    if (restored.length === tracks.length && restored.every((trackIndex) => trackIndex !== undefined)) {
      shuffleOrder = restored;
      shufflePosition = shuffleOrder.indexOf(index);
    }
    if (shufflePosition < 0 || shuffleOrder.length !== tracks.length) makeShuffleOrder(index);
  };

  const adjacentIndex = (direction) => {
    if (mode !== "shuffle") return index + direction;
    if (shuffleOrder[shufflePosition] !== index) makeShuffleOrder(index);
    let nextPosition = shufflePosition + direction;
    if (nextPosition >= shuffleOrder.length) {
      makeShuffleOrder(index);
      nextPosition = Math.min(1, shuffleOrder.length - 1);
    } else if (nextPosition < 0) {
      nextPosition = shuffleOrder.length - 1;
    }
    shufflePosition = nextPosition;
    return shuffleOrder[shufflePosition];
  };

  const setStatus = (message, state = "paused") => {
    status.textContent = message;
    dock.dataset.playerState = state;
  };

  const setPlayingUi = (playing) => {
    playButton.innerHTML = playing ? icons.pause : icons.play;
    playButton.setAttribute("aria-label", playing ? "暂停" : "播放");
    cover.classList.toggle("is-playing", playing);
    dock.dataset.playerState = playing ? "playing" : "paused";
  };

  const setCollapsed = (collapsed) => {
    dock.classList.toggle("is-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "展开播放器" : "收起播放器");
    toggle.textContent = collapsed ? "+" : "−";
    localStorage.setItem("gallery-player-collapsed", String(collapsed));
  };

  const setMode = (nextMode) => {
    const previousMode = mode;
    mode = ["list", "single", "shuffle"].includes(nextMode) ? nextMode : "list";
    if (mode === "shuffle" && previousMode !== "shuffle" && tracks.length) makeShuffleOrder(index);
    const labels = { list: "LIST", single: "ONE", shuffle: "SHUFFLE" };
    modeButton.textContent = labels[mode];
    modeButton.setAttribute("aria-label", `播放模式：${labels[mode]}`);
    localStorage.setItem("gallery-player-mode", mode);
    savePlayback(true);
  };

  const syncProgress = () => {
    let elapsed = playbackTime();
    let duration = audio.duration || currentTrack()?.duration || 0;
    if (currentProvider === "youtube" && youtubeReady) {
      duration = youtubePlayer.getDuration?.() || currentTrack()?.duration || 0;
    }
    if (currentProvider === "bilibili" && bilibiliPlaying && elapsed >= duration && duration > 0) {
      bilibiliPlaying = false;
      window.queueMicrotask(advance);
      return;
    }
    progress.max = String(Math.max(1, duration));
    if (!progress.matches(":active")) progress.value = String(Math.min(elapsed, duration));
    currentTime.textContent = formatTime(elapsed);
    totalTime.textContent = formatTime(duration);
  };

  const updateMediaSession = (track) => {
    if (!("mediaSession" in navigator) || !window.MediaMetadata) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: track.artists,
      album: track.album,
      artwork: track.cover ? [{ src: track.cover }] : [],
    });
  };

  const renderTrack = (track, startAt = 0) => {
    title.textContent = track.name;
    artist.textContent = track.artists || "Unknown artist";
    album.textContent = track.album || "";
    cover.src = track.cover || "";
    cover.alt = `${track.name} 封面`;
    totalTime.textContent = formatTime(track.duration);
    progress.max = String(Math.max(1, track.duration));
    progress.value = String(startAt);
    currentTime.textContent = formatTime(startAt);
    sourceLink.href = track.bilibiliBvid
      ? `https://www.bilibili.com/video/${track.bilibiliBvid}?p=${track.bilibiliPage}`
      : `https://music.163.com/#/song?id=${track.neteaseId}`;
    sourceLink.textContent = `原曲 · ${index + 1}/${tracks.length} ↗`;
    for (const item of playlist.querySelectorAll("button")) {
      item.classList.toggle("is-active", Number(item.dataset.index) === index);
    }
    playlist.querySelector(".is-active")?.scrollIntoView?.({ block: "nearest" });
    updateMediaSession(track);
  };

  const loadYouTubeApi = () => new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.append(script);
    }
  });

  const ensureYouTubePlayer = async () => {
    if (youtubePlayer) return youtubePlayer;
    await loadYouTubeApi();
    youtubePlayer = await new Promise((resolve) => {
      const player = new YT.Player("youtubePlayer", {
        width: "100%",
        height: "200",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            youtubeReady = true;
            player.setVolume(Number(volume.value));
            resolve(player);
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              pendingStartTime = null;
              playbackRequested = true;
              setPlayingUi(true);
              setStatus(`正在播放 · ${currentTrack()?.name}`, "playing");
            } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.CUED) {
              setPlayingUi(false);
            } else if (event.data === YT.PlayerState.ENDED) {
              advance();
            }
            syncProgress();
            savePlayback(true);
          },
          onError: () => {
            setStatus("当前曲目不可用 · 正在切换下一首", "error");
            window.setTimeout(advance, 900);
          },
          onAutoplayBlocked: () => {
            setPlayingUi(false);
            setStatus(`准备播放 · ${currentTrack()?.name} · 点击播放`, "paused");
          },
        },
      });
    });
    return youtubePlayer;
  };

  const prefersBilibili = () => ["Asia/Shanghai", "Asia/Urumqi"]
    .includes(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const stopBilibili = (rememberTime = true) => {
    if (rememberTime && bilibiliPlaying) bilibiliElapsed = playbackTime();
    bilibiliPlaying = false;
    bilibiliFrame?.remove();
    bilibiliFrame = null;
  };

  const mountBilibili = (track, startAt, autoplay) => {
    stopBilibili(false);
    bilibiliElapsed = Math.max(0, Number(startAt) || 0);
    bilibiliStartedAt = Date.now();
    bilibiliPlaying = autoplay;
    pendingStartTime = null;
    const url = new URL("https://player.bilibili.com/player.html");
    url.searchParams.set("bvid", track.bilibiliBvid);
    url.searchParams.set("p", track.bilibiliPage);
    url.searchParams.set("autoplay", autoplay ? "1" : "0");
    url.searchParams.set("muted", "0");
    url.searchParams.set("danmaku", "false");
    url.searchParams.set("poster", "false");
    url.searchParams.set("t", Math.floor(bilibiliElapsed));
    const frame = document.createElement("iframe");
    frame.src = url;
    frame.title = track.name;
    frame.allow = "autoplay; fullscreen";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    bilibiliContainer.replaceChildren(frame);
    bilibiliFrame = frame;
    setPlayingUi(autoplay);
    setStatus(`${autoplay ? "正在播放" : "准备播放"} · ${track.name}`, autoplay ? "playing" : "paused");
    savePlayback(true, bilibiliElapsed);
  };

  const fetchNeteaseUrl = async (track) => {
    for (const level of ["exhigh", "standard"]) {
      const url = new URL(`${API_BASE}/song/url/v1`);
      url.searchParams.set("id", track.neteaseId);
      url.searchParams.set("level", level);
      const response = await fetch(url);
      if (!response.ok) continue;
      const payload = await response.json();
      const data = payload.data?.find((item) => item.url);
      if (data?.url) return data.url.replace(/^http:/, "https:");
    }
    throw new Error("NetEase source unavailable");
  };

  const playCurrent = async () => {
    playbackRequested = true;
    if (currentProvider === "youtube") {
      const player = await ensureYouTubePlayer();
      player.playVideo();
    } else if (currentProvider === "bilibili") {
      mountBilibili(currentTrack(), playbackTime(), true);
    } else {
      await audio.play();
    }
    savePlayback(true);
  };

  const pauseCurrent = () => {
    playbackRequested = false;
    if (currentProvider === "youtube") youtubePlayer?.pauseVideo?.();
    else if (currentProvider === "bilibili") {
      stopBilibili();
      setPlayingUi(false);
    }
    else audio.pause();
    savePlayback(true);
  };

  const loadTrack = async (nextIndex, autoplay = false, startAt = 0, resetShuffle = false) => {
    if (!tracks.length) return;
    savePlayback(true);
    sourceGeneration += 1;
    const generation = sourceGeneration;
    index = (nextIndex + tracks.length) % tracks.length;
    if (mode === "shuffle" && (resetShuffle || shuffleOrder[shufflePosition] !== index)) makeShuffleOrder(index);
    const track = currentTrack();
    const resumeAt = Math.max(0, Math.min(Number(startAt) || 0, Math.max(0, track.duration - 1)));
    pendingStartTime = resumeAt;
    playbackRequested = autoplay;
    audio.pause();
    youtubePlayer?.pauseVideo?.();
    stopBilibili(false);
    setPlayingUi(false);
    renderTrack(track, resumeAt);
    savePlayback(true, resumeAt);
    const useBilibili = Boolean(track.bilibiliBvid) && prefersBilibili();
    const useYouTube = !useBilibili && (!track.neteaseId || restrictedFees.has(track.neteaseFee));

    try {
      if (useBilibili) {
        currentProvider = "bilibili";
        videoWrap.hidden = false;
        mountBilibili(track, resumeAt, autoplay);
      } else if (useYouTube) {
        currentProvider = "youtube";
        videoWrap.hidden = false;
        setStatus(`正在载入 · ${track.name}`, "paused");
        const player = await ensureYouTubePlayer();
        if (generation !== sourceGeneration) return;
        const video = { videoId: track.youtubeVideoId, startSeconds: resumeAt };
        if (autoplay) player.loadVideoById(video);
        else player.cueVideoById(video);
        setStatus(`准备播放 · ${track.name}`, "paused");
      } else {
        currentProvider = "netease";
        videoWrap.hidden = true;
        setStatus(`正在载入 · ${track.name}`, "paused");
        const url = await fetchNeteaseUrl(track);
        if (generation !== sourceGeneration) return;
        audio.src = url;
        audio.volume = Number(volume.value) / 100;
        const restoreTime = () => {
          if (generation !== sourceGeneration) return;
          audio.currentTime = resumeAt;
          pendingStartTime = null;
          syncProgress();
          savePlayback(true);
        };
        if (audio.readyState >= 1) restoreTime();
        else audio.addEventListener("loadedmetadata", restoreTime, { once: true });
        setStatus(`准备播放 · ${track.name}`, "paused");
        if (autoplay) await playCurrent();
      }
    } catch (error) {
      if (generation !== sourceGeneration) return;
      if (!useYouTube && !useBilibili && track.youtubeVideoId) {
        currentProvider = "youtube";
        videoWrap.hidden = false;
        const player = await ensureYouTubePlayer();
        if (generation !== sourceGeneration) return;
        const video = { videoId: track.youtubeVideoId, startSeconds: resumeAt };
        if (autoplay) player.loadVideoById(video);
        else player.cueVideoById(video);
        setStatus(`准备播放 · ${track.name}`, "paused");
        return;
      }
      console.error("Gallery music source failed", error);
      setStatus("音源不可用 · 正在切换下一首", "error");
      window.setTimeout(advance, 900);
    }
  };

  const advance = () => {
    if (mode === "single") {
      loadTrack(index, true, 0);
      return;
    }
    loadTrack(adjacentIndex(1), true, 0);
  };

  const renderPlaylist = () => {
    const fragment = document.createDocumentFragment();
    tracks.forEach((track, trackIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.index = String(trackIndex);
      button.innerHTML = `<span>${String(trackIndex + 1).padStart(3, "0")}</span><span><strong></strong><small></small></span><em>${formatTime(track.duration)}</em>`;
      button.querySelector("strong").textContent = track.name;
      button.querySelector("small").textContent = track.artists;
      button.addEventListener("click", () => loadTrack(trackIndex, true, 0, true));
      fragment.append(button);
    });
    playlist.replaceChildren(fragment);
  };

  audio.addEventListener("play", () => {
    playbackRequested = true;
    setPlayingUi(true);
    setStatus(`正在播放 · ${currentTrack()?.name}`, "playing");
    savePlayback(true);
  });
  audio.addEventListener("pause", () => {
    setPlayingUi(false);
    savePlayback(true);
  });
  audio.addEventListener("ended", advance);
  audio.addEventListener("timeupdate", () => {
    syncProgress();
    savePlayback();
  });
  audio.addEventListener("loadedmetadata", syncProgress);
  audio.addEventListener("error", () => {
    if (currentProvider !== "netease") return;
    setStatus("当前音频不可用 · 正在尝试备用线路", "error");
    const track = currentTrack();
    if (track?.youtubeVideoId) {
      const resumeAt = playbackTime();
      currentProvider = "youtube";
      videoWrap.hidden = false;
      ensureYouTubePlayer().then((player) => {
        player.loadVideoById({ videoId: track.youtubeVideoId, startSeconds: resumeAt });
        setStatus(`正在载入 · ${track.name}`, "paused");
      });
    } else {
      window.setTimeout(advance, 900);
    }
  });

  playButton.addEventListener("click", () => {
    if (isPlaying()) pauseCurrent();
    else playCurrent().catch(() => setStatus(`准备播放 · ${currentTrack()?.name} · 点击播放`, "paused"));
  });
  previousButton.addEventListener("click", () => loadTrack(adjacentIndex(-1), playbackRequested || isPlaying()));
  nextButton.addEventListener("click", () => loadTrack(adjacentIndex(1), playbackRequested || isPlaying()));
  progress.addEventListener("input", () => {
    const nextTime = Number(progress.value);
    pendingStartTime = nextTime;
    if (currentProvider === "youtube") youtubePlayer?.seekTo?.(nextTime, true);
    else if (currentProvider === "bilibili") {
      bilibiliElapsed = nextTime;
      bilibiliStartedAt = Date.now();
      if (bilibiliPlaying) mountBilibili(currentTrack(), nextTime, true);
      else stopBilibili(false);
      pendingStartTime = null;
    }
    else {
      audio.currentTime = nextTime;
      pendingStartTime = null;
    }
    syncProgress();
    savePlayback(true, nextTime);
  });
  volume.addEventListener("input", () => {
    const nextVolume = Number(volume.value);
    audio.volume = nextVolume / 100;
    youtubePlayer?.setVolume?.(nextVolume);
    bilibiliFrame?.contentWindow?.postMessage?.(`setPlayer-${JSON.stringify({ type: "changeVolume", value: { volume: nextVolume } })}`, "*");
    localStorage.setItem("gallery-player-volume", String(nextVolume));
  });
  modeButton.addEventListener("click", () => setMode(mode === "list" ? "single" : mode === "single" ? "shuffle" : "list"));
  playlistButton.addEventListener("click", () => {
    const open = playlist.hidden;
    playlist.hidden = !open;
    playlistButton.setAttribute("aria-expanded", String(open));
  });
  toggle.addEventListener("click", () => setCollapsed(!dock.classList.contains("is-collapsed")));

  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => playCurrent());
    navigator.mediaSession.setActionHandler("pause", pauseCurrent);
    navigator.mediaSession.setActionHandler("previoustrack", () => loadTrack(adjacentIndex(-1), true));
    navigator.mediaSession.setActionHandler("nexttrack", () => loadTrack(adjacentIndex(1), true));
  }

  setCollapsed(localStorage.getItem("gallery-player-collapsed") === "true");
  setMode(mode);
  const savedVolume = Math.min(100, Math.max(0, Number(localStorage.getItem("gallery-player-volume")) || 65));
  volume.value = String(savedVolume);
  audio.volume = savedVolume / 100;
  const progressTimer = window.setInterval(() => {
    syncProgress();
    savePlayback();
  }, 500);
  window.addEventListener("pagehide", () => {
    savePlayback(true);
    window.clearInterval(progressTimer);
  }, { once: true });

  Promise.all([PLAYLIST_URL, CURATED_PLAYLIST_URL].map((url) => fetch(url).then((response) => {
    if (!response.ok) throw new Error(`Playlist HTTP ${response.status}: ${url}`);
    return response.json();
  })))
    .then(([playlistPayload, curatedPayload]) => {
      tracks = [...(playlistPayload.tracks || []), ...(curatedPayload.tracks || [])];
      if (!tracks.length) throw new Error("Playlist is empty");
      const restoredIndex = tracks.findIndex((track) => trackKey(track) === String(savedPlayback?.trackId));
      const hasHistory = restoredIndex >= 0;
      index = hasHistory ? restoredIndex : Math.floor(Math.random() * tracks.length);
      if (mode === "shuffle") restoreShuffleOrder();
      renderPlaylist();
      setStatus(`${tracks.length} 首 · 自动选择可用线路`, "paused");
      loadTrack(index, hasHistory ? savedPlayback.shouldResume !== false : true, hasHistory ? savedPlayback.time : 0);
    })
    .catch((error) => {
      console.error("Gallery playlist failed", error);
      setStatus("歌单载入失败", "error");
    });
})();

(() => {
  const API_BASE = "https://api.hypcvgm.top/NeteaseMiniPlayer/nmp.php";
  const PLAYLIST_URL = "music-playlist.json";
  const restrictedFees = new Set([1, 4, 8]);

  const dock = document.querySelector("#musicDock");
  const toggle = document.querySelector("#musicDockToggle");
  const status = document.querySelector("#musicStatus");
  const title = document.querySelector("#musicTitle");
  const artist = document.querySelector("#musicArtist");
  const album = document.querySelector("#musicAlbum");
  const cover = document.querySelector("#musicCover");
  const videoWrap = document.querySelector("#musicVideoWrap");
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
  let index = Number(localStorage.getItem("gallery-player-index")) || 0;
  let mode = localStorage.getItem("gallery-player-mode") || "list";
  let currentProvider = "netease";
  let youtubePlayer = null;
  let youtubeReady = false;
  let sourceGeneration = 0;
  let playbackRequested = false;

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
  const isPlaying = () => currentProvider === "youtube"
    ? youtubePlayer?.getPlayerState?.() === window.YT?.PlayerState?.PLAYING
    : !audio.paused;

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
    mode = ["list", "single", "shuffle"].includes(nextMode) ? nextMode : "list";
    const labels = { list: "LIST", single: "ONE", shuffle: "SHUFFLE" };
    modeButton.textContent = labels[mode];
    modeButton.setAttribute("aria-label", `播放模式：${labels[mode]}`);
    localStorage.setItem("gallery-player-mode", mode);
  };

  const syncProgress = () => {
    let elapsed = audio.currentTime || 0;
    let duration = audio.duration || currentTrack()?.duration || 0;
    if (currentProvider === "youtube" && youtubeReady) {
      elapsed = youtubePlayer.getCurrentTime?.() || 0;
      duration = youtubePlayer.getDuration?.() || currentTrack()?.duration || 0;
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

  const renderTrack = (track) => {
    title.textContent = track.name;
    artist.textContent = track.artists || "Unknown artist";
    album.textContent = track.album || "";
    cover.src = track.cover || "";
    cover.alt = `${track.name} 封面`;
    totalTime.textContent = formatTime(track.duration);
    progress.max = String(Math.max(1, track.duration));
    progress.value = "0";
    currentTime.textContent = "0:00";
    sourceLink.href = `https://music.163.com/#/song?id=${track.neteaseId}`;
    sourceLink.textContent = `NETEASE · ${index + 1}/${tracks.length} ↗`;
    for (const item of playlist.querySelectorAll("button")) {
      item.classList.toggle("is-active", Number(item.dataset.index) === index);
    }
    playlist.querySelector(".is-active")?.scrollIntoView?.({ block: "nearest" });
    localStorage.setItem("gallery-player-index", String(index));
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
              playbackRequested = true;
              setPlayingUi(true);
              setStatus(`YOUTUBE FULL · ${currentTrack()?.name}`, "playing");
            } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.CUED) {
              setPlayingUi(false);
            } else if (event.data === YT.PlayerState.ENDED) {
              advance();
            }
            syncProgress();
          },
          onError: () => {
            setStatus("YOUTUBE 音源不可嵌入 · 正在切换下一首", "error");
            window.setTimeout(advance, 900);
          },
          onAutoplayBlocked: () => {
            setPlayingUi(false);
            setStatus(`READY · ${currentTrack()?.name} · 点击播放`, "paused");
          },
        },
      });
    });
    return youtubePlayer;
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
    } else {
      await audio.play();
    }
  };

  const pauseCurrent = () => {
    playbackRequested = false;
    if (currentProvider === "youtube") youtubePlayer?.pauseVideo?.();
    else audio.pause();
  };

  const loadTrack = async (nextIndex, autoplay = false) => {
    if (!tracks.length) return;
    sourceGeneration += 1;
    const generation = sourceGeneration;
    index = (nextIndex + tracks.length) % tracks.length;
    const track = currentTrack();
    audio.pause();
    youtubePlayer?.pauseVideo?.();
    setPlayingUi(false);
    renderTrack(track);
    const useYouTube = restrictedFees.has(track.neteaseFee);

    try {
      if (useYouTube) {
        currentProvider = "youtube";
        videoWrap.hidden = false;
        setStatus(`LOADING YOUTUBE · ${track.name}`, "paused");
        const player = await ensureYouTubePlayer();
        if (generation !== sourceGeneration) return;
        if (autoplay) player.loadVideoById(track.youtubeVideoId);
        else player.cueVideoById(track.youtubeVideoId);
        sourceLink.href = `https://www.youtube.com/watch?v=${track.youtubeVideoId}`;
        sourceLink.textContent = `YOUTUBE FULL · ${index + 1}/${tracks.length} ↗`;
        setStatus(`READY · ${track.name}`, "paused");
      } else {
        currentProvider = "netease";
        videoWrap.hidden = true;
        setStatus(`LOADING NETEASE · ${track.name}`, "paused");
        const url = await fetchNeteaseUrl(track);
        if (generation !== sourceGeneration) return;
        audio.src = url;
        audio.volume = Number(volume.value) / 100;
        setStatus(`READY · ${track.name}`, "paused");
        if (autoplay) await playCurrent();
      }
    } catch (error) {
      if (generation !== sourceGeneration) return;
      if (!useYouTube && track.youtubeVideoId) {
        currentProvider = "youtube";
        videoWrap.hidden = false;
        const player = await ensureYouTubePlayer();
        if (generation !== sourceGeneration) return;
        if (autoplay) player.loadVideoById(track.youtubeVideoId);
        else player.cueVideoById(track.youtubeVideoId);
        sourceLink.href = `https://www.youtube.com/watch?v=${track.youtubeVideoId}`;
        sourceLink.textContent = `YOUTUBE FALLBACK · ${index + 1}/${tracks.length} ↗`;
        setStatus("NETEASE 不可用 · 已切 YOUTUBE", "paused");
        return;
      }
      console.error("Gallery music source failed", error);
      setStatus("音源不可用 · 正在切换下一首", "error");
      window.setTimeout(advance, 900);
    }
  };

  const advance = () => {
    if (mode === "single") {
      loadTrack(index, true);
      return;
    }
    const nextIndex = mode === "shuffle" && tracks.length > 1
      ? (() => {
          let candidate = index;
          while (candidate === index) candidate = Math.floor(Math.random() * tracks.length);
          return candidate;
        })()
      : index + 1;
    loadTrack(nextIndex, true);
  };

  const renderPlaylist = () => {
    const fragment = document.createDocumentFragment();
    tracks.forEach((track, trackIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.index = String(trackIndex);
      button.innerHTML = `<span>${String(trackIndex + 1).padStart(3, "0")}</span><span><strong></strong><small></small></span><em>${restrictedFees.has(track.neteaseFee) ? "YT" : "NE"}</em>`;
      button.querySelector("strong").textContent = track.name;
      button.querySelector("small").textContent = track.artists;
      button.addEventListener("click", () => loadTrack(trackIndex, true));
      fragment.append(button);
    });
    playlist.replaceChildren(fragment);
  };

  audio.addEventListener("play", () => {
    playbackRequested = true;
    setPlayingUi(true);
    setStatus(`NETEASE · ${currentTrack()?.name}`, "playing");
  });
  audio.addEventListener("pause", () => setPlayingUi(false));
  audio.addEventListener("ended", advance);
  audio.addEventListener("timeupdate", syncProgress);
  audio.addEventListener("loadedmetadata", syncProgress);
  audio.addEventListener("error", () => {
    if (currentProvider !== "netease") return;
    setStatus("NETEASE 播放失败 · 正在尝试 YOUTUBE", "error");
    const track = currentTrack();
    if (track?.youtubeVideoId) {
      currentProvider = "youtube";
      videoWrap.hidden = false;
      ensureYouTubePlayer().then((player) => {
        player.loadVideoById(track.youtubeVideoId);
        sourceLink.href = `https://www.youtube.com/watch?v=${track.youtubeVideoId}`;
        sourceLink.textContent = `YOUTUBE FALLBACK · ${index + 1}/${tracks.length} ↗`;
      });
    } else {
      window.setTimeout(advance, 900);
    }
  });

  playButton.addEventListener("click", () => {
    if (isPlaying()) pauseCurrent();
    else playCurrent().catch(() => setStatus(`READY · ${currentTrack()?.name} · 点击播放`, "paused"));
  });
  previousButton.addEventListener("click", () => loadTrack(index - 1, playbackRequested || isPlaying()));
  nextButton.addEventListener("click", () => loadTrack(index + 1, playbackRequested || isPlaying()));
  progress.addEventListener("input", () => {
    const nextTime = Number(progress.value);
    if (currentProvider === "youtube") youtubePlayer?.seekTo?.(nextTime, true);
    else audio.currentTime = nextTime;
    syncProgress();
  });
  volume.addEventListener("input", () => {
    const nextVolume = Number(volume.value);
    audio.volume = nextVolume / 100;
    youtubePlayer?.setVolume?.(nextVolume);
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
    navigator.mediaSession.setActionHandler("previoustrack", () => loadTrack(index - 1, true));
    navigator.mediaSession.setActionHandler("nexttrack", () => loadTrack(index + 1, true));
  }

  setCollapsed(localStorage.getItem("gallery-player-collapsed") === "true");
  setMode(mode);
  const savedVolume = Math.min(100, Math.max(0, Number(localStorage.getItem("gallery-player-volume")) || 65));
  volume.value = String(savedVolume);
  audio.volume = savedVolume / 100;
  const progressTimer = window.setInterval(syncProgress, 500);
  window.addEventListener("pagehide", () => window.clearInterval(progressTimer), { once: true });

  fetch(PLAYLIST_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Playlist HTTP ${response.status}`);
      return response.json();
    })
    .then((payload) => {
      tracks = payload.tracks || [];
      if (!tracks.length) throw new Error("Playlist is empty");
      index = Math.min(index, tracks.length - 1);
      renderPlaylist();
      setStatus(`${tracks.length} TRACKS · 受限曲目自动切 YOUTUBE`, "paused");
      loadTrack(index, true);
    })
    .catch((error) => {
      console.error("Gallery playlist failed", error);
      setStatus("歌单载入失败", "error");
    });
})();

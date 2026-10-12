// ===== PLAYLIST =====

const playlist = [
  { title: "just your doll.", artist: "Snow Strippers", src: "media/song1.mp4", cover: "", lrc: "media/song1.lrc" },
  { title: "addiction(slowed)", artist: "LONOWN", src: "media/song2.mp4", cover: "", lrc: "media/song2.lrc" },
  { title: "the kill 2", artist: "lex amarni", src: "media/song3.mp4", cover: "", lrc: "media/song3.lrc" },
  { title: "mr popular", artist: "predayed", src: "media/song4.mp4", cover: "", lrc: "media/song4.lrc" },
  { title: "type london", artist: "ONDA ANDAR", src: "media/song5.mp4", cover: "", lrc: "media/song5.lrc" },
  { title: "tesla", artist: "Fixupboy", src: "media/song6.mp4", cover: "", lrc: "media/song6.lrc" },
  { title: "Queen St", artist: "twentythree", src: "media/song7.mp4", cover: "", lrc: "media/song7.lrc" }
];

const $ = (id) => document.getElementById(id);
const video = $("player");
const videoCard = $("videoCard");
const plList = $("plList");
const playBtn = $("playBtn");
const shuffleBtn = $("shuffleBtn");
const repeatBtn = $("repeatBtn");
const muteBtn = $("muteBtn");
const seek = $("seek");
const volume = $("volume");
const curTime = $("curTime");
const durTime = $("durTime");
const nowCover = $("nowCover");
const nowTitle = $("nowTitle");
const nowArtist = $("nowArtist");

let index = 0;
let shuffleOn = false;
let repeatMode = "off"; 
let seeking = false;
const trail = []; 


function fmt(s) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return m + ":" + sec;
}

function coverBg(track, i) {
  if (track.cover) return 'url("' + track.cover + '") center / cover no-repeat';
  const h = (i * 47 + 330) % 360;
  return "linear-gradient(135deg, hsl(" + h + " 85% 62%), hsl(" + ((h + 55) % 360) + " 80% 52%))";
}

function setFill(el) {
  const pct = ((el.value - el.min) / (el.max - el.min || 1)) * 100;
  el.style.setProperty("--pct", pct + "%");
}

function setRowDuration(i, seconds) {
  const el = plList.children[i] && plList.children[i].querySelector(".pl-dur");
  if (el) el.textContent = fmt(seconds);
}

// playlist panel 
function buildPlaylist() {
  $("plCount").textContent = playlist.length + (playlist.length === 1 ? " song" : " songs");

  playlist.forEach((t, i) => {
    const li = document.createElement("li");
    li.className = "pl-item";
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.innerHTML =
      '<span class="pl-num"><span class="n"></span><i class="bi bi-play-fill"></i>' +
      '<span class="eq"><i></i><i></i><i></i></span></span>' +
      '<div class="pl-thumb"></div>' +
      '<div class="pl-text"><div class="t"></div><div class="a"></div></div>' +
      '<span class="pl-dur">–:––</span>';

    li.querySelector(".n").textContent = i + 1;
    li.querySelector(".t").textContent = t.title;
    li.querySelector(".a").textContent = t.artist;
    li.querySelector(".pl-thumb").style.background = coverBg(t, i);

    const choose = () => (i === index ? togglePlay() : playTrack(i));
    li.addEventListener("click", choose);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        choose();
      }
    });
    plList.appendChild(li);

    // show durations
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.addEventListener("loadedmetadata", () => {
      setRowDuration(i, probe.duration);
      probe.removeAttribute("src");
      probe.load();
    });
    probe.src = t.src;
  });
}

function setActiveRow() {
  [...plList.children].forEach((li, i) => li.classList.toggle("active", i === index));
  const row = plList.children[index];
  if (row) row.scrollIntoView({ block: "nearest" });
}

// loading / navigation
function loadTrack(i, autoplay) {
  index = (i + playlist.length) % playlist.length;
  const t = playlist[index];

  videoCard.classList.remove("has-media");
  video.src = t.src;
  seek.value = 0;
  setFill(seek);
  curTime.textContent = "0:00";
  durTime.textContent = "0:00";

  nowTitle.textContent = t.title;
  nowArtist.textContent = t.artist;
  nowCover.style.background = coverBg(t, index);
  document.title = t.title + " · " + t.artist;
  setActiveRow();
  loadLyrics(t);

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title,
      artist: t.artist,
      artwork: t.cover ? [{ src: t.cover }] : []
    });
  }

  if (autoplay) video.play().catch(() => { });
}

function playTrack(i) {
  trail.push(index);
  if (trail.length > 100) trail.shift();
  loadTrack(i, true);
}

function pickNext() {
  if (shuffleOn && playlist.length > 1) {
    let n;
    do { n = Math.floor(Math.random() * playlist.length); } while (n === index);
    return n;
  }
  return (index + 1) % playlist.length;
}

function goNext(autoplay) {
  trail.push(index);
  if (trail.length > 100) trail.shift();
  loadTrack(pickNext(), autoplay);
}

function goPrev(autoplay) {
  if (video.currentTime > 3) { 
    video.currentTime = 0;
    return;
  }
  const p = trail.length ? trail.pop() : index - 1;
  loadTrack(p, autoplay);
}

function togglePlay() {
  if (video.paused) video.play().catch(() => { });
  else video.pause();
}

function skip(sec) {
  const end = video.duration || Infinity;
  video.currentTime = Math.min(Math.max(video.currentTime + sec, 0), end);
}

// buttons 
playBtn.addEventListener("click", togglePlay);
video.addEventListener("click", togglePlay);
$("nextBtn").addEventListener("click", () => goNext(!video.paused));
$("prevBtn").addEventListener("click", () => goPrev(!video.paused));
$("fwdBtn").addEventListener("click", () => skip(30));
$("backBtn").addEventListener("click", () => skip(-30));

shuffleBtn.addEventListener("click", () => {
  shuffleOn = !shuffleOn;
  shuffleBtn.classList.toggle("on", shuffleOn);
  shuffleBtn.setAttribute("aria-pressed", shuffleOn);
});

repeatBtn.addEventListener("click", () => {
  repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
  repeatBtn.classList.toggle("on", repeatMode !== "off");
  repeatBtn.innerHTML = '<i class="bi ' + (repeatMode === "one" ? "bi-repeat-1" : "bi-repeat") + '"></i>';
  repeatBtn.title = "Repeat: " + repeatMode;
});

// video events
video.addEventListener("play", () => {
  document.body.classList.add("playing");
  playBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
});

video.addEventListener("pause", () => {
  document.body.classList.remove("playing");
  playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
});

video.addEventListener("loadeddata", () => videoCard.classList.add("has-media"));

video.addEventListener("error", () => {
  videoCard.classList.remove("has-media");
  nowArtist.textContent = "Can't load this file";
});

video.addEventListener("ended", () => {
  if (repeatMode === "one") {
    video.currentTime = 0;
    video.play().catch(() => { });
    return;
  }
  const atEnd = !shuffleOn && index === playlist.length - 1;
  if (atEnd && repeatMode === "off") {
    loadTrack(0, false); 
    return;
  }
  goNext(true);
});

// seek bar 
video.addEventListener("loadedmetadata", () => {
  seek.max = video.duration;
  durTime.textContent = fmt(video.duration);
  setRowDuration(index, video.duration);
  setFill(seek);
});

video.addEventListener("timeupdate", () => {
  if (!seeking) {
    seek.value = video.currentTime;
    setFill(seek);
  }
  curTime.textContent = fmt(video.currentTime);
  updateLyrics();
});

seek.addEventListener("input", () => {
  seeking = true;
  setFill(seek);
  curTime.textContent = fmt(seek.value);
});

seek.addEventListener("change", () => {
  video.currentTime = seek.value;
  seeking = false;
});

// volume
function updateVolIcon() {
  const icon = (video.muted || video.volume === 0) ? "bi-volume-mute-fill"
    : video.volume < 0.5 ? "bi-volume-down-fill" : "bi-volume-up-fill";
  muteBtn.innerHTML = '<i class="bi ' + icon + '"></i>';
}

volume.addEventListener("input", () => {
  video.volume = volume.value;
  video.muted = false;
  setFill(volume);
  updateVolIcon();
});

muteBtn.addEventListener("click", () => {
  video.muted = !video.muted;
  updateVolIcon();
});

// media-key controls
if ("mediaSession" in navigator) {
  const handlers = {
    play: () => video.play(),
    pause: () => video.pause(),
    previoustrack: () => goPrev(!video.paused),
    nexttrack: () => goNext(!video.paused),
    seekbackward: () => skip(-30),
    seekforward: () => skip(30)
  };
  for (const action in handlers) {
    try { navigator.mediaSession.setActionHandler(action, handlers[action]); } catch (e) { }
  }
}

// synced lyrics
const lyricsEl = $("lyrics");
let lyricLines = []; // { time, el }
let lyricIdx = -1;
let lyricToken = 0;
let userScrollUntil = 0;
let lyricRaf = 0;


function parseLrc(text) {
  const out = [];
  let offset = 0;
  text.split(/\r?\n/).forEach((raw) => {
    const off = raw.match(/^\[offset:\s*([+-]?\d+)\s*\]/i);
    if (off) { offset = parseInt(off[1], 10) / 1000; return; }
    const stamps = [...raw.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    if (!stamps.length) return; // skips [ar:..] [ti:..] and blank lines
    const lyric = raw.replace(/\[[^\]]*\]/g, "").trim() || "♪";
    stamps.forEach((m) => {
      const time = parseInt(m[1], 10) * 60 + parseFloat(m[2]) - offset;
      out.push({ time: Math.max(time, 0), text: lyric });
    });
  });
  return out.sort((a, b) => a.time - b.time);
}

function showNoLyrics(msg) {
  lyricLines = [];
  lyricIdx = -1;
  lyricsEl.classList.add("empty");
  lyricsEl.innerHTML = "";
  const p = document.createElement("p");
  p.className = "lyrics-empty";
  p.textContent = msg || "No lyrics for this song";
  lyricsEl.appendChild(p);
}

function renderLyrics(lines) {
  lyricsEl.innerHTML = "";
  lyricsEl.classList.remove("empty");
  lyricsEl.scrollTop = 0;
  lyricLines = [];
  lyricIdx = -1;

  lines.forEach((l) => {
    const p = document.createElement("p");
    p.className = "lyric-line";
    p.textContent = l.text;
    p.addEventListener("click", () => { 
      video.currentTime = l.time;
      userScrollUntil = 0;
      updateLyrics(true);
    });
    lyricsEl.appendChild(p);
    lyricLines.push({ time: l.time, el: p });
  });
  updateLyrics(true);
}

function loadLyrics(track) {
  const token = ++lyricToken; 
  if (!track.lrc) { showNoLyrics(); return; }
  fetch(track.lrc)
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then((txt) => {
      if (token !== lyricToken) return;
      const lines = parseLrc(txt);
      if (lines.length) renderLyrics(lines);
      else showNoLyrics("Couldn't read this lyrics file");
    })
    .catch(() => {
      if (token === lyricToken) showNoLyrics("Couldn't load the lyrics file");
    });
}

function centerLyric(i) {
  const el = lyricLines[i].el;
  lyricsEl.scrollTo({
    top: el.offsetTop - lyricsEl.clientHeight / 2 + el.offsetHeight / 2,
    behavior: "smooth"
  });
}

function updateLyrics(force) {
  if (!lyricLines.length) return;
  const t = video.currentTime + 0.1;
  let lo = 0, hi = lyricLines.length - 1, idx = -1; 
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lyricLines[mid].time <= t) { idx = mid; lo = mid + 1; } else { hi = mid - 1; }
  }
  if (idx === lyricIdx && !force) return;
  lyricIdx = idx;
  lyricLines.forEach((l, i) => {
    l.el.classList.toggle("sung", i < idx);
    l.el.classList.toggle("active", i === idx);
  });
  if (idx >= 0 && Date.now() > userScrollUntil) centerLyric(idx);
}

function lyricTick() {
  updateLyrics();
  lyricRaf = requestAnimationFrame(lyricTick);
}
video.addEventListener("play", () => { cancelAnimationFrame(lyricRaf); lyricTick(); });
video.addEventListener("pause", () => cancelAnimationFrame(lyricRaf));
video.addEventListener("seeked", () => updateLyrics());


["wheel", "touchmove"].forEach((ev) =>
  lyricsEl.addEventListener(ev, () => { userScrollUntil = Date.now() + 3000; }, { passive: true })
);

buildPlaylist();
video.volume = volume.value;
setFill(volume);
loadTrack(0, false);
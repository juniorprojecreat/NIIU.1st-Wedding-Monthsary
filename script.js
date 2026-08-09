const opening = document.querySelector("#opening");
const openingVideo = document.querySelector(".opening-video");
const novelShell = document.querySelector("#novelShell");
const openBook = document.querySelector("#openBook");
const closeBook = document.querySelector("#closeBook");
const bookTransition = document.querySelector("#bookTransition");
const musicPlayer = document.querySelector("#musicPlayer");
const playlistDrawer = document.querySelector("#playlistDrawer");
const playlistToggle = document.querySelector("#playlistToggle");
const closePlaylist = document.querySelector("#closePlaylist");
const playlistList = document.querySelector("#playlistList");
const siteAudio = document.querySelector("#siteAudio");
const fadeAudio = document.querySelector("#fadeAudio");
const playTrack = document.querySelector("#playTrack");
const prevTrack = document.querySelector("#prevTrack");
const nextTrack = document.querySelector("#nextTrack");
const trackTitle = document.querySelector("#trackTitle");
const trackArtist = document.querySelector("#trackArtist");
const trackCategory = document.querySelector("#trackCategory");
const trackCover = document.querySelector("#trackCover");
const trackProgress = document.querySelector("#trackProgress");
const readingProgress = document.querySelector("#readingProgress");
const ending = document.querySelector("#ending");

const STORAGE_KEY = "echoesMusicState";

const playlistGroups = [
  {
    name: "Love Letter",
    accent: "sage",
    description: "For every smile, every promise, and every moment they chose each other.",
    tracks: [
      { icon: "01", title: "10,000 Hours", artist: "Dan + Shay, Justin Bieber", src: "assets/music/10000-hours.mp3", cover: "assets/echoes-cover.jpg" },
      { icon: "02", title: "Only One (OST.)", artist: "ATLAS", src: "assets/music/only-one.mp3", cover: "assets/memories/memory-04.jpg" },
      { icon: "03", title: "Don't Give Up (OST.)", artist: "TEETEE", src: "assets/music/dont-give-up.mp3", cover: "assets/memories/memory-08.jpg" },
      { icon: "04", title: "Someday, Say Yes (OST.)", artist: "PROXIE", src: "assets/music/someday-say-yes.mp3", cover: "assets/memories/memory-12.jpg" },
      { icon: "05", title: "Bagai Bintang", artist: "NOAH", src: "assets/music/bagai-bintang.mp3", cover: "assets/memories/memory-19.jpg" },
    ],
  },
  {
    name: "Echoes of Forever",
    accent: "midnight",
    description: "For every memory that never truly fades.",
    tracks: [
      { icon: "01", title: "Talking To The Moon", artist: "Bruno Mars", src: "assets/music/talking-to-the-moon.mp3", cover: "assets/memories/memory-17.jpg" },
      { icon: "02", title: "See You Again", artist: "Wiz Khalifa ft. Charlie Puth", src: "assets/music/see-you-again.mp3", cover: "assets/memories/memory-18.jpg" },
      { icon: "03", title: "In The Stars", artist: "Benson Boone", src: "assets/music/in-the-stars.mp3", cover: "assets/memories/memory-15.jpg" },
      { icon: "04", title: "Into Your Arms", artist: "Witt Lowry ft. Ava Max", src: "assets/music/into-your-arms.mp3", cover: "assets/memories/memory-11.jpg" },
      { icon: "05", title: "Found (บทเพลงที่ตามหา)", artist: "Por Suppakarn", src: "assets/music/found.mp3", cover: "assets/memories/memory-20.jpg" },
    ],
  },
];

const playlist = playlistGroups.flatMap((group, groupIndex) =>
  group.tracks.map((track) => ({ ...track, group: group.name, accent: group.accent, groupIndex }))
);

let currentTrack = 0;
let isSeeking = false;
let shouldResumeAfterSeek = false;

document.body.classList.add("is-opening");
openingVideo.muted = false;
openingVideo.volume = 0.9;

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveState(extra = {}) {
  const state = {
    track: currentTrack,
    time: siteAudio.currentTime || 0,
    paused: siteAudio.paused,
    ...extra,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyInitialState() {
  const state = loadState();
  currentTrack = Number.isInteger(state.track) && playlist[state.track] ? state.track : 0;
  siteAudio.volume = 1;
  fadeAudio.volume = 0;
  updateTrackMeta(false);
  if (Number.isFinite(Number(state.time))) {
    siteAudio.addEventListener("loadedmetadata", () => {
      siteAudio.currentTime = Math.min(Number(state.time), siteAudio.duration || Number(state.time));
    }, { once: true });
  }
}

async function playOpeningVideoWithSound() {
  openingVideo.muted = false;
  openingVideo.volume = 0.9;

  try {
    await openingVideo.play();
  } catch {
    document.addEventListener("pointerdown", playOpeningVideoWithSound, { once: true });
  }
}

function showNovel() {
  bookTransition.classList.add("is-turning");

  window.setTimeout(() => {
    opening.classList.add("is-hidden");
    openingVideo.pause();
    novelShell.classList.add("is-visible");
    musicPlayer.classList.add("is-visible");
    document.body.classList.remove("is-opening");
    document.body.classList.add("has-mobile-player");
    document.querySelector("#cover").scrollIntoView({ behavior: "smooth" });
  }, 720);

  window.setTimeout(() => {
    opening.setAttribute("aria-hidden", "true");
  }, 1300);
}

function updateTrackMeta(render = true, setSource = true) {
  const track = playlist[currentTrack];
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
  trackCategory.textContent = track.group;
  trackCover.src = track.cover;
  musicPlayer.dataset.accent = track.accent;

  if (setSource && siteAudio.src !== new URL(track.src, window.location.href).href) {
    siteAudio.src = track.src;
  }

  if (render) {
    renderPlaylist();
  }
}

async function playAudio() {
  try {
    await siteAudio.play();
    playTrack.textContent = "Pause";
    saveState({ paused: false });
  } catch {
    playTrack.textContent = "Play";
  }
}

function pauseAudio() {
  siteAudio.pause();
  playTrack.textContent = "Play";
  saveState({ paused: true });
}

async function toggleAudio() {
  if (siteAudio.paused) {
    await playAudio();
  } else {
    pauseAudio();
  }
}

function crossfadeTo(index, autoplay = !siteAudio.paused) {
  if (!playlist[index]) {
    return;
  }

  const previousVolume = siteAudio.volume || 1;
  const oldAudio = siteAudio.paused ? null : siteAudio;
  const next = playlist[index];
  currentTrack = index;

  fadeAudio.src = next.src;
  fadeAudio.currentTime = 0;
  fadeAudio.volume = 0;
  updateTrackMeta(true, false);

  if (!autoplay) {
    siteAudio.src = next.src;
    siteAudio.currentTime = 0;
    trackProgress.value = 0;
    playTrack.textContent = "Play";
    saveState({ time: 0, paused: true });
    return;
  }

  fadeAudio.play().then(() => {
    const steps = 24;
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      const ratio = step / steps;
      fadeAudio.volume = previousVolume * ratio;
      if (oldAudio) {
        oldAudio.volume = previousVolume * (1 - ratio);
      }

      if (step >= steps) {
        window.clearInterval(timer);
        if (oldAudio) {
          oldAudio.pause();
          oldAudio.volume = previousVolume;
        }
        siteAudio.src = next.src;
        siteAudio.currentTime = fadeAudio.currentTime;
        siteAudio.volume = previousVolume;
        siteAudio.play();
        fadeAudio.pause();
        fadeAudio.removeAttribute("src");
        playTrack.textContent = "Pause";
        saveState({ time: siteAudio.currentTime, paused: false });
      }
    }, 60);
  }).catch(() => {
    siteAudio.src = next.src;
    siteAudio.currentTime = 0;
    playTrack.textContent = "Play";
  });
}

function changeTrack(direction) {
  const nextIndex = (currentTrack + direction + playlist.length) % playlist.length;
  crossfadeTo(nextIndex);
}

function renderPlaylist() {
  playlistList.innerHTML = "";

  playlistGroups.forEach((group, groupIndex) => {
    const details = document.createElement("details");
    details.className = `playlist-group playlist-${group.accent}`;
    details.open = groupIndex === playlist[currentTrack].groupIndex;
    details.innerHTML = `
      <summary>
        <span>${group.name}</span>
        <small>${group.description}</small>
      </summary>
      <div class="playlist-items"></div>
    `;

    const list = details.querySelector(".playlist-items");
    group.tracks.forEach((track) => {
      const index = playlist.findIndex((item) => item.src === track.src);
      const item = document.createElement("button");
      item.className = `playlist-item${index === currentTrack ? " is-active" : ""}`;
      item.type = "button";
      item.innerHTML = `
        <span class="track-number">${track.icon}</span>
        <span><strong>${track.title}</strong><small>${track.artist}</small></span>
        <i class="equalizer" aria-hidden="true"><b></b><b></b><b></b></i>
      `;
      item.addEventListener("click", () => {
        crossfadeTo(index, true);
      });
      list.appendChild(item);
    });

    playlistList.appendChild(details);
  });
}

function updateReadingProgress() {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll <= 0 ? 0 : (scrollTop / maxScroll) * 100;
  readingProgress.style.width = `${progress}%`;
}

function fadeOutAudio() {
  const startVolume = siteAudio.volume;
  const steps = 26;
  let step = 0;

  const fade = window.setInterval(() => {
    step += 1;
    siteAudio.volume = Math.max(0, startVolume * (1 - step / steps));

    if (step >= steps) {
      window.clearInterval(fade);
      siteAudio.pause();
      siteAudio.volume = 1;
      playTrack.textContent = "Play";
      saveState({ paused: true });
    }
  }, 80);
}

openBook.addEventListener("click", showNovel);
playTrack.addEventListener("click", toggleAudio);
prevTrack.addEventListener("click", () => changeTrack(-1));
nextTrack.addEventListener("click", () => changeTrack(1));

playlistToggle.addEventListener("click", () => {
  playlistDrawer.classList.add("is-open");
  playlistDrawer.setAttribute("aria-hidden", "false");
});

closePlaylist.addEventListener("click", () => {
  playlistDrawer.classList.remove("is-open");
  playlistDrawer.setAttribute("aria-hidden", "true");
});

siteAudio.addEventListener("timeupdate", () => {
  if (isSeeking || !siteAudio.duration) {
    return;
  }

  trackProgress.value = (siteAudio.currentTime / siteAudio.duration) * 100;
  saveState();
});

siteAudio.addEventListener("ended", () => changeTrack(1));

trackProgress.addEventListener("pointerdown", () => {
  shouldResumeAfterSeek = !siteAudio.paused;
});

trackProgress.addEventListener("input", () => {
  isSeeking = true;
});

trackProgress.addEventListener("change", () => {
  if (siteAudio.duration) {
    siteAudio.currentTime = (Number(trackProgress.value) / 100) * siteAudio.duration;
  }

  isSeeking = false;
  if (shouldResumeAfterSeek) {
    playAudio();
  }
  saveState();
});

closeBook.addEventListener("click", () => {
  musicPlayer.classList.add("is-ending");
  document.body.classList.remove("has-mobile-player");
  playlistDrawer.classList.remove("is-open");
  playlistDrawer.setAttribute("aria-hidden", "true");
  fadeOutAudio();
  document.querySelector("#ending").scrollIntoView({ behavior: "smooth" });
});

window.addEventListener("scroll", updateReadingProgress, { passive: true });
window.addEventListener("resize", updateReadingProgress);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

applyInitialState();
renderPlaylist();
updateReadingProgress();
playOpeningVideoWithSound();

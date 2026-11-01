"use strict";

/* =========================================
   LA JUVENIL - MOTOR PRINCIPAL
========================================= */

const STREAMS = {
  timeRefresh: 5000,

  stations: [
    {
      name: "La JuVeNiL",
      description: "Te Enciende Bien...!",
      logo: "./assets/marca_model.png",
      cover: "./assets/logo_model.jpg",
      stream_url: "https://stream.zeno.fm/hdueixh3dwquv",
      hash: "LaJuVeNiL"
    },

    {
      name: "RADIOS UNIDAS",
      description: "La señal que une a todos",
      logo: "./assets/marca.png",
      cover: "./assets/radiosunidas.jpg",
      stream_url: "https://stream.zeno.fm/hdueixh3dwquv",
      hash: "radiosunidas"
    }
  ]
};

const $ = id => document.getElementById(id);

const audio = $("radioAudio");
const playBtn = $("playBtn");
const previousBtn = $("previousBtn");
const nextBtn = $("nextBtn");
const volume = $("volume");
const stationsMenu = $("stationsMenu");
const statusText = $("playerStatus");
const visualizer = $("visualizer");

let currentStation = 0;
let isLoading = false;
let deferredPrompt = null;
let toastTimer = null;

audio.volume = 0.8;

/* =========================================
   MENSAJES
========================================= */

function showToast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* =========================================
   INFORMACIÓN DE EMISORAS
========================================= */

function updateStationInfo() {
  const station = STREAMS.stations[currentStation];

  $("stationName").textContent = station.name;
  $("stationDescription").textContent = station.description;

  $("stationLogo").src = station.logo;
  $("cover").src = station.cover;

  $("stationLogo").onerror = () => {
    $("stationLogo").src = "./assets/favicon.png";
  };

  $("cover").onerror = () => {
    $("cover").src = "./assets/logo_model.jpg";
  };

  document.querySelectorAll(".station-card").forEach((card, index) => {
    card.classList.toggle("selected", index === currentStation);
    card.setAttribute("aria-pressed", String(index === currentStation));
  });
}

/* =========================================
   CREAR MENÚ DE RADIOS
========================================= */

function createStationsMenu() {
  stationsMenu.innerHTML = "";

  STREAMS.stations.forEach((station, index) => {
    const button = document.createElement("button");

    button.className = "station-card";
    button.type = "button";
    button.setAttribute("aria-label", "Escuchar " + station.name);

    const img = document.createElement("img");
    img.src = station.logo;
    img.alt = "";

    const title = document.createElement("strong");
    title.textContent = station.name;

    button.append(img, title);

    button.addEventListener("click", () => {
      selectStation(index, true);
    });

    stationsMenu.appendChild(button);
  });

  updateStationInfo();
}

/* =========================================
   SELECCIONAR RADIO
========================================= */

function selectStation(index, autoplay = false) {
  if (index < 0 || index >= STREAMS.stations.length) {
    return;
  }

  currentStation = index;

  const station = STREAMS.stations[currentStation];

  updateStationInfo();

  if (autoplay) {
    playStation();
  } else {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    updatePlayerState("Preparado para transmitir");
  }

  saveHistory(station.name);

  const selected = stationsMenu.children[index];

  if (selected) {
    selected.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });
  }
}

/* =========================================
   REPRODUCIR STREAMING
========================================= */

async function playStation() {
  if (isLoading) return;

  const station = STREAMS.stations[currentStation];

  if (!station || !station.stream_url) {
    showToast("No hay una dirección de streaming configurada.");
    return;
  }

  isLoading = true;

  updatePlayerState("Conectando con la emisora...");

  playBtn.textContent = "…";

  try {
    const newSource = new URL(station.stream_url).href;

    if (audio.src !== newSource) {
      audio.pause();
      audio.src = newSource;
      audio.load();
    }

    audio.volume = Number(volume.value) / 100;

    await audio.play();

  } catch (error) {
    console.error("Error de streaming:", error);

    updatePlayerState("No se pudo conectar");

    playBtn.textContent = "▶";

    showToast("No se pudo reproducir. Comprueba la señal de radio.");

  } finally {
    isLoading = false;
  }
}

/* =========================================
   PLAY / PAUSE
========================================= */

playBtn.addEventListener("click", async () => {
  if (audio.paused) {
    await playStation();
  } else {
    audio.pause();
  }
});

/* =========================================
   EVENTOS REALES DEL AUDIO
========================================= */

audio.addEventListener("playing", () => {
  playBtn.textContent = "Ⅱ";
  playBtn.classList.add("playing");

  visualizer.classList.add("active");

  updatePlayerState("Transmitiendo en vivo");
});

audio.addEventListener("pause", () => {
  playBtn.textContent = "▶";
  playBtn.classList.remove("playing");

  visualizer.classList.remove("active");

  if (audio.error) {
    updatePlayerState("Error en la señal");
  } else {
    updatePlayerState("Radio pausada");
  }
});

audio.addEventListener("waiting", () => {
  updatePlayerState("Cargando señal...");
});

audio.addEventListener("stalled", () => {
  updatePlayerState("Señal interrumpida...");
});

audio.addEventListener("error", () => {
  playBtn.textContent = "▶";
  playBtn.classList.remove("playing");

  visualizer.classList.remove("active");

  updatePlayerState("No se pudo cargar la señal");

  showToast("Error de streaming. Intenta nuevamente.");
});

audio.addEventListener("ended", () => {
  updatePlayerState("La transmisión ha terminado");
});

/* =========================================
   ESTADO DEL REPRODUCTOR
========================================= */

function updatePlayerState(message) {
  statusText.textContent = message;
}

/* =========================================
   SIGUIENTE / ANTERIOR
========================================= */

nextBtn.addEventListener("click", () => {
  const next = (currentStation + 1) % STREAMS.stations.length;
  selectStation(next, true);
});

previousBtn.addEventListener("click", () => {
  const previous =
    (currentStation - 1 + STREAMS.stations.length) %
    STREAMS.stations.length;

  selectStation(previous, true);
});

/* =========================================
   VOLUMEN
========================================= */

volume.addEventListener("input", () => {
  audio.volume = Number(volume.value) / 100;
});

/* =========================================
   DESPLAZAMIENTO DEL MENÚ
========================================= */

$("scrollLeft").addEventListener("click", () => {
  stationsMenu.scrollBy({
    left: -180,
    behavior: "smooth"
  });
});

$("scrollRight").addEventListener("click", () => {
  stationsMenu.scrollBy({
    left: 180,
    behavior: "smooth"
  });
});

/* =========================================
   HISTORIAL LOCAL
========================================= */

function saveHistory(name) {
  let history = [];

  try {
    history = JSON.parse(localStorage.getItem("radioHistory") || "[]");

    if (!Array.isArray(history)) history = [];

  } catch {
    history = [];
  }

  history.unshift({
    name,
    date: new Date().toLocaleString("es-PE")
  });

  history = history.slice(0, 15);

  try {
    localStorage.setItem("radioHistory", JSON.stringify(history));
  } catch (error) {
    console.warn("No se pudo guardar el historial", error);
  }

  renderHistory();
}

function renderHistory() {
  let history = [];

  try {
    history = JSON.parse(localStorage.getItem("radioHistory") || "[]");
    if (!Array.isArray(history)) history = [];
  } catch {
    history = [];
  }

  const list = $("historyList");

  list.innerHTML = "";

  if (!history.length) {
    list.textContent = "Todavía no hay emisoras escuchadas.";
    return;
  }

  history.forEach(item => {
    const div = document.createElement("div");

    div.className = "history-item";

    div.textContent = item.name + " · " + item.date;

    list.appendChild(div);
  });
}

/* =========================================
   PANEL DE HISTORIAL
========================================= */

$("historyBtn").addEventListener("click", () => {
  const panel = $("historyPanel");

  panel.hidden = !panel.hidden;

  if (!panel.hidden) {
    renderHistory();
    panel.scrollIntoView({ behavior: "smooth" });
  }
});

/* =========================================
   PANEL DE LETRAS
========================================= */

$("lyricsBtn").addEventListener("click", () => {
  const panel = $("lyricsPanel");

  panel.hidden = !panel.hidden;

  if (!panel.hidden) {
    panel.scrollIntoView({ behavior: "smooth" });
  }
});

/* =========================================
   INSTALACIÓN PWA
========================================= */

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();

  deferredPrompt = event;

  $("installBtn").hidden = false;
});

$("installBtn").addEventListener("click", () => {
  if (deferredPrompt) {
    $("installModal").hidden = false;
  } else {
    showToast("Si tu navegador lo permite, usa el menú y selecciona Instalar aplicación.");
  }
});

$("confirmInstall").addEventListener("click", async () => {
  if (!deferredPrompt) {
    $("installModal").hidden = true;
    return;
  }

  const promptEvent = deferredPrompt;

  deferredPrompt = null;

  await promptEvent.prompt();

  const result = await promptEvent.userChoice;

  if (result.outcome === "accepted") {
    showToast("Instalación aceptada.");
  }

  $("installModal").hidden = true;
});

$("closeInstall").addEventListener("click", () => {
  $("installModal").hidden = true;
});

window.addEventListener("appinstalled", () => {
  $("installBtn").hidden = true;
  $("installModal").hidden = true;
  deferredPrompt = null;

  showToast("La JuVeNiL se instaló correctamente.");
});

/* =========================================
   SERVICE WORKER
========================================= */

if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(registration => {
        console.log("PWA activa:", registration.scope);
      })
      .catch(error => {
        console.error("Error del Service Worker:", error);
      });
  });
}

/* =========================================
   INICIALIZACIÓN
========================================= */

function initializeRadio() {
  createStationsMenu();
  renderHistory();

  $("year").textContent = new Date().getFullYear();

  updatePlayerState("Preparado para transmitir");

  audio.volume = 0.8;

  console.log("La JuVeNiL está lista.");
}

initializeRadio();
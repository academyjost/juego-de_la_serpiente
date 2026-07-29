// serpiente.js - Snake Punk Edition Logic, Audio & Controls
const canvas = document.getElementById("canvasJuego");
const ctx = canvas.getContext("2d");
const tamanoCelda = 30;

let puntaje = 0;
let maxPuntaje = parseInt(localStorage.getItem("snake_punk_max_score")) || 0;

let direccionActual = "derecha";
let proximaDireccion = "derecha";

let juegoIniciado = false;
let juegoPausado = false;
let juegoFinalizado = false;
let intervaloSerpiente = null;
let velocidadJuego = 120; // Milisegundos por frame

let sonidoActivado = true;
let audioCtx = null;

let serpiente = [
  { x: 7, y: 6 },
  { x: 6, y: 6 },
  { x: 5, y: 6 }
];

let ComidaX, ComidaY;

// Web Audio API Synthesizer
function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function reproducirSonido(tipo) {
  if (!sonidoActivado || !audioCtx) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (tipo === "comer") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (tipo === "perder") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.35);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (tipo === "giro") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (tipo === "inicio") {
      osc.type = "square";
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.setValueAtTime(523, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    console.warn("Audio Error:", e);
  }
}

function toggleSonido() {
  sonidoActivado = !sonidoActivado;
  const btnSonido = document.getElementById("btnSonido");
  if (btnSonido) {
    btnSonido.innerText = sonidoActivado ? "🔊" : "🔇";
  }
}

// Inicialización de la interfaz
function actualizarInterfaz() {
  document.getElementById("puntaje").innerText = puntaje;
  document.getElementById("maxPuntaje").innerText = maxPuntaje;
}

// Dibujo del juego
function dibujarTablero() {
  ctx.strokeStyle = "rgba(0, 251, 255, 0.07)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= canvas.width; i += tamanoCelda) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i <= canvas.height; i += tamanoCelda) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }
}

function pintarParte(x, y, color, esCabeza = false) {
  const px = x * tamanoCelda;
  const py = y * tamanoCelda;
  const radio = esCabeza ? 6 : 4;

  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = esCabeza ? 10 : 4;

  ctx.beginPath();
  ctx.roundRect(px + 1, py + 1, tamanoCelda - 2, tamanoCelda - 2, radio);
  ctx.fill();

  ctx.shadowBlur = 0; // Resetear sombra para mejor rendimiento
}

function pintarSerpiente() {
  serpiente.forEach((segmento, i) => {
    if (i === 0) {
      pintarParte(segmento.x, segmento.y, "#ff0055", true);
    } else {
      // Degradado sutil en el cuerpo
      const colorCuerpo = i % 2 === 0 ? "#00fbff" : "#00d2ff";
      pintarParte(segmento.x, segmento.y, colorCuerpo, false);
    }
  });
}

function pintarComida() {
  const px = ComidaX * tamanoCelda + tamanoCelda / 2;
  const py = ComidaY * tamanoCelda + tamanoCelda / 2;

  ctx.fillStyle = "#00ff41";
  ctx.shadowColor = "#00ff41";
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.arc(px, py, tamanoCelda / 2 - 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}

function generarComida() {
  const limiteX = canvas.width / tamanoCelda;
  const limiteY = canvas.height / tamanoCelda;
  let posicionValida = false;

  while (!posicionValida) {
    ComidaX = Math.floor(Math.random() * limiteX);
    ComidaY = Math.floor(Math.random() * limiteY);

    // Evitar que la comida aparezca sobre el cuerpo de la serpiente
    posicionValida = !serpiente.some(seg => seg.x === ComidaX && seg.y === ComidaY);
  }
}

// Lógica de Movimiento
function moverSerpiente() {
  if (juegoPausado || juegoFinalizado) return;

  // Actualizar la dirección actual con la procesada del buffer
  direccionActual = proximaDireccion;

  let nuevaCabeza = { x: serpiente[0].x, y: serpiente[0].y };

  if (direccionActual === "derecha") nuevaCabeza.x++;
  if (direccionActual === "izquierda") nuevaCabeza.x--;
  if (direccionActual === "arriba") nuevaCabeza.y--;
  if (direccionActual === "abajo") nuevaCabeza.y++;

  // Verificar colisión con bordes del tablero
  const limiteX = canvas.width / tamanoCelda;
  const limiteY = canvas.height / tamanoCelda;
  if (nuevaCabeza.x < 0 || nuevaCabeza.x >= limiteX || nuevaCabeza.y < 0 || nuevaCabeza.y >= limiteY) {
    finalizarJuego("COLISIÓN CON LA PARED");
    return;
  }

  // Verificar colisión con su propio cuerpo
  const colisionCuerpo = serpiente.some(segmento => segmento.x === nuevaCabeza.x && segmento.y === nuevaCabeza.y);
  if (colisionCuerpo) {
    finalizarJuego("COLISIÓN CONTIGO MISMO");
    return;
  }

  // Avanzar serpiente
  serpiente.unshift(nuevaCabeza);

  // Verificar si comió la manzana
  if (nuevaCabeza.x === ComidaX && nuevaCabeza.y === ComidaY) {
    puntaje++;
    if (puntaje > maxPuntaje) {
      maxPuntaje = puntaje;
      localStorage.setItem("snake_punk_max_score", maxPuntaje);
    }
    actualizarInterfaz();
    reproducirSonido("comer");
    generarComida();
  } else {
    serpiente.pop();
  }

  dibujarTodo();
}

function cambiarDireccion(nuevaDir) {
  initAudio();
  if (juegoFinalizado) return;

  // Evitar inversiones instantáneas de 180°
  if (nuevaDir === "arriba" && direccionActual !== "abajo") proximaDireccion = "arriba";
  if (nuevaDir === "abajo" && direccionActual !== "arriba") proximaDireccion = "abajo";
  if (nuevaDir === "izquierda" && direccionActual !== "derecha") proximaDireccion = "izquierda";
  if (nuevaDir === "derecha" && direccionActual !== "izquierda") proximaDireccion = "derecha";

  if (proximaDireccion !== direccionActual) {
    reproducirSonido("giro");
  }
}

// Estados del Juego
function iniciarJuego() {
  initAudio();
  if (juegoFinalizado) {
    reiniciarJuego();
  }

  if (!juegoIniciado) {
    juegoIniciado = true;
    juegoPausado = false;
    document.getElementById("estado").innerText = "JUGANDO";
    document.getElementById("overlayJuego").classList.add("hidden");
    reproducirSonido("inicio");

    clearInterval(intervaloSerpiente);
    intervaloSerpiente = setInterval(moverSerpiente, velocidadJuego);
  } else if (juegoPausado) {
    pausarJuego(); // Reanudar si estaba pausado
  }
}

function pausarJuego() {
  initAudio();
  if (!juegoIniciado || juegoFinalizado) return;

  if (juegoPausado) {
    // Reanudar
    juegoPausado = false;
    document.getElementById("estado").innerText = "JUGANDO";
    document.getElementById("overlayJuego").classList.add("hidden");
    document.getElementById("pausar").innerText = "⏸";
    intervaloSerpiente = setInterval(moverSerpiente, velocidadJuego);
  } else {
    // Pausar
    juegoPausado = true;
    clearInterval(intervaloSerpiente);
    document.getElementById("estado").innerText = "PAUSADO";
    document.getElementById("pausar").innerText = "▶";
    
    document.getElementById("overlayTitulo").innerText = "PAUSADO";
    document.getElementById("overlaySubtitulo").innerText = "Presiona PAUSA o ESPACIO para continuar";
    document.getElementById("overlayJuego").classList.remove("hidden");
  }
}

function finalizarJuego(motivo) {
  clearInterval(intervaloSerpiente);
  juegoFinalizado = true;
  juegoIniciado = false;
  reproducirSonido("perder");

  document.getElementById("estado").innerText = "GAME OVER";
  document.getElementById("overlayTitulo").innerText = "GAME OVER";
  document.getElementById("overlaySubtitulo").innerText = `${motivo} - Puntaje: ${puntaje}`;
  document.getElementById("overlayJuego").classList.remove("hidden");
}

function reiniciarJuego() {
  initAudio();
  clearInterval(intervaloSerpiente);

  puntaje = 0;
  actualizarInterfaz();
  document.getElementById("estado").innerText = "LISTO";
  document.getElementById("pausar").innerText = "⏸";
  document.getElementById("overlayJuego").classList.add("hidden");

  direccionActual = "derecha";
  proximaDireccion = "derecha";
  serpiente = [
    { x: 7, y: 6 },
    { x: 6, y: 6 },
    { x: 5, y: 6 }
  ];

  juegoIniciado = false;
  juegoPausado = false;
  juegoFinalizado = false;

  generarComida();
  dibujarTodo();
}

function dibujarTodo() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarTablero();
  pintarSerpiente();
  pintarComida();
}

// EVENT LISTENERS (Teclado y Gestos Táctiles)
document.addEventListener("keydown", (e) => {
  const tecla = e.key;

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(tecla)) {
    e.preventDefault(); // Evitar scroll en la página
  }

  if (tecla === "ArrowUp" || tecla === "w" || tecla === "W") cambiarDireccion("arriba");
  else if (tecla === "ArrowDown" || tecla === "s" || tecla === "S") cambiarDireccion("abajo");
  else if (tecla === "ArrowLeft" || tecla === "a" || tecla === "A") cambiarDireccion("izquierda");
  else if (tecla === "ArrowRight" || tecla === "d" || tecla === "D") cambiarDireccion("derecha");
  else if (tecla === " " || tecla === "p" || tecla === "P") {
    if (!juegoIniciado && !juegoFinalizado) iniciarJuego();
    else pausarJuego();
  } else if (tecla === "r" || tecla === "R") {
    reiniciarJuego();
  }
});

// Gestos Táctiles (Swipe Detection)
let touchStartX = 0;
let touchStartY = 0;

const contenedorJuego = document.querySelector(".contenedor-juego");

contenedorJuego.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

contenedorJuego.addEventListener("touchend", (e) => {
  if (juegoFinalizado) return;

  const touchEndX = e.changedTouches[0].screenX;
  const touchEndY = e.changedTouches[0].screenY;

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  const umbral = 25; // Distancia mínima en px para registrar el deslizado

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (Math.abs(deltaX) > umbral) {
      if (deltaX > 0) cambiarDireccion("derecha");
      else cambiarDireccion("izquierda");
    }
  } else {
    if (Math.abs(deltaY) > umbral) {
      if (deltaY > 0) cambiarDireccion("abajo");
      else cambiarDireccion("arriba");
    }
  }
}, { passive: true });

// Inicialización inicial al cargar
actualizarInterfaz();
generarComida();
dibujarTodo();
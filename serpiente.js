// serpiente.js
const canvas = document.getElementById("canvasJuego");
const ctx = canvas.getContext("2d");
const tamanoCelda = 30;
let puntaje = 0;
let direccionActual = "derecha";
let juegoFinalizado = false;
let intervaloSerpiente; // Variable global para el control del tiempo

let serpiente = [
  {x:7,y:6}, {x:6,y:6}, {x:5,y:6}
];

let ComidaX, ComidaY;

function dibujarTablero(){
  for (let i = 0; i < canvas.width; i += tamanoCelda) {
      ctx.strokeStyle = "#333"; // Color oscuro para la red
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
      ctx.stroke();
  }
  for (let i = 0; i < canvas.height; i += tamanoCelda) {
      ctx.strokeStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(0, i); ctx.lineTo(canvas.width, i);
      ctx.stroke();
  }
}

function pintarParte(x, y, color){
  ctx.fillStyle = color;
  ctx.fillRect(x * tamanoCelda, y * tamanoCelda, tamanoCelda, tamanoCelda);
  ctx.strokeStyle = "#000";
  ctx.strokeRect(x * tamanoCelda, y * tamanoCelda, tamanoCelda, tamanoCelda);
}

function pintarSerpiente(){
  serpiente.forEach((segmento, i) => {
    // Cabeza de un color, cuerpo de otro
    pintarParte(segmento.x, segmento.y, i === 0 ? "#ff0055" : "#00fbff");
  });
}

function moverSerpiente(){
  let nuevaCabeza = { x: serpiente[0].x, y: serpiente[0].y };

  if(direccionActual === "derecha") nuevaCabeza.x++;
  if(direccionActual === "izquierda") nuevaCabeza.x--;
  if(direccionActual === "arriba") nuevaCabeza.y--;
  if(direccionActual === "abajo") nuevaCabeza.y++;

  serpiente.unshift(nuevaCabeza);

  if (nuevaCabeza.x === ComidaX && nuevaCabeza.y === ComidaY){
    puntaje++;
    document.getElementById("puntaje").innerText = puntaje;
    generarComida();
  } else {
    serpiente.pop();
  }

  verificarCondicionBordes();
  dibujarTodo();
}

function cambiarDireccion(nuevaDir){
    // Evitar que la serpiente se mueva hacia atrás directamente
    if(nuevaDir === "arriba" && direccionActual !== "abajo") direccionActual = "arriba";
    if(nuevaDir === "abajo" && direccionActual !== "arriba") direccionActual = "abajo";
    if(nuevaDir === "izquierda" && direccionActual !== "derecha") direccionActual = "izquierda";
    if(nuevaDir === "derecha" && direccionActual !== "izquierda") direccionActual = "derecha";
}

function iniciarJuego(){
  if(juegoFinalizado) return;
  clearInterval(intervaloSerpiente); // Limpiar por seguridad
  intervaloSerpiente = setInterval(moverSerpiente, 150); // Un poco más rápido
  document.getElementById("estado").innerText = "PLAYING";
}

function pausarJuego(){
  clearInterval(intervaloSerpiente);
  document.getElementById("estado").innerText = "PAUSED";
}

function verificarCondicionBordes(){
  let cabeza = serpiente[0];
  let limiteX = canvas.width / tamanoCelda;
  let limiteY = canvas.height / tamanoCelda;

  if(cabeza.x < 0 || cabeza.x >= limiteX || cabeza.y < 0 || cabeza.y >= limiteY){
    pausarJuego();
    document.getElementById("estado").innerText = "GAME OVER";
    juegoFinalizado = true;
    desabilitarBotones();
  }
}

function generarComida(){
  ComidaX = Math.floor(Math.random() * (canvas.width / tamanoCelda));
  ComidaY = Math.floor(Math.random() * (canvas.height / tamanoCelda));
}

function pintarComida(){
  pintarParte(ComidaX, ComidaY, "#00ff41");
}

function reiniciarJuego(){
  clearInterval(intervaloSerpiente);
  puntaje = 0;
  document.getElementById("puntaje").innerText = puntaje;
  document.getElementById("estado").innerText = "READY";
  direccionActual = "derecha";
  serpiente = [{x:7,y:6}, {x:6,y:6}, {x:5,y:6}];
  juegoFinalizado = false;
  generarComida();
  habilitarBotones();
  dibujarTodo();
}

function desabilitarBotones(){
    ["arriba", "abajo", "derecha", "izquierda", "pausar", "iniciar"].forEach(id => {
        document.getElementById(id).disabled = true;
    });
}

function habilitarBotones(){
    ["arriba", "abajo", "derecha", "izquierda", "pausar", "iniciar"].forEach(id => {
        document.getElementById(id).disabled = false;
    });
}

function dibujarTodo() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dibujarTablero();
  pintarSerpiente();
  pintarComida();
}

// Inicialización
generarComida();
dibujarTodo();
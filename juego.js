const datos = window.DATOS_JUEGO;
const categorias = Object.keys(datos.categorias);
const $ = id => document.getElementById(id);

let ronda = 0;
let puntos = [0, 0];
let puntosRonda = 0;
let errores = [0, 0];
let usadas = {};
let preguntaActual = null;
let ejercicio = 0;
let timer = null;
let tiempo = 60;
let asignadoFinal = [false, false];

function mostrar(id){
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  $(id).classList.add("activa");
}

function toast(texto){
  $("toast").textContent = texto;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 1500);
}

function animateNumber(el, from, to, duration=650){
  const start = performance.now();
  function step(now){
    const t = Math.min(1, (now-start)/duration);
    const eased = 1 - Math.pow(1-t, 3);
    el.textContent = Math.round(from + (to-from)*eased);
    if(t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function actualizarMarcador(animar=false, anteriores=[0,0]){
  const ids = [["puntos1","finalPuntos1"],["puntos2","finalPuntos2"]];
  ids.forEach((par,i) => par.forEach(id => {
    if(animar) animateNumber($(id), anteriores[i], puntos[i]);
    else $(id).textContent = puntos[i];
  }));
}

$("btnIniciar").addEventListener("click", () => {
  $("equipo1Nombre").textContent = $("nombre1").value.trim() || "Equipo 1";
  $("equipo2Nombre").textContent = $("nombre2").value.trim() || "Equipo 2";
  usadas = {};
  categorias.forEach(c => usadas[c] = []);
  ronda = 0;
  puntos = [0,0];
  errores = [0,0];
  actualizarMarcador();
  presentarRonda();
});

function presentarRonda(){
  $("presentacionNumero").textContent = `RONDA ${ronda+1}`;
  $("presentacionCategoria").textContent = categorias[ronda];
  $("presentacionEquipo1").textContent = $("equipo1Nombre").textContent;
  $("presentacionEquipo2").textContent = $("equipo2Nombre").textContent;
  mostrar("presentacionRonda");
}

function comenzarRondaActual(){
  if(!$("presentacionRonda").classList.contains("activa")) return;
  mostrar("juego");
  cargarRonda();
}

$("presentacionRonda").addEventListener("click", comenzarRondaActual);

function elegirPregunta(cat){
  const banco = datos.categorias[cat];
  let disponibles = banco.map((_,i)=>i).filter(i => !usadas[cat].includes(i));
  if(!disponibles.length){
    usadas[cat] = [];
    disponibles = banco.map((_,i)=>i);
  }
  const idx = disponibles[Math.floor(Math.random()*disponibles.length)];
  usadas[cat].push(idx);
  return banco[idx];
}

function cargarRonda(){
  const cat = categorias[ronda];
  preguntaActual = elegirPregunta(cat);
  puntosRonda = 0;
  errores = [0,0];

  $("rondaTexto").textContent = `RONDA ${ronda+1}`;
  $("categoriaTexto").textContent = cat.toUpperCase();
  $("preguntaTexto").textContent = preguntaActual.pregunta;
  $("puntosRonda").textContent = "0";
  actualizarErrores();

  const tablero = $("tablero");
  tablero.innerHTML = "";

  preguntaActual.respuestas.forEach((r,i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-card";
    btn.innerHTML = `
      <span class="answer-inner">
        <span class="answer-face answer-front">
          <span class="answer-number">${i+1}</span>
          <span class="answer-text">RESPUESTA OCULTA</span>
          <span class="answer-points">?</span>
        </span>
        <span class="answer-face answer-back">
          <span class="answer-number">${i+1}</span>
          <span class="answer-text">${r[0]}</span>
          <span class="answer-points">${r[1]}</span>
        </span>
      </span>`;
    btn.addEventListener("click", () => {
      const anterior = puntosRonda;
      if(btn.classList.contains("revealed")){
        btn.classList.remove("revealed");
        puntosRonda = Math.max(0, puntosRonda - r[1]);
        animateNumber($("puntosRonda"), anterior, puntosRonda, 400);
        toast("Respuesta ocultada nuevamente");
      } else {
        btn.classList.add("revealed");
        puntosRonda += r[1];
        animateNumber($("puntosRonda"), anterior, puntosRonda, 500);
      }
    });
    tablero.appendChild(btn);
  });
}

$("nuevaPregunta").addEventListener("click", () => {
  cargarRonda();
  toast("Se seleccionó una nueva pregunta");
});

function mostrarError(){
  const overlay = $("errorOverlay");
  overlay.classList.remove("show");
  void overlay.offsetWidth;
  overlay.classList.add("show");
  setTimeout(() => overlay.classList.remove("show"), 720);
}

function actualizarErrores(){
  $("errores1").textContent = "✕".repeat(errores[0]);
  $("errores2").textContent = "✕".repeat(errores[1]);
}

function agregarError(eq){
  if(errores[eq] < 3){
    errores[eq]++;
    actualizarErrores();
    mostrarError();
  }
}

$("error1").addEventListener("click", () => agregarError(0));
$("error2").addEventListener("click", () => agregarError(1));

function quitarError(eq){
  if(errores[eq] > 0){
    errores[eq]--;
    actualizarErrores();
    toast("Error corregido");
  } else {
    toast("El equipo no tiene errores");
  }
}

$("quitarError1").addEventListener("click", () => quitarError(0));
$("quitarError2").addEventListener("click", () => quitarError(1));

let equipoPendiente = null;

function pedirAsignacion(eq){
  if(puntosRonda <= 0){
    toast("No hay puntos pendientes");
    return;
  }
  equipoPendiente = eq;
  const nombre = eq === 0 ? $("equipo1Nombre").textContent : $("equipo2Nombre").textContent;
  $("confirmacionTexto").textContent = `¿Asignar ${puntosRonda} puntos a ${nombre}?`;
  $("confirmacion").classList.add("show");
  $("confirmacion").setAttribute("aria-hidden","false");
}

function cerrarConfirmacion(){
  equipoPendiente = null;
  $("confirmacion").classList.remove("show");
  $("confirmacion").setAttribute("aria-hidden","true");
}

function asignar(eq){
  if(puntosRonda <= 0){
    toast("No hay puntos pendientes");
    return;
  }
  const anteriores = [...puntos];
  puntos[eq] += puntosRonda;
  const ganados = puntosRonda;
  puntosRonda = 0;
  animateNumber($("puntosRonda"), ganados, 0, 350);
  actualizarMarcador(true, anteriores);
  toast(`${ganados} puntos asignados`);
}

$("asignar1").addEventListener("click", () => pedirAsignacion(0));
$("asignar2").addEventListener("click", () => pedirAsignacion(1));
$("cancelarAsignacion").addEventListener("click", cerrarConfirmacion);
$("confirmarAsignacion").addEventListener("click", () => {
  if(equipoPendiente !== null) asignar(equipoPendiente);
  cerrarConfirmacion();
});

$("siguiente").addEventListener("click", () => {
  if(puntosRonda > 0){
    toast("Asigna primero los puntos de la ronda");
    return;
  }
  ronda++;
  if(ronda < 5) presentarRonda();
  else iniciarFinal();
});

function iniciarFinal(){
  $("finalNombre1").textContent = $("equipo1Nombre").textContent;
  $("finalNombre2").textContent = $("equipo2Nombre").textContent;
  ejercicio = 0;
  mostrar("final");
  cargarEjercicio();
}

function cargarEjercicio(){
  clearInterval(timer);
  tiempo = 60;
  $("tiempo").textContent = tiempo;
  $("contadorEjercicio").textContent = `EJERCICIO ${ejercicio+1} DE ${datos.rondaFinal.length}`;
  asignadoFinal = [false,false];

  const e = datos.rondaFinal[ejercicio];
  $("ejercicioTexto").textContent = e.pregunta;
  $("explicacion").textContent = "";
  const cont = $("opciones");
  cont.innerHTML = "";

  e.opciones.forEach((op,i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.textContent = `${"ABCD"[i]}. ${op}`;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".option").forEach((x,j) => {
        x.disabled = true;
        if(j === e.correcta) x.classList.add("correct");
        else if(j === i) x.classList.add("wrong");
      });
      $("explicacion").textContent = e.explicacion;
    });
    cont.appendChild(btn);
  });
}

$("iniciarTiempo").addEventListener("click", () => {
  clearInterval(timer);
  timer = setInterval(() => {
    tiempo--;
    $("tiempo").textContent = tiempo;
    if(tiempo <= 0){
      clearInterval(timer);
      mostrarError();
    }
  },1000);
});

$("reiniciarTiempo").addEventListener("click", () => {
  clearInterval(timer);
  tiempo = 60;
  $("tiempo").textContent = tiempo;
});

function sumarFinal(eq){
  if(asignadoFinal[eq]){
    toast("Ese equipo ya recibió los puntos");
    return;
  }
  asignadoFinal[eq] = true;
  const anteriores = [...puntos];
  puntos[eq] += 40;
  actualizarMarcador(true, anteriores);
  toast("40 puntos asignados");
}
$("acierto1").addEventListener("click", () => sumarFinal(0));
$("acierto2").addEventListener("click", () => sumarFinal(1));

$("siguienteEjercicio").addEventListener("click", () => {
  ejercicio++;
  if(ejercicio < datos.rondaFinal.length) cargarEjercicio();
  else terminar();
});

function terminar(){
  clearInterval(timer);
  mostrar("ganador");
  const n1 = $("equipo1Nombre").textContent;
  const n2 = $("equipo2Nombre").textContent;
  $("ganadorNombre").textContent = puntos[0] === puntos[1] ? "¡EMPATE!" : (puntos[0] > puntos[1] ? n1 : n2);
  $("marcadorFinal").textContent = `${n1}: ${puntos[0]} puntos  ·  ${n2}: ${puntos[1]} puntos`;
  lanzarConfeti();
}

$("reiniciarJuego").addEventListener("click", () => {
  clearInterval(timer);
  mostrar("inicio");
});

function lanzarConfeti(){
  const canvas = $("confetti");
  const ctx = canvas.getContext("2d");
  let w, h;
  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize, {once:true});

  const piezas = Array.from({length:180}, () => ({
    x: Math.random()*w,
    y: -Math.random()*h,
    s: 4+Math.random()*8,
    vy: 2+Math.random()*4,
    vx: -1.5+Math.random()*3,
    r: Math.random()*Math.PI,
    vr: -.12+Math.random()*.24,
    c: ["#ffcb43","#ffffff","#4ba7ff","#ff5e68"][Math.floor(Math.random()*4)]
  }));

  let frames = 0;
  function draw(){
    ctx.clearRect(0,0,w,h);
    piezas.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      if(p.y > h+20){ p.y=-20; p.x=Math.random()*w; }
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.r);
      ctx.fillStyle=p.c;
      ctx.fillRect(-p.s/2,-p.s/3,p.s,p.s*.65);
      ctx.restore();
    });
    frames++;
    if(frames < 720 && $("ganador").classList.contains("activa")) requestAnimationFrame(draw);
  }
  draw();
}
let pantallaAntesDePausa = "juego";
$("pausarJuego").addEventListener("click", () => {
  pantallaAntesDePausa = document.querySelector(".pantalla.activa")?.id || "juego";
  mostrar("pausa");
});
$("reanudarJuego").addEventListener("click", () => mostrar(pantallaAntesDePausa));

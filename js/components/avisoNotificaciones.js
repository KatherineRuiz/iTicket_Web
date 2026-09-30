/* Mini aviso que aparece en la esquina cuando entran notificaciones nuevas.

   No sustituye al panel de la campana: solo avisa. Pregunta cada cierto tiempo
   cuantas hay sin leer y, si el numero subio desde la ultima vez, saca el aviso.
   Mientras el aviso sigue en pantalla las nuevas se van sumando (+1, +2, +3...),
   y al llegar al tope deja de contar y dice "Varias notificaciones nuevas". */

import { API_BASE_URL, esPaginaPublica } from "../services/apiConfig.js";

const INTERVALO_MS = 20000;   // cada cuanto se le pregunta a la API
const DURACION_MS = 6000;     // cuanto se queda el aviso en pantalla
const TOPE_DETALLE = 10;      // a partir de aqui ya no se dice el numero exacto

/* null = todavia no se ha hecho la primera lectura. Esa primera lectura solo
   sirve para fijar el punto de partida: si no, al entrar a cualquier pagina
   saldria un aviso por notificaciones que ya estaban ahi desde antes. */
let conocidas = null;
let acumuladas = 0;
let temporizadorOcultar = null;
let temporizadorSondeo = null;
let elemento = null;
let iniciado = false;

function idUsuarioSesion() {
    try {
        return JSON.parse(sessionStorage.getItem("usuarioLogueado"))?.idUsuario ?? null;
    } catch {
        return null;
    }
}

/* A proposito NO usa apiFetch ni el service de notificaciones.

   apiFetch trata cualquier 401 como "al usuario se le vencio la sesion mientras
   trabajaba": borra sessionStorage y manda al login. Eso esta bien cuando el 401
   viene de algo que la persona pidio, pero aqui el que pregunta es un temporizador
   de fondo. El token dura 15 minutos; con un sondeo cada 20 segundos, dejar la
   pantalla abierta un rato bastaba para que se borrara la sesion sola, y el menu
   se volvia a dibujar con el rol por defecto ("usuario") aunque fueras admin.

   Asi que este sondeo es silencioso: si no hay sesion valida simplemente se apaga
   y deja que sea la siguiente accion real de la persona la que la mande al login. */
async function consultarNoLeidas() {
    const idUsuario = idUsuarioSesion();
    if (!idUsuario) return null;

    const respuesta = await fetch(
        `${API_BASE_URL}/notificaciones/no-leidas/contador?idUsuario=${idUsuario}`,
        { credentials: "include" }
    );
    if (respuesta.status === 401 || respuesta.status === 403) return "sin-sesion";
    if (!respuesta.ok) return null;

    const cuerpo = await respuesta.json().catch(() => null);
    return Number(cuerpo?.data);
}

function detenerSondeo() {
    window.clearInterval(temporizadorSondeo);
    temporizadorSondeo = null;
}

function textoAviso(cantidad) {
    if (cantidad >= TOPE_DETALLE) return "Varias notificaciones nuevas";
    return cantidad === 1 ? "+1 notificación nueva" : `+${cantidad} notificaciones nuevas`;
}

function textoContador(cantidad) {
    return cantidad >= TOPE_DETALLE ? "9+" : String(cantidad);
}

function haySesion() {
    try {
        return Boolean(JSON.parse(sessionStorage.getItem("usuarioLogueado"))?.idUsuario);
    } catch {
        return false;
    }
}

function obtenerElemento() {
    if (elemento?.isConnected) return elemento;

    elemento = document.createElement("div");
    elemento.className = "aviso-notificaciones";
    elemento.setAttribute("role", "status");
    elemento.setAttribute("aria-live", "polite");
    elemento.hidden = true;
    elemento.innerHTML = `
        <span class="aviso-notificaciones-icono">
            <i class="bi bi-bell-fill" aria-hidden="true"></i>
            <span class="aviso-notificaciones-contador"></span>
        </span>
        <span class="aviso-notificaciones-texto"></span>
        <button type="button" class="aviso-notificaciones-cerrar" aria-label="Cerrar aviso">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>`;

    elemento.addEventListener("click", function (evento) {
        const cerrando = Boolean(evento.target.closest(".aviso-notificaciones-cerrar"));
        ocultar();
        // Tocar el aviso (no la X) abre el panel de la campana
        if (!cerrando) document.getElementById("btnNotificaciones")?.click();
    });

    document.body.appendChild(elemento);
    return elemento;
}

function mostrar() {
    const nodo = obtenerElemento();
    nodo.querySelector(".aviso-notificaciones-texto").textContent = textoAviso(acumuladas);
    nodo.querySelector(".aviso-notificaciones-contador").textContent = textoContador(acumuladas);
    nodo.hidden = false;

    /* Si ya estaba visible y solo subio el contador, se reinicia la animacion
       a mano: quitar la clase y volver a leer offsetWidth obliga al navegador
       a recalcular antes de ponerla otra vez. */
    nodo.classList.remove("late");
    void nodo.offsetWidth;
    nodo.classList.add("visible", "late");

    window.clearTimeout(temporizadorOcultar);
    temporizadorOcultar = window.setTimeout(ocultar, DURACION_MS);
}

function ocultar() {
    window.clearTimeout(temporizadorOcultar);
    acumuladas = 0;   // el siguiente aviso vuelve a empezar desde +1
    if (!elemento) return;

    elemento.classList.remove("visible", "late");
    window.setTimeout(function () {
        if (elemento && !elemento.classList.contains("visible")) elemento.hidden = true;
    }, 260);
}

function actualizarPunto(hayNoLeidas) {
    const punto = document.getElementById("notificacionDot");
    if (punto) punto.hidden = !hayNoLeidas;
}

async function revisar() {
    let conteo;
    try {
        conteo = await consultarNoLeidas();
    } catch (error) {
        // Sin conexion: no se avisa nada y se reintenta en el siguiente ciclo
        return;
    }

    if (conteo === "sin-sesion") {
        detenerSondeo();
        return;
    }
    if (!Number.isFinite(conteo)) return;

    actualizarPunto(conteo > 0);

    if (conocidas === null) {
        conocidas = conteo;
        return;
    }

    if (conteo > conocidas) {
        acumuladas += conteo - conocidas;
        mostrar();
    }

    // Tambien baja cuando el usuario las marca como leidas, para no volver a avisar de las mismas
    conocidas = conteo;
}

export function iniciarAvisoNotificaciones() {
    if (iniciado || esPaginaPublica() || !haySesion()) return;
    iniciado = true;

    revisar();
    temporizadorSondeo = window.setInterval(function () {
        if (!document.hidden) revisar();
    }, INTERVALO_MS);

    // Al volver a la pestaña se revisa de una vez, sin esperar al siguiente ciclo
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden && temporizadorSondeo) revisar();
    });
}

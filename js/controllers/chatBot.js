import {
    eliminarConversacionChatbot,
    enviarMensajeChatbot,
    obtenerConversacionChatbot,
    obtenerConversacionesChatbot
} from "../services/chatbotService.js";
import {
    mostrarConfirmacion,
    mostrarError,
    mostrarExitoSimple
} from "../components/sweetAlerts.js";
import { obtenerIdUsuario, obtenerUsuarioLogueado } from "../utils/sesion.js";

const txtChat = document.getElementById("txtChat");
const cuerpoChat = document.getElementById("cuerpoChat");
const btnEnviar = document.getElementById("btnEnviar");
const btnNuevaConversacion = document.getElementById("btnNuevaConversacion");
const btnAlternarConversaciones = document.getElementById("btnAlternarConversaciones");
const chatLayout = document.querySelector(".chat-layout");
const listaConversaciones = document.getElementById("listaConversaciones");
const bienvenidaChat = document.getElementById("bienvenidaChat");
const overlayHistorialChat = document.getElementById("chatHistorialOverlay");
const ANCHO_MOVIL_CHAT = 767.98;

const idUsuario = obtenerIdUsuario();
let idConversacionActiva = null;
let chatOcupado = false;
const CLAVE_HISTORIAL_CONTRAIDO = "tickyHistorialContraido";

const PREGUNTAS_SUGERIDAS = {
    btnSugerencia1: "Dame un resumen de mis tickets, incluyendo cuántos están abiertos y cuántos vencidos.",
    btnSugerencia2: "¿Cuál es mi ticket más reciente y en qué estado se encuentra?",
    btnSugerencia3: "Tengo un problema de conexión a internet. ¿Qué comprobaciones sencillas puedo realizar?"
};

if (window.bootstrap?.Popover) {
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((elemento) => {
        new bootstrap.Popover(elemento);
    });
}

txtChat?.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = `${this.scrollHeight}px`;
    this.style.overflowY = this.scrollHeight >= 120 ? "auto" : "hidden";
});

Object.entries(PREGUNTAS_SUGERIDAS).forEach(([idBoton, pregunta]) => {
    document.getElementById(idBoton)?.addEventListener("click", () => enviarMensaje(pregunta));
});

/* Avatar propio en los mensajes que manda el usuario.

   Se arma igual que el del encabezado (menu.js): primero la miniatura de
   Cloudinary, que viene recortada a 120x120, y si no existe la imagen completa.
   Si el usuario todavia no subio foto se usa la inicial de su nombre, que es lo
   mismo que hace el menu. Se lee de la sesion en cada mensaje y no una sola vez
   al cargar, para que si cambia su foto en el perfil se refleje enseguida. */
function crearInicialUsuario(inicial) {
    const marca = document.createElement("span");
    marca.className = "perfil-usuario perfil-usuario-inicial";
    marca.textContent = inicial;
    return marca;
}

function crearAvatarUsuario() {
    const usuario = obtenerUsuarioLogueado() || {};
    const nombre = String(usuario.nombreUsuario || usuario.nombreCompleto || usuario.nombre || "Usuario").trim();
    const inicial = nombre.charAt(0).toUpperCase() || "U";
    const foto = usuario.imagenMiniaturaUrl || usuario.imagenUrl || "";

    if (!foto) return crearInicialUsuario(inicial);

    const imagen = document.createElement("img");
    imagen.src = foto;
    imagen.alt = "Foto de perfil";
    imagen.className = "perfil-usuario perfil-usuario-foto";
    // Si la URL falla (imagen borrada en Cloudinary) se cambia por la inicial,
    // para no dejar un icono roto en medio de la conversacion.
    imagen.addEventListener("error", () => imagen.replaceWith(crearInicialUsuario(inicial)), { once: true });
    return imagen;
}

function agregarMensajeUsuario(texto, animar = true) {
    const fila = document.createElement("div");
    fila.className = "d-flex justify-content-end align-items-end gap-2 mensaje-conversacion";

    const globo = document.createElement("div");
    globo.className = `mensaje usuario${animar ? " animar-mensaje" : ""}`;
    globo.textContent = texto;

    fila.append(globo, crearAvatarUsuario());
    cuerpoChat.appendChild(fila);
    desplazarAlFinal();
}

function agregarMensajeBotTexto(texto, animar = true) {
    const fila = document.createElement("div");
    fila.className = "d-flex align-items-end gap-3 mensaje-conversacion";
    fila.innerHTML = `
        ${crearIconoBot()}
        <div class="mensaje bot mensaje-texto${animar ? " animar-mensaje" : ""} shadow-sm"></div>`;
    fila.querySelector(".mensaje").textContent = limpiarFormatoRespuesta(texto);
    cuerpoChat.appendChild(fila);
    desplazarAlFinal();
}

function limpiarFormatoRespuesta(texto) {
    const lineas = String(texto || "").split(/\r?\n/);
    const resultado = [];

    lineas.forEach((linea) => {
        const contenido = linea.trim();
        if (/^\|?(\s*:?-{3,}:?\s*\|)+\s*$/.test(contenido)) return;

        if (contenido.startsWith("|") && contenido.endsWith("|")) {
            const columnas = contenido.split("|")
                .map((columna) => columna.trim()
                    .replace(/\*\*(.*?)\*\*/g, "$1")
                    .replace(/`([^`]+)`/g, "$1"))
                .filter(Boolean);
            if (columnas.length > 0) resultado.push(`• ${columnas.join(": ")}`);
            return;
        }

        const lineaLimpia = linea
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/^\s*#{1,6}\s+/, "")
            .replace(/^\s*-\s+/, "• ")
            .replace(/`([^`]+)`/g, "$1")
            .trimEnd();
        if (!lineaLimpia.trim() && !resultado.at(-1)?.trim()) return;
        resultado.push(lineaLimpia);
    });

    return resultado.join("\n").trim();
}

function agregarIndicadorEscritura() {
    const fila = document.createElement("div");
    fila.className = "d-flex align-items-center gap-3 indicador-escritura";
    fila.innerHTML = `${crearIconoBot()}<span class="puntos-escritura" aria-label="Ticky está escribiendo"><i></i><i></i><i></i></span>`;
    cuerpoChat.appendChild(fila);
    desplazarAlFinal();
    return fila;
}

function crearIconoBot() {
    return `
        <span class="perfil-bot rounded-pill" aria-hidden="true">
            <svg viewBox="0 0 52 46" fill="none" xmlns="http://www.w3.org/2000/svg" class="chatbot-svg">
                <path
                    d="M26 10.844V2H16.4M33.2 21.899V26.321M2 24.11H6.8M45.2 24.11H50M18.8 21.899V26.321M45.2 32.954C45.2 34.1268 44.6943 35.2516 43.7941 36.0809C42.8939 36.9101 41.673 37.376 40.4 37.376H18.3872C17.1143 37.3763 15.8936 37.8423 14.9936 38.6717L9.7088 43.5403C9.47049 43.7598 9.16689 43.9093 8.83637 43.9698C8.50586 44.0304 8.16328 43.9993 7.85194 43.8805C7.5406 43.7617 7.27449 43.5605 7.08725 43.3024C6.9 43.0443 6.80004 42.7408 6.8 42.4304V15.266C6.8 14.0932 7.30571 12.9685 8.20589 12.1392C9.10606 11.3099 10.327 10.844 11.6 10.844H40.4C41.673 10.844 42.8939 11.3099 43.7941 12.1392C44.6943 12.9685 45.2 14.0932 45.2 15.266V32.954Z"
                    stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        </span>`;
}

async function enviarMensaje(mensajeSugerido) {
    const mensaje = typeof mensajeSugerido === "string"
        ? mensajeSugerido.trim()
        : txtChat.value.trim();

    if (!mensaje || chatOcupado) return;

    agregarMensajeUsuario(mensaje);
    txtChat.value = "";
    txtChat.style.height = "auto";
    const indicador = agregarIndicadorEscritura();
    cambiarEstadoChat(true);

    try {
        const resultado = await enviarMensajeChatbot(
            idUsuario,
            mensaje,
            idConversacionActiva
        );

        idConversacionActiva = resultado?.idConversacion ?? idConversacionActiva;
        agregarMensajeBotTexto(
            resultado?.respuesta || "Lo siento, no recibí una respuesta válida."
        );
        await cargarConversaciones();
    } catch (error) {
        console.error("Error al consultar a Ticky:", error);
        agregarMensajeBotTexto(
            error.message || "No pude responder en este momento. Inténtalo nuevamente."
        );
    } finally {
        indicador.remove();
        cambiarEstadoChat(false);
        txtChat.focus();
    }
}

async function cargarConversaciones() {
    if (!idUsuario) {
        mostrarEstadoLista("Inicia sesión para guardar tus conversaciones.");
        return;
    }

    try {
        const conversaciones = await obtenerConversacionesChatbot(idUsuario);
        renderizarConversaciones(Array.isArray(conversaciones) ? conversaciones : []);
    } catch (error) {
        console.error("No se pudo cargar el historial:", error);
        mostrarEstadoLista("No fue posible cargar las conversaciones.");
    }
}

function renderizarConversaciones(conversaciones) {
    listaConversaciones.replaceChildren();

    if (conversaciones.length === 0) {
        mostrarEstadoLista("Aún no tienes conversaciones guardadas.");
        return;
    }

    conversaciones.forEach((conversacion) => {
        const elemento = document.createElement("div");
        elemento.className = "conversacion-item";
        if (conversacion.idConversacion === idConversacionActiva) elemento.classList.add("activa");

        const abrir = document.createElement("button");
        abrir.type = "button";
        abrir.className = "conversacion-abrir";
        abrir.setAttribute("aria-label", `Abrir conversación ${conversacion.titulo}`);

        const titulo = document.createElement("span");
        titulo.className = "conversacion-titulo";
        titulo.textContent = conversacion.titulo || "Conversación";

        const fecha = document.createElement("small");
        fecha.textContent = formatearFechaConversacion(conversacion.fechaActualizacion);
        abrir.append(titulo, fecha);
        abrir.addEventListener("click", () => abrirConversacion(conversacion.idConversacion));

        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.className = "conversacion-eliminar";
        eliminar.title = "Eliminar conversación";
        eliminar.setAttribute("aria-label", `Eliminar conversación ${conversacion.titulo}`);
        eliminar.innerHTML = '<i class="bi bi-trash3"></i>';
        eliminar.addEventListener("click", () => eliminarConversacion(
            conversacion.idConversacion,
            conversacion.titulo
        ));

        elemento.append(abrir, eliminar);
        listaConversaciones.appendChild(elemento);
    });
}

async function abrirConversacion(idConversacion) {
    if (chatOcupado || idConversacion === idConversacionActiva) return;

    cambiarEstadoChat(true);
    cerrarHistorialEnMovil();
    try {
        const conversacion = await obtenerConversacionChatbot(idUsuario, idConversacion);
        idConversacionActiva = conversacion.idConversacion;
        limpiarMensajesConversacion(false);

        (conversacion.mensajes || []).forEach((mensaje) => {
            if (mensaje.rol === "user") agregarMensajeUsuario(mensaje.contenido, false);
            if (mensaje.rol === "assistant") agregarMensajeBotTexto(mensaje.contenido, false);
        });

        await cargarConversaciones();
        desplazarAlFinal();
    } catch (error) {
        console.error("No se pudo abrir la conversación:", error);
    } finally {
        cambiarEstadoChat(false);
    }
}

async function eliminarConversacion(idConversacion, titulo) {
    if (chatOcupado) return;
    const confirmado = await mostrarConfirmacion(
        "¿Eliminar conversación?",
        `Se eliminarán todos los mensajes de “${titulo || "Conversación"}”.`,
        "Sí, eliminar",
        "Cancelar"
    );
    if (!confirmado) return;

    cambiarEstadoChat(true);
    try {
        await eliminarConversacionChatbot(idUsuario, idConversacion);
        if (idConversacionActiva === idConversacion) {
            idConversacionActiva = null;
            limpiarMensajesConversacion(true);
        }
        await cargarConversaciones();
        mostrarExitoSimple(
            "Conversación eliminada",
            "El historial de esta conversación se eliminó correctamente."
        );
    } catch (error) {
        console.error("No se pudo eliminar la conversación:", error);
        mostrarError(error.message || "No se pudo eliminar la conversación.");
    } finally {
        cambiarEstadoChat(false);
    }
}

function iniciarNuevaConversacion() {
    if (chatOcupado) return;
    idConversacionActiva = null;
    limpiarMensajesConversacion(true);
    cargarConversaciones();
    cerrarHistorialEnMovil();
    txtChat.focus();
}

function limpiarMensajesConversacion(mostrarBienvenida) {
    cuerpoChat.querySelectorAll(".mensaje-conversacion, .indicador-escritura")
        .forEach((elemento) => elemento.remove());
    bienvenidaChat.hidden = !mostrarBienvenida;
}

function mostrarEstadoLista(texto) {
    listaConversaciones.replaceChildren();
    const estado = document.createElement("p");
    estado.className = "estado-conversaciones";
    estado.textContent = texto;
    listaConversaciones.appendChild(estado);
}

function formatearFechaConversacion(valor) {
    if (!valor) return "";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "";

    return new Intl.DateTimeFormat("es-SV", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    }).format(fecha);
}

function cambiarEstadoChat(deshabilitado) {
    chatOcupado = deshabilitado;
    btnEnviar.disabled = deshabilitado;
    txtChat.disabled = deshabilitado;
    btnNuevaConversacion.disabled = deshabilitado;
    Object.keys(PREGUNTAS_SUGERIDAS).forEach((idBoton) => {
        const boton = document.getElementById(idBoton);
        if (boton) boton.disabled = deshabilitado;
    });
}

function desplazarAlFinal() {
    cuerpoChat.scrollTop = cuerpoChat.scrollHeight;
}

function cambiarVisibilidadHistorial(contraer) {
    chatLayout.classList.toggle("historial-contraido", contraer);
    btnAlternarConversaciones.setAttribute("aria-expanded", String(!contraer));
    btnAlternarConversaciones.setAttribute(
        "aria-label",
        contraer ? "Mostrar historial de conversaciones" : "Contraer historial de conversaciones"
    );
    btnAlternarConversaciones.title = contraer ? "Mostrar historial" : "Contraer historial";

    const icono = btnAlternarConversaciones.querySelector("i");
    icono.className = "bi bi-chevron-left";
    sessionStorage.setItem(CLAVE_HISTORIAL_CONTRAIDO, String(contraer));

    /* En celular el historial ya no se superpone al chat: lo reemplaza a pantalla
       completa (ver chatBot.css), así que el fondo oscuro sobra. Solo se usa de
       tablet en adelante, donde el panel sí se abre encima. */
    overlayHistorialChat?.classList.remove("activo");
}

function esPantallaAngosta() {
    return window.innerWidth <= ANCHO_MOVIL_CHAT;
}

// En celular, al elegir una conversación se vuelve al chat: es lo que se quería ver
function cerrarHistorialEnMovil() {
    if (esPantallaAngosta()) cambiarVisibilidadHistorial(true);
}

btnAlternarConversaciones?.addEventListener("click", () => {
    cambiarVisibilidadHistorial(!chatLayout.classList.contains("historial-contraido"));
});

overlayHistorialChat?.addEventListener("click", () => {
    cambiarVisibilidadHistorial(true);
});

window.addEventListener("resize", () => {
    if (window.innerWidth > ANCHO_MOVIL_CHAT) {
        overlayHistorialChat?.classList.remove("activo");
    }
});
btnNuevaConversacion?.addEventListener("click", iniciarNuevaConversacion);
btnEnviar?.addEventListener("click", () => enviarMensaje());
txtChat?.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" && !evento.shiftKey) {
        evento.preventDefault();
        enviarMensaje();
    }
});

/* Al entrar, en celular se muestra el chat y no el historial: en una pantalla
   angosta el historial ocupa todo, y abrirlo de entrada dejaba la conversación
   escondida detrás. En escritorio se sigue abriendo expandido. */
const historialGuardado = sessionStorage.getItem(CLAVE_HISTORIAL_CONTRAIDO);
cambiarVisibilidadHistorial(
    historialGuardado === null ? esPantallaAngosta() : historialGuardado === "true"
);
cargarConversaciones();

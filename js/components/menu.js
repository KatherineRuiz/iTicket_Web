/* Aqui se cargan los componentes del menú */
const MENU_CACHE_KEY = "iticket_menu_v5";
const BREAKPOINT_MENU = 1100;

/* Color del ticket dependiendo de su prioridad */
window.obtenerClaseIconoTicket = function (prioridad) {
    const valor = String(prioridad || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
    if (valor === "critica" || valor === "critico") return "icono-ticket-prioridad-critica";
    if (valor === "alta") return "icono-ticket-prioridad-alta";
    if (valor === "media") return "icono-ticket-prioridad-media";
    if (valor === "baja") return "icono-ticket-prioridad-baja";
    return "icono-ticket-prioridad-sin-asignar";
};

document.addEventListener("DOMContentLoaded", function () {
    aplicarTemaGuardado();
    prepararLayoutGlobal();
    inicializarNotificacionesGlobales();
    prepararInteraccionTablas();
    inicializarPaginacionAutomatica();
    configurarEstiloGlobalGraficas();
    prepararNavegacionSuave();
    cargarMenuCompartido();
    finalizarPreparacionVisual();
});

/* Revela la interfaz con una transición corta cuando el CSS global ya existe */
async function finalizarPreparacionVisual() {
    try {
        await (window.__layoutCssReady || Promise.resolve());
    } finally {
        window.requestAnimationFrame(() => {
            document.documentElement.classList.remove("iticket-preparando");
            document.documentElement.classList.add("iticket-listo");
        });
    }
}

function prepararLayoutGlobal() {
    const main = document.querySelector("main.main");
    if (!main || main.querySelector(":scope > .main-shell")) return;

    const pagina = (window.location.pathname.split("/").pop() || "dashboardAdmin.html").toLowerCase();

    // Estos son los apartados del menu
    const titulos = {
        "bitacoras.html": "Bitácoras",
        "chatbot.html": "ChatBot",
        "creartickets.html": "Crear ticket",
        "dashboardadmin.html": "Dashboard",
        "dashboardtecnicos.html": "Dashboard",
        "dashboardusuarios.html": "Dashboard",
        "equiposmobiliarios.html": "Equipos y mobiliario",
        "estadisticas.html": "Estadísticas",
        "evaluaciones.html": "Evaluaciones",
        "gestiontickets.html": "Gestión de tickets",
        "mistickets.html": "Mis tickets",
        "proyectos.html": "Proyectos",
        "ticketsasignados.html": "Tickets asignados",
        "ubicaciones.html": "Ubicaciones",
        "usuarios.html": "Usuarios",
        "vistaproyecto.html": "Proyectos",
        "vistaticket.html": "Detalle del ticket"
    };

    // Aqui estan los iconos de cada apartado del menu
    const iconos = {
        "bitacoras.html": "bi-clock-history",
        "chatbot.html": "bi-chat-dots",
        "creartickets.html": "bi-ticket-perforated",
        "equiposmobiliarios.html": "bi-pc-display",
        "estadisticas.html": "bi-bar-chart",
        "evaluaciones.html": "bi-star",
        "gestiontickets.html": "bi-ticket-detailed",
        "mistickets.html": "bi-ticket",
        "proyectos.html": "bi-kanban",
        "ticketsasignados.html": "bi-person-check",
        "ubicaciones.html": "bi-geo-alt",
        "usuarios.html": "bi-people",
        "vistaproyecto.html": "bi-kanban",
        "vistaticket.html": "bi-ticket-detailed"
    };

    const superior = main.querySelector(":scope > .superior");
    const tituloExistente = superior && superior.querySelector("h6");
    const botonVolver = superior?.querySelector(".volver-button") || null;
    const perfilExistente = document.getElementById("perfilBienvenida");
    const titulo = tituloExistente?.textContent.trim() || titulos[pagina] || "iTicket";

    if (perfilExistente) perfilExistente.remove();
    if (superior) superior.remove();

    const mainShell = document.createElement("div");
    mainShell.className = "main-shell";

    const topbar = document.createElement("header");
    topbar.className = "topbar-global";
    topbar.id = "topbarGlobal";

    const topbarLeft = document.createElement("div");
    topbarLeft.className = "topbar-left";
    topbarLeft.innerHTML = `
        <button class="btn-menu-toggle" id="btnMenu" type="button" aria-label="Abrir o cerrar menú">
            <i class="bi bi-layout-sidebar" aria-hidden="true"></i>
        </button>
        <div class="topbar-divider"></div>
        <div class="pagina-actual">
            <i class="bi ${iconos[pagina] || "bi-grid"} pagina-icono" aria-hidden="true"></i>
            <span id="tituloPagina"></span>
        </div>`;
    topbarLeft.querySelector("#tituloPagina").textContent = titulo;
    if (botonVolver) {
        botonVolver.classList.add("volver-global");
        botonVolver.classList.remove("text-dark", "mb-0");
        botonVolver.setAttribute("aria-label", "Volver a la pantalla anterior");
        topbarLeft.querySelector(".topbar-divider").insertAdjacentElement("afterend", botonVolver);
    }

    const topbarRight = document.createElement("div");
    topbarRight.className = "topbar-right";

    if (document.getElementById("notificacionesOverlay")) {
        const btnNotificaciones = document.createElement("button");
        btnNotificaciones.className = "btn-topbar btn-notificaciones-top";
        btnNotificaciones.id = "btnNotificaciones";
        btnNotificaciones.type = "button";
        btnNotificaciones.setAttribute("aria-label", "Notificaciones");
        btnNotificaciones.innerHTML = '<i class="bi bi-bell" aria-hidden="true"></i><span class="notificacion-dot" id="notificacionDot"></span>';
        // El punto azul solo representa notificaciones realmente no leídas
        const tieneNoLeidas = Boolean(document.querySelector("#panelNotificaciones .notificacion-item.no-leida"));
        btnNotificaciones.querySelector("#notificacionDot").hidden = !tieneNoLeidas;
        topbarRight.append(btnNotificaciones, crearDivisorTopbar());
    }

    const perfil = crearPerfilPredeterminado();
    topbarRight.appendChild(perfil);

    topbar.append(topbarLeft, topbarRight);

    const contenidoScroll = document.createElement("div");
    contenidoScroll.className = "contenido-scroll";
    contenidoScroll.id = "contenidoScroll";
    while (main.firstChild) contenidoScroll.appendChild(main.firstChild);

    mainShell.append(topbar, contenidoScroll);
    main.appendChild(mainShell);
    main.classList.add("layout-global-listo");
    document.body.classList.add("layout-global-activo");

    inicializarPerfil(perfil);
}

// Pequeño separador reutilizado entre las acciones del topbar
function crearDivisorTopbar() {
    const divisor = document.createElement("div");
    divisor.className = "topbar-divider";
    return divisor;
}

// Aqui se crea la base del saludo
function crearPerfilPredeterminado() {
    const perfil = document.createElement("button");
    perfil.type = "button";
    perfil.className = "perfil-topbar";
    perfil.id = "perfilBienvenida";
    perfil.setAttribute("aria-label", "Abrir perfil de usuario");
    perfil.setAttribute("aria-controls", "perfilPanel");
    perfil.setAttribute("aria-expanded", "false");
    perfil.innerHTML = `
        <span class="perfil-saludo-capsula" aria-hidden="true">
            <span class="perfil-saludo">
                <span>Hola,</span>
                <strong id="perfilPrimerNombre">Usuario</strong>
            </span>
            <img src="img/usuario.png" alt="" class="perfil-saludo-persona">
        </span>
        <span class="perfil-avatar" id="fotoPerfil">
            <span class="foto-letra" id="fotoLetra">U</span>
            <img alt="Foto de perfil" class="foto-img" id="fotoDePerfil" hidden>
        </span>`;
    return perfil;
}

// Lee la sesión, calcula primer nombre/inicial y construye el panel desplegable al presionar la foto de perfil
function inicializarPerfil(perfil) {
    const primerNombrePerfil = perfil.querySelector("#perfilPrimerNombre");
    const fotoLetra = perfil.querySelector("#fotoLetra");
    const foto = perfil.querySelector("#fotoDePerfil");
    const usuario = obtenerDatosPerfil();
    const nombreCompleto = String(usuario?.nombreUsuario || usuario?.nombreCompleto || usuario?.nombre || "Usuario").trim();
    const primerNombre = nombreCompleto.split(/\s+/)[0] || "Usuario";
    const correo = String(usuario?.correo || usuario?.email || "Correo no disponible").trim();
    const departamento = String(usuario?.nombreDepartamento || usuario?.departamento || "Sin departamento asignado").trim();
    const imagenUrl = usuario?.imagenUrl || usuario?.fotoPerfil || usuario?.imagenPerfil || "";
    const inicial = primerNombre.charAt(0).toUpperCase() || "U";

    primerNombrePerfil.textContent = primerNombre;
    fotoLetra.textContent = inicial;
    configurarImagenPerfil(foto, imagenUrl);

    document.getElementById("perfilPanel")?.remove();
    const panel = crearPanelPerfil({ nombreCompleto, correo, departamento, imagenUrl, inicial });
    document.body.appendChild(panel);
    configurarPanelPerfil(perfil, panel);
    mostrarSaludoDeInicio(perfil, primerNombre);
}

function obtenerDatosPerfil() {
    try {
        return JSON.parse(sessionStorage.getItem("usuarioLogueado") || "null") || {};
    } catch (error) {
        console.error("[iTicket] No se pudo leer el perfil:", error);
        return {};
    }
}

// Esta es la logica de la foto de perfil, se agarra la inicial (si no hay foto) y se crea un avatar
function configurarImagenPerfil(imagen, origen, animarEntrada = false) {
    // Si no hay imagen, no se hace nada
    if (!imagen) return;
    const respaldo = imagen.parentElement?.querySelector(".foto-letra, .perfil-panel-letra");

    const cicloCarga = (Number(imagen.dataset.cicloCarga) || 0) + 1;
    imagen.dataset.cicloCarga = String(cicloCarga);
    let cargaFinalizada = false;
    let temporizadorCarga = null;

    // Al preparar una URL nueva se recupera primero la inicial por si no carga la imagen, pero sino si se muestra la imagen
    if (respaldo) respaldo.hidden = false;
    imagen.hidden = true;
    imagen.removeAttribute("src");
    imagen.classList.remove("foto-actualizada");
    if (!origen) return;

    imagen.addEventListener("load", function () {
        if (cargaFinalizada || Number(imagen.dataset.cicloCarga) !== cicloCarga) return;
        cargaFinalizada = true;
        window.clearTimeout(temporizadorCarga);
        if (respaldo) respaldo.hidden = true;
        imagen.hidden = false;
        if (animarEntrada) {
            window.requestAnimationFrame(function () {
                if (Number(imagen.dataset.cicloCarga) !== cicloCarga) return;
                imagen.classList.add("foto-actualizada");
                const limpiarAnimacion = () => imagen.classList.remove("foto-actualizada");
                imagen.addEventListener("animationend", limpiarAnimacion, { once: true });
                window.setTimeout(limpiarAnimacion, 900);
            });
        }
    }, { once: true });
    imagen.addEventListener("error", function () {
        if (cargaFinalizada || Number(imagen.dataset.cicloCarga) !== cicloCarga) return;
        cargaFinalizada = true;
        window.clearTimeout(temporizadorCarga);
        if (respaldo) respaldo.hidden = false;
        imagen.hidden = true;
        imagen.removeAttribute("src");
    }, { once: true });
    imagen.src = origen;
    temporizadorCarga = window.setTimeout(function () {
        if (cargaFinalizada || Number(imagen.dataset.cicloCarga) !== cicloCarga) return;
        cargaFinalizada = true;
        if (respaldo) respaldo.hidden = false;
        imagen.hidden = true;
        imagen.removeAttribute("src");
    }, 10000);
}

// Aqui se genera el panel del perfil, con la foto, nombre, correo, departamento y botones de cambiar foto, modo oscuro y cerrar sesión
function crearPanelPerfil(datos) {
    const panel = document.createElement("aside");
    panel.className = "perfil-panel";
    panel.id = "perfilPanel";
    panel.setAttribute("aria-label", "Información del usuario");
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
        <div class="perfil-panel-cabecera">
            <span class="perfil-panel-avatar">
                <span class="perfil-panel-letra"></span>
                <img alt="Foto de perfil" class="perfil-panel-img" hidden>
            </span>
            <span class="perfil-panel-identidad">
                <strong class="perfil-panel-nombre"></strong>
                <span class="perfil-panel-departamento"></span>
            </span>
        </div>
        <div class="perfil-panel-correo">
            <i class="bi bi-envelope" aria-hidden="true"></i>
            <span></span>
        </div>
        <div class="perfil-panel-separador"></div>
        <button type="button" class="perfil-panel-accion" id="btnCambiarFoto">
            <i class="bi bi-camera" aria-hidden="true"></i>
            <span class="perfil-panel-accion-texto">Cambiar foto</span>
        </button>
        <input type="file" id="inputFotoPerfil" accept="image/jpeg,image/png,image/webp" hidden>
        <p class="perfil-panel-estado" id="estadoFotoPerfil" role="status" aria-live="polite"></p>
        <button type="button" class="perfil-panel-accion" id="btnTemaOscuro" aria-pressed="false">
            <i class="bi bi-moon-stars" aria-hidden="true"></i>
            <span class="perfil-panel-accion-texto">Modo oscuro</span>
            <span class="tema-switch" aria-hidden="true"><span></span></span>
        </button>
        <button type="button" class="perfil-panel-accion perfil-panel-salir" id="btnCerrarSesion">
            <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
            <span>Cerrar sesión</span>
        </button>`;

    panel.querySelector(".perfil-panel-letra").textContent = datos.inicial;
    panel.querySelector(".perfil-panel-nombre").textContent = datos.nombreCompleto;
    panel.querySelector(".perfil-panel-departamento").textContent = datos.departamento;
    panel.querySelector(".perfil-panel-correo span").textContent = datos.correo;
    configurarImagenPerfil(panel.querySelector(".perfil-panel-img"), datos.imagenUrl);
    return panel;
}

// Registra apertura/cierre, cambio de foto, cambio de tema y cierre de sesión
function configurarPanelPerfil(perfil, panel) {
    const botonFoto = panel.querySelector("#btnCambiarFoto");
    const inputFoto = panel.querySelector("#inputFotoPerfil");
    const botonTema = panel.querySelector("#btnTemaOscuro");
    const botonSalir = panel.querySelector("#btnCerrarSesion");
    let temporizadorCierre = null;

    // Abrir/cerrar el panel con click
    function abrirPanel() {
        window.clearTimeout(temporizadorCierre);
        panel.classList.add("abierto");
        panel.setAttribute("aria-hidden", "false");
        perfil.setAttribute("aria-expanded", "true");
    }

    function cerrarPanel() {
        panel.classList.remove("abierto");
        panel.setAttribute("aria-hidden", "true");
        perfil.setAttribute("aria-expanded", "false");
        temporizadorCierre = window.setTimeout(function () {
            panel.scrollTop = 0;
        }, 260);
    }

    perfil.addEventListener("click", function (evento) {
        evento.stopPropagation();
        if (panel.classList.contains("abierto")) cerrarPanel();
        else abrirPanel();
    });
    panel.addEventListener("click", function (evento) { evento.stopPropagation(); });
    document.addEventListener("click", cerrarPanel);
    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") cerrarPanel();
    });

    // El selector siempre permanece disponible. Si la API o Cloudinary no funcionan por alguna razon, se muestra el error y se mantiene la imagen
    botonFoto.addEventListener("click", function () {
        inputFoto.click();
    });
    inputFoto.addEventListener("change", async function () {
        const archivo = inputFoto.files?.[0];
        inputFoto.value = "";
        if (!archivo) return;
        await cambiarFotoPerfil(archivo, perfil, panel, botonFoto);
    });

    actualizarBotonTema(botonTema);
    botonTema.addEventListener("click", async function () {
        if (botonTema.disabled) return;
        const activarOscuro = !document.documentElement.classList.contains("tema-oscuro");
        botonTema.disabled = true;
        try {
            await cambiarTemaConAnimacion(activarOscuro, botonTema, perfil);
        } finally {
            botonTema.disabled = false;
        }
    });

    botonSalir.addEventListener("click", function () {
        sessionStorage.clear();
        localStorage.removeItem("rolUsuario");
        localStorage.removeItem("menuColapsado");
        window.location.href = "index.html";
    });
}

/*
 * Proceso de actualización de la foto de perfil:
 * 1. Comprueba formato y límite de 5 MB en el navegador.
 * 2. usuariosService.js envía el archivo como FormData a la API.
 * 3. La API sube el archivo a Cloudinary y devuelve imagenUrl.
 * 4. Se actualizan la sesión, el avatar del topbar y el avatar del panel.
 * El navegador nunca guarda la imagen binaria en sessionStorage: solo la URL.
 */
async function cambiarFotoPerfil(archivo, perfil, panel, boton) {
    const formatosPermitidos = new Set(["image/jpeg", "image/png", "image/webp"]);
    const limiteBytes = 5 * 1024 * 1024;
    if (!formatosPermitidos.has(archivo.type)) {
        mostrarEstadoFoto(panel, "Usa una imagen JPG, PNG o WEBP.", "error");
        return;
    }
    if (archivo.size > limiteBytes) {
        mostrarEstadoFoto(panel, "La imagen no puede superar 5 MB.", "error");
        return;
    }

    const usuario = obtenerDatosPerfil();
    if (!usuario.idUsuario) {
        mostrarEstadoFoto(panel, "Inicia sesión para guardar una foto.", "error");
        return;
    }

    boton.disabled = true;
    boton.classList.add("cargando");
    boton.querySelector(".perfil-panel-accion-texto").textContent = "Subiendo imagen…";
    mostrarEstadoFoto(panel, "La imagen se está guardando de forma segura.", "cargando");

    try {
        const { actualizarFotoPerfil } = await import("../services/usuariosService.js?v=2");
        const actualizado = await actualizarFotoPerfil(usuario.idUsuario, archivo);
        const imagenUrl = actualizado?.imagenUrl;
        if (!imagenUrl) throw new Error("La API no devolvió la URL de la imagen.");

        // La sesión se sincroniza para que el cambio sobreviva a la navegación
        // entre interfaces sin tener que iniciar sesión nuevamente.
        sessionStorage.setItem("usuarioLogueado", JSON.stringify({ ...usuario, ...actualizado, imagenUrl }));
        configurarImagenPerfil(perfil.querySelector("#fotoDePerfil"), imagenUrl, true);
        configurarImagenPerfil(panel.querySelector(".perfil-panel-img"), imagenUrl, true);
        mostrarEstadoFoto(panel, "Foto actualizada correctamente.", "exito");
    } catch (error) {
        console.error("[iTicket] No se pudo actualizar la foto:", error);
        const mensaje = error instanceof TypeError && /fetch/i.test(error.message)
            ? "No se pudo conectar con la API de imágenes. Verifica que el servidor esté iniciado en el puerto 8080."
            : (error.message || "No se pudo actualizar la foto.");
        mostrarEstadoFoto(panel, mensaje, "error");
    } finally {
        boton.disabled = false;
        boton.classList.remove("cargando");
        boton.querySelector(".perfil-panel-accion-texto").textContent = "Cambiar foto";
    }
}

// Informa carga, éxito o error en un texto
function mostrarEstadoFoto(panel, mensaje, tipo) {
    const estado = panel.querySelector("#estadoFotoPerfil");
    estado.textContent = mensaje;
    estado.dataset.tipo = tipo;
}

/* El tema oscuro como tal no cambia de hojas de css para cambiarla, sino que cambia las clases en el html para sobreescribir los estilos
y que asi funcione bien */
function aplicarTemaGuardado() {
    const oscuro = localStorage.getItem("iticket_tema") === "oscuro";
    document.documentElement.classList.toggle("tema-oscuro", oscuro);
}

function aplicarEstadoTema(activarOscuro, botonTema) {
    document.documentElement.classList.toggle("tema-oscuro", activarOscuro);
    localStorage.setItem("iticket_tema", activarOscuro ? "oscuro" : "claro");
    actualizarBotonTema(botonTema);
    document.dispatchEvent(new CustomEvent("iticket:tema-cambiado", {
        detail: { oscuro: activarOscuro }
    }));
}

async function cambiarTemaConAnimacion(activarOscuro, botonTema, perfil) {
    const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducirMovimiento) {
        aplicarEstadoTema(activarOscuro, botonTema);
        return;
    }

    const rectangulo = perfil.getBoundingClientRect();
    const origenX = rectangulo.left + rectangulo.width / 2;
    const origenY = rectangulo.top + rectangulo.height / 2;
    const radioFinal = Math.hypot(
        Math.max(origenX, window.innerWidth - origenX),
        Math.max(origenY, window.innerHeight - origenY)
    );
    const raiz = document.documentElement;
    raiz.style.setProperty("--tema-origen-x", `${origenX}px`);
    raiz.style.setProperty("--tema-origen-y", `${origenY}px`);
    raiz.style.setProperty("--tema-radio-final", `${radioFinal}px`);
    raiz.classList.add("tema-en-transicion");

    try {
        if (typeof document.startViewTransition === "function") {
            const transicion = document.startViewTransition(function () {
                aplicarEstadoTema(activarOscuro, botonTema);
            });
            await transicion.finished;
        } else {
            await cambiarTemaConCapa(activarOscuro, botonTema, origenX, origenY, radioFinal);
        }
    } finally {
        raiz.classList.remove("tema-en-transicion");
        raiz.style.removeProperty("--tema-origen-x");
        raiz.style.removeProperty("--tema-origen-y");
        raiz.style.removeProperty("--tema-radio-final");
    }
}

async function cambiarTemaConCapa(activarOscuro, botonTema, origenX, origenY, radioFinal) {
    const capa = document.createElement("span");
    capa.className = "tema-transicion-capa";
    capa.style.left = `${origenX}px`;
    capa.style.top = `${origenY}px`;
    // Color de fondo al cambiar el modo oscuro o claro
    capa.style.background = activarOscuro ? "#101725" : "#f3f4f5";
    document.body.appendChild(capa);

    const escalaFinal = radioFinal / 24;
    const expansion = capa.animate([
        { transform: "translate(-50%, -50%) scale(0)" },
        { transform: `translate(-50%, -50%) scale(${escalaFinal})` }
    ], { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });
    await expansion.finished;
    aplicarEstadoTema(activarOscuro, botonTema);
    const salida = capa.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 190,
        easing: "ease-out",
        fill: "forwards"
    });
    await salida.finished;
    capa.remove();
}

function actualizarBotonTema(boton) {
    if (!boton) return;
    const oscuro = document.documentElement.classList.contains("tema-oscuro");
    boton.setAttribute("aria-pressed", String(oscuro));
    boton.querySelector("i").className = `bi ${oscuro ? "bi-sun" : "bi-moon-stars"}`;
    boton.querySelector(".perfil-panel-accion-texto").textContent = oscuro ? "Modo claro" : "Modo oscuro";
}

// Reproduce la animacion del saludo cada vez que se abre un dashboard
function mostrarSaludoDeInicio(perfil, primerNombre) {
    const paginaActual = (window.location.pathname.split("/").pop() || "").toLowerCase();
    const esDashboard = ["dashboardadmin.html", "dashboardtecnicos.html", "dashboardusuarios.html"].includes(paginaActual);
    if (!esDashboard) return;

    sessionStorage.removeItem("saludoPerfilPendiente");
    const capsulaSaludo = perfil.querySelector(".perfil-saludo-capsula");
    const textoSaludo = perfil.querySelector(".perfil-saludo");
    const accionesTopbar = perfil.closest(".topbar-right");
    let saludoConcluido = false;
    let temporizadorSeguridadSaludo = null;

    function fijarEstadoFinalSaludo() {
        if (saludoConcluido) return;
        saludoConcluido = true;
        window.clearTimeout(temporizadorSeguridadSaludo);
        perfil.classList.remove("abrir", "saludo-finalizando", "avatar-apareciendo");
        accionesTopbar?.classList.remove("saludo-activo");
        perfil.style.removeProperty("--saludo-ancho");
        accionesTopbar?.style.removeProperty("--saludo-desplazamiento");
        document.removeEventListener("visibilitychange", cerrarAlVolver);
        perfil.removeEventListener("click", fijarEstadoFinalSaludo);
    }

    function cerrarAlVolver() {
        if (!document.hidden) fijarEstadoFinalSaludo();
    }

    document.addEventListener("visibilitychange", cerrarAlVolver);
    perfil.addEventListener("click", fijarEstadoFinalSaludo);
    temporizadorSeguridadSaludo = window.setTimeout(fijarEstadoFinalSaludo, 4700);
    perfil.querySelector("#perfilPrimerNombre").textContent = primerNombre;
    const tonoBase = Math.floor(Math.random() * 31) + 210;
    const azulInicial = `hsl(${tonoBase}, 85%, 35%)`;
    const azulFinal = `hsl(${tonoBase + 15}, 85%, 20%)`;
    perfil.style.setProperty("--saludo-azul-1", azulInicial);
    perfil.style.setProperty("--saludo-azul-2", azulFinal);
    const panelPerfil = document.getElementById("perfilPanel");
    panelPerfil?.style.setProperty("--saludo-azul-1", azulInicial);
    panelPerfil?.style.setProperty("--saludo-azul-2", azulFinal);

    window.setTimeout(function () {
        if (saludoConcluido) return;
        const etiquetaHola = textoSaludo?.querySelector("span");
        const etiquetaNombre = textoSaludo?.querySelector("strong");
        const anchoTexto = (etiquetaHola?.scrollWidth || 32)
            + (etiquetaNombre?.scrollWidth || 58)
            + 4;
        const anchoMaximo = Math.max(150, window.innerWidth - 86);
        const anchoReal = Math.min(anchoMaximo, anchoTexto + 70);
        perfil.style.setProperty("--saludo-ancho", `${anchoReal}px`);
        accionesTopbar?.style.setProperty("--saludo-desplazamiento", `${-(anchoReal - 50)}px`);

        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
                if (saludoConcluido) return;
                accionesTopbar?.classList.add("saludo-activo");
                perfil.classList.add("abrir");
            });
        });

        window.setTimeout(function () {
            if (saludoConcluido) return;
            perfil.classList.add("saludo-finalizando");
            window.setTimeout(function () {
                if (saludoConcluido) return;
                perfil.classList.remove("abrir");
                accionesTopbar?.classList.remove("saludo-activo");
                let saludoFinalizado = false;
                let respaldoCierre = null;
                const avatar = perfil.querySelector(".perfil-avatar");

                function limpiarEntradaAvatar() {
                    fijarEstadoFinalSaludo();
                }

                function completarCierreSaludo() {
                    if (saludoFinalizado || saludoConcluido) return;
                    saludoFinalizado = true;
                    window.clearTimeout(respaldoCierre);
                    perfil.classList.remove("saludo-finalizando");
                    avatar?.addEventListener("animationend", limpiarEntradaAvatar, { once: true });
                    perfil.classList.add("avatar-apareciendo");
                    window.setTimeout(limpiarEntradaAvatar, 850);
                    perfil.style.removeProperty("--saludo-ancho");
                    accionesTopbar?.style.removeProperty("--saludo-desplazamiento");
                    capsulaSaludo?.removeEventListener("transitionend", alTerminarRetraccion);
                }

                function alTerminarRetraccion(evento) {
                    if (evento.propertyName === "width") completarCierreSaludo();
                }

                capsulaSaludo?.addEventListener("transitionend", alTerminarRetraccion);
                respaldoCierre = window.setTimeout(completarCierreSaludo, 900);
                if (!capsulaSaludo) completarCierreSaludo();
            }, 320);
        }, 2300);
    }, 100);
}

function inicializarNotificacionesGlobales() {
    const boton = document.getElementById("btnNotificaciones");
    const panel = document.getElementById("panelNotificaciones");
    const fondo = document.getElementById("notificacionesOverlay");
    if (!boton || !panel || !fondo || boton.dataset.notificacionesListas === "true") return;

    boton.dataset.notificacionesListas = "true";
    boton.addEventListener("click", function () {
        fondo.classList.add("activo");
        panel.classList.add("activo");
        document.getElementById("menuLateral")?.classList.remove("mobile-abierto");
        document.getElementById("overlay")?.classList.remove("activo");
    });
    fondo.addEventListener("click", function (evento) {
        if (evento.target !== fondo) return;
        fondo.classList.remove("activo");
        panel.classList.remove("activo");
    });
}

function prepararInteraccionTablas() {
    document.addEventListener("click", function (evento) {
        const fila = evento.target.closest(".table-custom tbody tr.fila-expandible");

        if (!fila || evento.target.closest("button, a, input, select, textarea, label")) {
            document.querySelectorAll(".table-custom tbody tr.fila-expandida").forEach(function (otraFila) {
                otraFila.classList.remove("fila-expandida");
                otraFila.setAttribute("aria-expanded", "false");
            });
            return;
        }
        if (fila.querySelector("td[colspan]")) return;

        const estabaExpandida = fila.classList.contains("fila-expandida");
        fila.closest("tbody").querySelectorAll("tr.fila-expandida").forEach(function (otraFila) {
            otraFila.classList.remove("fila-expandida");
            otraFila.setAttribute("aria-expanded", "false");
        });
        fila.classList.toggle("fila-expandida", !estabaExpandida);
        fila.setAttribute("aria-expanded", estabaExpandida ? "false" : "true");
    });
}

const FILAS_POR_PAGINA = 8;

function inicializarPaginacionAutomatica() {
    prepararTablasSinPaginacion(document);

    const observadorDocumento = new MutationObserver((cambios) => {
        const hayTablasNuevas = cambios.some((cambio) =>
            [...cambio.addedNodes].some((nodo) =>
                nodo.nodeType === Node.ELEMENT_NODE
                && (nodo.matches?.("table") || nodo.querySelector?.("table"))
            )
        );
        if (hayTablasNuevas) prepararTablasSinPaginacion(document);
    });
    observadorDocumento.observe(document.body, { childList: true, subtree: true });
}

function prepararTablasSinPaginacion(raiz) {
    raiz.querySelectorAll("table:not([data-paginacion-lista]):not([data-sin-paginacion])").forEach((tabla) => {
        tabla.dataset.paginacionLista = "true";

        const alcance = tabla.closest(".card, .card-tabla, .modal-content, .tab-pane, section") || tabla.parentElement;
        if (alcance?.querySelector(".pagination, [data-paginacion-existente]")) {
            tabla.dataset.paginacion = "existente";
            return;
        }

        crearPaginacionParaTabla(tabla);
    });
}

function crearPaginacionParaTabla(tabla) {
    const pie = document.createElement("div");
    pie.className = "paginacion-tabla-auto";
    pie.innerHTML = `
        <span class="paginacion-tabla-resumen" aria-live="polite"></span>
        <nav aria-label="Páginas de la tabla">
            <ul class="pagination pagination-sm mb-0"></ul>
        </nav>`;

    const envoltorioTabla = tabla.closest(".table-responsive") || tabla;
    envoltorioTabla.insertAdjacentElement("afterend", pie);

    const estado = { pagina: 1, filasPorPagina: FILAS_POR_PAGINA };
    const actualizar = () => actualizarPaginacionTabla(tabla, pie, estado);
    tabla.__actualizarPaginacion = actualizar;

    const observadorFilas = new MutationObserver(() => {
        window.clearTimeout(estado.temporizador);
        estado.temporizador = window.setTimeout(actualizar, 0);
    });
    observadorFilas.observe(tabla.tBodies[0] || tabla, { childList: true, subtree: true });
    actualizar();
}

function actualizarPaginacionTabla(tabla, pie, estado) {
    const filas = [...(tabla.tBodies[0]?.rows || [])];
    const esMensajeVacio = filas.length === 1 && filas[0].querySelector("td[colspan]");
    const totalFilas = esMensajeVacio ? 0 : filas.length;
    const totalPaginas = Math.max(1, Math.ceil(totalFilas / estado.filasPorPagina));
    estado.pagina = Math.min(estado.pagina, totalPaginas);

    filas.forEach((fila, indice) => {
        fila.hidden = totalFilas > 0
            && (indice < (estado.pagina - 1) * estado.filasPorPagina
                || indice >= estado.pagina * estado.filasPorPagina);
    });

    pie.hidden = totalFilas === 0;
    if (!totalFilas) return;

    const desde = (estado.pagina - 1) * estado.filasPorPagina + 1;
    const hasta = Math.min(estado.pagina * estado.filasPorPagina, totalFilas);
    pie.querySelector(".paginacion-tabla-resumen").textContent = `Mostrando ${desde}-${hasta} de ${totalFilas}`;
    renderizarControlesPaginacion(pie.querySelector(".pagination"), estado, totalPaginas, () => {
        actualizarPaginacionTabla(tabla, pie, estado);
        tabla.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
}

function renderizarControlesPaginacion(lista, estado, totalPaginas, alCambiar) {
    lista.innerHTML = "";
    const paginas = obtenerPaginasVisibles(estado.pagina, totalPaginas);
    agregarBotonPaginacion(lista, "bi-chevron-left", estado.pagina - 1, estado.pagina === 1, false, estado, alCambiar);

    let anterior = 0;
    paginas.forEach((pagina) => {
        if (anterior && pagina - anterior > 1) agregarSeparadorPaginacion(lista);
        agregarBotonPaginacion(lista, String(pagina), pagina, false, pagina === estado.pagina, estado, alCambiar);
        anterior = pagina;
    });

    agregarBotonPaginacion(lista, "bi-chevron-right", estado.pagina + 1, estado.pagina === totalPaginas, false, estado, alCambiar);
}

function obtenerPaginasVisibles(actual, total) {
    if (total <= 5) return Array.from({ length: total }, (_, indice) => indice + 1);
    const paginas = new Set([1, total, actual - 1, actual, actual + 1]);
    return [...paginas].filter((pagina) => pagina >= 1 && pagina <= total).sort((a, b) => a - b);
}

function agregarBotonPaginacion(lista, contenido, pagina, deshabilitado, activo, estado, alCambiar) {
    const elemento = document.createElement("li");
    elemento.className = `page-item${deshabilitado ? " disabled" : ""}${activo ? " active" : ""}`;
    const esIcono = contenido.startsWith("bi-");
    elemento.innerHTML = `<button type="button" class="page-link" ${deshabilitado ? "disabled" : ""}
        aria-label="${esIcono ? (contenido.includes("left") ? "Página anterior" : "Página siguiente") : `Página ${pagina}`}">
        ${esIcono ? `<i class="bi ${contenido}" aria-hidden="true"></i>` : contenido}
    </button>`;
    elemento.querySelector("button").addEventListener("click", () => {
        if (deshabilitado || activo) return;
        estado.pagina = pagina;
        alCambiar();
    });
    lista.appendChild(elemento);
}

// Inserta puntos suspensivos cuando hay páginas ocultas entre dos números 
function agregarSeparadorPaginacion(lista) {
    const elemento = document.createElement("li");
    elemento.className = "page-item disabled paginacion-separador";
    elemento.innerHTML = '<span class="page-link" aria-hidden="true">…</span>';
    lista.appendChild(elemento);
}

// Registra una sola extensión de Chart.js que adapta todas las gráficas al tema.
function configurarEstiloGlobalGraficas() {
    if (!window.Chart || Chart.registry.plugins.get("iticketTemaGraficas")) return;

    Chart.defaults.font.family = "Inter, system-ui, -apple-system, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.animation.duration = 760;
    Chart.defaults.animation.easing = "easeOutQuart";
    Chart.defaults.interaction.mode = "nearest";
    Chart.defaults.interaction.intersect = false;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    Chart.defaults.plugins.tooltip.displayColors = true;

    Chart.register({
        id: "iticketTemaGraficas",
        beforeUpdate(grafica) {
            const oscuro = document.documentElement.classList.contains("tema-oscuro");
            const texto = oscuro ? "#b8c3d3" : "#687386";
            const cuadricula = oscuro ? "rgba(158, 172, 193, 0.14)" : "rgba(45, 60, 85, 0.09)";
            const superficie = oscuro ? "#182235" : "#ffffff";

            grafica.options.color = texto;
            if (grafica.options.plugins?.legend?.labels) grafica.options.plugins.legend.labels.color = texto;
            if (grafica.options.plugins?.legend?.labels) {
                grafica.options.plugins.legend.labels.usePointStyle = true;
                grafica.options.plugins.legend.labels.pointStyle = "circle";
                grafica.options.plugins.legend.labels.padding = 16;
            }
            Object.values(grafica.options.scales || {}).forEach((escala) => {
                if (escala.ticks) {
                    escala.ticks.color = texto;
                    escala.ticks.padding = 8;
                }
                if (escala.grid) {
                    escala.grid.color = cuadricula;
                    escala.grid.drawBorder = false;
                }
            });

            if (["doughnut", "pie", "polarArea"].includes(grafica.config.type)) {
                grafica.data.datasets.forEach((serie) => {
                    serie.borderColor = superficie;
                    serie.borderWidth = 3;
                    serie.hoverOffset = 9;
                });
            }

            if (grafica.config.type === "bar") {
                grafica.data.datasets.forEach((serie) => {
                    serie.borderRadius = 8;
                    serie.borderSkipped = false;
                    serie.maxBarThickness = serie.maxBarThickness || 46;
                });
            }
            if (grafica.config.type === "line") {
                grafica.data.datasets.forEach((serie) => {
                    serie.tension = 0.38;
                    serie.borderWidth = Math.max(Number(serie.borderWidth) || 0, 3);
                    serie.pointRadius = 3;
                    serie.pointHoverRadius = 6;
                });
            }
        }
    });

    document.addEventListener("iticket:tema-cambiado", actualizarGraficasExistentes);
}

function actualizarGraficasExistentes() {
    if (!window.Chart?.instances) return;
    Object.values(Chart.instances).forEach((grafica) => grafica.update("none"));
}

function prepararNavegacionSuave() {
    document.addEventListener("click", (evento) => {
        const enlace = evento.target.closest("a[href]");
        if (!enlace || evento.defaultPrevented || evento.button !== 0
            || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey
            || enlace.target || enlace.hasAttribute("download")) return;

        const href = enlace.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

        const destino = new URL(enlace.href, window.location.href);
        if (destino.origin !== window.location.origin) return;
        if (destino.pathname === window.location.pathname && destino.search === window.location.search) return;

        evento.preventDefault();
        // Desvanece brevemente la vista actual antes de solicitar la siguiente
        document.documentElement.classList.add("iticket-navegando");
        window.setTimeout(() => window.location.assign(destino.href), 170);
    });
}

function cargarMenuCompartido() {
    const contenedor = document.getElementById("contenedorMenuLateral");
    if (!contenedor) return;

    const htmlCacheado = window.__menuCacheHTML || sessionStorage.getItem(MENU_CACHE_KEY);
    if (htmlCacheado) {
        contenedor.innerHTML = htmlCacheado;
        inicializarMenu();
        fetch("components/menu.html")
            .then(function (respuesta) { return respuesta.ok ? respuesta.text() : null; })
            .then(function (htmlNuevo) { if (htmlNuevo) sessionStorage.setItem(MENU_CACHE_KEY, htmlNuevo); })
            .catch(function () { });
        return;
    }

    fetch("components/menu.html")
        .then(function (respuesta) { return respuesta.ok ? respuesta.text() : Promise.reject(); })
        .then(function (htmlNuevo) {
            sessionStorage.setItem(MENU_CACHE_KEY, htmlNuevo);
            window.__menuCacheHTML = htmlNuevo;
            contenedor.innerHTML = htmlNuevo;
            inicializarMenu();
        })
        .catch(function () { console.error("[iTicket] No se pudo cargar el menú lateral."); });
}

// Aplica rol, página activa y estado colapsado
function inicializarMenu() {
    const menu = document.getElementById("menuLateral");
    const btnMenu = document.getElementById("btnMenu");
    const overlay = document.getElementById("overlay");
    const ticketsMenu = document.getElementById("ticketsMenu");
    const equiposMenu = document.getElementById("equiposMenu");
    if (!menu || !btnMenu) return;

    const rolActivo = (localStorage.getItem("rolUsuario") || "admin").toLowerCase().trim();
    ajustarEnlaceInicio(menu, rolActivo);
    aplicarVisibilidadPorRol(rolActivo);
    marcarOpcionActiva(menu, window.location.pathname.split("/").pop() || "dashboardAdmin.html");

    if (window.innerWidth > BREAKPOINT_MENU && localStorage.getItem("menuColapsado") === "true") {
        document.body.classList.add("menu-colapsado");
    }

    let temporizadorAnimacion = null;
    let cuadroResize = null;

    function marcarAnimacionMenu() {
        document.body.classList.add("menu-en-transicion");
        window.clearTimeout(temporizadorAnimacion);

        let finalizada = false;
        function finalizar() {
            if (finalizada) return;
            finalizada = true;
            document.body.classList.remove("menu-en-transicion");
            window.clearTimeout(temporizadorAnimacion);
            document.querySelector(".main.layout-global-listo")?.removeEventListener("transitionend", alTerminar);
            // Chart.js recalcula una sola vez, ya con el ancho definitivo
            window.requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
        }
        function alTerminar(evento) {
            if (evento.propertyName === "margin-left") finalizar();
        }

        document.querySelector(".main.layout-global-listo")?.addEventListener("transitionend", alTerminar);
        // Respaldo para navegadores que cancelan transitionend al pulsar rápido
        temporizadorAnimacion = window.setTimeout(finalizar, 760);
    }

    btnMenu.addEventListener("click", function () {
        marcarAnimacionMenu();
        if (window.innerWidth > BREAKPOINT_MENU) {
            window.requestAnimationFrame(function () {
                document.body.classList.toggle("menu-colapsado");
                const colapsado = document.body.classList.contains("menu-colapsado");
                localStorage.setItem("menuColapsado", String(colapsado));
                cerrarSubmenus(ticketsMenu, equiposMenu);
            });
        } else {
            const abierto = menu.classList.toggle("mobile-abierto");
            overlay?.classList.toggle("activo", abierto);
        }
    });

    overlay?.addEventListener("click", function () {
        menu.classList.remove("mobile-abierto");
        overlay.classList.remove("activo");
    });

    configurarSubmenu(document.getElementById("btnTickets"), ticketsMenu, equiposMenu);
    configurarSubmenu(document.getElementById("btnEquipos"), equiposMenu, ticketsMenu);

    menu.querySelectorAll(".nav-link:not(#btnTickets):not(#btnEquipos), .submenu a").forEach(function (enlace) {
        enlace.addEventListener("click", function () {
            if (window.innerWidth <= BREAKPOINT_MENU) {
                menu.classList.remove("mobile-abierto");
                overlay?.classList.remove("activo");
            }
        });
    });

    window.addEventListener("resize", function () {
        if (cuadroResize) return;
        cuadroResize = window.requestAnimationFrame(function () {
            cuadroResize = null;
            if (window.innerWidth > BREAKPOINT_MENU) {
                menu.classList.remove("mobile-abierto");
                overlay?.classList.remove("activo");
                document.body.classList.toggle("menu-colapsado", localStorage.getItem("menuColapsado") === "true");
            } else {
                document.body.classList.remove("menu-colapsado");
            }
        });
    });

    document.dispatchEvent(new CustomEvent("iticket:layout-ready"));
}

function configurarSubmenu(boton, submenuActual, submenuOtro) {
    if (!boton || !submenuActual) return;
    boton.addEventListener("click", function (evento) {
        evento.preventDefault();
        if (window.innerWidth > BREAKPOINT_MENU && document.body.classList.contains("menu-colapsado")) {
            document.body.classList.remove("menu-colapsado");
            localStorage.setItem("menuColapsado", "false");
        }
        submenuOtro?.classList.remove("abrir");
        submenuActual.classList.toggle("abrir");
    });
}

function cerrarSubmenus() {
    Array.from(arguments).forEach(function (submenu) { submenu?.classList.remove("abrir"); });
}

function ajustarEnlaceInicio(menu, rol) {
    const inicio = menu.querySelector(".menu-list > .menu-opcion:first-child a");
    if (!inicio) return;
    inicio.href = rol === "tecnico" ? "dashboardTecnicos.html" : rol === "usuario" ? "dashboardUsuarios.html" : "dashboardAdmin.html";
}

function marcarOpcionActiva(menu, paginaActual) {
    menu.querySelectorAll(".activo").forEach(function (elemento) { elemento.classList.remove("activo"); });
    menu.querySelectorAll("a[href]").forEach(function (enlace) {
        const destino = (enlace.getAttribute("href") || "").split("/").pop().split(/[?#]/)[0];
        if (!destino || destino !== paginaActual) return;
        const opcion = enlace.closest(".menu-opcion");
        opcion?.classList.add("activo");
        const submenu = enlace.closest(".submenu");
        if (submenu) {
            enlace.classList.add("activo");
            submenu.closest(".menu-opcion")?.classList.add("abrir");
        }
    });
}

function aplicarVisibilidadPorRol(rolActual) {
    document.querySelectorAll("[data-roles]").forEach(function (elemento) {
        const permitidos = elemento.dataset.roles.split(",").map(function (rol) { return rol.trim().toLowerCase(); });
        elemento.classList.toggle("d-none", !permitidos.includes(rolActual));
    });
}

window.cambiarRolSimulado = function (nuevoRol) {
    localStorage.setItem("rolUsuario", nuevoRol);
    window.location.reload();
};

window.cambiarUsuarioSimulado = function (idUsuario, nombre, correo) {
    sessionStorage.setItem("usuarioLogueado", JSON.stringify({ idUsuario, nombre, correo }));
};
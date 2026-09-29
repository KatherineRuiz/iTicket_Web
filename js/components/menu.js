/* Aqui se cargan los componentes del menú */
const MENU_CACHE_KEY = "iticket_menu_v8";
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
    verificarSesionActiva();
    inicializarNotificacionesGlobales();
    prepararInteraccionTablas();
    inicializarPaginacionAutomatica();
    inicializarSelectsPersonalizados();
    inicializarFechasPersonalizadas();
    configurarEstiloGlobalGraficas();
    prepararNavegacionSuave();
    cargarMenuCompartido();
    finalizarPreparacionVisual();
});

/* Revalida la sesion contra el servidor (GET /auth/me), sin bloquear el resto
   de la pagina -- que ya se pinta al instante con lo que hay en sessionStorage.
   Si el servidor dice que la sesion no es valida (401), apiFetch mismo limpia
   todo y manda al login; aqui no hace falta repetir esa logica. */
async function verificarSesionActiva() {
    try {
        const { esPaginaPublica } = await import("../services/apiConfig.js");
        if (esPaginaPublica()) return;

        const { obtenerSesion } = await import("../services/authService.js");
        const sesionReal = await obtenerSesion();

        // El rol real siempre viene del JWT firmado en el servidor, nunca de
        // lo que haya en sessionStorage. Si alguien lo manipulo a mano desde
        // la consola del navegador, aqui se corrige y se recarga el menu.
        const usuarioLocal = JSON.parse(sessionStorage.getItem("usuarioLogueado") || "null");
        if (usuarioLocal && usuarioLocal.nombreRol !== sesionReal.rol) {
            sessionStorage.setItem("usuarioLogueado", JSON.stringify({ ...usuarioLocal, nombreRol: sesionReal.rol }));
            window.location.reload();
        }
    } catch (error) {
        console.warn("[iTicket] No se pudo verificar la sesion con el servidor:", error.message);
    }
}

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
        <button type="button" class="perfil-panel-accion" id="btnCambiarClave" aria-controls="formCambioClave">
            <i class="bi bi-key" aria-hidden="true"></i>
            <span class="perfil-panel-accion-texto">Cambiar contraseña</span>
        </button>
        <form class="perfil-panel-form-clave" id="formCambioClave" hidden novalidate>
            <input type="password" id="txtClaveActual" placeholder="Contraseña actual" aria-label="Contraseña actual" autocomplete="current-password">
            <input type="password" id="txtClaveNueva" placeholder="Nueva contraseña (mín. 8)" aria-label="Nueva contraseña" autocomplete="new-password">
            <input type="password" id="txtClaveConfirmar" placeholder="Confirmar nueva contraseña" aria-label="Confirmar nueva contraseña" autocomplete="new-password">
            <div class="perfil-panel-form-acciones">
                <button type="button" class="perfil-panel-form-cancelar" id="btnCancelarClave">Cancelar</button>
                <button type="submit" class="perfil-panel-form-guardar" id="btnGuardarClave">Guardar</button>
            </div>
        </form>
        <p class="perfil-panel-estado" id="estadoClave" role="status" aria-live="polite"></p>
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

    botonSalir.addEventListener("click", async function () {
    botonSalir.disabled = true;

    try {
        const { cerrarSesion } = await import("../services/authService.js");
        await cerrarSesion();
    } catch (error) {
        // Si la API no responde (sin conexion, sesion ya vencida, etc.), igual
        // cerramos la sesion local -- no tiene sentido dejar al usuario atascado.
        console.warn("[iTicket] No se pudo avisar al servidor del cierre de sesion:", error.message);
    }

    const { limpiarSesionLocal } = await import("../services/apiConfig.js");
    limpiarSesionLocal();
    window.location.href = "index.html";
});

    configurarCambioClave(perfil, panel);
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
        const { actualizarFotoPerfil } = await import("../services/usuariosService.js");
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
    mostrarEstadoPanel(panel.querySelector("#estadoFotoPerfil"), mensaje, tipo);
}

function mostrarEstadoPanel(estado, mensaje, tipo) {
    estado.textContent = mensaje;
    estado.dataset.tipo = tipo;
}

// No hay columna en la BD para saber si es el primer inicio de sesión, así que se
// recuerda por usuario en este navegador: el aviso sale hasta que cambie su contraseña aquí
function claveCambioPendiente(idUsuario) {
    if (!idUsuario) return false;
    try {
        return localStorage.getItem(`iticket_clave_cambiada_${idUsuario}`) !== "true";
    } catch (error) {
        return false;
    }
}

function marcarClaveCambiada(idUsuario) {
    try {
        localStorage.setItem(`iticket_clave_cambiada_${idUsuario}`, "true");
    } catch (error) {
        console.warn("[iTicket] No se pudo recordar el cambio de contraseña:", error);
    }
}

function configurarCambioClave(perfil, panel) {
    const boton = panel.querySelector("#btnCambiarClave");
    const form = panel.querySelector("#formCambioClave");
    const estado = panel.querySelector("#estadoClave");
    const btnGuardar = panel.querySelector("#btnGuardarClave");
    const idUsuario = obtenerDatosPerfil().idUsuario;

    function actualizarAviso() {
        const pendiente = claveCambioPendiente(idUsuario);
        boton.classList.toggle("clave-pendiente", pendiente);
        boton.title = pendiente ? "Aún usas la contraseña que te asignaron" : "";
        perfil.classList.toggle("clave-pendiente", pendiente);
    }

    function cerrarFormulario() {
        form.hidden = true;
        form.reset();
        boton.setAttribute("aria-expanded", "false");
    }

    actualizarAviso();

    boton.addEventListener("click", function () {
        const abrir = form.hidden;
        mostrarEstadoPanel(estado, "", "");
        if (!abrir) {
            cerrarFormulario();
            return;
        }
        form.hidden = false;
        boton.setAttribute("aria-expanded", "true");
        form.querySelector("#txtClaveActual").focus();
    });
    panel.querySelector("#btnCancelarClave").addEventListener("click", cerrarFormulario);

    form.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        const actual = form.querySelector("#txtClaveActual").value;
        const nueva = form.querySelector("#txtClaveNueva").value;
        const confirmar = form.querySelector("#txtClaveConfirmar").value;

        let error = null;
        if (!idUsuario) error = "Inicia sesión para cambiar tu contraseña.";
        else if (!actual || !nueva || !confirmar) error = "Completa los tres campos.";
        else if (nueva.length < 8) error = "La nueva contraseña debe tener al menos 8 caracteres.";
        else if (nueva !== confirmar) error = "Las contraseñas nuevas no coinciden.";
        else if (nueva === actual) error = "La nueva contraseña debe ser diferente a la actual.";
        if (error) {
            mostrarEstadoPanel(estado, error, "error");
            return;
        }

        btnGuardar.disabled = true;
        mostrarEstadoPanel(estado, "Guardando la nueva contraseña…", "cargando");
        try {
            const { cambiarClave } = await import("../services/usuariosService.js");
            await cambiarClave(idUsuario, actual, nueva);
            marcarClaveCambiada(idUsuario);
            cerrarFormulario();
            actualizarAviso();
            mostrarEstadoPanel(estado, "Contraseña actualizada correctamente.", "exito");
        } catch (errorApi) {
            const mensaje = errorApi instanceof TypeError
                ? "No se pudo conectar con el servidor. Inténtalo de nuevo en unos momentos."
                : (errorApi.message || "No se pudo cambiar la contraseña.");
            mostrarEstadoPanel(estado, mensaje, "error");
        } finally {
            btnGuardar.disabled = false;
        }
    });
}

/* El tema oscuro como tal no cambia de hojas de css para cambiarla, sino que cambia las clases en el html para sobreescribir los estilos
y que asi funcione bien */
function aplicarTemaGuardado() {
    const oscuro = localStorage.getItem("iticket_tema") === "oscuro";
    document.documentElement.classList.toggle("tema-oscuro", oscuro);
}

function aplicarEstadoTema(activarOscuro, botonTema) {
    const raiz = document.documentElement;
    // Se apagan las transiciones, se cambia el tema y se fuerza el cálculo de estilos en el
    // mismo instante: así los colores cambian de golpe y el recálculo ocurre antes de que
    // empiece el círculo, no durante ni al final de la animación
    raiz.classList.add("tema-sin-transiciones");
    raiz.classList.toggle("tema-oscuro", activarOscuro);
    void document.body.offsetHeight;
    raiz.classList.remove("tema-sin-transiciones");
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
    ], { duration: 600, easing: "cubic-bezier(0.3, 0.7, 0.4, 1)", fill: "forwards" });
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
    convertirAccionesDeTablas(document);

    const observadorAcciones = new MutationObserver(function (cambios) {
        cambios.forEach(function (cambio) {
            cambio.addedNodes.forEach(function (nodo) {
                if (nodo.nodeType === Node.ELEMENT_NODE) convertirAccionesDeTablas(nodo);
            });
        });
    });
    observadorAcciones.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("click", function (evento) {
        const botonMenu = evento.target.closest(".btn-menu-acciones-tabla");
        if (botonMenu) {
            evento.preventDefault();
            evento.stopPropagation();
            const menu = botonMenu.closest(".menu-acciones-tabla");
            const estabaAbierto = menu.classList.contains("abierto");
            cerrarMenusAccionesTabla();
            if (!estabaAbierto) abrirMenuAccionesTabla(menu);
            return;
        }

        if (evento.target.closest(".menu-acciones-tabla-opcion")) {
            cerrarMenusAccionesTabla();
            return;
        }

        cerrarMenusAccionesTabla();
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

    document.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") cerrarMenusAccionesTabla();
    });

    window.addEventListener("resize", function () { cerrarMenusAccionesTabla(); });
    window.addEventListener("scroll", function () { cerrarMenusAccionesTabla(); }, true);
}

function convertirAccionesDeTablas(raiz) {
    const selectorCelda = ".table-custom tbody td";
    const celdas = [];
    if (raiz.matches?.(selectorCelda)) celdas.push(raiz);
    raiz.querySelectorAll?.(selectorCelda).forEach(function (celda) { celdas.push(celda); });

    celdas.forEach(function (celda) {
        if (celda.dataset.menuAccionesPreparado === "true") return;

        const acciones = [...celda.querySelectorAll('button[class*="btn-editar-"], button[class*="btn-eliminar-"]')]
            .filter(function (boton) { return !boton.closest(".menu-acciones-tabla"); });
        if (!acciones.length) return;

        celda.dataset.menuAccionesPreparado = "true";
        const menu = document.createElement("div");
        menu.className = "menu-acciones-tabla";

        const botonAbrir = document.createElement("button");
        botonAbrir.type = "button";
        botonAbrir.className = "btn-menu-acciones-tabla";
        botonAbrir.setAttribute("aria-label", "Mostrar acciones");
        botonAbrir.setAttribute("aria-expanded", "false");
        botonAbrir.innerHTML = '<i class="bi bi-three-dots" aria-hidden="true"></i>';

        const panel = document.createElement("div");
        panel.className = "panel-acciones-tabla";
        panel.hidden = true;

        acciones.forEach(function (boton) {
            const esEliminar = [...boton.classList].some(function (clase) { return clase.includes("btn-eliminar-"); });
            const texto = esEliminar ? "Eliminar" : "Editar";
            boton.type = "button";
            boton.classList.add("menu-acciones-tabla-opcion");
            boton.classList.toggle("opcion-eliminar", esEliminar);
            boton.setAttribute("aria-label", texto);
            boton.innerHTML = `<i class="bi ${esEliminar ? "bi-trash3" : "bi-pencil-square"}" aria-hidden="true"></i><span>${texto}</span>`;
            panel.appendChild(boton);
        });

        menu.append(botonAbrir, panel);
        celda.appendChild(menu);
    });
}

function abrirMenuAccionesTabla(menu) {
    const panel = menu.querySelector(".panel-acciones-tabla");
    const boton = menu.querySelector(".btn-menu-acciones-tabla");
    if (!panel || !boton) return;

    panel.hidden = false;
    menu.classList.add("abierto");
    boton.setAttribute("aria-expanded", "true");

    const espacioDebajo = window.innerHeight - menu.getBoundingClientRect().bottom;
    const espacioEncima = menu.getBoundingClientRect().top;
    menu.classList.toggle("abre-arriba", espacioDebajo < panel.offsetHeight + 20 && espacioEncima > espacioDebajo);
}

function cerrarMenusAccionesTabla() {
    document.querySelectorAll(".menu-acciones-tabla.abierto").forEach(function (menu) {
        menu.classList.remove("abierto", "abre-arriba");
        menu.querySelector(".btn-menu-acciones-tabla")?.setAttribute("aria-expanded", "false");
        const panel = menu.querySelector(".panel-acciones-tabla");
        if (panel) panel.hidden = true;
    });
}

const FILAS_POR_PAGINA = 10;
const DURACION_SALIDA_PAGINA = 170;
const DURACION_ENTRADA_PAGINA = 800;

// Transición al cambiar de página en listas y tablas paginadas: el contenido actual se
// desvanece hacia un lado y el nuevo entra elemento por elemento desde el lado contrario.
// direccion = 1 al avanzar de página y -1 al regresar.
window.animarCambioPagina = async function (contenido, cambiarPagina, direccion = 1) {
    const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!contenido || reducirMovimiento) {
        await cambiarPagina();
        return;
    }

    // Mantiene la altura mientras carga la página nueva para que el resto no brinque
    const marco = contenido.tagName === "TBODY" ? (contenido.closest(".table-responsive") || contenido.closest("table")) : contenido;
    if (marco) marco.style.minHeight = `${marco.offsetHeight}px`;

    window.clearTimeout(contenido.__temporizadorPagina);
    contenido.style.setProperty("--direccion-pagina", direccion < 0 ? -1 : 1);
    contenido.classList.remove("pagina-entrando");
    contenido.classList.add("pagina-saliendo");
    await new Promise((resolver) => window.setTimeout(resolver, DURACION_SALIDA_PAGINA));

    // Algunas páginas cargan los datos sin devolver una promesa: se espera a que el contenido cambie
    let huboCambio = false;
    let resolverCambio;
    const esperaCambio = new Promise((resolver) => { resolverCambio = resolver; });
    let temporizadorCambio;
    const observador = new MutationObserver(() => {
        huboCambio = true;
        window.clearTimeout(temporizadorCambio);
        temporizadorCambio = window.setTimeout(resolverCambio, 40);
    });
    observador.observe(contenido, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });

    try {
        const resultado = cambiarPagina();
        const devolvioPromesa = typeof resultado?.then === "function";
        await resultado;
        const limite = huboCambio ? 400 : (devolvioPromesa ? 150 : 4000);
        await Promise.race([esperaCambio, new Promise((resolver) => window.setTimeout(resolver, limite))]);
    } finally {
        observador.disconnect();
        window.clearTimeout(temporizadorCambio);
        // Cada elemento visible entra con un pequeño retraso según su posición
        [...contenido.children]
            .filter((hijo) => !hijo.hidden)
            .forEach((hijo, indice) => hijo.style.setProperty("--orden-pagina", Math.min(indice, 12)));

        contenido.classList.remove("pagina-saliendo");
        void contenido.offsetWidth;
        contenido.classList.add("pagina-entrando");
        if (marco) marco.style.minHeight = "";

        contenido.__temporizadorPagina = window.setTimeout(() => {
            contenido.classList.remove("pagina-entrando");
        }, DURACION_ENTRADA_PAGINA);
    }
};

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
        const direccion = pagina > estado.pagina ? 1 : -1;
        const tbody = lista.closest(".paginacion-tabla-auto")?.previousElementSibling?.querySelector?.("tbody");
        window.animarCambioPagina(tbody, () => {
            estado.pagina = pagina;
            alCambiar();
        }, direccion);
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

    const rolActivo = obtenerRolActivo();
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

/* El rol sale del usuario que inició sesión (sessionStorage). Antes se leía de
   localStorage con "admin" por defecto, así que un usuario sin sesión veía el menú completo. */
function obtenerRolActivo() {
    let nombreRol = "";
    try {
        nombreRol = (JSON.parse(sessionStorage.getItem("usuarioLogueado") || "null") || {}).nombreRol || "";
    } catch (error) {
        console.warn("[iTicket] No se pudo leer la sesión para el menú.", error);
    }

    const texto = String(nombreRol).toLowerCase();
    let rol = "";
    if (texto.includes("admin")) rol = "admin";
    else if (texto.includes("tecnic") || texto.includes("técnic")) rol = "tecnico";
    else if (texto) rol = "usuario";

    // Sin sesión se usa el rol más limitado
    if (!rol) rol = (localStorage.getItem("rolUsuario") || "usuario").toLowerCase().trim();

    localStorage.setItem("rolUsuario", rol);
    return rol;
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

/* =====================================================================
   DROPDOWNS PERSONALIZADOS
   La lista que abre un <select> nativo la dibuja el sistema operativo y casi no se
   puede estilizar. Aquí cada select.form-select recibe un botón y una lista propia.
   El <select> original se queda oculto y sigue siendo la fuente de verdad: los
   controladores lo siguen llenando, leyendo (.value) y escuchando ("change") igual.
   Para excluir uno: <select data-select-nativo>.
   ===================================================================== */

let contadorSelects = 0;
let selectAbierto = null;

function inicializarSelectsPersonalizados() {
    document.querySelectorAll("select.form-select").forEach(mejorarSelect);

    new MutationObserver((cambios) => {
        cambios.forEach((cambio) => cambio.addedNodes.forEach((nodo) => {
            if (nodo.nodeType !== Node.ELEMENT_NODE) return;
            if (nodo.matches("select.form-select")) mejorarSelect(nodo);
            nodo.querySelectorAll?.("select.form-select").forEach(mejorarSelect);
        }));
    }).observe(document.body, { childList: true, subtree: true });

    // Cerrar al hacer clic fuera, al desplazar la página o al cambiar el tamaño
    document.addEventListener("pointerdown", (evento) => {
        if (selectAbierto && !selectAbierto.envoltorio.contains(evento.target)) cerrarSelect(selectAbierto);
    });
    window.addEventListener("resize", () => selectAbierto && cerrarSelect(selectAbierto));
    document.addEventListener("scroll", (evento) => {
        if (selectAbierto && !selectAbierto.lista.contains(evento.target)) cerrarSelect(selectAbierto);
    }, true);
}

function mejorarSelect(select) {
    if (select.__selectPersonalizado || select.multiple || select.size > 1 || select.hasAttribute("data-select-nativo")) return;

    const id = `selectPersonalizado${++contadorSelects}`;
    const envoltorio = document.createElement("div");
    envoltorio.className = "select-personalizado";

    const boton = document.createElement("button");
    boton.type = "button";
    boton.id = `${id}Boton`;
    boton.setAttribute("role", "combobox");
    boton.setAttribute("aria-haspopup", "listbox");
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute("aria-controls", `${id}Lista`);
    boton.innerHTML = '<span class="select-personalizado-texto"></span>';

    const lista = document.createElement("ul");
    lista.className = "select-personalizado-lista";
    lista.id = `${id}Lista`;
    lista.setAttribute("role", "listbox");
    lista.tabIndex = -1;
    lista.hidden = true;

    select.parentNode.insertBefore(envoltorio, select);
    envoltorio.append(select, boton, lista);
    select.classList.add("select-nativo-oculto");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    const estado = { select, envoltorio, boton, lista, indiceActivo: -1, busqueda: "", temporizadorBusqueda: null };
    select.__selectPersonalizado = estado;

    // El nombre accesible viene del <label for="..."> del select original
    const etiqueta = select.id ? document.querySelector(`label[for="${CSS.escape(select.id)}"]`) : null;
    if (etiqueta) {
        if (!etiqueta.id) etiqueta.id = `${id}Etiqueta`;
        boton.setAttribute("aria-labelledby", `${etiqueta.id} ${boton.id}`);
        lista.setAttribute("aria-labelledby", etiqueta.id);
        etiqueta.addEventListener("click", (evento) => { evento.preventDefault(); boton.focus(); });
    } else if (select.getAttribute("aria-label")) {
        boton.setAttribute("aria-label", select.getAttribute("aria-label"));
    }

    // Si algún código enfoca el select oculto, el foco pasa al botón
    select.addEventListener("focus", () => boton.focus());

    // Asignar .value o .selectedIndex desde JavaScript no dispara eventos: se intercepta para refrescar el texto
    ["value", "selectedIndex"].forEach((propiedad) => {
        const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, propiedad);
        Object.defineProperty(select, propiedad, {
            configurable: true,
            get() { return descriptor.get.call(this); },
            set(valor) { descriptor.set.call(this, valor); sincronizarSelect(estado); }
        });
    });

    select.addEventListener("change", () => sincronizarSelect(estado));
    select.form?.addEventListener("reset", () => window.setTimeout(() => sincronizarSelect(estado)));

    // Opciones cargadas después, cambios de clase (is-invalid) o de disabled
    new MutationObserver(() => sincronizarSelect(estado)).observe(select, {
        childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: ["class", "disabled", "selected", "hidden"]
    });

    boton.addEventListener("click", () => (lista.hidden ? abrirSelect(estado) : cerrarSelect(estado)));
    boton.addEventListener("keydown", (evento) => manejarTecladoSelect(estado, evento));
    lista.addEventListener("keydown", (evento) => manejarTecladoSelect(estado, evento));
    lista.addEventListener("click", (evento) => {
        const opcion = evento.target.closest("[data-indice]");
        if (opcion && !opcion.classList.contains("deshabilitada")) elegirOpcion(estado, Number(opcion.dataset.indice));
    });
    lista.addEventListener("pointermove", (evento) => {
        const opcion = evento.target.closest("[data-indice]");
        if (opcion && !opcion.classList.contains("deshabilitada")) marcarActiva(estado, Number(opcion.dataset.indice), false);
    });

    sincronizarSelect(estado);
}

// Copia al botón las clases, el texto seleccionado y el estado del select original
function sincronizarSelect(estado) {
    const { select, boton } = estado;
    const clases = [...select.classList].filter((clase) => clase !== "select-nativo-oculto");
    boton.className = [...clases, "select-personalizado-boton"].join(" ");
    boton.disabled = select.disabled;

    const opcion = select.options[select.selectedIndex];
    const texto = opcion ? opcion.textContent.trim() : "";
    boton.querySelector(".select-personalizado-texto").textContent = texto || " ";
    boton.classList.toggle("sin-valor", !opcion || opcion.value === "");

    if (!estado.lista.hidden) construirOpciones(estado);
}

function construirOpciones(estado) {
    const { select, lista } = estado;
    lista.innerHTML = "";
    [...select.options].forEach((opcion, indice) => {
        if (opcion.hidden) return;
        const elemento = document.createElement("li");
        elemento.id = `${lista.id}Opcion${indice}`;
        elemento.dataset.indice = indice;
        elemento.setAttribute("role", "option");
        const seleccionada = indice === select.selectedIndex;
        elemento.setAttribute("aria-selected", String(seleccionada));
        elemento.className = "select-personalizado-opcion";
        if (seleccionada) elemento.classList.add("seleccionada");
        if (opcion.disabled) {
            elemento.classList.add("deshabilitada");
            elemento.setAttribute("aria-disabled", "true");
        }
        if (opcion.value === "") elemento.classList.add("opcion-vacia");
        elemento.innerHTML = '<span class="select-personalizado-opcion-texto"></span><i class="bi bi-check2" aria-hidden="true"></i>';
        elemento.querySelector("span").textContent = opcion.textContent.trim();
        lista.appendChild(elemento);
    });
}

function abrirSelect(estado) {
    if (estado.boton.disabled) return;
    if (selectAbierto && selectAbierto !== estado) cerrarSelect(selectAbierto);
    selectAbierto = estado;

    construirOpciones(estado);
    estado.lista.hidden = false;
    estado.boton.setAttribute("aria-expanded", "true");
    estado.envoltorio.classList.add("abierto");
    posicionarLista(estado);
    marcarActiva(estado, estado.select.selectedIndex >= 0 ? estado.select.selectedIndex : primeraHabilitada(estado, 0, 1), true);
}

function cerrarSelect(estado, devolverFoco = false) {
    estado.lista.hidden = true;
    estado.boton.setAttribute("aria-expanded", "false");
    estado.boton.removeAttribute("aria-activedescendant");
    estado.envoltorio.classList.remove("abierto", "hacia-arriba");
    if (selectAbierto === estado) selectAbierto = null;
    if (devolverFoco) estado.boton.focus();
}

// La lista usa position: fixed para que no la recorten tarjetas con overflow hidden
function posicionarLista(estado) {
    const { boton, lista, envoltorio } = estado;
    const rect = boton.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom - 12;
    const espacioArriba = rect.top - 12;
    const haciaArriba = espacioAbajo < Math.min(lista.scrollHeight, 320) && espacioArriba > espacioAbajo;

    lista.style.minWidth = `${rect.width}px`;
    lista.style.maxWidth = `${Math.max(rect.width, 320)}px`;
    lista.style.maxHeight = `${Math.max(140, Math.min(320, haciaArriba ? espacioArriba : espacioAbajo))}px`;
    posicionarFlotante(lista, rect, envoltorio, 320);
}

function marcarActiva(estado, indice, desplazar = true) {
    estado.indiceActivo = indice;
    estado.lista.querySelectorAll(".activa").forEach((elemento) => elemento.classList.remove("activa"));
    const elemento = estado.lista.querySelector(`[data-indice="${indice}"]`);
    if (!elemento) return;
    elemento.classList.add("activa");
    estado.boton.setAttribute("aria-activedescendant", elemento.id);
    if (desplazar) elemento.scrollIntoView({ block: "nearest" });
}

function primeraHabilitada(estado, desde, paso) {
    const opciones = estado.select.options;
    for (let i = desde; i >= 0 && i < opciones.length; i += paso) {
        if (!opciones[i].disabled && !opciones[i].hidden) return i;
    }
    return -1;
}

function elegirOpcion(estado, indice) {
    const { select } = estado;
    const cambio = select.selectedIndex !== indice;
    select.selectedIndex = indice;
    cerrarSelect(estado, true);
    if (cambio) {
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
    }
}

function manejarTecladoSelect(estado, evento) {
    const abierto = !estado.lista.hidden;
    const total = estado.select.options.length;

    switch (evento.key) {
        case "ArrowDown":
        case "ArrowUp": {
            evento.preventDefault();
            if (!abierto) { abrirSelect(estado); return; }
            const paso = evento.key === "ArrowDown" ? 1 : -1;
            const siguiente = primeraHabilitada(estado, estado.indiceActivo + paso, paso);
            if (siguiente >= 0) marcarActiva(estado, siguiente);
            return;
        }
        case "Home":
        case "End":
            if (!abierto) return;
            evento.preventDefault();
            marcarActiva(estado, evento.key === "Home" ? primeraHabilitada(estado, 0, 1) : primeraHabilitada(estado, total - 1, -1));
            return;
        case "Enter":
        case " ":
            if (evento.key === " " && estado.busqueda) break;
            evento.preventDefault();
            if (!abierto) abrirSelect(estado);
            else if (estado.indiceActivo >= 0) elegirOpcion(estado, estado.indiceActivo);
            return;
        case "Escape":
            if (!abierto) return;
            evento.preventDefault();
            evento.stopPropagation(); // que no cierre el modal que lo contiene
            cerrarSelect(estado, true);
            return;
        case "Tab":
            if (abierto) cerrarSelect(estado);
            return;
    }

    // Escribir letras salta a la opción que empieza con ese texto
    if (evento.key.length === 1 && !evento.ctrlKey && !evento.metaKey && !evento.altKey) {
        estado.busqueda += evento.key.toLowerCase();
        window.clearTimeout(estado.temporizadorBusqueda);
        estado.temporizadorBusqueda = window.setTimeout(() => { estado.busqueda = ""; }, 600);

        const opciones = [...estado.select.options];
        const coincidencia = opciones.findIndex((opcion) =>
            !opcion.disabled && !opcion.hidden && opcion.textContent.trim().toLowerCase().startsWith(estado.busqueda));
        if (coincidencia < 0) return;
        if (abierto) marcarActiva(estado, coincidencia);
        else elegirOpcion(estado, coincidencia);
    }
}

/* =====================================================================
   CALENDARIO PERSONALIZADO
   El calendario de <input type="date"> también lo dibuja el sistema. Aquí el campo se
   queda igual (se puede seguir escribiendo la fecha y su .value no cambia de formato),
   pero al hacer clic se abre un calendario propio. En datetime-local se agrega la hora.
   Para excluir uno: <input type="date" data-fecha-nativa>.
   ===================================================================== */

let fechaAbierta = null;
const NOMBRES_DIAS = ["do", "lu", "ma", "mi", "ju", "vi", "sá"];

function inicializarFechasPersonalizadas() {
    const selector = 'input[type="date"], input[type="datetime-local"]';
    document.querySelectorAll(selector).forEach(mejorarFecha);

    new MutationObserver((cambios) => {
        cambios.forEach((cambio) => cambio.addedNodes.forEach((nodo) => {
            if (nodo.nodeType !== Node.ELEMENT_NODE) return;
            if (nodo.matches(selector)) mejorarFecha(nodo);
            nodo.querySelectorAll?.(selector).forEach(mejorarFecha);
        }));
    }).observe(document.body, { childList: true, subtree: true });

    document.addEventListener("pointerdown", (evento) => {
        if (fechaAbierta && !fechaAbierta.envoltorio.contains(evento.target)) cerrarCalendario(fechaAbierta);
    });
    window.addEventListener("resize", () => fechaAbierta && cerrarCalendario(fechaAbierta));
    document.addEventListener("scroll", (evento) => {
        if (fechaAbierta && !fechaAbierta.panel.contains(evento.target)) cerrarCalendario(fechaAbierta);
    }, true);
}

function aFechaTexto(fecha) {
    const dos = (n) => String(n).padStart(2, "0");
    return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

// "2026-09-19" -> Date local (sin desfase de zona horaria)
function deFechaTexto(texto) {
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto || "");
    return coincidencia ? new Date(Number(coincidencia[1]), Number(coincidencia[2]) - 1, Number(coincidencia[3])) : null;
}

function mejorarFecha(input) {
    if (input.__fechaPersonalizada || input.hasAttribute("data-fecha-nativa")) return;

    const conHora = input.type === "datetime-local";
    const envoltorio = document.createElement("div");
    envoltorio.className = "fecha-personalizada";

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn-abrir-calendario";
    boton.tabIndex = -1;
    boton.setAttribute("aria-label", "Abrir calendario");
    boton.innerHTML = '<i class="bi bi-calendar3" aria-hidden="true"></i>';

    const panel = document.createElement("div");
    panel.className = "calendario-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Elegir fecha");
    panel.hidden = true;
    panel.innerHTML = `
        <div class="calendario-encabezado">
            <button type="button" class="calendario-flecha" data-mover="-1" aria-label="Mes anterior"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>
            <span class="calendario-mes" aria-live="polite"></span>
            <button type="button" class="calendario-flecha" data-mover="1" aria-label="Mes siguiente"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>
        </div>
        <div class="calendario-semana" aria-hidden="true">${NOMBRES_DIAS.map((dia) => `<span>${dia}</span>`).join("")}</div>
        <div class="calendario-dias" role="grid"></div>
        ${conHora ? `<label class="calendario-hora"><span>Hora</span><input type="time" class="form-control form-control-sm" step="60"></label>` : ""}
        <div class="calendario-pie">
            <button type="button" class="calendario-accion" data-accion="borrar">Borrar</button>
            <button type="button" class="calendario-accion calendario-accion-principal" data-accion="hoy">Hoy</button>
        </div>`;

    input.parentNode.insertBefore(envoltorio, input);
    envoltorio.append(input, boton, panel);
    input.classList.add("input-fecha-personalizada");

    const estado = { input, envoltorio, boton, panel, conHora, mesVisible: null, diaActivo: null };
    input.__fechaPersonalizada = estado;

    // Clic en el campo o en el ícono abre el calendario; escribir la fecha sigue funcionando
    input.addEventListener("click", (evento) => {
        evento.preventDefault();
        if (panel.hidden) abrirCalendario(estado);
    });
    boton.addEventListener("click", () => (panel.hidden ? abrirCalendario(estado) : cerrarCalendario(estado, true)));
    input.addEventListener("keydown", (evento) => {
        if ((evento.key === "ArrowDown" && evento.altKey) || evento.key === "F4") {
            evento.preventDefault();
            abrirCalendario(estado);
        } else if (evento.key === "Escape" && !panel.hidden) {
            evento.preventDefault();
            evento.stopPropagation();
            cerrarCalendario(estado, true);
        }
    });
    input.addEventListener("change", () => { if (!panel.hidden) pintarCalendario(estado); });

    panel.addEventListener("click", (evento) => {
        const flecha = evento.target.closest("[data-mover]");
        if (flecha) { moverMes(estado, Number(flecha.dataset.mover)); return; }

        const dia = evento.target.closest("[data-fecha]");
        if (dia && !dia.disabled) { elegirFecha(estado, deFechaTexto(dia.dataset.fecha)); return; }

        const accion = evento.target.closest("[data-accion]")?.dataset.accion;
        if (accion === "hoy") elegirFecha(estado, new Date());
        if (accion === "borrar") elegirFecha(estado, null);
    });
    panel.addEventListener("keydown", (evento) => manejarTecladoCalendario(estado, evento));
    panel.querySelector(".calendario-hora input")?.addEventListener("change", (evento) => {
        const fecha = deFechaTexto(input.value) || new Date();
        asignarValorFecha(estado, fecha, evento.target.value);
    });
}

function abrirCalendario(estado) {
    if (estado.input.disabled || estado.input.readOnly) return;
    if (fechaAbierta && fechaAbierta !== estado) cerrarCalendario(fechaAbierta);
    if (typeof selectAbierto !== "undefined" && selectAbierto) cerrarSelect(selectAbierto);
    fechaAbierta = estado;

    const seleccionada = deFechaTexto(estado.input.value);
    const base = seleccionada || new Date();
    estado.mesVisible = new Date(base.getFullYear(), base.getMonth(), 1);
    estado.diaActivo = base;

    estado.panel.hidden = false;
    estado.envoltorio.classList.add("abierto");
    pintarCalendario(estado);
    posicionarFlotante(estado.panel, estado.input.getBoundingClientRect(), estado.envoltorio, 420);
    estado.panel.querySelector(".calendario-dia.activo")?.focus();
}

function cerrarCalendario(estado, devolverFoco = false) {
    estado.panel.hidden = true;
    estado.envoltorio.classList.remove("abierto", "hacia-arriba");
    if (fechaAbierta === estado) fechaAbierta = null;
    if (devolverFoco) estado.input.focus();
}

function moverMes(estado, meses) {
    const { mesVisible, diaActivo } = estado;
    estado.mesVisible = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + meses, 1);
    const ultimoDia = new Date(estado.mesVisible.getFullYear(), estado.mesVisible.getMonth() + 1, 0).getDate();
    estado.diaActivo = new Date(estado.mesVisible.getFullYear(), estado.mesVisible.getMonth(), Math.min(diaActivo.getDate(), ultimoDia));
    pintarCalendario(estado);
}

function fueraDeRango(estado, fecha) {
    const texto = aFechaTexto(fecha);
    const minimo = (estado.input.min || "").slice(0, 10);
    const maximo = (estado.input.max || "").slice(0, 10);
    return (minimo && texto < minimo) || (maximo && texto > maximo);
}

function pintarCalendario(estado) {
    const { panel, mesVisible, input } = estado;
    const titulo = mesVisible.toLocaleDateString("es", { month: "long", year: "numeric" });
    panel.querySelector(".calendario-mes").textContent = titulo.charAt(0).toUpperCase() + titulo.slice(1);

    const seleccionada = input.value.slice(0, 10);
    const hoy = aFechaTexto(new Date());
    const activo = aFechaTexto(estado.diaActivo);

    // 6 semanas completas empezando en domingo
    const inicio = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1 - mesVisible.getDay());
    const dias = panel.querySelector(".calendario-dias");
    dias.innerHTML = "";
    for (let i = 0; i < 42; i++) {
        const fecha = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
        const texto = aFechaTexto(fecha);
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "calendario-dia";
        boton.dataset.fecha = texto;
        boton.textContent = fecha.getDate();
        boton.tabIndex = texto === activo ? 0 : -1;
        boton.setAttribute("aria-label", fecha.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
        if (fecha.getMonth() !== mesVisible.getMonth()) boton.classList.add("otro-mes");
        if (texto === hoy) boton.classList.add("hoy");
        if (texto === seleccionada) {
            boton.classList.add("seleccionado");
            boton.setAttribute("aria-pressed", "true");
        }
        if (texto === activo) boton.classList.add("activo");
        if (fueraDeRango(estado, fecha)) boton.disabled = true;
        dias.appendChild(boton);
    }

    const hora = panel.querySelector(".calendario-hora input");
    if (hora) hora.value = input.value.slice(11, 16) || hora.value || "08:00";
}

function asignarValorFecha(estado, fecha, hora) {
    const { input, conHora, panel } = estado;
    if (!fecha) {
        input.value = "";
    } else if (conHora) {
        const horaElegida = hora || panel.querySelector(".calendario-hora input")?.value || "08:00";
        input.value = `${aFechaTexto(fecha)}T${horaElegida}`;
    } else {
        input.value = aFechaTexto(fecha);
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
}

function elegirFecha(estado, fecha) {
    if (fecha && fueraDeRango(estado, fecha)) return;
    asignarValorFecha(estado, fecha);
    // Con hora el panel sigue abierto para poder ajustarla; sin hora se cierra
    if (estado.conHora && fecha) {
        estado.diaActivo = fecha;
        estado.mesVisible = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        pintarCalendario(estado);
    } else {
        cerrarCalendario(estado, true);
    }
}

function manejarTecladoCalendario(estado, evento) {
    if (evento.key === "Escape") {
        evento.preventDefault();
        evento.stopPropagation(); // que no cierre el modal que lo contiene
        cerrarCalendario(estado, true);
        return;
    }
    if (!evento.target.classList.contains("calendario-dia")) return;

    const saltos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const actual = estado.diaActivo;
    let nueva = null;
    if (saltos[evento.key]) nueva = new Date(actual.getFullYear(), actual.getMonth(), actual.getDate() + saltos[evento.key]);
    if (evento.key === "PageUp") nueva = new Date(actual.getFullYear(), actual.getMonth() - 1, actual.getDate());
    if (evento.key === "PageDown") nueva = new Date(actual.getFullYear(), actual.getMonth() + 1, actual.getDate());
    if (evento.key === "Home") nueva = new Date(actual.getFullYear(), actual.getMonth(), actual.getDate() - actual.getDay());
    if (evento.key === "End") nueva = new Date(actual.getFullYear(), actual.getMonth(), actual.getDate() + (6 - actual.getDay()));
    if (!nueva) return;

    evento.preventDefault();
    estado.diaActivo = nueva;
    estado.mesVisible = new Date(nueva.getFullYear(), nueva.getMonth(), 1);
    pintarCalendario(estado);
    estado.panel.querySelector(".calendario-dia.activo")?.focus();
}

// Coloca un panel flotante (position: fixed) debajo o encima de un elemento, dentro de la ventana.
// Dentro de un modal o de un contenedor con transform, "fixed" se mide desde ese contenedor, que
// puede estar desplazado o escalado: se prueban dos posiciones para saber dónde queda el origen
// y cuánto mide un píxel. Se mide sin la animación de apertura, que escala el panel.
function posicionarFlotante(panel, rect, envoltorio, altoMaximo) {
    const espacioAbajo = window.innerHeight - rect.bottom - 12;
    const espacioArriba = rect.top - 12;
    const altoPanel = Math.min(panel.scrollHeight, altoMaximo);
    const haciaArriba = espacioAbajo < altoPanel && espacioArriba > espacioAbajo;
    envoltorio.classList.toggle("hacia-arriba", haciaArriba);

    const anchoPanel = panel.offsetWidth;
    const izquierda = Math.max(8, Math.min(rect.left, window.innerWidth - anchoPanel - 8));
    const arriba = haciaArriba ? rect.top - 6 - panel.offsetHeight : rect.bottom + 6;

    panel.style.animation = "none";
    panel.style.left = "0px";
    panel.style.top = "0px";
    const origen = panel.getBoundingClientRect();
    panel.style.left = "100px";
    panel.style.top = "100px";
    const prueba = panel.getBoundingClientRect();
    const escalaX = (prueba.left - origen.left) / 100 || 1;
    const escalaY = (prueba.top - origen.top) / 100 || 1;
    panel.style.left = `${(izquierda - origen.left) / escalaX}px`;
    panel.style.top = `${(arriba - origen.top) / escalaY}px`;
    void panel.offsetWidth;
    panel.style.animation = "";
}

import { getNotificaciones, contarNoLeidas, marcarComoLeida, marcarTodasComoLeidas } from '../services/notificacionesService.js';

const INTERVALO_POLLING_MS = 30000; //Hace peticiones cada 30 segundos
const TAMANO_PAGINA = 10;
let intervaloPolling = null;
let paginaActual = 1;

document.addEventListener("DOMContentLoaded",
    inicializarNotificaciones
);

document.addEventListener("iticket:layout-ready",
    inicializarNotificaciones
);

function inicializarNotificaciones() {
    const btnNotificaciones = document.getElementById("btnNotificaciones");
    const panelNotificaciones = document.getElementById("panelNotificaciones");
    const notificacionesOverlay = document.getElementById("notificacionesOverlay");
    if (!btnNotificaciones || !panelNotificaciones || !notificacionesOverlay) return;
    if (btnNotificaciones.dataset.notificacionesDatosListos === "true") return;
    btnNotificaciones.dataset.notificacionesDatosListos = "true";

    //Al abrir el panel se refresca de inmediato, no solo se confía en el polling
    btnNotificaciones.addEventListener("click", () => cargarNotificaciones(1));

    cargarNotificaciones(1);
    actualizarBadge();

    intervaloPolling = setInterval(() => {
        actualizarBadge();
        //Si el panel está abierto, refresca también la lista para que se vea al instante
        if (panelNotificaciones.classList.contains("activo")) {
            cargarNotificaciones(paginaActual);
        }
    }, INTERVALO_POLLING_MS);
}

//El bage de notificaciones aparece si hay notificaciones no leidas
async function actualizarBadge() {
    const dot = document.getElementById("notificacionDot");
    if (!dot) return;
    try {
        const total = await contarNoLeidas();
        dot.hidden = !(total > 0);
    } catch (error) {
        console.error("Error al obtener el contador de notificaciones:", error);
    }
}

async function cargarNotificaciones(pagina) {
    const body = document.querySelector("#panelNotificaciones .notificaciones-body");
    if (!body) return;

    try {
        const resultado = await getNotificaciones(pagina, TAMANO_PAGINA);
        paginaActual = resultado.paginaActual || pagina;
        pintarNotificaciones(body, resultado);
    } catch (error) {
        console.error("Error al cargar notificaciones:", error);
        body.innerHTML = `<p class="text-muted text-center py-4">No se pudieron cargar las notificaciones.</p>`;
    }
}

function pintarNotificaciones(body, resultado) {
    const notificaciones = resultado?.notificaciones || [];

    if (notificaciones.length === 0) {
        body.innerHTML = `<p class="text-muted text-center py-4">No tienes notificaciones del último mes.</p>`;
        return;
    }

    const noLeidas = notificaciones.filter(n => !n.leida).length;

    const encabezado = noLeidas > 0
        ? `<div class="d-flex justify-content-between align-items-center mb-3">
             <h6 class="text-muted fw-bold mb-0 small">${noLeidas} sin leer</h6>
             <button type="button" class="btn btn-link btn-sm p-0" id="btnMarcarTodasLeidas">Marcar todas como leídas</button>
           </div>`
        : '';

    const items = notificaciones.map(n => `
        <div class="notificacion-item ${n.leida ? '' : 'no-leida'}" style="cursor:${n.tipo === 'TICKET_ELIMINADO' ? 'default' : 'pointer'}" data-id="${n.idNotificacion}" data-tipo="${n.tipo || ''}" data-tipo-entidad="${n.tipoEntidad || ''}" data-id-entidad="${n.idEntidad ?? ''}">
            <div class="avatar-notificacion"><i class="bi ${iconoPorTipo(n.tipo)}"></i></div>
            <div class="contenido-notificacion">
                <div class="d-flex justify-content-between align-items-baseline">
                    <span class="notificacion-titulo">${n.titulo}</span>
                    <span class="notificacion-tiempo">${formatearTiempo(n.fechaHora)}</span>
                </div>
                <p class="notificacion-texto">${n.mensaje}</p>
            </div>
        </div>
    `).join('');

    const totalPaginas = resultado.totalPaginas || 1;
    const paginacion = totalPaginas > 1 ? construirPaginacion(totalPaginas, resultado.paginaActual) : '';

    body.innerHTML = `
        <div class="notificaciones-seccion mb-2">
            ${encabezado}
            <div class="lista-notificaciones">${items}</div>
        </div>
        ${paginacion}
    `;

    document.getElementById("btnMarcarTodasLeidas")?.addEventListener("click", async (evento) => {
        evento.stopPropagation();
        try {
            await marcarTodasComoLeidas();
            cargarNotificaciones(paginaActual);
            actualizarBadge();
        } catch (error) {
            console.error("Error al marcar todas como leídas:", error);
        }
    });

    body.querySelectorAll(".notificacion-item").forEach(item => {
        item.addEventListener("click", () => manejarClicNotificacion(item));
    });

    body.querySelectorAll("[data-pagina-notif]").forEach(link => {
        link.addEventListener("click", (evento) => {
            evento.preventDefault();
            cargarNotificaciones(Number(link.dataset.paginaNotif));
        });
    });
}

function construirPaginacion(totalPaginas, paginaActiva) {
    const paginas = [];
    for (let i = 1; i <= totalPaginas; i++) {
        const activo = i === paginaActiva ? 'active' : '';
        paginas.push(`
            <li class="page-item ${activo}">
                <a class="page-link border-0 bg-transparent text-dark" href="#" data-pagina-notif="${i}">${i}</a>
            </li>
        `);
    }
    return `
        <nav aria-label="Paginacion de notificaciones" class="d-flex justify-content-end mt-2">
            <ul class="pagination pagination-sm mb-0 align-items-center gap-1">${paginas.join('')}</ul>
        </nav>
    `;
}

// Mapea el tipo de entidad guardado en la notificación a la página de detalle correspondiente.
function construirUrlDestino(tipo, tipoEntidad, idEntidad) {
    if (tipo === 'TICKET_ELIMINADO') return null;
    if (!tipoEntidad || !idEntidad) return null;
    switch (tipoEntidad) {
        case 'Ticket':
            return `vistaTicket.html?id=${idEntidad}`;
        case 'Proyecto':
            return `vistaProyecto.html?id=${idEntidad}`;
        default:
            return null;
    }
}

async function manejarClicNotificacion(item) {
    const id = item.dataset.id;
    const eraNoLeida = item.classList.contains("no-leida");

    if (eraNoLeida) {
        try {
            await marcarComoLeida(id);
            item.classList.remove("no-leida");
            actualizarBadge();
        } catch (error) {
            console.error("Error al marcar como leída:", error);
        }
    }

    const url = construirUrlDestino(item.dataset.tipo, item.dataset.tipoEntidad, item.dataset.idEntidad);
    if (url) {
        window.location.href = url;
    }
}

function iconoPorTipo(tipo) {
    const iconos = {
        TICKET_CREADO: "bi-ticket-perforated",
        TICKET_ASIGNADO: "bi-person-check",
        TICKET_RESUELTO: "bi-check-circle",
        TICKET_ELIMINADO: "bi-trash",
        TICKET_VENCIDO: "bi-exclamation-triangle",
        TICKET_REASIGNADO: "bi-arrow-left-right",
        COMENTARIO_CREADO: "bi-chat",
        PROYECTO_CREADO: "bi-kanban",
        FASE_CREADA: "bi-diagram-3"
    };
    return iconos[tipo] || "bi-bell";
}

function formatearTiempo(fechaHora) {
    const fecha = new Date(fechaHora);
    const ahora = new Date();
    const minutos = Math.floor((ahora - fecha) / 60000);
    if (minutos < 1) return "Ahora";
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias} d`;
}

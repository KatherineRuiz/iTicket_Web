import { getTicketsPropios, getIndicadoresEstadoPropios, getTicketsPendientesEvaluacion } from "../services/ticketsService.js";
import { mostrarError, mostrarConfirmacion } from "../components/sweetAlerts.js";
import { crearEvaluacion } from "../services/evaluacionesService.js";
import { formatearFecha12H } from "../utils/formateadores.js";
import { obtenerIdUsuario } from "../utils/sesion.js";
import { renderizarPaginacion as pintarPaginacionComun } from "../components/paginacion.js";

// Contadores superiores agrupados por estado.
const numNuevos = document.getElementById("numNuevos");
const numResueltos = document.getElementById("numResueltos");
const numAsignados = document.getElementById("numAsignados");
const numEnProgreso = document.getElementById("numEnProgreso");
const numEnEspera = document.getElementById("numEnEspera");
const numCerrados = document.getElementById("numCerrados");
const numVencidos = document.getElementById("numVencidos");

// Elementos de la lista paginada y sus filtros.
const divTickets = document.getElementById("divTickets");
const paginacionTickets = document.getElementById("paginacionTickets");
const infoTickets = document.getElementById("infoTickets");

const txtBuscar = document.getElementById("txtBuscar");
const sltBuscarPrioridad = document.getElementById("sltBuscarPrioridad");
const sltBuscarEstado = document.getElementById("sltBuscarEstado");
const dtBuscarFecha = document.getElementById("dtBuscarFecha");

// Elementos del modal que permite evaluar uno o varios tickets resueltos.
const btnAbrirEvaluacion = document.getElementById("btnAbrirEvaluacion");
const evaluacionModalEl = document.getElementById("evaluacionModal");
const evaluacionModal = new bootstrap.Modal(evaluacionModalEl);
const formEvaluacion = document.getElementById("formEvaluacion");
const txtMensajeEvaluaciones = document.getElementById("txtMensajeEvaluaciones");
const iconoTicket = document.getElementById("iconoTicket");
const itemTicket = document.getElementById("divTicket");

const evalAsunto = document.getElementById("evalAsunto");
const evalCodigo = document.getElementById("evalCodigo");
const evalCreacion = document.getElementById("evalCreacion");
const evalVence = document.getElementById("evalVence");
const evalDescripcion = document.getElementById("evalDescripcion");
const evalPrioridad = document.getElementById("evalPrioridad");
const evalProgreso = document.getElementById("evalProgreso");

// Estado de paginación, filtros y recorrido de evaluaciones pendientes.
let paginaActualTickets = 1;
let idTicketSeleccionado = null;
let filtrosActuales = {};
let temporizadorBusqueda = null;
let colaEvaluaciones = [];
let indiceActual = 0;
const idUsuario = obtenerIdUsuario();

document.addEventListener("DOMContentLoaded", () => {
    cargarTickets(1);
    cargarIndicadores();

    document.addEventListener("click", function (e) {

    const tarjetaTicket = e.target.closest(".lista-tickets");

    if (!tarjetaTicket) return;
      
    if (e.target.closest(".badge")) {
      return; 
    }

    const idTicket = tarjetaTicket.dataset.id;
    window.location.href = `vistaTicket.html?id=${idTicket}`;
  });
});

//Cargar y mostrar los contadores de estado de los tickets
async function cargarIndicadores() {
    try {
        const indicadores = await getIndicadoresEstadoPropios(idUsuario);

        numNuevos.textContent = indicadores.nuevos;
        numResueltos.textContent = indicadores.resueltos;
        numAsignados.textContent = indicadores.asignados;
        numEnProgreso.textContent = indicadores.enProgreso;
        numEnEspera.textContent = indicadores.enEspera;
        numCerrados.textContent = indicadores.cerrados;
        numVencidos.textContent = indicadores.vencidos;

        if (indicadores.resueltos === 0) {
            txtMensajeEvaluaciones.textContent = `¡No tienes evaluaciones pendientes!`;
            btnAbrirEvaluacion.classList.add("d-none");
        } else if (indicadores.resueltos === 1) {
            txtMensajeEvaluaciones.textContent = `¡Tienes 1 evaluación pendiente!`;
        } else {
            txtMensajeEvaluaciones.textContent = `¡Tienes ${indicadores.resueltos} evaluaciones pendientes!`;
        }

    }
    catch (error) {
        console.error("Error al cargar indicadores de estado: ", error);
        mostrarError(error.message || "Error. No se pudieron cargar los indicadores de estado");
    }
}

function renderizarTickets(tickets) {
    divTickets.innerHTML = "";


    tickets.forEach((ticket) => {

        const prio = ticket.prioridad || '';
        const iconoPrioridad = window.obtenerClaseIconoTicket?.(prio)
            || 'icono-ticket-prioridad-sin-asignar';
        const fechaVencimiento = ticket.fechaVencimiento || '';
        let existe = "noExiste";
        if (fechaVencimiento != '') {
            existe = "existe";
        }

        divTickets.innerHTML += `
            <article data-id="${ticket.idTicket}" class="lista-tickets position-relative shadow-sm bg-white borde-lateral-${prio} rounded-3 p-3 mb-3 d-flex justify-content-between align-items-start">
                <div class="elemento-ticket-asignado pe-1">
                  <h6 class="fw-bold mb-1 fs-5 d-flex align-items-start texto-limitado-1">
                    <i class="bi bi-ticket-perforated ${iconoPrioridad} me-2"></i>${ticket.asunto}</h6>
                  <small class="text-muted d-block mb-2">${ticket.codigo}</small>
                  <small class="text-muted d-block"><b>Creador: </b>${ticket.correoCreador}</small>
                  <small class="text-muted d-block"><b>Estado: </b>${ticket.estado}</small>
                  <small class="text-muted d-block"><b>Fecha de creación: </b> ${formatearFecha12H(ticket.fechaCreacion)}</small>
                  ${ticket.fechaVencimiento ? `<small class="text-muted d-block"><b class="text-danger">Vence: </b> ${formatearFecha12H(ticket.fechaVencimiento)}</small>` : ''}
                  <small class="text-muted d-block texto-limitado">
                    <b>Descripción:</b>${ticket.descripcion}
                  </small>
                </div>
                <span
                  class="flex-shrink-0 position-absolute rounded-pill badge prioridad-${ticket.prioridad} px-3 py-2">${prio}</span>
            </article>
        `;
    });
}

function renderizarPaginacion(totalPaginas, paginaActual) {
    pintarPaginacionComun(paginacionTickets, paginaActual, totalPaginas, cargarTickets);
}

async function cargarTickets(pagina = 1) {
    try {
        const resultado = await getTicketsPropios(idUsuario, pagina, 5, filtrosActuales);

        paginaActualTickets = resultado.paginaActual;
        renderizarTickets(resultado.tickets);
        renderizarPaginacion(resultado.totalPaginas, resultado.paginaActual);
        const inicio = resultado.tickets.length ? (resultado.paginaActual - 1) * 5 + 1 : 0;
        const fin = resultado.tickets.length ? inicio + resultado.tickets.length - 1 : 0;
        infoTickets.textContent = `Mostrando ${inicio}-${fin} de ${resultado.totalElementos}`;
    } catch (error) {
        console.error("Error al cargar tus tickets:", error);
        mostrarError("Error al cargar los tickets")
    }
}

txtBuscar.addEventListener("input", () => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => {
        filtrosActuales.busqueda = txtBuscar.value.trim();
        cargarTickets(1);
    }, 400);
});

sltBuscarPrioridad.addEventListener("change", () => {
    filtrosActuales.prioridad = sltBuscarPrioridad.value;
    cargarTickets(1);
});

sltBuscarEstado.addEventListener("change", () => {
    filtrosActuales.estado = sltBuscarEstado.value;
    cargarTickets(1);
});

dtBuscarFecha.addEventListener("change", () => {
    filtrosActuales.fecha = dtBuscarFecha.value;
    cargarTickets(1);
});

async function abrirEvaluacionesPendientes() {
    // La cola solo se consulta cuando está vacía; después se recorre en memoria.
    if (colaEvaluaciones.length === 0) {
        try {
            const resultado = await getTicketsPendientesEvaluacion(idUsuario);
            colaEvaluaciones = resultado.tickets;
            indiceActual = 0;
        } catch (error) {
            mostrarError(error.message || "No se pudieron cargar tus evaluaciones pendientes.");
            return;
        }
    }

    if (colaEvaluaciones.length === 0) {
        mostrarError("No tienes evaluaciones pendientes por el momento.");
        return;
    }

    pintarTicketEvaluacion();
    evaluacionModal.show();
}

btnAbrirEvaluacion.addEventListener("click", abrirEvaluacionesPendientes);

if (new URLSearchParams(window.location.search).get("evaluar") === "pendientes") {
    abrirEvaluacionesPendientes();
}

function pintarTicketEvaluacion() {
    const ticket = colaEvaluaciones[indiceActual];

    itemTicket.dataset.id=`${ticket.idTicket}`;
    itemTicket.classList.add("lista-tickets");

    evalAsunto.textContent = ticket.asunto;
    evalCodigo.textContent = ticket.codigo;
    evalCreacion.textContent = formatearFecha12H(ticket.fechaCreacion);
    evalVence.textContent =  formatearFecha12H(ticket.fechaVencimiento) ?? "—";
    evalDescripcion.textContent = ticket.descripcion;
    evalPrioridad.textContent = ticket.prioridad;
    evalProgreso.textContent = `Evaluación ${indiceActual + 1} de ${colaEvaluaciones.length}`;

    // Se retiran colores anteriores porque el mismo modal puede mostrar varios
    // tickets consecutivos con prioridades diferentes.
    Array.from(iconoTicket.classList)
        .filter((clase) => clase.startsWith('icono-ticket-prioridad-'))
        .forEach((clase) => iconoTicket.classList.remove(clase));
    iconoTicket.classList.add(
        window.obtenerClaseIconoTicket?.(ticket.prioridad) || 'icono-ticket-prioridad-sin-asignar'
    );
    itemTicket.classList.add(`borde-lateral-${ticket.prioridad}`);
    evalPrioridad.classList.add(`prio-${ticket.prioridad}`);
    evalPrioridad.classList.add("sin-absolute"); 

    formEvaluacion.reset();
}

formEvaluacion.addEventListener("submit", async (e) => {
    e.preventDefault();

    const ticket = colaEvaluaciones[indiceActual];
    const calificacionInput = formEvaluacion.querySelector('input[name="calificacion"]:checked');
    const comentario = document.getElementById("comentario-evaluacion").value.trim();

    if (!calificacionInput) {
        mostrarError("Selecciona una calificación antes de enviar.");
        return;
    }
    if (!comentario) {
        mostrarError("Deja un comentario antes de enviar.");
        return;
    }

    const confirmar = await mostrarConfirmacion("¿Estás seguro de enviar esta evaluación?", "No podrás editarla o eliminarla después.", "Enviar");
    if (!confirmar) {
        return;
    }

    try {
        await crearEvaluacion({
            calificacion: Number(calificacionInput.value),
            comentario,
            idTicket: ticket.idTicket
        }, idUsuario);
    } catch (error) {
        mostrarError(error.message || "No se pudo enviar la evaluación. Intenta de nuevo.");
        return;
    }

    indiceActual++;

    if (indiceActual < colaEvaluaciones.length) {
        pintarTicketEvaluacion();
    } else {
        evaluacionModal.hide();
        mostrarExitoSimple("¡Gracias!", "Has completado todas tus evaluaciones pendientes.");
        cargarIndicadores();
    }

    await cargarTickets();
});

evaluacionModalEl.addEventListener("hidden.bs.modal", () => {
    colaEvaluaciones = [];
    indiceActual = 0;
    formEvaluacion.reset();
    cargarIndicadores();
});

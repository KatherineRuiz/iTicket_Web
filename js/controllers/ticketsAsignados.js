import { mostrarError } from "../components/sweetAlerts.js";
import { getTicketsAsignados } from "../services/ticketsService.js";
import { formatearFecha12H } from "../utils/formateadores.js";

const divTickets = document.getElementById("divTickets");
const paginacionTickets = document.getElementById("paginacionTickets"); 
const infoTickets = document.getElementById("infoTickets");

const txtBuscar = document.getElementById("txtBuscar");
const sltBuscarPrioridad = document.getElementById("sltBuscarPrioridad");
const sltBuscarEstado = document.getElementById("sltBuscarEstado");
const dtBuscarFecha = document.getElementById("dtBuscarFecha");

let paginaActualTickets = 1;
let idTicketSeleccionado = null;
let filtrosActuales = {};
let temporizadorBusqueda = null;
const idUsuario = 1;//Temporal

document.addEventListener("DOMContentLoaded", function () {
  cargarTicketsAsignados(1);

  document.addEventListener("click", function (e) {

    const tarjetaTicket = e.target.closest(".lista-tickets-asignados");

    if (!tarjetaTicket) return;
      
    if (e.target.closest(".badge")) {
      return; 
    }

    const idTicket = tarjetaTicket.dataset.id;
    window.location.href = `vistaTicket.html?id=${idTicket}`;
  });
});

function renderizarTickets(tickets){
    divTickets.innerHTML = "";

    tickets.forEach((ticket) =>{
        divTickets.innerHTML += `
            <article data-id="${ticket.idTicket}" class="lista-tickets-asignados position-relative shadow-sm bg-white borde-lateral-${ticket.prioridad} rounded-3 p-3 mb-3 d-flex justify-content-between align-items-start">
                <div class="elemento-ticket-asignado pe-1">
                  <h6 class="fw-bold mb-1 fs-5 d-flex align-items-start texto-limitado-1">
                    <i class="bi bi-ticket-perforated bi-${ticket.prioridad} me-2"></i>${ticket.asunto}</h6>
                  <small class="text-muted d-block mb-2">${ticket.codigo}</small>
                  <small class="text-muted d-block"><b>Creador:</b>${ticket.correoCreador}</small>
                  <small class="text-muted d-block"><b>Estado:</b>${ticket.estado}</small>
                  <small class="text-muted d-block"><b>Fecha de creación:</b> ${formatearFecha12H(ticket.fechaCreacion)}</small>
                  <small class="text-muted d-block"><b class="text-danger">Vence:</b> ${formatearFecha12H(ticket.fechaVencimiento)}</small>
                  <small class="text-muted d-block texto-limitado">
                    <b>Descripción:</b>${ticket.descripcion}
                  </small>
                </div>
                <span
                  class="flex-shrink-0 rounded-pill badge prioridad-${ticket.prioridad} px-3 py-2">${ticket.prioridad}</span>
            </article>
        `;
    });
}

function renderizarPaginacion(totalPaginas, paginaActual) {
    paginacionTickets.innerHTML = "";

    for (let i = 1; i <= totalPaginas; i++) {
        const activo = i === paginaActual ? "active" : "";
        paginacionTickets.innerHTML += `
            <li class="page-item ${activo}">
                <a class="page-link border-0 bg-transparent text-dark" href="#" data-pagina="${i}">${i}</a>
            </li>
        `;
    }
}

paginacionTickets.addEventListener("click", (e) => {
    const link = e.target.closest("[data-pagina]");
    if (!link) return;
    e.preventDefault();
    cargarTicketsAsignados(Number(link.dataset.pagina));
});

async function cargarTicketsAsignados(pagina = 1) {
    try{
        const resultado = await getTicketsAsignados(idUsuario, pagina, 5, filtrosActuales);

        paginaActualTickets = resultado.paginaActual;
        renderizarTickets(resultado.tickets);
        renderizarPaginacion(resultado.totalPaginas, resultado.paginaActual);
        infoTickets.textContent = `Mostrando ${resultado.tickets.length} de ${resultado.totalElementos} tickets`;
    }catch (error) {
        console.error("Error al cargar la tabla de tickets:", error);
        mostrarError("Error al cargar los tickets")
    }
}

txtBuscar.addEventListener("input", () => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => {
        filtrosActuales.busqueda = txtBuscar.value.trim();
        cargarTicketsAsignados(1);
    }, 400);
});

sltBuscarPrioridad.addEventListener("change", () => {
    filtrosActuales.prioridad = sltBuscarPrioridad.value;
    cargarTicketsAsignados(1);
});

sltBuscarEstado.addEventListener("change", () => {
    filtrosActuales.estado = sltBuscarEstado.value;
    cargarTicketsAsignados(1);
});

dtBuscarFecha.addEventListener("change", () => {
    filtrosActuales.fecha = dtBuscarFecha.value;
    cargarTicketsAsignados(1);
});
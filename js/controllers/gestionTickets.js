import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/sweetAlerts.js";
import { getIndicadoresEstado, getAprobacionesPendientes, getTicket, asignarTicket, getTicketsPorDepartamento, actualizarDepartamento, eliminarTicket } from "../services/ticketsService.js";
import { validarFormularioAprobacion, validarFormularioReasignacionDep } from "../validators/ticketsValidator.js";
import { getTecnicosPorDepartamento } from "../services/usuariosService.js";
import { getDepartamentosAsignables } from "../services/departamentosService.js";
import { formatearFecha12H } from "../utils/formateadores.js";
import { obtenerIdUsuario } from "../utils/sesion.js";

// Contadores del resumen superior
const numNuevos = document.getElementById("numNuevos");
const numResueltos = document.getElementById("numResueltos");
const numAsignados = document.getElementById("numAsignados");
const numEnProgreso = document.getElementById("numEnProgreso");
const numEnEspera = document.getElementById("numEnEspera");
const numCerrados = document.getElementById("numCerrados");

const scrollAprobaciones = document.getElementById("scrollAprobaciones");
// Elementos del modal donde se revisa y aprueba un ticket nuevo
const modalAprobacionesEl = document.getElementById("modalAprobaciones");
const formAprobaciones = document.getElementById("formAprobaciones");
const prioridadAprobaciones = document.getElementById("sltPrioridad");
const tecnicoAprobaciones = document.getElementById("sltTecnico");
const fechaVencimiento = document.getElementById("dtFechaVencimiento");

const modalCreadorTicket = document.getElementById("modalCreadorTicket");
const modalAsuntoTicket = document.getElementById("modalAsuntoTicket");
const modalCodigoTicket = document.getElementById("modalCodigoTicket");
const modalEstadoTicket = document.getElementById("modalEstadoTicket");
const modalDescripcionTicket = document.getElementById("modalDescripcionTicket");
const modalFechaCreacion = document.getElementById("modalFechaTicket");
const filaEquipo = document.getElementById("filaEquipo");
const filaSoftware = document.getElementById("filaSoftware");
const modalUbicacionTicket = document.getElementById("modalUbicacionTicket");
const modalArticulosTicket = document.getElementById("modalArticulosTicket");
const modalSoftwareVersionTicket = document.getElementById("modalSoftwareVersionTicket");

// Controles del segundo modal, utilizado para enviar el ticket a otro departamento
const modalReasignarEl = document.getElementById('modalReasignarDepartamento');
const btnReasignarDepto = document.getElementById('btnReasignarDepto');
const sltDepartamentoReasignar = document.getElementById('sltDepartamentoReasignar');
const btnCancelarReasignacion = document.getElementById('btnCancelarReasignacion');
const btnConfirmarReasignar = document.getElementById('btnConfirmarReasignar');
const formReasignarDepartamento = document.getElementById('formReasignarDepartamento');
const btnEliminarTicket = document.getElementById('btnEliminarTicket');

// Bootstrap conserva una sola instancia por modal para evitar fondos superpuestos
const modalAprobaciones = bootstrap.Modal.getOrCreateInstance(modalAprobacionesEl);
const modalReasignar = bootstrap.Modal.getOrCreateInstance(modalReasignarEl);

// Galería y vista ampliada de las evidencias adjuntas al ticket
const modalGaleriaEvidencias = document.getElementById("modalGaleriaEvidencias");
const img = document.getElementById('imagenVista');
const modalVistaPrevia = new bootstrap.Modal(document.getElementById('modalVistaPrevia'));

// Tabla completa, paginación y filtros
const tablaTickets = document.getElementById("tblTickets");
const paginacionTickets = document.getElementById("paginacionTickets");
const infoTickets = document.getElementById("infoTickets");

const txtBuscar = document.getElementById("txtBuscar");
const sltBuscarPrioridad = document.getElementById("sltBuscarPrioridad");
const sltBuscarEstado = document.getElementById("sltBuscarEstado");
const dtBuscarFecha = document.getElementById("dtBuscarFecha");

// Estado que debe sobrevivir mientras se abren modales o se cambian filtros
let paginaActualTickets = 1;
let idTicketSeleccionado = null;
let filtrosActuales = {};
let temporizadorBusqueda = null;
let departamentosCargados = false;
let departamentoTicketActual = "";
let listaDepartamentosDisponibles = [];
const idUsuario = obtenerIdUsuario();

document.addEventListener("DOMContentLoaded", () => {
    recargarGestionTickets(1);
});

// Una sola recarga sincroniza indicadores, tarjetas pendientes y tabla. Se usa
// después de aprobar, reasignar o eliminar para no dejar ninguna sección vieja.
async function recargarGestionTickets(pagina = paginaActualTickets) {
    await Promise.all([
        cargarIndicadores(),
        cargarAprobacionesPendientes(idUsuario),
        cargarTablaTickets(pagina),
    ]);
}

function limitarFechasPasadas() {
    if (!fechaVencimiento) return;

    const ahora = new Date();
    //Convierte la fecha actual al formato requerido por HTML5
    const fechaLocalIso = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    fechaVencimiento.min = fechaLocalIso;
}

//Cargar y mostrar los contadores de estado de los tickets
async function cargarIndicadores() {
    try {
        const indicadores = await getIndicadoresEstado(idUsuario);

        numNuevos.textContent = indicadores.nuevos;
        numResueltos.textContent = indicadores.resueltos;
        numAsignados.textContent = indicadores.asignados;
        numEnProgreso.textContent = indicadores.enProgreso;
        numEnEspera.textContent = indicadores.enEspera;
        numCerrados.textContent = indicadores.cerrados;
    }
    catch (error) {
        console.error("Error al cargar indicadores de estado: ", error);
        mostrarError("Error. No se pudieron cargar los indicadores de estado");
    }
}

//Aprobaciones pendientes
async function cargarAprobacionesPendientes(idUsuario) {
    try {
        const tickets = await getAprobacionesPendientes(5, idUsuario);
        renderizarAprobaciones(tickets);
    }
    catch (error) {
        console.error("Error al cargar aprobaciones pendientes:", error);
        mostrarError("Error al cargar aprobaciones pendientes");
    }
}

function renderizarAprobaciones(tickets) {
    scrollAprobaciones.innerHTML = "";

    if (tickets.length === 0) {
        scrollAprobaciones.innerHTML = `<p class="text-muted text-center py-3">No hay tickets pendientes de aprobación.</p>`;
        return;
    }

    tickets.forEach((ticket) => {
        const iconoPrioridad = window.obtenerClaseIconoTicket?.(ticket.prioridad)
            || 'icono-ticket-prioridad-sin-asignar';
        scrollAprobaciones.innerHTML += `
            <div class="item-ticket-aprobacion bg-white p-3 mb-3 shadow-inner shadow-sm position-relative cursor-pointer"
                data-id="${ticket.idTicket}" data-bs-toggle="modal" data-bs-target="#modalAprobaciones">
                <h6 class="fw-bold mb-1 text-dark small d-flex align-items-center gap-2">
                    <i class="bi bi-ticket-perforated ${iconoPrioridad} me-2"></i>
                    ${ticket.asunto}
                </h6>
                <span class="text-muted-custom d-block text-mini">${ticket.codigo}</span>
                <span class="text-muted-custom d-block text-mini mt-2"><b>Creador:</b> ${ticket.correoCreador}</span>
                <span class="text-muted-custom d-block text-mini mt-2"><b>Fecha de creación:</b> ${formatearFecha12H(ticket.fechaCreacion)}</span>
                <p class="text-muted-custom text-mini mb-0 mt-1 text-truncate pe-2">
                    <b>Descripción:</b> ${ticket.descripcion}
                </p>
            </div>
        `;
    });
}

function renderizarEvidencias(evidencias) {
    modalGaleriaEvidencias.innerHTML = "";

    if (!evidencias || evidencias.length === 0) {
        modalGaleriaEvidencias.innerHTML = `<p class="text-muted small mb-0">Sin evidencias adjuntas.</p>`;
        return;
    }

    evidencias.forEach((url) => {
        modalGaleriaEvidencias.innerHTML += `
            <div class="miniatura-evidencia" onclick="abrirVistaImagen('${url}')">
                <img src="${url}" alt="Evidencia">
            </div>
        `;
    });
}

//Función para cargar la url y mostrar el modal de vista previa
window.abrirVistaImagen = function (url) {
    if (document.activeElement) {
        document.activeElement.blur();
    }
    img.src = url;
    modalVistaPrevia.show();
}

async function cargarTecnicos(idDepartamento) {
    try {
        const tecnicos = await getTecnicosPorDepartamento(idDepartamento);
        tecnicoAprobaciones.innerHTML = `<option value="">Selecciona un técnico</option>`;
        tecnicos.forEach((tecnico) => {
            tecnicoAprobaciones.innerHTML += `<option value="${tecnico.idUsuario}">${tecnico.correo} (${tecnico.nombreRol})</option>`;
        });
    }
    catch (error) {
        console.error("Error al cargar técnicos:", error);
        mostrarError("Oops... Hubo un error al cargar los técnicos");
    }
}

async function cargarTablaTickets(pagina = 1) {
    try {
        const resultado = await getTicketsPorDepartamento(idUsuario, pagina, 10, filtrosActuales);

        paginaActualTickets = resultado.paginaActual;
        renderizarTablaTickets(resultado.tickets);
        renderizarPaginacion(resultado.totalPaginas, resultado.paginaActual);
        infoTickets.textContent = `Mostrando ${resultado.tickets.length} de ${resultado.totalElementos} tickets`;
    } catch (error) {
        console.error("Error al cargar la tabla de tickets:", error);
        mostrarError("Oops... No se puedieron cargar los tickets");
    }
}

function renderizarTablaTickets(tickets) {
    tablaTickets.innerHTML = "";

    tickets.forEach((ticket) => {
        tablaTickets.innerHTML += `
            <tr>
                <td class="fw-bold">${ticket.codigo}</td>
                <td class="text-truncate truncate-celda">${ticket.asunto}</td>
                <td>${ticket.nombreCreador}</td>
                <td>${ticket.nombreTecnico ?? "Sin asignar"}</td>
                <td>${formatearFecha12H(ticket.fechaCreacion)}</td>
                <td>${formatearFecha12H(ticket.fechaVencimiento) ?? "-"}</td>
                <td>${ticket.prioridad ?? "-"}</td>
                <td>${ticket.estado}</td>
                <td>
                    <a href="vistaTicket.html?id=${ticket.idTicket}" class="text-info text-decoration-none small fw-semibold">Ver...</a>
                </td>
            </tr>
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
    cargarTablaTickets(Number(link.dataset.pagina));
});

formAprobaciones.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
        prioridad: prioridadAprobaciones.value,
        tecnicoAsignado: tecnicoAprobaciones.value,
        fechaVencimiento: fechaVencimiento.value
    };

    const errores = validarFormularioAprobacion(datos);
    if (errores.length > 0) {
        errores.forEach((error) => {
            const campo = document.getElementById(error.campo);
            if (campo) campo.classList.add("is-invalid");
        });

        //Muestra todos los mensajes juntos
        const mensajes = errores.map((error) => error.mensaje).join(" ");
        mostrarError(mensajes, false);
        return;
    }

    if (document.activeElement) {
        document.activeElement.blur();
    }
    const confirmar = await mostrarConfirmacion("¿Estás seguro de aprobar este ticket?", "Ya no podrás eliminarlo", "Aprobar");
    if (!confirmar) {
        return;
    }

    try {
        await asignarTicket(idTicketSeleccionado, idUsuario, {
            prioridad: datos.prioridad,
            tecnicoAsignado: Number(datos.tecnicoAsignado),
            fechaVencimiento: datos.fechaVencimiento
        });

        mostrarExitoSimple("¡Ticket asignado!", "El ticket fue asignado correctamente.");
        await recargarGestionTickets();
        modalAprobaciones.hide();
    }
    catch (error) {
        mostrarError(error.message);
    }
});

modalAprobacionesEl.addEventListener("show.bs.modal", async (e) => {
    // relatedTarget es la tarjeta que abrió el modal y contiene el id del ticket.
    limitarFechasPasadas();
    const tarjeta = e.relatedTarget;
    if (tarjeta && tarjeta.dataset.id) {
        idTicketSeleccionado = tarjeta.dataset.id;
    }

    if (!idTicketSeleccionado) return;

    try {
        const ticket = await getTicket(idTicketSeleccionado);

        departamentoTicketActual = ticket.nombreDepartamento;

        modalCreadorTicket.textContent = ticket.nombreCreador;
        modalAsuntoTicket.textContent = ticket.asunto;
        modalCodigoTicket.textContent = ticket.codigo;
        modalEstadoTicket.textContent = ticket.estado;
        modalDescripcionTicket.textContent = ticket.descripcion;
        modalFechaCreacion.textContent = formatearFecha12H(ticket.fechaCreacion);
        modalUbicacionTicket.textContent = ticket.ubicacion;
        if (Array.isArray(ticket.codigosArticulos) && ticket.codigosArticulos.length > 0) {
            modalArticulosTicket.textContent = Array.isArray(ticket.codigosArticulos) ? ticket.codigosArticulos.join(", ") : ticket.codigosArticulos;
            filaEquipo.classList.remove("d-none");
        } else {
            filaEquipo.classList.add("d-none");
        }

        if (Array.isArray(ticket.detallesSoftware) && ticket.detallesSoftware.length > 0) {
            //Convierte la lista de objetos a texto
            const textoSoftware = ticket.detallesSoftware.map(item => `${item.nombreSoftware} ${item.version ? `(v.${item.version})` : ''}`.trim()).join(", ");

            modalSoftwareVersionTicket.textContent = textoSoftware;
            filaSoftware.classList.remove("d-none");
        } else {
            filaSoftware.classList.add("d-none");
        }

        renderizarEvidencias(ticket.evidencias);
        await cargarTecnicos(ticket.departamento);
    }
    catch (error) {
        console.error("Error al cargar el detalle del ticket:", error);
    }
});

modalAprobacionesEl.addEventListener("hide.bs.modal", () => {
    if (document.activeElement) {
        document.activeElement.blur();
    }
});

btnReasignarDepto.addEventListener('click', () => {
    if (document.activeElement) document.activeElement.blur();
    modalAprobaciones.hide();
    modalReasignar.show();
    cargarDepartamentos();
});

btnCancelarReasignacion.addEventListener('click', () => {
    if (document.activeElement) document.activeElement.blur();
    modalReasignar.hide();
    modalAprobaciones.show();
});

txtBuscar.addEventListener("input", () => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => {
        filtrosActuales.busqueda = txtBuscar.value.trim();
        cargarTablaTickets(1); //vuelve a la página 1 cada vez que cambia un filtro
    }, 400);
});

sltBuscarPrioridad.addEventListener("change", () => {
    filtrosActuales.prioridad = sltBuscarPrioridad.value;
    cargarTablaTickets(1);
});

sltBuscarEstado.addEventListener("change", () => {
    filtrosActuales.estado = sltBuscarEstado.value;
    cargarTablaTickets(1);
});

dtBuscarFecha.addEventListener("change", () => {
    filtrosActuales.fecha = dtBuscarFecha.value;
    cargarTablaTickets(1);
});

async function cargarDepartamentos() {
    try {
        const departamentos = await getDepartamentosAsignables();
        listaDepartamentosDisponibles = departamentos;

        sltDepartamentoReasignar.innerHTML = '<option selected disabled value="">Selecciona un departamento</option>';

        departamentos.forEach((departamento) => {
            const opcion = document.createElement("option");
            opcion.value = departamento.idDepartamento;
            opcion.textContent = departamento.nombreDepartamento;
            sltDepartamentoReasignar.appendChild(opcion);
            if (departamentoTicketActual != departamento.nombreDepartamento) {
                sltDepartamentoReasignar.value = departamento.idDepartamento;
                sltDepartamentoReasignar.disabled = true;
            }
        });

        departamentosCargados = true;

    } catch (error) {
        console.error("Error al cargar los departamentos: ", error);
        mostrarError("No se pudieron cargar los departamentos.");
    }
}

formReasignarDepartamento.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
        departamento: sltDepartamentoReasignar.value,
    };

    const errores = validarFormularioReasignacionDep(datos);
    if (errores.length > 0) {
        errores.forEach((error) => {
            const campo = document.getElementById(error.campo);
            if (campo) campo.classList.add("is-invalid");
        });

        const mensajes = errores.map((error) => error.mensaje).join(" ");
        mostrarError(mensajes, false);
        return;
    }

    if (document.activeElement) {
        document.activeElement.blur();
    }
    const confirmar = await mostrarConfirmacion("¿Estás seguro de reasignar este ticket?", "Tu departamento ya no podrá gestionarlo", "Reasignar");
    if (!confirmar) {
        return;
    }

    try {
        await actualizarDepartamento(idTicketSeleccionado, {
            departamento: datos.departamento
        });

        mostrarExitoSimple("¡Ticket reasignado!", "El ticket fue asignado a otro departamento.");
        await recargarGestionTickets();
        modalAprobaciones.hide();
        modalReasignar.hide();
    }
    catch (error) {
        mostrarError(error.message);
    }
});

async function eliminarTicketSeleccionado() {
    const confirmar = await mostrarConfirmacion("¿Estás seguro de eliminar este ticket?", "No podrás revertir esta acción", "Eliminar");
    if (!confirmar) {
        return;
    }

    try {
        await eliminarTicket(idTicketSeleccionado, idUsuario);

        await recargarGestionTickets();

        if (document.activeElement) {
            document.activeElement.blur();
        }
        mostrarExitoSimple("Ticket eliminado", "El ticket fue eliminado con éxito.");
        modalAprobaciones.hide();
    }
    catch (error) {
        console.error("Error al eliminar el ticket:", error);
    }
}

if (btnEliminarTicket) {
    btnEliminarTicket.addEventListener("click", eliminarTicketSeleccionado);
}
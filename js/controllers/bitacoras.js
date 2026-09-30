import { mostrarError } from "../components/sweetAlerts.js";
import { getBitacoras } from "../services/bitacorasService.js";
import { formatearFecha12H } from "../utils/formateadores.js";
import { renderizarPaginacion as pintarPaginacionComun } from "../components/paginacion.js";

const tblBitacoras = document.getElementById("tblBitacoras");
const paginacionBitacoras = document.getElementById("paginacionBitacoras");
const infoBitacoras = document.getElementById("infoBitacoras");
const txtBuscarBitacora = document.getElementById("txtBuscarBitacora");
const sltEstadoBitacora = document.getElementById("sltEstadoBitacora");

const tblEliminados = document.getElementById("tblBitacorasEliminados");
const paginacionEliminados = document.getElementById("paginacionBitacorasEliminados");
const infoEliminados = document.getElementById("infoBitacorasEliminados");
const txtBuscarEliminados = document.getElementById("txtBuscarEliminados");

const TAMANO_PAGINA = 10;
//Nombre del estado "eliminado" en la base de datos. La pestaña de eliminados
//siempre lo manda como filtro fijo, sin importar lo que el usuario busque.
const ESTADO_ELIMINADO = "Eliminado";

let paginaActualTodos = 1;
let paginaActualEliminados = 1;
// Cada tabla pagina y filtra en la API, así que cada una guarda sus propios filtros
let filtrosTodos = {};
let filtrosEliminados = {};
let temporizadorBusquedaTodos = null;
let temporizadorBusquedaEliminados = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarTablaTodos(1);
    cargarTablaEliminados(1);
});

function esEliminado(bitacora) {
    return (bitacora.nuevoEstado || "").trim().toLowerCase() === ESTADO_ELIMINADO.toLowerCase();
}

async function cargarTablaTodos(pagina = 1) {
    try {
        const resultado = await getBitacoras(pagina, TAMANO_PAGINA, filtrosTodos);

        paginaActualTodos = resultado.paginaActual;
        renderizarTodos(resultado.bitacoras);
        pintarPaginacionComun(paginacionBitacoras, resultado.paginaActual, resultado.totalPaginas, cargarTablaTodos);

        const inicio = resultado.bitacoras.length ? (resultado.paginaActual - 1) * TAMANO_PAGINA + 1 : 0;
        const fin = resultado.bitacoras.length ? inicio + resultado.bitacoras.length - 1 : 0;
        infoBitacoras.textContent = `Mostrando ${inicio}-${fin} de ${resultado.totalElementos}`;
    } catch (error) {
        console.error("Error al cargar la bitácora:", error);
        mostrarError(error.message || "Oops... No se pudo cargar la bitácora de actividad");
    }
}

function renderizarTodos(bitacoras) {
    tblBitacoras.innerHTML = "";

    if (bitacoras.length === 0) {
        tblBitacoras.innerHTML = `<tr><td colspan="6" class="text-muted py-4">No se encontraron registros de bitácora.</td></tr>`;
        return;
    }

    bitacoras.forEach((b) => {
        const eliminado = esEliminado(b);
        tblBitacoras.innerHTML += `
            <tr>
                <td>${formatearFecha12H(b.fechaHora)}</td>
                <td class="fw-bold">${b.codigoTicket}</td>
                <td class="text-truncate truncate-celda">${b.asuntoTicket}</td>
                <td>${b.nombreUsuario ?? "-"}</td>
                <td><span class="badge bg-info-subtle text-info-emphasis fw-semibold">${b.nuevoEstado}</span></td>
                <td>
                    ${eliminado
                ? `<span class="text-muted small"><i class="bi bi-trash3 me-1"></i>Ticket eliminado</span>`
                : `<a href="vistaTicket.html?id=${b.idTicket}" class="text-info text-decoration-none small fw-semibold">Ver...</a>`}
                </td>
            </tr>
        `;
    });
}

async function cargarTablaEliminados(pagina = 1) {
    try {
        // Estado fijo: esta pestaña solo muestra bitácoras de tickets eliminados
        const filtros = { ...filtrosEliminados, estado: ESTADO_ELIMINADO };
        const resultado = await getBitacoras(pagina, TAMANO_PAGINA, filtros);

        paginaActualEliminados = resultado.paginaActual;
        renderizarEliminados(resultado.bitacoras);
        pintarPaginacionComun(paginacionEliminados, resultado.paginaActual, resultado.totalPaginas, cargarTablaEliminados);

        const inicio = resultado.bitacoras.length ? (resultado.paginaActual - 1) * TAMANO_PAGINA + 1 : 0;
        const fin = resultado.bitacoras.length ? inicio + resultado.bitacoras.length - 1 : 0;
        infoEliminados.textContent = `Mostrando ${inicio}-${fin} de ${resultado.totalElementos}`;
    } catch (error) {
        console.error("Error al cargar los tickets eliminados:", error);
        mostrarError(error.message || "Oops... No se pudieron cargar los tickets eliminados");
    }
}

function renderizarEliminados(bitacoras) {
    tblEliminados.innerHTML = "";

    if (bitacoras.length === 0) {
        tblEliminados.innerHTML = `<tr><td colspan="4" class="text-muted py-4">No hay tickets eliminados registrados.</td></tr>`;
        return;
    }

    bitacoras.forEach((b) => {
        tblEliminados.innerHTML += `
            <tr>
                <td>${formatearFecha12H(b.fechaHora)}</td>
                <td class="fw-bold">${b.codigoTicket}</td>
                <td class="text-truncate truncate-celda">${b.asuntoTicket}</td>
                <td>${b.nombreUsuario ?? "-"}</td>
            </tr>
        `;
    });
}

txtBuscarBitacora.addEventListener("input", () => {
    clearTimeout(temporizadorBusquedaTodos);
    temporizadorBusquedaTodos = setTimeout(() => {
        filtrosTodos.busqueda = txtBuscarBitacora.value.trim();
        cargarTablaTodos(1);
    }, 400);
});

sltEstadoBitacora.addEventListener("change", () => {
    filtrosTodos.estado = sltEstadoBitacora.value;
    cargarTablaTodos(1);
});

txtBuscarEliminados.addEventListener("input", () => {
    clearTimeout(temporizadorBusquedaEliminados);
    temporizadorBusquedaEliminados = setTimeout(() => {
        filtrosEliminados.busqueda = txtBuscarEliminados.value.trim();
        cargarTablaEliminados(1);
    }, 400);
});

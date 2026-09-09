import { mostrarError } from "../components/sweetAlerts.js";
import { getBitacoras } from "../services/bitacorasService.js";
import { formatearFecha12H } from "../utils/formateadores.js";
import { renderizarPaginacion } from "../components/paginacion.js";

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
//La bitácora registra la eliminación de un ticket con este texto como "nuevoEstado".
//Si en la base de datos se guarda con otro texto exacto, ajustar aquí.
const ESTADO_ELIMINADO = "eliminado";

let bitacorasCompletas = [];
let paginaActualTodos = 1;
let paginaActualEliminados = 1;
let temporizadorBusquedaTodos = null;
let temporizadorBusquedaEliminados = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarBitacoras();
});

async function cargarBitacoras() {
    try {
        const bitacoras = await getBitacoras();
        bitacorasCompletas = Array.isArray(bitacoras) ? bitacoras : [];

        //Ordena del registro mas reciente al mas antiguo
        bitacorasCompletas.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));

        poblarFiltroEstados();
        renderizarTodos(1);
        renderizarEliminados(1);
    } catch (error) {
        console.error("Error al cargar la bitácora:", error);
        mostrarError("Oops... No se pudo cargar la bitácora de actividad");
    }
}

//Arma el select de estados con base en los valores reales que trae la bitácora
function poblarFiltroEstados() {
    const estados = [...new Set(bitacorasCompletas.map((b) => b.nuevoEstado).filter(Boolean))].sort();

    sltEstadoBitacora.innerHTML = '<option value="">Todos los estados</option>';
    estados.forEach((estado) => {
        sltEstadoBitacora.innerHTML += `<option value="${estado}">${estado}</option>`;
    });
}

function esEliminado(bitacora) {
    return (bitacora.nuevoEstado || "").trim().toLowerCase() === ESTADO_ELIMINADO;
}

function filtrarBitacoras(lista, busqueda, estado) {
    const texto = (busqueda || "").trim().toLowerCase();

    return lista.filter((b) => {
        const coincideTexto = !texto
            || (b.codigoTicket || "").toLowerCase().includes(texto)
            || (b.asuntoTicket || "").toLowerCase().includes(texto)
            || (b.nombreUsuario || "").toLowerCase().includes(texto);

        const coincideEstado = !estado || b.nuevoEstado === estado;

        return coincideTexto && coincideEstado;
    });
}

function renderizarTodos(pagina = 1) {
    const filtradas = filtrarBitacoras(bitacorasCompletas, txtBuscarBitacora.value, sltEstadoBitacora.value);
    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / TAMANO_PAGINA));
    paginaActualTodos = Math.min(Math.max(pagina, 1), totalPaginas);

    const inicio = (paginaActualTodos - 1) * TAMANO_PAGINA;
    const paginaDeDatos = filtradas.slice(inicio, inicio + TAMANO_PAGINA);

    tblBitacoras.innerHTML = "";

    if (paginaDeDatos.length === 0) {
        tblBitacoras.innerHTML = `<tr><td colspan="6" class="text-muted py-4">No se encontraron registros de bitácora.</td></tr>`;
    }

    paginaDeDatos.forEach((b) => {
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

    const fin = paginaDeDatos.length ? inicio + paginaDeDatos.length : 0;
    infoBitacoras.textContent = `Mostrando ${paginaDeDatos.length ? inicio + 1 : 0}-${fin} de ${filtradas.length}`;
    renderizarPaginacion(paginacionBitacoras, paginaActualTodos, totalPaginas, renderizarTodos);
}

function renderizarEliminados(pagina = 1) {
    const soloEliminados = bitacorasCompletas.filter(esEliminado);
    const filtradas = filtrarBitacoras(soloEliminados, txtBuscarEliminados.value, "");
    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / TAMANO_PAGINA));
    paginaActualEliminados = Math.min(Math.max(pagina, 1), totalPaginas);

    const inicio = (paginaActualEliminados - 1) * TAMANO_PAGINA;
    const paginaDeDatos = filtradas.slice(inicio, inicio + TAMANO_PAGINA);

    tblEliminados.innerHTML = "";

    if (paginaDeDatos.length === 0) {
        tblEliminados.innerHTML = `<tr><td colspan="4" class="text-muted py-4">No hay tickets eliminados registrados.</td></tr>`;
    }

    paginaDeDatos.forEach((b) => {
        tblEliminados.innerHTML += `
            <tr>
                <td>${formatearFecha12H(b.fechaHora)}</td>
                <td class="fw-bold">${b.codigoTicket}</td>
                <td class="text-truncate truncate-celda">${b.asuntoTicket}</td>
                <td>${b.nombreUsuario ?? "-"}</td>
            </tr>
        `;
    });

    const fin = paginaDeDatos.length ? inicio + paginaDeDatos.length : 0;
    infoEliminados.textContent = `Mostrando ${paginaDeDatos.length ? inicio + 1 : 0}-${fin} de ${filtradas.length}`;
    renderizarPaginacion(paginacionEliminados, paginaActualEliminados, totalPaginas, renderizarEliminados);
}

txtBuscarBitacora.addEventListener("input", () => {
    clearTimeout(temporizadorBusquedaTodos);
    temporizadorBusquedaTodos = setTimeout(() => renderizarTodos(1), 400);
});

sltEstadoBitacora.addEventListener("change", () => renderizarTodos(1));

txtBuscarEliminados.addEventListener("input", () => {
    clearTimeout(temporizadorBusquedaEliminados);
    temporizadorBusquedaEliminados = setTimeout(() => renderizarEliminados(1), 400);
});

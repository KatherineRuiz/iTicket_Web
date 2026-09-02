import { obtenerEvaluaciones, obtenerMetricasEvaluaciones } from "../services/evaluacionesService.js";
import { mostrarError } from "../components/sweetAlerts.js";

const totalEvaluaciones     = document.getElementById("totalEvaluaciones");
const promedioCalificacion  = document.getElementById("promedioCalificacion");
const evaluacionesPositivas = document.getElementById("evaluacionesPositivas");
const evaluacionesNegativas = document.getElementById("evaluacionesNegativas");
const inputBusqueda         = document.getElementById("inputBusqueda");
const selectCalificacion    = document.getElementById("selectCalificacion");
const inputFecha            = document.getElementById("inputFecha");
const tablaEvaluaciones     = document.getElementById("tablaEvaluaciones");
const textoContador         = document.getElementById("textoContador");
const contenedorPaginacion  = document.getElementById("contenedorPaginacion");

// Estado de navegación. La API usa páginas desde cero, por eso paginaActual
// inicia en 0 aunque visualmente la primera página se muestre como 1.
let paginaActual = 0;
const tamanioPagina = 10;
let totalPaginas = 0;
let totalElementos = 0;

document.addEventListener("DOMContentLoaded", function () {
    if (selectCalificacion && selectCalificacion.value === "") {
        selectCalificacion.value = "0";
    }
    cargarDatos();
});

function obtenerIdUsuarioLogueado() {
    try {
        const sesion = JSON.parse(sessionStorage.getItem("usuarioLogueado"));
        return sesion?.idUsuario ?? null;
    } catch {
        return null;
    }
}

async function cargarDatos() {
    try {
        const idUsuarioAdmin = obtenerIdUsuarioLogueado();
        const busqueda = inputBusqueda ? inputBusqueda.value : "";
        const calificacion = selectCalificacion ? selectCalificacion.value : "0";
        
        // El input type="date" entrega la fecha en formato YYYY-MM-DD (Ej: 2026-07-01)
        // Se asume que el backend Spring Boot lo recibe en este formato estándar por la URL.
        const fecha = inputFecha ? inputFecha.value : "";

        // Peticiones en paralelo para tabla paginada y métricas globales
        const [pageData, metricas] = await Promise.all([
            obtenerEvaluaciones(idUsuarioAdmin, paginaActual, tamanioPagina, busqueda, calificacion, fecha),
            obtenerMetricasEvaluaciones(idUsuarioAdmin, busqueda, calificacion, fecha)
        ]);

        if (!pageData) {
            renderizarTabla([]);
            actualizarMetricas(null, 0);
            renderizarPaginacion();
            return;
        }

        const lista = pageData.content || [];
        totalPaginas = pageData.totalPages || 0;
        totalElementos = pageData.totalElements || 0;

        renderizarTabla(lista);
        actualizarMetricas(metricas, totalElementos);
        renderizarPaginacion();
    } catch (error) {
        console.error("Error al cargar datos de evaluaciones:", error);
        mostrarError("No se pudieron cargar las evaluaciones. Intenta de nuevo más tarde.");
    }
}

function actualizarMetricas(metricas, totalGral) {
    if (metricas) {
        totalEvaluaciones.textContent = metricas.totalEvaluaciones ?? 0;
        promedioCalificacion.textContent = Number(metricas.promedio || 0).toFixed(1);
        evaluacionesPositivas.textContent = metricas.positivas ?? 0;
        evaluacionesNegativas.textContent = metricas.negativas ?? 0;
    } else {
        totalEvaluaciones.textContent = "0";
        promedioCalificacion.textContent = "0.0";
        evaluacionesPositivas.textContent = "0";
        evaluacionesNegativas.textContent = "0";
    }

    const inicio = totalGral === 0 ? 0 : (paginaActual * tamanioPagina) + 1;
    const fin = Math.min((paginaActual + 1) * tamanioPagina, totalGral);
    if (textoContador) {
        textoContador.textContent = `Mostrando ${inicio}-${fin} de ${totalGral}`;
    }
}

function renderizarTabla(data) {
    tablaEvaluaciones.innerHTML = "";

    if (!data || data.length === 0) {
        tablaEvaluaciones.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No se encontraron evaluaciones</td></tr>';
        return;
    }

    data.forEach(ev => {
        const fila = document.createElement("tr");
        fila.classList.add("fila-expandible");
        fila.setAttribute("title", "Haz clic para ver la evaluación completa");
        fila.setAttribute("aria-expanded", "false");
        const puntos = Math.round(ev.calificacion || 0);

        let estrellasHTML = "";
        for (let i = 1; i <= 5; i++) {
            estrellasHTML += i <= puntos 
                ? '<i class="bi bi-star-fill estrella-llena"></i>' 
                : '<i class="bi bi-star estrella-vacia"></i>';
        }

        // Formatear la fecha para que se muestre como DD/MM/YYYY y coincida visualmente con el Input
        let fechaMostrar = "N/A";
        const fechaRaw = ev.fechaEvaluacion || ev.fechaCreacion;
        if (fechaRaw) {
            const soloFecha = fechaRaw.includes("T") ? fechaRaw.split("T")[0] : fechaRaw;
            const [anio, mes, dia] = soloFecha.split("-");
            fechaMostrar = `${dia}/${mes}/${anio}`;
        }

        fila.innerHTML = `
            <td>${ev.codigoTicket || ev.codigo || "N/A"}</td>
            <td class="celda-asunto text-truncate">${ev.asuntoTicket || ev.asunto || "Sin asunto"}</td>
            <td>${ev.nombreTecnico || ev.tecnico || "No asignado"}</td>
            <td><span class="estrellas">${estrellasHTML}</span></td>
            <td class="celda-comentario text-truncate">${ev.comentario || "Sin comentarios"}</td>
            <td>${fechaMostrar}</td>
        `;

        tablaEvaluaciones.appendChild(fila);
    });
}

function renderizarPaginacion() {
    if (!contenedorPaginacion) return;
    contenedorPaginacion.innerHTML = "";

    if (totalPaginas <= 1) return;

    // Botón Anterior
    const liAnt = document.createElement("li");
    liAnt.className = `page-item ${paginaActual === 0 ? 'disabled' : ''}`;
    liAnt.innerHTML = `<a class="page-link border-0 bg-transparent ${paginaActual === 0 ? 'text-muted' : 'text-dark'}" href="#"><i class="bi bi-chevron-left"></i></a>`;
    liAnt.addEventListener("click", (e) => {
        e.preventDefault();
        if (paginaActual > 0) { paginaActual--; cargarDatos(); }
    });
    contenedorPaginacion.appendChild(liAnt);

    const ventana = 1;
    let inicio = Math.max(0, paginaActual - ventana);
    let fin = Math.min(totalPaginas - 1, paginaActual + ventana);

    if (inicio > 0) {
        agregarBotonPagina(0);
        if (inicio > 1) agregarEllipsis();
    }

    for (let i = inicio; i <= fin; i++) {
        agregarBotonPagina(i);
    }

    if (fin < totalPaginas - 1) {
        if (fin < totalPaginas - 2) agregarEllipsis();
        agregarBotonPagina(totalPaginas - 1);
    }

    // Botón Siguiente
    const liSig = document.createElement("li");
    liSig.className = `page-item ${paginaActual >= totalPaginas - 1 ? 'disabled' : ''}`;
    liSig.innerHTML = `<a class="page-link border-0 bg-transparent ${paginaActual >= totalPaginas - 1 ? 'text-muted' : 'text-dark'}" href="#"><i class="bi bi-chevron-right"></i></a>`;
    liSig.addEventListener("click", (e) => {
        e.preventDefault();
        if (paginaActual < totalPaginas - 1) { paginaActual++; cargarDatos(); }
    });
    contenedorPaginacion.appendChild(liSig);
}

function agregarBotonPagina(i) {
    const li = document.createElement("li");
    const esActiva = i === paginaActual;
    li.className = `page-item ${esActiva ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link border-0 ${esActiva ? 'bg-primary text-white rounded-circle' : 'bg-transparent text-dark'}" href="#">${i + 1}</a>`;
    li.addEventListener("click", (e) => {
        e.preventDefault();
        if (paginaActual !== i) {
            paginaActual = i;
            cargarDatos();
        }
    });
    contenedorPaginacion.appendChild(li);
}

function agregarEllipsis() {
    const li = document.createElement("li");
    li.className = "page-item disabled";
    li.innerHTML = `<span class="page-link border-0 bg-transparent text-muted px-1">...</span>`;
    contenedorPaginacion.appendChild(li);
}

// La búsqueda usa debounce para no consultar la API por cada tecla. Los filtros
// cerrados pueden recargar inmediatamente y todos regresan a la primera página.
let debounceTimer;
if (inputBusqueda) {
    inputBusqueda.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => { paginaActual = 0; cargarDatos(); }, 300);
    });
}

if (selectCalificacion) {
    selectCalificacion.addEventListener("change", () => { paginaActual = 0; cargarDatos(); });
}

if (inputFecha) {
    inputFecha.addEventListener("change", () => { paginaActual = 0; cargarDatos(); });
}
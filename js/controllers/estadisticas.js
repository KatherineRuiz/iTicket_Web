import { obtenerMetricas, obtenerAlertas, obtenerEquiposMasReportados } from "../services/estadisticasService.js";
import { mostrarError } from "../components/sweetAlerts.js";

let graficos = [];

// Paginación Alertas
let paginaAlertas = 0;
const TAMANO_PAGINA_ALERTAS = 5;
let totalPaginasAlertas = 0;

// Paginación Equipos
let paginaEquipos = 0;
const TAMANO_PAGINA_EQUIPOS = 5;
let totalPaginasEquipos = 0;

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function formatearHoras(horasDecimales) {
    if (horasDecimales == null || isNaN(horasDecimales) || horasDecimales <= 0) return '0m';
    const totalMinutos = Math.round(horasDecimales * 60);
    const dias = Math.floor(totalMinutos / (60 * 24));
    const horas = Math.floor((totalMinutos % (60 * 24)) / 60);
    const mins = totalMinutos % 60;
    if (dias > 0) return `${dias}d ${horas}h`;
    if (horas > 0) return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
    return `${mins}m`;
}

function generarEstrellasHTML(calificacion) {
    if (calificacion == null || isNaN(calificacion)) return '—';
    const entero = Math.floor(calificacion);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= entero) {
            html += '<i class="bi bi-star-fill text-warning me-1"></i>';
        } else if (i - calificacion <= 0.5) {
            html += '<i class="bi bi-star-half text-warning me-1"></i>';
        } else {
            html += '<i class="bi bi-star text-muted opacity-50 me-1"></i>';
        }
    }
    return html;
}

function formatearFechaAmigable(fechaIso) {
    if (!fechaIso) return '—';
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function destruirGraficos() {
    graficos.forEach(g => g.destroy());
    graficos = [];
}

// ============================================================
// CARGA PRINCIPAL
// ============================================================

async function cargarMetricas() {
    const fechaInicio = document.getElementById('fechaInicio')?.value || '';
    const fechaFin = document.getElementById('fechaFin')?.value || '';

    try {
        // Cargar métricas, alertas y equipos en paralelo para mayor fluidez
        const [dataMetricas, dataAlertas, dataEquipos] = await Promise.all([
            obtenerMetricas(fechaInicio, fechaFin, paginaAlertas, TAMANO_PAGINA_ALERTAS),
            obtenerAlertas(fechaInicio, fechaFin, paginaAlertas, TAMANO_PAGINA_ALERTAS),
            obtenerEquiposMasReportados(fechaInicio, fechaFin, paginaEquipos, TAMANO_PAGINA_EQUIPOS)
        ]);

        if (dataMetricas) {
            renderizarGraficosYKPIs(dataMetricas);
        }

        if (dataAlertas) {
            renderizarTablaAlertas(dataAlertas);
        } else {
            renderizarTablaAlertas({ content: [], totalPages: 0 });
        }

        if (dataEquipos) {
            renderizarTablaEquipos(dataEquipos);
        } else {
            renderizarTablaEquipos({ content: [], totalPages: 0 });
        }

    } catch (error) {
        console.error(' [Controller] Error en cargarMetricas:', error);
        renderizarTablaAlertas({ content: [], totalPages: 0 });
        renderizarTablaEquipos({ content: [], totalPages: 0 });
    }
}

// ============================================================
// RENDERIZADO DE GRÁFICAS Y KPIS
// ============================================================

function renderizarGraficosYKPIs(data) {
    destruirGraficos();
    const { tickets, evaluaciones, ticketsPorPrioridad, ticketsPorMes, satisfaccionPorTecnico } = data;

    // ----- KPIs -----
    const elTotalTickets = document.getElementById('kpi_total_tickets');
    if (elTotalTickets) elTotalTickets.textContent = tickets?.totalTickets ?? 0;

    const elCsat = document.getElementById('kpi_csat_general');
    if (elCsat) {
        const csatVal = evaluaciones?.promedioCsat;
        if (csatVal != null) {
            elCsat.innerHTML = `${csatVal.toFixed(1)} <span class="fs-5 fw-semibold text-muted">/ 5.0</span>`;
            const contenedorEstrellas = document.getElementById('contenedor_estrellas_csat');
            if (contenedorEstrellas) contenedorEstrellas.innerHTML = generarEstrellasHTML(csatVal);
        } else {
            elCsat.innerHTML = '<span class="fs-5 fw-semibold text-muted">Sin datos</span>';
        }
    }

    const elTiempoMedio = document.getElementById('kpi_tiempo_resolucion');
    if (elTiempoMedio) {
        elTiempoMedio.textContent = formatearHoras(tickets?.tiempoMedioResolucionHoras);
    }

    Chart.defaults.font.family = "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    Chart.defaults.color = '#6c757d';

    // 1. Gráfica de Satisfacción por Técnico
    const ctxSatisfaccion = document.getElementById('grafica_satisfaccion');
    if (ctxSatisfaccion) {
        const tecnicos = satisfaccionPorTecnico || [];
        const labels = tecnicos.map(item => item.tecnico || 'Desconocido');
        const datos = tecnicos.map(item => item.promedio || 0);

        const chartSatisfaccion = new Chart(ctxSatisfaccion, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Sin datos'],
                datasets: [{
                    label: 'Puntuación Promedio',
                    data: labels.length ? datos : [0],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { beginAtZero: true, max: 5 } },
                plugins: { legend: { display: false } }
            }
        });
        graficos.push(chartSatisfaccion);
    }

    // 2. Gráfica de Total de Estrellas
    const ctxEstrellas = document.getElementById('grafica_estrellas');
    if (ctxEstrellas) {
        const e = evaluaciones || {};
        const chartEstrellas = new Chart(ctxEstrellas, {
            type: 'pie',
            data: {
                labels: ['5 Estrellas', '4 Estrellas', '3 Estrellas', '1-2 Estrellas'],
                datasets: [{
                    data: [e.estrellas5 || 0, e.estrellas4 || 0, e.estrellas3 || 0, e.estrellas1y2 || 0],
                    backgroundColor: ['#43a1ff', '#b2f5b2', '#ffe173', '#ff8484'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'left' } }
            }
        });
        graficos.push(chartEstrellas);
    }

    // 3. Gráfica de Tickets por Prioridad
    const ctxPrioridades = document.getElementById('grafica_prioridades');
    if (ctxPrioridades) {
        const prioridades = ticketsPorPrioridad || [];
        const labels = prioridades.map(p => p.prioridad || 'Sin prioridad');
        const datos = prioridades.map(p => p.cantidad || 0);

        const chartPrioridades = new Chart(ctxPrioridades, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['Sin datos'],
                datasets: [{
                    data: labels.length ? datos : [1],
                    backgroundColor: ['#ff8484', '#b2f5b2', '#ffe173', '#ffbc66', '#43a1ff'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: { legend: { position: 'right' } }
            }
        });
        graficos.push(chartPrioridades);
    }

    // 4. Gráfica Histórico 
    const ctxHistorico = document.getElementById('grafica_historico');
    if (ctxHistorico) {
        const meses = ticketsPorMes || [];
        const labels = meses.map(m => `${m.mes} ${m.year}`);
        const creados = meses.map(m => m.creados || 0);
        const resueltos = meses.map(m => m.resueltos || 0);
        const vencidos = meses.map(m => m.vencidos || 0);

        const crearGradiente = (r, g, b) => (context) => {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`);
            gradient.addColorStop(1, `rgba(255, 255, 255, 0.07)`);
            return gradient;
        };

        const chartHistorico = new Chart(ctxHistorico, {
            type: 'line',
            data: {
                labels: labels.length ? labels : ['Sin datos'],
                datasets: [
                    {
                        label: 'Vencidos',
                        data: labels.length ? vencidos : [0],
                        borderColor: '#FBBABA',
                        fill: true,
                        tension: 0.4,
                        backgroundColor: crearGradiente(251, 186, 186)
                    },
                    {
                        label: 'Creados',
                        data: labels.length ? creados : [0],
                        borderColor: '#CAEBFF',
                        fill: true,
                        tension: 0.4,
                        backgroundColor: crearGradiente(202, 235, 255)
                    },
                    {
                        label: 'Resueltos',
                        data: labels.length ? resueltos : [0],
                        borderColor: '#D4FFCA',
                        fill: true,
                        tension: 0.4,
                        backgroundColor: crearGradiente(212, 255, 202)
                    }
                ]
            },
            options: {
                animation: { duration: 2000, easing: 'easeOutQuart' },
                responsive: true,
                resizeDelay: 200,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'top' } },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } }
                }
            }
        });
        graficos.push(chartHistorico);
    }
}

// ============================================================
// RENDERIZADO DE TABLA DE ALERTAS
// ============================================================

function renderizarTablaAlertas(pageData) {
    const tbodyAlertas = document.getElementById('tablaEvaluaciones');
    const contenedorPaginacion = document.getElementById('contenedorPaginacion');
    const textoContador = document.getElementById('textoContador');

    if (!tbodyAlertas) return;
    tbodyAlertas.innerHTML = '';

    const lista = pageData?.content || [];
    totalPaginasAlertas = pageData?.totalPages || 0;

    if (lista.length === 0) {
        tbodyAlertas.innerHTML = '<tr><td colspan="7" class="text-muted text-center py-4">No hay evaluaciones insatisfechas</td></tr>';
        if (contenedorPaginacion) contenedorPaginacion.innerHTML = "";
        if (textoContador) textoContador.textContent = "Mostrando 0 de 0";
        return;
    }

    lista.forEach(ev => {
        const fila = document.createElement('tr');
        const puntos = Math.round(ev.calificacion || 0);
        let estrellasHTML = "";
        for (let i = 1; i <= 5; i++) {
            estrellasHTML += i <= puntos
                ? '<i class="bi bi-star-fill text-warning me-1"></i>'
                : '<i class="bi bi-star text-muted opacity-50 me-1"></i>';
        }

        // Campos del backend (AlertaInsatisfaccionDTO):
        // codigoTicket, asunto, usuario, tecnico, calificacion, comentario, fechaEvaluacion
        fila.innerHTML = `
            <td class="fw-semibold text-primary">${ev.codigoTicket || '—'}</td>
            <td class="text-truncate" style="max-width: 150px;" title="${ev.asunto || ''}">${ev.asunto || 'Sin asunto'}</td>
            <td class="text-truncate" style="max-width: 150px;">${ev.usuario || 'Sin usuario'}</td>
            <td>${ev.tecnico || 'No asignado'}</td>
            <td><div class="text-nowrap">${estrellasHTML}</div></td>
            <td class="text-secondary small text-start text-truncate" style="max-width: 200px;" title="${ev.comentario || ''}">${ev.comentario || 'Sin comentario'}</td>
            <td class="text-muted small">${formatearFechaAmigable(ev.fechaEvaluacion)}</td>
        `;
        tbodyAlertas.appendChild(fila);
    });

    if (textoContador) {
        const totalElementos = pageData?.totalElements || lista.length;
        textoContador.textContent = `Mostrando página ${paginaAlertas + 1} de ${totalPaginasAlertas} (${totalElementos} registros)`;
    }

    if (contenedorPaginacion) {
        let paginacionHTML = '';
        
        paginacionHTML += `
            <li class="page-item ${paginaAlertas === 0 ? 'disabled' : ''}">
                <a class="page-link border-0 shadow-sm rounded-1 text-secondary px-2 btn-pag" href="#" data-page="${paginaAlertas - 1}">&laquo;</a>
            </li>
        `;

        for (let i = 0; i < totalPaginasAlertas; i++) {
            const isActiveClass = i === paginaAlertas ? 'bg-primary text-white fw-bold' : 'text-secondary';
            const activeLi = i === paginaAlertas ? 'active' : '';
            paginacionHTML += `
                <li class="page-item ${activeLi}">
                    <a class="page-link border-0 shadow-sm rounded-1 ${isActiveClass} btn-pag" href="#" data-page="${i}">${i + 1}</a>
                </li>
            `;
        }

        paginacionHTML += `
            <li class="page-item ${paginaAlertas >= totalPaginasAlertas - 1 ? 'disabled' : ''}">
                <a class="page-link border-0 shadow-sm rounded-1 text-secondary px-2 btn-pag" href="#" data-page="${paginaAlertas + 1}">&raquo;</a>
            </li>
        `;

        contenedorPaginacion.innerHTML = paginacionHTML;

        document.querySelectorAll('.btn-pag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const nuevaPagina = parseInt(e.currentTarget.getAttribute('data-page'));
                if (!isNaN(nuevaPagina) && nuevaPagina !== paginaAlertas && nuevaPagina >= 0 && nuevaPagina < totalPaginasAlertas) {
                    paginaAlertas = nuevaPagina;
                    cargarMetricas();
                }
            });
        });
    }
}

// ============================================================
// RENDERIZADO DE TABLA DE EQUIPOS MÁS REPORTADOS
// ============================================================

function renderizarTablaEquipos(pageData) {
    const tbodyEquipos = document.getElementById('tbody_equipos_reportados');
    const contenedorPaginacion = document.getElementById('contenedorPaginacionEquipos');
    const textoContador = document.getElementById('textoContadorEquipos');

    if (!tbodyEquipos) return;
    tbodyEquipos.innerHTML = '';

    const lista = pageData?.content || [];
    totalPaginasEquipos = pageData?.totalPages || 0;

    if (lista.length === 0) {
        tbodyEquipos.innerHTML = '<tr><td colspan="6" class="text-muted text-center py-4">No hay datos de equipos reportados</td></tr>';
        if (contenedorPaginacion) contenedorPaginacion.innerHTML = "";
        if (textoContador) textoContador.textContent = "Mostrando 0 de 0";
        return;
    }

    lista.forEach(eq => {
        const fila = document.createElement('tr');

        // Campos del backend (ReportadosDTO):
        // codigoEquipo, ubicacion, modeloMarca, categoria, numeroTickets, estadoGeneral
        // estadoGeneral viene como: "Normal", "Atención" o "Crítico"
        let badgeClass = 'bg-secondary';
        if (eq.estadoGeneral === 'Normal') badgeClass = 'bg-success';
        if (eq.estadoGeneral === 'Atención') badgeClass = 'bg-warning text-dark';
        if (eq.estadoGeneral === 'Crítico') badgeClass = 'bg-danger';

        fila.innerHTML = `
            <td class="fw-semibold text-primary">${eq.codigoEquipo || '—'}</td>
            <td>${eq.ubicacion || '—'}</td>
            <td>${eq.modeloMarca || '—'}</td>
            <td>${eq.categoria || '—'}</td>
            <td class="fw-bold">${eq.numeroTickets ?? 0}</td>
            <td><span class="badge ${badgeClass} px-2 py-1">${eq.estadoGeneral || '—'}</span></td>
        `;
        tbodyEquipos.appendChild(fila);
    });

    if (textoContador) {
        const totalElementos = pageData?.totalElements || lista.length;
        textoContador.textContent = `Mostrando página ${paginaEquipos + 1} de ${totalPaginasEquipos} (${totalElementos} registros)`;
    }

    if (contenedorPaginacion) {
        let paginacionHTML = '';

        paginacionHTML += `
            <li class="page-item ${paginaEquipos === 0 ? 'disabled' : ''}">
                <a class="page-link border-0 shadow-sm rounded-1 text-secondary px-2 btn-pag-equipos" href="#" data-page="${paginaEquipos - 1}">&laquo;</a>
            </li>
        `;

        for (let i = 0; i < totalPaginasEquipos; i++) {
            const isActiveClass = i === paginaEquipos ? 'bg-primary text-white fw-bold' : 'text-secondary';
            const activeLi = i === paginaEquipos ? 'active' : '';
            paginacionHTML += `
                <li class="page-item ${activeLi}">
                    <a class="page-link border-0 shadow-sm rounded-1 ${isActiveClass} btn-pag-equipos" href="#" data-page="${i}">${i + 1}</a>
                </li>
            `;
        }

        paginacionHTML += `
            <li class="page-item ${paginaEquipos >= totalPaginasEquipos - 1 ? 'disabled' : ''}">
                <a class="page-link border-0 shadow-sm rounded-1 text-secondary px-2 btn-pag-equipos" href="#" data-page="${paginaEquipos + 1}">&raquo;</a>
            </li>
        `;

        contenedorPaginacion.innerHTML = paginacionHTML;

        document.querySelectorAll('.btn-pag-equipos').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const nuevaPagina = parseInt(e.currentTarget.getAttribute('data-page'));
                if (!isNaN(nuevaPagina) && nuevaPagina !== paginaEquipos && nuevaPagina >= 0 && nuevaPagina < totalPaginasEquipos) {
                    paginaEquipos = nuevaPagina;
                    cargarMetricas();
                }
            });
        });
    }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    cargarMetricas();

    document.getElementById('btnFiltrarFechas')?.addEventListener('click', () => {
        const inputInicio = document.getElementById('fechaInicio').value;
        const inputFin = document.getElementById('fechaFin').value;

        if (inputInicio && inputFin) {
            if (new Date(inputInicio) > new Date(inputFin)) {
                mostrarError("La fecha de inicio no puede ser mayor que la fecha de fin.", "Por favor, ajusta las fechas antes de filtrar.", false);
                return;
            }
        }

        paginaAlertas = 0;
        paginaEquipos = 0;
        cargarMetricas();
    });

    document.getElementById('btnLimpiarFechas')?.addEventListener('click', () => {
        const inputInicio = document.getElementById('fechaInicio');
        const inputFin = document.getElementById('fechaFin');
        if (inputInicio) inputInicio.value = '';
        if (inputFin) inputFin.value = '';
        paginaAlertas = 0;
        paginaEquipos = 0;
        cargarMetricas();
    });

    document.getElementById('btnExportarPDF')?.addEventListener('click', () => {
        console.log("Iniciando exportación a PDF...");
    });
});
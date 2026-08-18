import { getTickets } from "../services/ticketsService.js";
import { obtenerEvaluaciones } from "../services/evaluacionesService.js";

const Meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ESTADOS_RESUELTOS = ['Resuelto', 'Cerrado'];
const ESTADOS_NO_VENCIDOS = ['Resuelto', 'Cerrado', 'Eliminado', 'Vencido'];

let listaTicketsCompleta = [];
let listaEvaluacionesCompleta = [];
let mapaTickets = new Map();
let graficos = [];

function parseFecha(fechaStr) {
    if (!fechaStr) return null;
    const [fecha, hora] = String(fechaStr).split(' ');
    const partes = fecha.split('/');
    if (partes.length < 3) return null;
    const anio = Number(partes[2]);
    const mes = Number(partes[1]) - 1;
    const dia = Number(partes[0]);
    const [hh, mm] = (hora || '00:00').split(':');
    return new Date(anio, mes, dia, Number(hh) || 0, Number(mm) || 0);
}

function mesDe(fecha) {
    const d = fecha instanceof Date ? fecha : parseFecha(fecha);
    return d ? d.getMonth() : -1;
}

function contarPorMes(lista, selector) {
    const conteo = new Array(12).fill(0);
    lista.forEach(item => {
        const mes = mesDe(selector(item));
        if (mes >= 0) conteo[mes]++;
    });
    return conteo;
}

function normalizarPrioridad(prioridad) {
    if (!prioridad) return null;
    const limpia = String(prioridad)
        .toLowerCase()
        .replace(/á/g, 'a')
        .replace(/í/g, 'i')
        .replace(/é/g, 'e')
        .trim();
    const mapa = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' };
    return mapa[limpia] || prioridad;
}

function promedio(lista) {
    if (!lista.length) return 0;
    return lista.reduce((acc, valor) => acc + valor, 0) / lista.length;
}

function formatearTiempo(minutos) {
    if (minutos == null || isNaN(minutos)) return '—';
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    return horas > 0 ? `${String(horas).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m` : `${mins}m`;
}

function esVencido(ticket) {
    if (ticket.estado === 'Vencido') return true;
    if (ESTADOS_NO_VENCIDOS.includes(ticket.estado)) return false;
    const fechaVen = parseFecha(ticket.fechaVencimiento);
    return fechaVen ? fechaVen < new Date() : false;
}

function obtenerTiempoResolucionMin(ticket) {
    const creacion = parseFecha(ticket.fechaCreacion);
    const resolucion = parseFecha(ticket.fechaResolucion);
    if (!creacion || !resolucion) return null;
    return (resolucion - creacion) / 60000;
}

function destruirGraficos() {
    graficos.forEach(grafico => grafico.destroy());
    graficos = [];
}

function renderizar(listaTickets, listaEvaluaciones) {
    destruirGraficos();

    /* ================= KPI ================= */
    const totalTickets = listaTickets.length;

    const calificaciones = listaEvaluaciones.map(e => Number(e.calificacion)).filter(c => !isNaN(c));
    const csat = calificaciones.length ? promedio(calificaciones) : null;

    const tiemposResolucion = listaTickets
        .map(obtenerTiempoResolucionMin)
        .filter(t => t !== null && t >= 0);
    const tiempoMedio = tiemposResolucion.length ? promedio(tiemposResolucion) : null;

    const elTotalTickets = document.getElementById('kpi_total_tickets');
    if (elTotalTickets) elTotalTickets.textContent = totalTickets;

    const elCsat = document.getElementById('kpi_csat_general');
    if (elCsat) {
        elCsat.innerHTML = csat !== null
            ? `${csat.toFixed(1)} <span class="fs-5 fw-semibold text-muted">/ 5.0</span>`
            : '<span class="fs-5 fw-semibold text-muted">Sin datos</span>';
    }

    const elTiempoMedio = document.getElementById('kpi_tiempo_resolucion');
    if (elTiempoMedio) elTiempoMedio.textContent = formatearTiempo(tiempoMedio);

    /* ================= 1. Barras horizontales: satisfacción por técnico ================= */
    const canvasSatisfaccion = document.getElementById('grafica_satisfaccion');
    if (canvasSatisfaccion) {
        const satisfaccionPorTecnico = {};
        listaEvaluaciones.forEach(evaluacion => {
            const ticket = mapaTickets.get(evaluacion.idTicket);
            const nombre = ticket?.nombreTecnico || 'Sin asignar';
            if (!satisfaccionPorTecnico[nombre]) satisfaccionPorTecnico[nombre] = [];
            satisfaccionPorTecnico[nombre].push(Number(evaluacion.calificacion));
        });

        const tecnicos = Object.keys(satisfaccionPorTecnico);
        const datos = tecnicos.map(nombre => promedio(satisfaccionPorTecnico[nombre]));

        graficos.push(new Chart(canvasSatisfaccion, {
            type: 'bar',
            data: {
                labels: tecnicos,
                datasets: [{
                    label: 'Nivel de Satisfacción',
                    data: datos,
                    backgroundColor: (ctx) => ctx.dataIndex % 2 === 0 ? 'rgba(3, 4, 94, 0.8)' : 'rgba(67, 161, 255, 0.8)',
                    borderColor: (ctx) => ctx.dataIndex % 2 === 0 ? 'rgb(3, 4, 94)' : 'rgb(67, 161, 255)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                animation: { duration: 2000, easing: 'easeOutQuart' },
                indexAxis: 'y',
                responsive: true,
                resizeDelay: 200,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, max: 5 },
                    y: { reverse: true }
                }
            }
        }));
    }

    /* ================= 2. Pie: distribución de estrellas ================= */
    const canvasEstrellas = document.getElementById('grafica_estrellas');
    if (canvasEstrellas) {
        const conteoEstrellas = { '5 Estrellas': 0, '4 Estrellas': 0, '3 Estrellas': 0, '1-2 Estrellas': 0 };
        calificaciones.forEach(calificacion => {
            if (calificacion >= 4.5) conteoEstrellas['5 Estrellas']++;
            else if (calificacion >= 3.5) conteoEstrellas['4 Estrellas']++;
            else if (calificacion >= 2.5) conteoEstrellas['3 Estrellas']++;
            else conteoEstrellas['1-2 Estrellas']++;
        });

        graficos.push(new Chart(canvasEstrellas, {
            type: 'pie',
            data: {
                labels: Object.keys(conteoEstrellas),
                datasets: [{
                    data: Object.values(conteoEstrellas),
                    backgroundColor: ['#43a1ff', '#b2f5b2', '#ffe173', '#ff8484'],
                    borderWidth: 5,
                    borderColor: '#F5F7FA',
                    borderRadius: 5,
                    hoverOffset: 10,
                    radius: '105%'
                }]
            },
            options: {
                animation: { animateRotate: true, animateScale: true, duration: 2000, easing: 'easeOutCirc' },
                responsive: true,
                resizeDelay: 200,
                maintainAspectRatio: false,
                layout: { padding: 10 },
                plugins: {
                    legend: { position: 'left' },
                    tooltip: { usePointStyle: true, boxPadding: 6 }
                }
            }
        }));
    }

    /* ================= 3. Dona: tickets por prioridad ================= */
    const canvasPrioridades = document.getElementById('grafica_prioridades');
    if (canvasPrioridades) {
        const ordenPrioridades = ['Crítica', 'Alta', 'Media', 'Baja'];
        const conteoPrioridades = { 'Crítica': 0, 'Alta': 0, 'Media': 0, 'Baja': 0 };
        listaTickets.forEach(ticket => {
            const prioridad = normalizarPrioridad(ticket.prioridad);
            if (prioridad && conteoPrioridades[prioridad] !== undefined) {
                conteoPrioridades[prioridad]++;
            }
        });
        const labelsPrioridades = Object.keys(conteoPrioridades).sort(
            (a, b) => ordenPrioridades.indexOf(a) - ordenPrioridades.indexOf(b)
        );
        const valoresPrioridades = labelsPrioridades.map(p => conteoPrioridades[p]);

        graficos.push(new Chart(canvasPrioridades, {
            type: 'doughnut',
            data: {
                labels: labelsPrioridades,
                datasets: [{
                    data: valoresPrioridades,
                    backgroundColor: ['#ff8484', '#ffbc66', '#ffe173', '#b2f5b2'],
                    borderWidth: 5,
                    borderColor: '#F5F7FA',
                    borderRadius: 5,
                    hoverOffset: 15,
                    radius: '90%'
                }]
            },
            options: {
                animation: { animateRotate: true, animateScale: true, duration: 2000, easing: 'easeOutCirc' },
                cutout: '60%',
                responsive: true,
                resizeDelay: 200,
                maintainAspectRatio: false,
                layout: { padding: 10 },
                plugins: {
                    legend: { position: 'right' },
                    tooltip: { usePointStyle: true, boxPadding: 6 }
                }
            }
        }));
    }

    /* ================= 4. Lineas: creados, vencidos y resueltos por mes ================= */
    const canvasHistorico = document.getElementById('grafica_historico');
    if (canvasHistorico) {
        const creados = contarPorMes(listaTickets, t => t.fechaCreacion);

        const vencidos = contarPorMes(listaTickets.filter(esVencido), t => t.fechaVencimiento);

        const resueltos = contarPorMes(
            listaTickets.filter(t => ESTADOS_RESUELTOS.includes(t.estado)),
            t => t.fechaResolucion || t.fechaCreacion
        );

        const crearDataset = (label, datos, color, colorFondo) => ({
            label,
            data: datos,
            borderColor: color,
            fill: true,
            tension: 0.4,
            backgroundColor: (context) => {
                const { ctx, chartArea } = context.chart;
                if (!chartArea) return null;
                const gradiente = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradiente.addColorStop(0, colorFondo);
                gradiente.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
                return gradiente;
            }
        });

        graficos.push(new Chart(canvasHistorico, {
            type: 'line',
            data: {
                labels: Meses,
                datasets: [
                    crearDataset('Vencidos', vencidos, '#FBBABA', 'rgba(251, 186, 186, 0.6)'),
                    crearDataset('Creados', creados, '#CAEBFF', 'rgba(202, 235, 255, 0.6)'),
                    crearDataset('Resueltos', resueltos, '#D4FFCA', 'rgba(212, 255, 202, 0.6)')
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
                    y: { grid: { color: 'rgba(0, 0, 0, 0.05)' } }
                }
            }
        }));
    }

    /* ================= 5. Tabla de alertas de insatisfacción ================= */
    const tbodyAlertas = document.getElementById('tbody_alertas_insatisfaccion');
    if (tbodyAlertas) {
        const alertas = listaEvaluaciones
            .filter(evaluacion => Number(evaluacion.calificacion) < 3)
            .sort((a, b) => Number(a.calificacion) - Number(b.calificacion));

        tbodyAlertas.innerHTML = '';

        const lblAlertaConteo = document.getElementById('lblAlertaConteo');
        if (lblAlertaConteo) lblAlertaConteo.textContent = `Mostrando ${alertas.length} de ${listaEvaluaciones.length}`;

        if (!alertas.length) {
            tbodyAlertas.innerHTML = '<tr><td colspan="4" class="text-muted py-3">Sin alertas de insatisfacción</td></tr>';
        } else {
            alertas.forEach(evaluacion => {
                const ticket = mapaTickets.get(evaluacion.idTicket);
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td class="fw-semibold">${ticket?.codigo || '—'}</td>
                    <td>${ticket?.nombreCreador || '—'}</td>
                    <td>${ticket?.nombreTecnico || '—'}</td>
                    <td>${evaluacion.comentario || '—'} <span class="badge bg-danger-light text-danger ms-1">${Number(evaluacion.calificacion).toFixed(1)}★</span></td>
                `;
                tbodyAlertas.appendChild(fila);
            });
        }
    }
}

function aplicarFiltroFechas() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;

    const inicio = fechaInicio ? new Date(`${fechaInicio}T00:00:00`) : null;
    const fin = fechaFin ? new Date(`${fechaFin}T23:59:59`) : null;

    const ticketsFiltrados = listaTicketsCompleta.filter(ticket => {
        const fecha = parseFecha(ticket.fechaCreacion);
        if (!fecha) return true;
        if (inicio && fecha < inicio) return false;
        if (fin && fecha > fin) return false;
        return true;
    });

    const idsTickets = new Set(ticketsFiltrados.map(t => t.idTicket));
    const evaluacionesFiltradas = listaEvaluacionesCompleta.filter(e => idsTickets.has(e.idTicket));

    renderizar(ticketsFiltrados, evaluacionesFiltradas);
}

async function crearGraficas() {
    const [tickets, evaluaciones] = await Promise.all([getTickets(), obtenerEvaluaciones()]);

    listaTicketsCompleta = Array.isArray(tickets) ? tickets : [];
    listaEvaluacionesCompleta = Array.isArray(evaluaciones) ? evaluaciones : [];
    mapaTickets = new Map(listaTicketsCompleta.map(t => [t.idTicket, t]));

    renderizar(listaTicketsCompleta, listaEvaluacionesCompleta);
}

Promise.all([
    new Promise(resolve => window.addEventListener('load', resolve)),
    document.fonts.ready
]).then(function () {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            crearGraficas();
        });
    });
});

const btnFiltrarFechas = document.getElementById('btnFiltrarFechas');
if (btnFiltrarFechas) {
    btnFiltrarFechas.addEventListener('click', aplicarFiltroFechas);
}

const btnLimpiarFechas = document.getElementById('btnLimpiarFechas');
if (btnLimpiarFechas) {
    btnLimpiarFechas.addEventListener('click', () => {
        document.getElementById('fechaInicio').value = '';
        document.getElementById('fechaFin').value = '';
        renderizar(listaTicketsCompleta, listaEvaluacionesCompleta);
    });
}

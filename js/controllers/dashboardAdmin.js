// ============================================================
// DASHBOARD ADMIN — CONTROLADOR PRINCIPAL
// ============================================================

import {
    obtenerTickets,
    obtenerMetricasDashboard,
    obtenerResumenMensual,
    obtenerResolucionPorDia,
    obtenerTopTecnicosPorCalificacion
} from '../services/dashboardAdminService.js?v=3';

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let todosLosTickets = [];
let graficoResolucionChart = null;

// ============================================================
// UTILIDAD: Parsear fecha en formato ISO o "dd/MM/yyyy HH:mm"
// ============================================================
function parseFecha(fechaStr) {
    if (!fechaStr) return null;
    // Intenta parsear como ISO (ej: "2026-01-28T07:00:00")
    let date = new Date(fechaStr);
    if (!isNaN(date.getTime())) return date;

    // Si falla, intenta con "dd/MM/yyyy HH:mm"
    const partes = fechaStr.split(' ');
    if (partes.length === 2) {
        const fechaPart = partes[0]; // "25/01/2026"
        const horaPart = partes[1];   // "00:00"
        const [dia, mes, anio] = fechaPart.split('/').map(Number);
        const [hora, min] = horaPart.split(':').map(Number);
        date = new Date(anio, mes - 1, dia, hora, min);
        if (!isNaN(date.getTime())) return date;
    }
    return null;
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
const btnCrear = document.getElementById('btnCrear');
if (btnCrear) {
    btnCrear.addEventListener('click', () => {
        window.location.href = 'crearTickets.html';
    });
}

const paginaLista = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise(resolve => window.addEventListener('load', resolve, { once: true }));

Promise.all([paginaLista, document.fonts?.ready || Promise.resolve()]).then(cargarDashboard);

// ============================================================
// CARGA PRINCIPAL (en paralelo)
// ============================================================
async function cargarDashboard() {
    const [ticketsResult, resumenResult, resolucionResult, metricasResult] = await Promise.allSettled([
        obtenerTickets(),
        obtenerResumenMensual(),
        obtenerResolucionPorDia(),
        obtenerMetricasDashboard()
    ]);

    const tickets = ticketsResult.status === 'fulfilled' ? ticketsResult.value : [];
    const resumenMensual = resumenResult.status === 'fulfilled' ? resumenResult.value : null;
    const resolucionDia = resolucionResult.status === 'fulfilled' ? resolucionResult.value : [];
    const metricas = metricasResult.status === 'fulfilled' ? metricasResult.value : null;

    if (ticketsResult.status === 'rejected') console.error('[Dashboard] Tickets:', ticketsResult.reason);
    if (resumenResult.status === 'rejected') console.error('[Dashboard] Resumen mensual:', resumenResult.reason);
    if (resolucionResult.status === 'rejected') console.error('[Dashboard] Resolución diaria:', resolucionResult.reason);
    if (metricasResult.status === 'rejected') console.error('[Dashboard] Calificaciones por técnico:', metricasResult.reason);

        // 1. Contadores de abiertos/cerrados desde el backend
        if (resumenMensual) {
            poblarContadoresDesdeResumen(resumenMensual);
        } else {
            console.warn('No se pudo obtener el resumen mensual, los contadores quedarán en 0');
        }

        // 2. Panel de evaluaciones (pendientes/vencidos/hoy) usa todos los tickets
        if (tickets && Array.isArray(tickets)) {
            poblarPanelEvaluaciones(tickets);
        }

        // 3. Técnicos ordenados por el promedio real de sus evaluaciones.
        const calificaciones = metricas?.satisfaccionPorTecnico || [];
        poblarMejoresTecnicos(obtenerTopTecnicosPorCalificacion(calificaciones));

        // 4. Gráfico de resolución por día (si el endpoint existe)
        if (resolucionDia) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    crearGraficoResolucion(resolucionDia);
                });
            });
        } else {
            // Si no hay datos, mostrar gráfico vacío o con valores cero
            crearGraficoResolucion([]);
        }

}

// ============================================================
// 1. CONTADORES DESDE EL RESUMEN DEL BACKEND
// ============================================================
function poblarContadoresDesdeResumen(resumen) {
    if (!resumen) return;
    document.getElementById('numTicketsAbiertos').textContent = resumen.ticketsAbiertos ?? 0;
    document.getElementById('numTicketsCerrados').textContent = resumen.ticketsCerrados ?? 0;
}

// ============================================================
// 2. NUESTROS MEJORES TÉCNICOS (Top 3 del carrusel)
// ============================================================
function poblarMejoresTecnicos(top3) {
    const tecnicos = Array.isArray(top3) ? top3.slice(0, 3) : [];
    const items = Array.from(document.querySelectorAll('#carruselTecnicos .carousel-item'));

    if (tecnicos.length === 0 && items[0]) {
        items.forEach((item, indice) => {
            item.classList.toggle('d-none', indice !== 0);
            item.classList.toggle('active', indice === 0);
        });
        const nombre = document.getElementById('txtNombreTecnico1');
        const total = document.getElementById('txtTicketsTecnico1');
        if (nombre) nombre.textContent = 'Sin datos disponibles';
        if (total) total.textContent = 'Aún no hay evaluaciones';
        document.querySelectorAll('#carruselTecnicos .carousel-control-prev, #carruselTecnicos .carousel-control-next')
            .forEach((control) => control.classList.add('d-none'));
        return;
    }

    items.forEach((item, indice) => {
        const tecnico = tecnicos[indice];
        const nombre = document.getElementById(`txtNombreTecnico${indice + 1}`);
        const total = document.getElementById(`txtTicketsTecnico${indice + 1}`);

        item.classList.toggle('d-none', !tecnico);
        item.classList.remove('active');
        if (!tecnico) {
            if (nombre) nombre.textContent = 'Sin datos';
            if (total) total.textContent = 'Sin calificación';
            return;
        }

        if (nombre) nombre.textContent = tecnico.tecnico;
        if (total) {
            const promedio = Number(tecnico.promedio || 0).toFixed(1);
            total.textContent = `Calificación ${promedio} de 5`;
        }
    });

    const primerItemVisible = items.find((item) => !item.classList.contains('d-none'));
    if (primerItemVisible) primerItemVisible.classList.add('active');

    const controles = document.querySelectorAll('#carruselTecnicos .carousel-control-prev, #carruselTecnicos .carousel-control-next');
    controles.forEach((control) => control.classList.toggle('d-none', tecnicos.length <= 1));
}

// ============================================================
// 3. PANEL DE EVALUACIONES (Pendientes / Vencidos / Vencen hoy)
// ============================================================
function poblarPanelEvaluaciones(tickets) {
    if (!Array.isArray(tickets)) return;

    todosLosTickets = tickets;

    const ahora = new Date();
    const estadosFinalizados = ['resuelto', 'cerrado', 'cancelado'];

    const pendientes = [];
    const vencidos = [];
    const vencenHoy = [];

    tickets.forEach(t => {
        const estado = String(t.estado || '').trim().toLowerCase();
        const esNoFinalizado = !estadosFinalizados.includes(estado);

        // Las tres categorías describen trabajo todavía activo. Un ticket que
        // ya fue resuelto, cerrado o cancelado no debe reaparecer únicamente
        // porque su fecha de vencimiento quedó en el pasado.
        if (!esNoFinalizado) return;
        pendientes.push(t);

        if (t.fechaVencimiento) {
            const fechaVenc = parseFecha(t.fechaVencimiento);
            if (!fechaVenc) return;

            // La hora forma parte del vencimiento: si pasó hace un minuto ya
            // cuenta como vencido, aunque todavía sea el mismo día.
            if (fechaVenc.getTime() < ahora.getTime()) {
                vencidos.push(t);
            } else if (
                fechaVenc.getFullYear() === ahora.getFullYear()
                && fechaVenc.getMonth() === ahora.getMonth()
                && fechaVenc.getDate() === ahora.getDate()
            ) {
                vencenHoy.push(t);
            }
        }
    });

    document.getElementById('num-pendientes').textContent = pendientes.length;
    document.getElementById('num-vencidas').textContent = vencidos.length;
    document.getElementById('num-hoy').textContent = vencenHoy.length;

    window._categorias = { pendientes, vencidos, hoy: vencenHoy };

    renderizarListaTickets(pendientes);
}

// ============================================================
// RENDERIZADO DE LISTA DE TICKETS
// ============================================================
function renderizarListaTickets(lista) {
    const contenedor = document.getElementById('listaTicketsDashboard');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    if (!lista || lista.length === 0) {
        contenedor.innerHTML = '<p class="text-muted text-center py-4">No hay tickets en esta categoría</p>';
        return;
    }

    lista.forEach((t, index) => {
        const prioridad = (t.prioridad || 'Media').toLowerCase();
        const config = {
            'crítica':  { borde: 'border-start-critical',  badge: 'bg-danger-light text-danger' },
            'critica':  { borde: 'border-start-critical',  badge: 'bg-danger-light text-danger' },
            'alta':     { borde: 'border-start-high',      badge: 'bg-warning-light text-warning' },
            'media':    { borde: 'border-start-medium',    badge: 'bg-warning-light-2 text-warning-oscuro' },
            'baja':     { borde: 'border-start-low',       badge: 'bg-success-light text-success' }
        };
        const c = config[prioridad] || config['media'];
        const iconoPrioridad = window.obtenerClaseIconoTicket?.(t.prioridad)
            || 'icono-ticket-prioridad-sin-asignar';

        const fechaVenc = t.fechaVencimiento || 'Sin fecha';
        const desc = t.descripcion
            ? (t.descripcion.length > 60 ? t.descripcion.substring(0, 60) + '...' : t.descripcion)
            : 'Sin descripción';

        const div = document.createElement('div');
        div.className = `elemento-ticket ${c.borde} p-3 ${index === lista.length - 1 ? 'mb-0' : 'mb-3'} rounded-3 shadow-sm d-flex justify-content-between align-items-start`;
        div.innerHTML = `
            <div>
                <h6 class="fw-bold mb-1">
                    <i class="bi bi-ticket-perforated ${iconoPrioridad} me-2"></i>${t.asunto || 'Sin asunto'}
                </h6>
                <small class="text-muted d-block">#${t.codigo || '—'}</small>
                <small class="text-muted d-block mt-1"><b>Estado:</b> ${t.estado || '—'}</small>
                <small class="text-muted d-block"><b>Vence:</b> ${fechaVenc}</small>
                <small class="text-muted d-block mt-1"><b>Descripción:</b> ${desc}</small>
            </div>
            <span class="badge ${c.badge} rounded-pill px-3 py-2">${t.prioridad || 'Media'}</span>
        `;
        contenedor.appendChild(div);
    });
}

// ============================================================
// 4. GRÁFICA DE TIEMPO DE RESOLUCIÓN POR DÍA DE SEMANA
// ============================================================
function crearGraficoResolucion(data) {
    if (typeof Chart === 'undefined') {
        console.error('[Dashboard] Chart.js no terminó de cargar.');
        return;
    }
    const canvas = document.getElementById('graficoResolucion');
    if (!canvas) return;

    if (graficoResolucionChart) {
        graficoResolucionChart.destroy();
    }

    const diasOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const oracleToIndex = { '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '1': 6 };

    const horas = [0, 0, 0, 0, 0, 0, 0];

    if (Array.isArray(data)) {
        data.forEach(row => {
            if (row && row.length >= 2) {
                const diaClave = String(row[0]).trim();
                const promedio = parseFloat(row[1]) || 0;
                const idx = oracleToIndex[diaClave];
                if (idx !== undefined) {
                    horas[idx] = Math.round(promedio * 10) / 10;
                }
            }
        });
    }

    const ctx = canvas.getContext('2d');
    graficoResolucionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: diasOrden,
            datasets: [{
                label: 'Horas promedio',
                data: horas,
                backgroundColor: ['#539ECD','#90BFDB','#184E8C','#539ECD','#90BFDB','#184E8C','#539ECD'],
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 200,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#EAEAEA' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ============================================================
// BOTONES DE FILTRO (Pendientes / Vencidos / Vencen hoy)
// ============================================================
const botonesResumen = document.querySelectorAll('.btn-resumen');
botonesResumen.forEach(boton => {
    boton.addEventListener('click', function () {
        botonesResumen.forEach(b => b.classList.remove('activo'));
        this.classList.add('activo');

        const opcion = this.getAttribute('data-opcion');
        const categorias = window._categorias || {};

        switch (opcion) {
            case 'pendientes':
                renderizarListaTickets(categorias.pendientes || []);
                break;
            case 'vencidos':
                renderizarListaTickets(categorias.vencidos || []);
                break;
            case 'hoy':
                renderizarListaTickets(categorias.hoy || []);
                break;
            default:
                renderizarListaTickets(categorias.pendientes || []);
                break;
        }
    });
});

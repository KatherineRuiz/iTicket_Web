/*
 * DASHBOARD DE USUARIO
 * Obtiene el id desde la sesión, consulta tickets y las métricas ya
 * calculadas por el backend (calificaciones y tiempo promedio) en paralelo,
 * y entrega esos datos al servicio de transformación. Antes de pintar una
 * gráfica destruye su instancia anterior para evitar canvas duplicados.
 */
import { obtenerUsuarioLogueado } from '../utils/sesion.js';
import { formatearFecha12H } from '../utils/formateadores.js';
import {
    obtenerTodosLosTicketsDelUsuario,
    obtenerCalificacionesUsuario,
    obtenerTiempoPromedioUsuario,
    construirResumenUsuario
} from '../services/dashboardUsuarioService.js?v=4';

let graficoTicketsInstance = null;
let graficoEvaluacionesInstance = null;

const RESUMEN_VACIO = { prioridades: [0, 0, 0, 0, 0], calificaciones: [0, 0, 0, 0, 0], tiempoPromedio: 0, ultimosTickets: [] };

function iniciarDashboardUsuario() {
    // El botón de bienvenida lleva al flujo existente para crear un ticket.
    document.querySelector('.btn-oscuro')?.addEventListener('click', function () {
        window.location.href = 'crearTickets.html';
    });
    cargarDashboardUsuario();
}

// El script puede entrar cuando DOMContentLoaded ya fue emitido (por caché o
// navegación rápida). En ese caso se inicia inmediatamente.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarDashboardUsuario, { once: true });
} else {
    iniciarDashboardUsuario();
}

// Promise.allSettled permite seguir mostrando tickets aunque fallen datos
// secundarios como calificaciones o tiempo promedio. Los fallos se convierten en valores por defecto.
async function cargarDashboardUsuario() {
    const usuario = obtenerUsuarioLogueado();
    if (!usuario?.idUsuario) {
        renderizarDashboard(RESUMEN_VACIO);
        return;
    }

    const [ticketsResult, calificacionesResult, tiempoResult] = await Promise.allSettled([
        obtenerTodosLosTicketsDelUsuario(usuario.idUsuario),
        obtenerCalificacionesUsuario(usuario.idUsuario),
        obtenerTiempoPromedioUsuario(usuario.idUsuario)
    ]);

    if (ticketsResult.status === 'rejected') {
        console.error('[Dashboard usuario] Tickets:', ticketsResult.reason);
        renderizarDashboard(RESUMEN_VACIO);
        return;
    }

    const calificaciones = calificacionesResult.status === 'fulfilled' ? calificacionesResult.value : [0, 0, 0, 0, 0];
    const tiempoPromedio = tiempoResult.status === 'fulfilled' ? tiempoResult.value : 0;
    if (calificacionesResult.status === 'rejected') console.error('[Dashboard usuario] Calificaciones:', calificacionesResult.reason);
    if (tiempoResult.status === 'rejected') console.error('[Dashboard usuario] Tiempo promedio:', tiempoResult.reason);

    renderizarDashboard(construirResumenUsuario(ticketsResult.value, calificaciones, tiempoPromedio));
}

// Actualiza texto, la lista de últimos tickets y recrea las gráficas. destroy
// es indispensable porque Chart.js no permite dos instancias activas sobre el mismo canvas.
function renderizarDashboard(resumen) {
    const tiempoPromedio = document.getElementById('tiempoPromedio');
    if (tiempoPromedio) tiempoPromedio.textContent = resumen.tiempoPromedio;

    renderizarUltimosTickets(resumen.ultimosTickets || []);

    if (graficoTicketsInstance) graficoTicketsInstance.destroy();
    if (graficoEvaluacionesInstance) graficoEvaluacionesInstance.destroy();

    if (typeof Chart === 'undefined') {
        console.error('[Dashboard usuario] Chart.js no terminó de cargar.');
        return;
    }

    const graficoTickets = document.getElementById('graficoTickets');
    if (graficoTickets) {
        graficoTicketsInstance = new Chart(graficoTickets.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['No asignada', 'Baja', 'Media', 'Alta', 'Crítica'],
                datasets: [{
                    label: 'Cantidad',
                    data: resumen.prioridades,
                    backgroundColor: ['#90BFDB', '#D4FFCA', '#ffe173', '#ffbc66', '#ff8484'],
                    borderWidth: 0,
                    borderRadius: 8,
                    maxBarThickness: 45
                }]
            },
            options: opcionesGrafico(false)
        });
    }

    const graficoEvaluacion = document.getElementById('graficoEvaluacion');
    if (graficoEvaluacion) {
        graficoEvaluacionesInstance = new Chart(graficoEvaluacion.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['5 Estrellas', '4 Estrellas', '3 Estrellas', '2 Estrellas', '1 Estrella'],
                datasets: [{
                    label: 'Evaluaciones',
                    data: resumen.calificaciones,
                    backgroundColor: ['#0D3B6E', '#184E8C', '#2E6DAE', '#539ECD', '#90BFDB'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: opcionesGrafico(true)
        });
    }
}

// ---------- LISTA "ÚLTIMOS TICKETS" (los 5 más recientes del usuario) ----------
function renderizarUltimosTickets(tickets) {
    const contenedor = document.getElementById('listaUltimosTickets');
    if (!contenedor) return;

    if (!tickets || tickets.length === 0) {
        contenedor.innerHTML = '<p class="text-muted text-center py-4 mb-0">Aún no has creado tickets</p>';
        return;
    }

    contenedor.innerHTML = tickets.map((ticket) => {
        const prioridad = ticket.prioridad || '';
        const iconoPrioridad = window.obtenerClaseIconoTicket?.(prioridad)
            || 'icono-ticket-prioridad-sin-asignar';

        return `
            <article data-id="${ticket.idTicket}" class="lista-tickets ticket-usuario-item position-relative shadow-sm bg-white borde-lateral-${prioridad} rounded-3 p-3 mb-3">
                <div class="elemento-ticket-asignado">
                    <div class="ticket-usuario-cabecera">
                        <h6 class="ticket-usuario-titulo fw-bold mb-1 fs-6">
                            <i class="bi bi-ticket-perforated ${iconoPrioridad}"></i>
                            <span>${ticket.asunto || 'Sin asunto'}</span>
                        </h6>
                        ${prioridad ? `<span class="ticket-usuario-prioridad rounded-pill badge prioridad-${prioridad} px-3 py-2">${prioridad}</span>` : ''}
                    </div>
                    <small class="text-muted d-block mb-2">${ticket.codigo || '—'}</small>
                    <small class="text-muted d-block"><b>Estado: </b>${ticket.estado || '—'}</small>
                    <small class="text-muted d-block"><b>Creado: </b>${formatearFecha12H(ticket.fechaCreacion)}</small>
                </div>
            </article>
        `;
    }).join('');
}

document.getElementById('listaUltimosTickets')?.addEventListener('click', (evento) => {
    const tarjeta = evento.target.closest('.lista-tickets');
    if (!tarjeta) return;
    const idTicket = tarjeta.dataset.id;
    if (idTicket) window.location.href = `vistaTicket.html?id=${idTicket}`;
});

// Comparte animación y comportamiento responsive. La gráfica de barras recibe
// ejes; la circular recibe leyenda inferior y no necesita escalas.
function opcionesGrafico(mostrarLeyenda) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 120,
        animation: { duration: 650, easing: 'easeOutQuart' },
        plugins: {
            legend: {
                display: mostrarLeyenda,
                position: 'bottom',
                labels: { boxWidth: 15, font: { size: 12 } }
            }
        },
        scales: mostrarLeyenda ? undefined : {
            y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#EAEAEA' } },
            x: { grid: { display: false } }
        }
    };
}

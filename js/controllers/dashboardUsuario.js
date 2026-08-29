/*
 * DASHBOARD DE USUARIO
 * Obtiene el id desde la sesión, consulta tickets/evaluaciones/bitácoras en
 * paralelo y entrega esos datos al servicio de transformación. Antes de pintar
 * una gráfica destruye su instancia anterior para evitar canvas duplicados.
 */
import { obtenerUsuarioLogueado } from '../utils/sesion.js';
import {
    obtenerTodosLosTicketsDelUsuario,
    obtenerEvaluacionesParaDashboard,
    obtenerBitacorasParaDashboard,
    construirResumenUsuario
} from '../services/dashboardUsuarioService.js?v=2';

let graficoTicketsInstance = null;
let graficoEvaluacionesInstance = null;

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
// secundarios como evaluaciones o bitácoras. Los fallos se convierten en [].
async function cargarDashboardUsuario() {
    const usuario = obtenerUsuarioLogueado();
    if (!usuario?.idUsuario) {
        renderizarDashboard({ prioridades: [0, 0, 0, 0, 0], calificaciones: [0, 0, 0, 0, 0], tiempoPromedio: 0, ticketsActivos: 0, ticketsFinalizados: 0 });
        return;
    }

    const [ticketsResult, evaluacionesResult, bitacorasResult] = await Promise.allSettled([
        obtenerTodosLosTicketsDelUsuario(usuario.idUsuario),
        obtenerEvaluacionesParaDashboard(),
        obtenerBitacorasParaDashboard()
    ]);

    if (ticketsResult.status === 'rejected') {
        console.error('[Dashboard usuario] Tickets:', ticketsResult.reason);
        renderizarDashboard({ prioridades: [0, 0, 0, 0, 0], calificaciones: [0, 0, 0, 0, 0], tiempoPromedio: 0, ticketsActivos: 0, ticketsFinalizados: 0 });
        return;
    }

    const evaluaciones = evaluacionesResult.status === 'fulfilled' ? evaluacionesResult.value : [];
    const bitacoras = bitacorasResult.status === 'fulfilled' ? bitacorasResult.value : [];
    if (evaluacionesResult.status === 'rejected') console.error('[Dashboard usuario] Evaluaciones:', evaluacionesResult.reason);
    if (bitacorasResult.status === 'rejected') console.error('[Dashboard usuario] Bitácoras:', bitacorasResult.reason);

    renderizarDashboard(construirResumenUsuario(ticketsResult.value, evaluaciones, bitacoras));
}

// Actualiza texto y recrea las gráficas. destroy es indispensable porque
// Chart.js no permite dos instancias activas sobre el mismo canvas.
function renderizarDashboard(resumen) {
    const tiempoPromedio = document.getElementById('tiempoPromedio');
    if (tiempoPromedio) tiempoPromedio.textContent = resumen.tiempoPromedio;
    const ticketsActivos = document.getElementById('ticketsActivosUsuario');
    const ticketsFinalizados = document.getElementById('ticketsFinalizadosUsuario');
    if (ticketsActivos) ticketsActivos.textContent = resumen.ticketsActivos ?? 0;
    if (ticketsFinalizados) ticketsFinalizados.textContent = resumen.ticketsFinalizados ?? 0;

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
                    backgroundColor: ['#184E8C', '#539ECD', '#ffe173', '#ffbc66', '#ff8484'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: opcionesGrafico(true)
        });
    }
}

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

// Dashboard Técnico - Controller con conexión a API

import {
    getTicketsPropios,
    getIndicadoresEstadoPropios,
    procesarDatosGraficos,
    obtenerContadoresPorEstado
} from "../services/dashboardTecnicosService.js";
import { obtenerUsuarioLogueado } from "../utils/sesion.js";

// Elementos del DOM
const graficoResolucion = document.getElementById('graficoResolucion');
const graficoCalificacion = document.getElementById('graficoCalificacion');
const botonesResumen = document.querySelectorAll('.btn-resumen');
const btnCrear = document.querySelector('.btn-oscuro');
const contenedorTickets = document.querySelector('.contenedor-tickets-scroll');
const numPendientes = document.getElementById('num-pendientes');
const numVencidas = document.getElementById('num-vencidas');
const numHoy = document.getElementById('num-hoy');

// Variables globales
let ticketsPropios = [];
let indicadores = {};
let graficoCalificacionesInstance = null;
let graficoTiempoInstance = null;

// Obtener ID del usuario logueado
const usuarioLogueado = obtenerUsuarioLogueado();
if (!usuarioLogueado) {
    console.warn('No hay usuario logueado');
}

let idUsuario = usuarioLogueado ? usuarioLogueado.idUsuario : null;

// ---------- CARGAR DATOS DE LA API ----------
async function cargarDatos() {
    if (!idUsuario) {
        console.warn('ID de usuario no disponible');
        usarDatosEjemplo();
        return;
    }

    try {
        mostrarLoading(true);

        // Obtener indicadores (contadores)
        indicadores = await getIndicadoresEstadoPropios(idUsuario);
        
        // Obtener tickets propios
        const resultadoTickets = await getTicketsPropios(idUsuario, 1, 20, {});
        ticketsPropios = resultadoTickets.content || [];

        // Actualizar UI
        actualizarContadores(indicadores);
        renderizarTickets(ticketsPropios);
        
        // Procesar y actualizar gráficos
        const datosGraficos = procesarDatosGraficos(ticketsPropios);
        crearGraficos(datosGraficos.calificaciones, datosGraficos.tiempos);

        mostrarLoading(false);
    } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        mostrarLoading(false);
        usarDatosEjemplo();
    }
}

// ---------- ACTUALIZAR CONTADORES ----------
function actualizarContadores(data) {
    if (numPendientes) {
        numPendientes.textContent = data.pendientes || 0;
    }
    if (numVencidas) {
        numVencidas.textContent = data.vencidos || 0;
    }
    if (numHoy) {
        numHoy.textContent = data.vencenHoy || 0;
    }
}

// ---------- RENDERIZAR TICKETS ----------
function renderizarTickets(tickets) {
    if (!contenedorTickets) return;

    if (!tickets || tickets.length === 0) {
        contenedorTickets.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-ticket-perforated fs-1 d-block mb-2"></i>
                <p>No tienes tickets asignados</p>
            </div>
        `;
        return;
    }

    contenedorTickets.innerHTML = tickets.map(ticket => {
        const prioridadClass = obtenerClasePrioridad(ticket.prioridad);
        const badgeClass = obtenerClaseBadge(ticket.prioridad);
        const prioridadText = obtenerTextoPrioridad(ticket.prioridad);

        return `
            <div class="ticket-item ${prioridadClass} p-3 mb-3 rounded-3 shadow-sm d-flex justify-content-between align-items-start" data-id="${ticket.idTicket}">
                <div>
                    <h6 class="fw-bold mb-1">
                        <i class="bi bi-ticket-perforated me-2"></i>${ticket.asunto || 'Sin título'}
                    </h6>
                    <small class="text-muted d-block">#${ticket.codigo || ticket.idTicket}</small>
                    <small class="text-muted d-block mt-1"><b>Estado:</b> ${ticket.estado || 'Pendiente'}</small>
                    <small class="text-muted d-block"><b>Vence:</b> ${formatearFecha(ticket.fechaVencimiento)}</small>
                    <small class="text-muted d-block mt-1"><b>Descripción:</b> ${ticket.descripcion?.substring(0, 60) || 'Sin descripción'}...</small>
                </div>
                <span class="badge ${badgeClass} rounded-pill px-3 py-2">${prioridadText}</span>
            </div>
        `;
    }).join('');

    // Evento click para ir al detalle del ticket
    document.querySelectorAll('.ticket-item').forEach((item) => {
        item.addEventListener('click', function() {
            const id = this.dataset.id;
            if (id) {
                window.location.href = `detalleTicket.html?id=${id}`;
            }
        });
        item.style.cursor = 'pointer';
    });
}

// ---------- FUNCIONES AUXILIARES PARA PRIORIDAD ----------
function obtenerClasePrioridad(prioridad) {
    const p = prioridad?.toLowerCase() || '';
    switch (p) {
        case 'critica':
        case 'crítico':
            return 'border-start-critical';
        case 'alta':
            return 'border-start-high';
        case 'media':
            return 'border-start-medium';
        default:
            return 'border-start-low';
    }
}

function obtenerClaseBadge(prioridad) {
    const p = prioridad?.toLowerCase() || '';
    switch (p) {
        case 'critica':
        case 'crítico':
            return 'bg-danger-light text-danger';
        case 'alta':
            return 'bg-warning-light text-warning';
        case 'media':
            return 'bg-warning-light-2 text-warning-dark';
        default:
            return 'bg-success-light text-success';
    }
}

function obtenerTextoPrioridad(prioridad) {
    const p = prioridad?.toLowerCase() || '';
    switch (p) {
        case 'critica':
        case 'crítico':
            return 'Crítica';
        case 'alta':
            return 'Alta';
        case 'media':
            return 'Media';
        default:
            return 'Baja';
    }
}

// ---------- CREAR GRÁFICOS ----------
function crearGraficos(datosCalificaciones, datosTiempos) {
    // Destruir gráficos anteriores si existen
    if (graficoCalificacionesInstance) {
        graficoCalificacionesInstance.destroy();
        graficoCalificacionesInstance = null;
    }
    if (graficoTiempoInstance) {
        graficoTiempoInstance.destroy();
        graficoTiempoInstance = null;
    }

    Promise.all([
        new Promise(resolve => window.addEventListener('load', resolve)),
        document.fonts.ready
    ]).then(function() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Gráfico de calificaciones (Doughnut)
                if (graficoCalificacion) {
                    const grfCalificacion = graficoCalificacion.getContext('2d');
                    graficoCalificacionesInstance = new Chart(grfCalificacion, {
                        type: 'doughnut',
                        data: {
                            labels: ['5 Estrellas', '4 Estrellas', '3 Estrellas', '2 Estrellas', '1 Estrella'],
                            datasets: [{
                                label: 'Porcentaje de calificaciones',
                                data: datosCalificaciones,
                                backgroundColor: [
                                    '#184E8C',
                                    '#539ECD',
                                    '#ffe173',
                                    '#ffbc66',
                                    '#ff8484'
                                ],
                                borderWidth: 2,
                                borderColor: '#ffffff',
                                hoverOffset: 4
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
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'bottom',
                                    labels: {
                                        boxWidth: 15,
                                        font: { size: 12 }
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function (context) {
                                            return `${context.label}: ${context.raw}%`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                }

                // Gráfico de tiempos promedio (Bar)
                if (graficoResolucion) {
                    const grfResolucion = graficoResolucion.getContext('2d');
                    graficoTiempoInstance = new Chart(grfResolucion, {
                        type: 'bar',
                        data: {
                            labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
                            datasets: [{
                                label: 'Horas promedio',
                                data: datosTiempos,
                                backgroundColor: [
                                    '#539ECD', '#90BFDB', '#184E8C',
                                    '#539ECD', '#90BFDB', '#184E8C', '#539ECD'
                                ],
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
                            plugins: {
                                legend: { display: false }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: '#EAEAEA' },
                                    title: {
                                        display: true,
                                        text: 'Horas',
                                        font: { size: 12 }
                                    }
                                },
                                x: {
                                    grid: { display: false }
                                }
                            }
                        }
                    });
                }

                // Control de botones de resumen
                botonesResumen.forEach(boton => {
                    boton.addEventListener('click', function () {
                        botonesResumen.forEach(b => b.classList.remove('activo'));
                        this.classList.add('activo');
                        const opcion = this.dataset.opcion;
                        filtrarTickets(opcion);
                    });
                });
            });
        });
    });
}

// ---------- FILTRAR TICKETS ----------
function filtrarTickets(opcion) {
    if (!contenedorTickets) return;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let filtrados = [];

    switch(opcion) {
        case 'pendientes':
            filtrados = ticketsPropios.filter(t => 
                t.estado === 'Pendiente' || t.estado === 'En proceso'
            );
            break;
        case 'vencidos':
            filtrados = ticketsPropios.filter(t => {
                if (!t.fechaVencimiento) return false;
                const fechaVenc = new Date(t.fechaVencimiento);
                return fechaVenc < hoy && t.estado !== 'Cerrado' && t.estado !== 'Resuelto';
            });
            break;
        case 'hoy':
            filtrados = ticketsPropios.filter(t => {
                if (!t.fechaVencimiento) return false;
                const fechaVenc = new Date(t.fechaVencimiento);
                return fechaVenc.toDateString() === hoy.toDateString();
            });
            break;
        default:
            filtrados = ticketsPropios;
    }

    renderizarTickets(filtrados);
}

// ---------- USAR DATOS DE EJEMPLO ----------
function usarDatosEjemplo() {
    console.log('Usando datos de ejemplo para el dashboard');
    
    if (numPendientes) numPendientes.textContent = '7';
    if (numVencidas) numVencidas.textContent = '2';
    if (numHoy) numHoy.textContent = '5';

    crearGraficos([45, 30, 15, 7, 3], [12, 19, 3, 5, 2, 3, 8]);
}

// ---------- UTILITY: FORMATEAR FECHA ----------
function formatearFecha(fecha) {
    if (!fecha) return 'Sin fecha';
    const f = new Date(fecha);
    return f.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ---------- UTILITY: LOADING ----------
function mostrarLoading(mostrar) {
    let overlay = document.getElementById('loadingOverlay');
    const contenedor = document.querySelector('.mi-resumen');

    if (!contenedor) return;

    if (mostrar) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            `;
            contenedor.style.position = 'relative';
            contenedor.appendChild(overlay);
        }
    } else {
        if (overlay) overlay.remove();
    }
}

// ---------- EVENTO: CREAR TICKET ----------
if (btnCrear) {
    btnCrear.addEventListener('click', function() {
        window.location.href = 'misTickets.html';
    });
}

// ---------- INICIALIZAR ----------
if (idUsuario) {
    cargarDatos();
} else {
    usarDatosEjemplo();
}

// Recargar datos cada 5 minutos
setInterval(() => {
    if (idUsuario) {
        cargarDatos();
    }
}, 300000);

console.log('✅ Dashboard Técnico conectado a la API');
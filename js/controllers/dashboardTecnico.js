/* Dashboard técnico: reúne tickets, evaluaciones y bitácoras desde la API y
   transforma esos datos en indicadores, listas y gráficas del técnico activo. */

import {
    obtenerResumenPanelTecnico,
    obtenerContadoresPanelTecnico,
    getCalificacionesTecnico,
    getResolucionPorDiaTecnico
} from "../services/dashboardTecnicosService.js?v=6";
import { obtenerUsuarioLogueado } from "../utils/sesion.js";

// Elementos del DOM
const graficoResolucion = document.getElementById('graficoResolucion');
const graficoCalificacion = document.getElementById('graficoCalificacion');
const botonesResumen = document.querySelectorAll('[data-opcion]');
const btnCrear = document.querySelector('.btn-oscuro');
const contenedorTickets = document.querySelector('.contenedor-tickets-scroll');
const numPendientes = document.getElementById('num-pendientes');
const numVencidas = document.getElementById('num-vencidas');
const numHoy = document.getElementById('num-hoy');

// Variables globales
const TAMANO_PAGINA_ASIGNACIONES = 5;
let categoriaActual = 'pendientes';
let paginaActualAsignaciones = 1;
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
        mostrarDashboardVacio('No se encontró una sesión activa');
        return;
    }

    try {
        mostrarLoading(true);

        const [contadoresResult, calificacionesResult, resolucionResult] = await Promise.allSettled([
            obtenerContadoresPanelTecnico(idUsuario),
            getCalificacionesTecnico(idUsuario),
            getResolucionPorDiaTecnico(idUsuario)
        ]);

        const contadores = contadoresResult.status === 'fulfilled' ? contadoresResult.value : null;
        const calificaciones = calificacionesResult.status === 'fulfilled' ? calificacionesResult.value : [0, 0, 0, 0, 0];
        const filasResolucion = resolucionResult.status === 'fulfilled' ? resolucionResult.value : [];
        if (contadoresResult.status === 'rejected') console.error('No se cargaron los contadores del panel:', contadoresResult.reason);
        if (calificacionesResult.status === 'rejected') console.error('No se cargaron las calificaciones:', calificacionesResult.reason);
        if (resolucionResult.status === 'rejected') console.error('No se cargó el tiempo de resolución:', resolucionResult.reason);

        // Actualizar UI: tarjetas de contadores y lista paginada (respeta "Pendientes" activo por defecto)
        actualizarContadores(contadores || { pendientes: 0, vencidos: 0, hoy: 0 });
        cargarPanelAsignaciones('pendientes', 1);

        // Procesar y actualizar gráficos
        crearGraficos(calificaciones, mapearResolucionPorDia(filasResolucion));

        mostrarLoading(false);
    } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        mostrarLoading(false);
        mostrarDashboardVacio('No se pudieron cargar los datos de la API');
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
        numHoy.textContent = data.hoy || 0;
    }
}

// ---------- PANEL "ASIGNACIONES" (Pendientes / Vencidos / Vencen hoy) ----------
// Paginado y filtrado por el técnico logueado, viene ya resuelto del backend.
async function cargarPanelAsignaciones(categoria, pagina) {
    categoriaActual = categoria;
    paginaActualAsignaciones = pagina;

    if (contenedorTickets) {
        contenedorTickets.innerHTML = '<p class="text-muted text-center py-4">Cargando tickets...</p>';
    }

    try {
        const resultado = await obtenerResumenPanelTecnico(idUsuario, categoria, pagina, TAMANO_PAGINA_ASIGNACIONES);
        renderizarTickets(resultado.tickets);
        renderizarPaginacionAsignaciones(resultado.totalPaginas, resultado.paginaActual);
    } catch (error) {
        console.error('[Dashboard técnico] Error al cargar el panel de asignaciones:', error);
        if (contenedorTickets) {
            contenedorTickets.innerHTML = '<p class="text-muted text-center py-4">No se pudieron cargar los tickets</p>';
        }
        renderizarPaginacionAsignaciones(0, 1);
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
        const iconoPrioridad = window.obtenerClaseIconoTicket?.(ticket.prioridad)
            || 'icono-ticket-prioridad-sin-asignar';

        return `
            <div class="ticket-item ${prioridadClass} p-3 mb-3 rounded-3 shadow-sm d-flex justify-content-between align-items-start" data-id="${ticket.idTicket}">
                <div>
                    <h6 class="fw-bold mb-1">
                        <i class="bi bi-ticket-perforated ${iconoPrioridad} me-2"></i>${ticket.asunto || 'Sin título'}
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
                window.location.href = `vistaTicket.html?id=${id}`;
            }
        });
        item.style.cursor = 'pointer';
    });
}

// ---------- PAGINACIÓN DEL PANEL "ASIGNACIONES" ----------
function renderizarPaginacionAsignaciones(totalPaginas, paginaActual) {
    const contenedor = document.getElementById('paginacionAsignaciones');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    for (let i = 1; i <= totalPaginas; i++) {
        const activo = i === paginaActual ? 'active' : '';
        contenedor.innerHTML += `
            <li class="page-item ${activo}">
                <a class="page-link border-0 bg-transparent text-dark" href="#" data-pagina="${i}">${i}</a>
            </li>
        `;
    }
}

document.getElementById('paginacionAsignaciones')?.addEventListener('click', (evento) => {
    const link = evento.target.closest('[data-pagina]');
    if (!link) return;
    evento.preventDefault();
    cargarPanelAsignaciones(categoriaActual, Number(link.dataset.pagina));
});


function normalizarPrioridad(prioridad) {
    return String(prioridad || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function obtenerClasePrioridad(prioridad) {
    const p = normalizarPrioridad(prioridad);
    switch (p) {
        case 'critica':
        case 'critico':
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
    const p = normalizarPrioridad(prioridad);
    switch (p) {
        case 'critica':
        case 'critico':
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
    const p = normalizarPrioridad(prioridad);
    switch (p) {
        case 'critica':
        case 'critico':
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
    if (typeof Chart === 'undefined') {
        console.error('[Dashboard técnico] Chart.js no terminó de cargar.');
        return;
    }
    // Destruir gráficos anteriores si existen
    if (graficoCalificacionesInstance) {
        graficoCalificacionesInstance.destroy();
        graficoCalificacionesInstance = null;
    }
    if (graficoTiempoInstance) {
        graficoTiempoInstance.destroy();
        graficoTiempoInstance = null;
    }

    const dibujar = function() {
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
                                    '#0D3B6E',
                                    '#184E8C',
                                    '#2E6DAE',
                                    '#539ECD',
                                    '#90BFDB'
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
                    if (boton.dataset.dashboardListo === 'true') return;
                    boton.dataset.dashboardListo = 'true';
                    boton.addEventListener('click', function () {
                        botonesResumen.forEach(b => b.classList.remove('activo'));
                        this.classList.add('activo');
                        const opcion = this.dataset.opcion;
                        cargarPanelAsignaciones(opcion, 1);
                    });
                });
            });
        });
    };

    if (document.readyState === 'complete') {
        document.fonts.ready.then(dibujar);
    } else {
        window.addEventListener('load', () => document.fonts.ready.then(dibujar), { once: true });
    }
}

// ---------- MAPEAR RESOLUCIÓN POR DÍA (Oracle: 1=Domingo...7=Sábado) ----------
function mapearResolucionPorDia(filas) {
    const oracleToIndex = { '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '1': 6 };
    const horas = [0, 0, 0, 0, 0, 0, 0];

    if (Array.isArray(filas)) {
        filas.forEach((fila) => {
            if (fila && fila.length >= 2) {
                const diaClave = String(fila[0]).trim();
                const promedio = parseFloat(fila[1]) || 0;
                const idx = oracleToIndex[diaClave];
                if (idx !== undefined) {
                    horas[idx] = Math.round(promedio * 10) / 10;
                }
            }
        });
    }
    return horas;
}

// ---------- ESTADO VACÍO CUANDO NO HAY SESIÓN O FALLA LA API ----------
function mostrarDashboardVacio(mensaje) {
    actualizarContadores({ pendientes: 0, vencidos: 0, hoy: 0 });
    if (contenedorTickets) {
        contenedorTickets.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-cloud-slash fs-1 d-block mb-2"></i>
                <p>${mensaje}</p>
            </div>`;
    }
    renderizarPaginacionAsignaciones(0, 1);
    crearGraficos([0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]);
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
        window.location.href = 'crearTickets.html';
    });
}

// ---------- INICIALIZAR ----------
if (idUsuario) {
    cargarDatos();
} else {
    mostrarDashboardVacio('No se encontró una sesión activa');
}

// Recargar datos cada 5 minutos
setInterval(() => {
    if (idUsuario) {
        cargarDatos();
    }
}, 300000);

console.log('✅ Dashboard Técnico conectado a la API');

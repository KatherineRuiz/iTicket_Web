
import {
    obtenerMetricasDashboard,
    obtenerResumenMensual,
    obtenerResolucionPorDia,
    obtenerTopTecnicosPorCalificacion,
    obtenerResumenPanelAdmin,
    obtenerContadoresPanelAdmin
} from '../services/dashboardAdminService.js?v=5';

import { formatearFecha12H } from '../utils/formateadores.js'; 

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let graficoResolucionChart = null;
let categoriaActual = 'pendientes';
let paginaActualResumen = 1;
const TAMANO_PAGINA_RESUMEN = 5;

function obtenerIdUsuarioLogueado() {
    try {
        const sesion = JSON.parse(sessionStorage.getItem("usuarioLogueado"));
        return sesion?.idUsuario ?? null;
    } catch {
        return null;
    }
}

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
    const idUsuario = obtenerIdUsuarioLogueado();

    const [contadoresResult, resumenResult, resolucionResult, metricasResult] = await Promise.allSettled([
        obtenerContadoresPanelAdmin(idUsuario),
        obtenerResumenMensual(idUsuario),
        obtenerResolucionPorDia(idUsuario),
        obtenerMetricasDashboard(idUsuario)
    ]);

    const contadoresPanel = contadoresResult.status === 'fulfilled' ? contadoresResult.value : null;
    const resumenMensual = resumenResult.status === 'fulfilled' ? resumenResult.value : null;
    const resolucionDia = resolucionResult.status === 'fulfilled' ? resolucionResult.value : [];
    const metricas = metricasResult.status === 'fulfilled' ? metricasResult.value : null;

    if (contadoresResult.status === 'rejected') console.error('[Dashboard] Contadores del panel:', contadoresResult.reason);
    if (resumenResult.status === 'rejected') console.error('[Dashboard] Resumen mensual:', resumenResult.reason);
    if (resolucionResult.status === 'rejected') console.error('[Dashboard] Resolución diaria:', resolucionResult.reason);
    if (metricasResult.status === 'rejected') console.error('[Dashboard] Calificaciones por técnico:', metricasResult.reason);

        // 1. Contadores de abiertos/cerrados desde el backend (ya filtrados por el departamento del admin)
        if (resumenMensual) {
            poblarContadoresDesdeResumen(resumenMensual);
        } else {
            console.warn('No se pudo obtener el resumen mensual, los contadores quedarán en 0');
        }

        // 2. Tarjetas Pendientes/Vencidos/Vencen hoy (contadores ya filtrados por departamento)
        if (contadoresPanel) {
            document.getElementById('num-pendientes').textContent = contadoresPanel.pendientes ?? 0;
            document.getElementById('num-vencidas').textContent = contadoresPanel.vencidos ?? 0;
            document.getElementById('num-hoy').textContent = contadoresPanel.hoy ?? 0;
        }

        // 3. Panel de tickets del "Mi resumen": paginado y filtrado por el departamento del admin
        cargarPanelResumen('pendientes', 1);

        // 4. Técnicos ordenados por el promedio real de sus evaluaciones.
        const calificaciones = metricas?.satisfaccionPorTecnico || [];
        poblarMejoresTecnicos(obtenerTopTecnicosPorCalificacion(calificaciones));

        // 5. Gráfico de resolución por día (si el endpoint existe)
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
// 3. PANEL "MI RESUMEN" (Pendientes / Vencidos / Vencen hoy)
// Paginado y filtrado por el departamento del admin, viene ya resuelto del backend.
// ============================================================
async function cargarPanelResumen(categoria, pagina) {
    categoriaActual = categoria;
    paginaActualResumen = pagina;

    const contenedor = document.getElementById('listaTicketsDashboard');
    if (contenedor) contenedor.innerHTML = '<p class="text-muted text-center py-4">Cargando tickets...</p>';

    try {
        const idUsuario = obtenerIdUsuarioLogueado();
        const resultado = await obtenerResumenPanelAdmin(idUsuario, categoria, pagina, TAMANO_PAGINA_RESUMEN);
        renderizarListaTickets(resultado.tickets);
        renderizarPaginacionResumen(resultado.totalPaginas, resultado.paginaActual);
    } catch (error) {
        console.error('[Dashboard] Error al cargar el panel de resumen:', error);
        if (contenedor) contenedor.innerHTML = '<p class="text-muted text-center py-4">No se pudieron cargar los tickets</p>';
    }
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

    lista.forEach((t) => {
        const iconoPrioridad = window.obtenerClaseIconoTicket?.(t.prioridad)
            || 'icono-ticket-prioridad-sin-asignar';

        const desc = t.descripcion
            ? (t.descripcion.length > 60 ? t.descripcion.substring(0, 60) + '...' : t.descripcion)
            : 'Sin descripción';

        const div = document.createElement('article');
        div.dataset.id = t.idTicket;
        div.className = `lista-tickets position-relative shadow-sm bg-white borde-lateral-${t.prioridad || ''} rounded-3 p-3 mb-3 d-flex justify-content-between align-items-start`;
        div.innerHTML = `
            <div class="elemento-ticket-asignado pe-1">
                <h6 class="fw-bold mb-1 fs-5 d-flex align-items-start texto-limitado-1">
                    <i class="bi bi-ticket-perforated ${iconoPrioridad} me-2"></i>${t.asunto || 'Sin asunto'}
                </h6>
                <small class="text-muted d-block mb-2">${t.codigo || '—'}</small>
                <small class="text-muted d-block"><b>Estado: </b>${t.estado || '—'}</small>
                ${t.fechaVencimiento ? `<small class="text-muted d-block"><b>Vence: </b>${formatearFecha12H(t.fechaVencimiento)}</small>` : ''}
                <small class="text-muted d-block texto-limitado"><b>Descripción:</b> ${desc}</small>
            </div>
            ${t.prioridad ? `<span class="flex-shrink-0 position-absolute rounded-pill badge prioridad-${t.prioridad} px-3 py-2">${t.prioridad}</span>` : ''}
        `;
        contenedor.appendChild(div);
    });
}

// ============================================================
// PAGINACIÓN DEL PANEL "MI RESUMEN"
// ============================================================
function renderizarPaginacionResumen(totalPaginas, paginaActual) {
    const contenedor = document.getElementById('paginacionResumenDashboard');
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

document.getElementById('paginacionResumenDashboard')?.addEventListener('click', (evento) => {
    const link = evento.target.closest('[data-pagina]');
    if (!link) return;
    evento.preventDefault();
    cargarPanelResumen(categoriaActual, Number(link.dataset.pagina));
});

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

        const opcion = this.getAttribute('data-opcion') || 'pendientes';
        cargarPanelResumen(opcion, 1);
    });
});

document.addEventListener("DOMContentLoaded", () => {

    document.addEventListener("click", function (e) {

    const tarjetaTicket = e.target.closest(".lista-tickets");

    if (!tarjetaTicket) return;
      
    if (e.target.closest(".badge")) {
      return; 
    }

    const idTicket = tarjetaTicket.dataset.id;
    window.location.href = `vistaTicket.html?id=${idTicket}`;
  });
});
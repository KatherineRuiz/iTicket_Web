// ============================================================
// DASHBOARD ADMIN — CONTROLADOR PRINCIPAL
// Consume endpoints existentes para poblar las 4 secciones
// ============================================================

const API_BASE = "http://localhost:8080/api";

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let todosLosTickets = [];     // Todos los tickets del sistema
let ticketsFiltrados = [];    // Tickets filtrados por la pestaña activa
let filtroActual = 'pendientes';
let graficoResolucionChart = null;

// ============================================================
// INICIALIZACIÓN
// ============================================================
const btnCrear = document.getElementById('btnCrear');
if (btnCrear) {
    btnCrear.addEventListener('click', function () {
        window.location.href = 'misTickets.html';
    });
}

// Esperar carga completa + fuentes para gráficos
Promise.all([
    new Promise(resolve => window.addEventListener('load', resolve)),
    document.fonts.ready
]).then(() => {
    cargarDashboard();
});

// ============================================================
// CARGA PRINCIPAL (en paralelo)
// ============================================================
async function cargarDashboard() {
    try {
        // 3 llamadas en paralelo: métricas, tickets, resolución por día
        const [metricas, tickets, resolucionDia] = await Promise.all([
            fetchJSON(`${API_BASE}/estadisticas/metricas`),
            fetchJSON(`${API_BASE}/tickets`),
            fetchJSON(`${API_BASE}/estadisticas/resolucion-por-dia`)
        ]);

        // 1. Contadores de tickets abiertos/cerrados (este mes)
        if (tickets) {
            poblarContadoresTickets(tickets);
            poblarPanelEvaluaciones(tickets);
        }

        // 2. Mejores técnicos (del endpoint de métricas)
        if (metricas) {
            poblarMejoresTecnicos(metricas.satisfaccionPorTecnico);
        }

        // 3. Gráfica de resolución por día de semana
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                crearGraficoResolucion(resolucionDia);
            });
        });

    } catch (error) {
        console.error('[Dashboard] Error al cargar:', error);
    }
}

// ============================================================
// UTILIDAD FETCH
// ============================================================
async function fetchJSON(url) {
    try {
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const json = await resp.json();
        return json.data ?? json;
    } catch (e) {
        console.error(`Error fetching ${url}:`, e);
        return null;
    }
}

// ============================================================
// 1. CONTADORES: TICKETS ABIERTOS / CERRADOS (ESTE MES)
// ============================================================
function poblarContadoresTickets(tickets) {
    if (!Array.isArray(tickets)) return;

    const ahora = new Date();
    const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    // Filtrar tickets creados este mes
    const ticketsEsteMes = tickets.filter(t => {
        if (!t.fechaCreacion) return false;
        return new Date(t.fechaCreacion) >= primerDiaMes;
    });

    const estadosAbiertos = ['nuevo', 'abierto', 'en proceso', 'asignado', 'en espera'];
    const estadosCerrados = ['resuelto', 'cerrado'];

    let abiertos = 0;
    let cerrados = 0;

    ticketsEsteMes.forEach(t => {
        const estado = (t.estado || '').toLowerCase();
        if (estadosAbiertos.includes(estado)) abiertos++;
        if (estadosCerrados.includes(estado)) cerrados++;
    });

    const elAbiertos = document.getElementById('numTicketsAbiertos');
    const elCerrados = document.getElementById('numTicketsCerrados');
    if (elAbiertos) elAbiertos.textContent = abiertos;
    if (elCerrados) elCerrados.textContent = cerrados;
}

// ============================================================
// 2. NUESTROS MEJORES TÉCNICOS (Top 3 del carrusel)
// ============================================================
function poblarMejoresTecnicos(satisfaccionPorTecnico) {
    if (!Array.isArray(satisfaccionPorTecnico) || satisfaccionPorTecnico.length === 0) return;

    // Ya viene ordenado DESC por promedio desde el backend
    const top3 = satisfaccionPorTecnico.slice(0, 3);

    const el1 = document.getElementById('txtNombreTecnico1');
    const el2 = document.getElementById('txtNombreTecnico2');
    const el3 = document.getElementById('txtNombreTecnico3');

    if (el1 && top3[0]) el1.textContent = top3[0].tecnico || 'Sin datos';
    if (el2 && top3[1]) el2.textContent = top3[1].tecnico || 'Sin datos';
    if (el3 && top3[2]) el3.textContent = top3[2].tecnico || 'Sin datos';

    // Si hay menos de 3, ocultar items sobrantes del carrusel
    const items = document.querySelectorAll('#carruselTecnicos .carousel-item');
    items.forEach((item, i) => {
        if (i >= top3.length) {
            item.remove();
        }
    });
}

// ============================================================
// 3. PANEL DE EVALUACIONES (Pendientes / Vencidos / Vencen hoy)
// ============================================================
function poblarPanelEvaluaciones(tickets) {
    if (!Array.isArray(tickets)) return;

    todosLosTickets = tickets;

    const ahora = new Date();
    const hoyStr = ahora.toISOString().split('T')[0]; // YYYY-MM-DD

    const estadosFinalizados = ['resuelto', 'cerrado', 'cancelado'];

    let pendientes = [];
    let vencidos = [];
    let vencenHoy = [];

    tickets.forEach(t => {
        const estado = (t.estado || '').toLowerCase();
        const esNoFinalizado = !estadosFinalizados.includes(estado);

        if (esNoFinalizado) {
            pendientes.push(t);
        }

        if (t.fechaVencimiento) {
            const fechaVenc = new Date(t.fechaVencimiento);
            const fechaVencStr = fechaVenc.toISOString().split('T')[0];

            if (fechaVenc < ahora && esNoFinalizado) {
                vencidos.push(t);
            }

            if (fechaVencStr === hoyStr) {
                vencenHoy.push(t);
            }
        }
    });

    // Actualizar contadores
    const elPendientes = document.getElementById('num-pendientes');
    const elVencidos = document.getElementById('num-vencidas');
    const elHoy = document.getElementById('num-hoy');

    if (elPendientes) elPendientes.textContent = pendientes.length;
    if (elVencidos) elVencidos.textContent = vencidos.length;
    if (elHoy) elHoy.textContent = vencenHoy.length;

    // Guardar las categorías para los botones
    window._categorias = { pendientes, vencidos, hoy: vencenHoy };

    // Renderizar la pestaña activa por defecto
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

        // Mapeo de clases según prioridad
        const config = {
            'crítica':  { borde: 'borde-lateral-critica',  badge: 'fondo-peligro-suave text-danger',     icono: 'text-danger' },
            'critica':  { borde: 'borde-lateral-critica',  badge: 'fondo-peligro-suave text-danger',     icono: 'text-danger' },
            'alta':     { borde: 'borde-lateral-alta',     badge: 'fondo-advertencia-suave text-warning', icono: '' },
            'media':    { borde: 'borde-lateral-media',    badge: 'fondo-advertencia-suave-2 texto-advertencia-oscuro', icono: '' },
            'baja':     { borde: 'borde-lateral-baja',     badge: 'fondo-exito-suave text-success',      icono: 'text-success' }
        };

        const c = config[prioridad] || config['media'];
        const esUltimo = index === lista.length - 1;

        const fechaVenc = t.fechaVencimiento
            ? new Date(t.fechaVencimiento).toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Sin fecha';

        const desc = t.descripcion
            ? (t.descripcion.length > 60 ? t.descripcion.substring(0, 60) + '...' : t.descripcion)
            : 'Sin descripción';

        const div = document.createElement('div');
        div.className = `elemento-ticket ${c.borde} p-3 ${esUltimo ? 'mb-0' : 'mb-3'} rounded-3 shadow-sm d-flex justify-content-between align-items-start`;
        div.innerHTML = `
            <div>
                <h6 class="fw-bold mb-1">
                    <i class="bi bi-ticket-perforated ${c.icono} me-2"></i>${t.asunto || 'Sin asunto'}
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
    const canvas = document.getElementById('graficoResolucion');
    if (!canvas) return;

    if (graficoResolucionChart) {
        graficoResolucionChart.destroy();
    }

    // Nombres de días: Oracle TO_CHAR('D') → 1=Domingo, 2=Lunes... 7=Sábado
    const diasOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const oracleToIndex = { '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '1': 6 };

    const horas = [0, 0, 0, 0, 0, 0, 0]; // Lun-Dom

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
        }
    });
});
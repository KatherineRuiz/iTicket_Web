import { API_BASE_URL, manejarRespuesta } from './apiConfig.js';

// Todas las lecturas del dashboard omiten la caché para evitar cifras antiguas.
function fetchFresco(url) {
    return fetch(url, { cache: 'no-store' });
}

// Obtiene una página de tickets y agrega únicamente los filtros seleccionados.
export async function getTicketsAsignados(idUsuario, pagina = 1, tamano = 200, filtros = {}) {
    const parametros = new URLSearchParams({ idUsuario, pagina, tamano });
    if (filtros.busqueda) parametros.append('busqueda', filtros.busqueda);
    if (filtros.prioridad) parametros.append('prioridad', filtros.prioridad);
    if (filtros.estado) parametros.append('estado', filtros.estado);
    if (filtros.fecha) parametros.append('fecha', filtros.fecha);
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/tickets/tickets-asignados?${parametros}`));
}

// El endpoint es paginado. Primero averigua cuántas páginas hay y luego carga
// las restantes en paralelo para entregar al controlador un solo arreglo.
export async function getTodosTicketsAsignados(idUsuario) {
    const primera = await getTicketsAsignados(idUsuario, 1, 200);
    const tickets = [...(primera?.tickets || primera?.content || [])];
    const totalPaginas = Number(primera?.totalPaginas || 1);
    if (totalPaginas <= 1) return tickets;

    const restantes = await Promise.all(
        Array.from({ length: totalPaginas - 1 }, (_, indice) => getTicketsAsignados(idUsuario, indice + 2, 200))
    );
    restantes.forEach((pagina) => tickets.push(...(pagina?.tickets || pagina?.content || [])));
    return tickets;
}

// Se usa un tamaño amplio porque las gráficas necesitan el conjunto completo,
// no solamente la página que podría estar visible en otra interfaz.
export async function getEvaluacionesDashboard() {
    const parametros = new URLSearchParams({ page: 0, size: 1000 });
    const pagina = await manejarRespuesta(await fetchFresco(`${API_BASE_URL}/evaluaciones?${parametros}`));
    return pagina?.content || pagina?.evaluaciones || (Array.isArray(pagina) ? pagina : []);
}

// Normaliza una respuesta inesperada a [] para simplificar los cálculos.
export async function getBitacorasDashboard() {
    const bitacoras = await manejarRespuesta(await fetchFresco(`${API_BASE_URL}/bitacoras`));
    return Array.isArray(bitacoras) ? bitacoras : [];
}

// Clasifica un vencimiento con la hora real. Un ticket que venció hoy a las
// 10:00 ya pertenece a "vencidos" a las 10:01, no a "vencen hoy".
export function obtenerCategoriaVencimiento(ticket, ahora = new Date()) {
    if (!ticket?.fechaVencimiento) return null;

    const fecha = new Date(ticket.fechaVencimiento);
    if (Number.isNaN(fecha.getTime())) return null;
    if (fecha.getTime() < ahora.getTime()) return 'vencido';

    const venceEnElMismoDia = fecha.getFullYear() === ahora.getFullYear()
        && fecha.getMonth() === ahora.getMonth()
        && fecha.getDate() === ahora.getDate();
    return venceEnElMismoDia ? 'hoy' : 'futuro';
}

// Todas las categorías del resumen representan trabajo activo. Los tickets
// resueltos, cerrados o cancelados dejan de contarse aunque su fecha ya venciera.
export function obtenerContadoresPorEstado(tickets) {
    const contadores = { pendientes: 0, vencidos: 0, vencenHoy: 0 };
    const finales = new Set(['resuelto', 'cerrado', 'cancelado']);
    const ahora = new Date();

    tickets.forEach((ticket) => {
        const estado = String(ticket?.estado || '').trim().toLowerCase();
        const pendiente = !finales.has(estado);
        if (!pendiente) return;
        contadores.pendientes += 1;
        const categoria = obtenerCategoriaVencimiento(ticket, ahora);
        if (categoria === 'vencido') contadores.vencidos += 1;
        if (categoria === 'hoy') contadores.vencenHoy += 1;
    });
    return contadores;
}

// Punto de entrada de los cálculos gráficos. Mantiene separados los algoritmos
// de calificación y de tiempo para que cada uno pueda entenderse y probarse.
export function procesarDatosGraficos(tickets, evaluaciones, bitacoras) {
    return {
        calificaciones: procesarCalificaciones(tickets, evaluaciones),
        tiempos: procesarTiemposResolucion(tickets, bitacoras)
    };
}

// Cruza evaluaciones con los ids asignados al técnico y devuelve los conteos
// en el orden 5, 4, 3, 2 y 1 que utiliza la gráfica.
function procesarCalificaciones(tickets, evaluaciones) {
    const ids = new Set(tickets.map((ticket) => Number(ticket.idTicket)));
    const conteos = [0, 0, 0, 0, 0];
    evaluaciones.forEach((evaluacion) => {
        if (!ids.has(Number(evaluacion.idTicket))) return;
        const valor = Math.max(1, Math.min(5, Math.round(Number(evaluacion.calificacion) || 0)));
        if (valor) conteos[5 - valor] += 1;
    });
    return conteos;
}

// Busca el primer cierre de cada ticket en la bitácora, calcula las horas desde
// su creación y promedia los resultados según el día de inicio del ticket.
function procesarTiemposResolucion(tickets, bitacoras) {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const acumulados = dias.map(() => ({ total: 0, cantidad: 0 }));
    const cierresPorTicket = new Map();

    bitacoras.forEach((bitacora) => {
        const estado = String(bitacora?.nuevoEstado || '').toLowerCase();
        if (!['resuelto', 'cerrado'].includes(estado)) return;
        const fecha = new Date(bitacora.fechaHora);
        if (Number.isNaN(fecha.getTime())) return;
        const id = Number(bitacora.idTicket);
        const actual = cierresPorTicket.get(id);
        if (!actual || fecha < actual) cierresPorTicket.set(id, fecha);
    });

    tickets.forEach((ticket) => {
        const inicio = new Date(ticket.fechaCreacion);
        const fin = cierresPorTicket.get(Number(ticket.idTicket));
        if (!fin || Number.isNaN(inicio.getTime()) || fin <= inicio) return;
        const indiceDia = (inicio.getDay() + 6) % 7;
        acumulados[indiceDia].total += (fin - inicio) / 3600000;
        acumulados[indiceDia].cantidad += 1;
    });

    return acumulados.map((dato) => dato.cantidad ? Math.round((dato.total / dato.cantidad) * 10) / 10 : 0);
}

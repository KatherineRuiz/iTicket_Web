/*
 * SERVICIO DEL DASHBOARD DE USUARIO
 * Reúne todas las páginas de tickets y cruza sus ids con evaluaciones/bitácoras.
 * Devuelve conteos y promedios independientes del HTML, listos para que el
 * controlador los entregue a Chart.js.
 */
import { API_BASE_URL, manejarRespuesta } from './apiConfig.js';

// Fuerza una consulta actual para que crear o actualizar un ticket se refleje
// al volver al dashboard sin depender de la caché del navegador.
function fetchFresco(url) {
    return fetch(url, { cache: 'no-store' });
}

// Función interna para una sola página; el resto del archivo trabaja con el
// arreglo unificado que construye obtenerTodosLosTicketsDelUsuario.
async function obtenerPaginaTickets(idUsuario, pagina) {
    const parametros = new URLSearchParams({ idUsuario, pagina, tamano: 200 });
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/tickets/mis-tickets?${parametros}`));
}

// Descarga la primera página, conoce el total y solicita las demás en paralelo.
export async function obtenerTodosLosTicketsDelUsuario(idUsuario) {
    const primera = await obtenerPaginaTickets(idUsuario, 1);
    const tickets = [...(primera?.tickets || primera?.content || [])];
    const totalPaginas = Number(primera?.totalPaginas || 1);
    if (totalPaginas <= 1) return tickets;

    const paginas = await Promise.all(
        Array.from({ length: totalPaginas - 1 }, (_, indice) => obtenerPaginaTickets(idUsuario, indice + 2))
    );
    paginas.forEach((pagina) => tickets.push(...(pagina?.tickets || pagina?.content || [])));
    return tickets;
}

// Las evaluaciones se cruzarán después con los ids de tickets del usuario.
export async function obtenerEvaluacionesParaDashboard() {
    const pagina = await manejarRespuesta(
        await fetchFresco(`${API_BASE_URL}/evaluaciones?page=0&size=1000`)
    );
    return pagina?.content || (Array.isArray(pagina) ? pagina : []);
}

// Las bitácoras permiten encontrar la primera fecha de resolución de cada caso.
export async function obtenerBitacorasParaDashboard() {
    const bitacoras = await manejarRespuesta(await fetchFresco(`${API_BASE_URL}/bitacoras`));
    return Array.isArray(bitacoras) ? bitacoras : [];
}

// Convierte datos de tres endpoints en las tres estructuras que consumen las
// gráficas: cantidades por prioridad, cantidades por nota y promedio de horas.
export function construirResumenUsuario(tickets, evaluaciones, bitacoras, ahora = new Date()) {
    const prioridades = [0, 0, 0, 0, 0];
    const indicePrioridad = { baja: 1, media: 2, alta: 3, crítica: 4, critica: 4 };
    tickets.forEach((ticket) => {
        const prioridad = String(ticket?.prioridad || '').trim().toLowerCase();
        prioridades[indicePrioridad[prioridad] ?? 0] += 1;
    });

    // Set permite comprobar rápidamente si una evaluación pertenece al usuario.
    const idsTickets = new Set(tickets.map((ticket) => Number(ticket.idTicket)));
    const calificaciones = [0, 0, 0, 0, 0];
    evaluaciones.forEach((evaluacion) => {
        if (!idsTickets.has(Number(evaluacion.idTicket))) return;
        const valor = Math.max(1, Math.min(5, Math.round(Number(evaluacion.calificacion) || 0)));
        if (valor) calificaciones[5 - valor] += 1;
    });

    // Los Map relacionan cada id con su creación y con su primer cierre válido.
    const fechaCreacion = new Map(tickets.map((ticket) => [Number(ticket.idTicket), new Date(ticket.fechaCreacion)]));
    const primerCierre = new Map();
    bitacoras.forEach((bitacora) => {
        const id = Number(bitacora.idTicket);
        if (!idsTickets.has(id)) return;
        const estado = String(bitacora.nuevoEstado || '').toLowerCase();
        if (!['resuelto', 'cerrado'].includes(estado)) return;
        const fecha = new Date(bitacora.fechaHora);
        if (Number.isNaN(fecha.getTime())) return;
        const actual = primerCierre.get(id);
        if (!actual || fecha < actual) primerCierre.set(id, fecha);
    });

    const tiempos = [];
    primerCierre.forEach((fin, id) => {
        const inicio = fechaCreacion.get(id);
        if (!inicio || Number.isNaN(inicio.getTime()) || fin <= inicio) return;
        tiempos.push((fin - inicio) / 3600000);
    });
    const tiempoPromedio = tiempos.length
        ? Math.round((tiempos.reduce((total, horas) => total + horas, 0) / tiempos.length) * 10) / 10
        : 0;

    // Los dos indicadores superiores imitan el resumen mensual del administrador,
    // pero se calculan únicamente con los tickets creados por este usuario.
    const estadosFinales = new Set(['resuelto', 'cerrado', 'cancelado']);
    const ticketsDelMes = tickets.filter((ticket) => {
        const fecha = new Date(ticket?.fechaCreacion);
        return !Number.isNaN(fecha.getTime())
            && fecha.getFullYear() === ahora.getFullYear()
            && fecha.getMonth() === ahora.getMonth();
    });
    const ticketsFinalizados = ticketsDelMes.filter((ticket) => {
        const estado = String(ticket?.estado || '').trim().toLowerCase();
        return estadosFinales.has(estado);
    }).length;
    const ticketsActivos = ticketsDelMes.length - ticketsFinalizados;

    return { prioridades, calificaciones, tiempoPromedio, ticketsActivos, ticketsFinalizados };
}

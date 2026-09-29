/*
 * SERVICIO DEL DASHBOARD DE USUARIO
 * Reúne todas las páginas de tickets del usuario y consulta, ya resueltos por
 * el backend, la distribución de calificaciones y el tiempo promedio de
 * resolución de sus tickets. Devuelve datos independientes del HTML, listos
 * para que el controlador los entregue a Chart.js.
 */
import { API_BASE_URL, manejarRespuesta, apiFetch } from './apiConfig.js';

// Fuerza una consulta actual para que crear o actualizar un ticket se refleje
// al volver al dashboard sin depender de la caché del navegador.
function fetchFresco(url) {
    return apiFetch(url, { cache: 'no-store' });
}

// Función interna para una sola página; el resto del archivo trabaja con el
// arreglo unificado que construye obtenerTodosLosTicketsDelUsuario.
async function obtenerPaginaTickets(idUsuario, pagina) {
    const parametros = new URLSearchParams({ idUsuario, pagina, tamano: 200 });
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/tickets/mis-tickets?${parametros}`));
}

// Descarga la primera página, conoce el total y solicita las demás en paralelo.
// El backend ordena siempre por idTicket descendente, así que el arreglo
// resultante ya queda del ticket más reciente al más antiguo.
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

// El backend ya filtra por el creador del ticket: solo trae la distribución de
// calificaciones de este usuario, en el orden 5, 4, 3, 2 y 1 estrellas.
export async function obtenerCalificacionesUsuario(idUsuario) {
    const parametros = new URLSearchParams({ idUsuario });
    const distribucion = await manejarRespuesta(await fetchFresco(`${API_BASE_URL}/evaluaciones/usuario/calificaciones?${parametros}`));
    return Array.isArray(distribucion) ? distribucion : [0, 0, 0, 0, 0];
}

// El backend ya filtra por el creador del ticket y devuelve un único promedio en horas.
export async function obtenerTiempoPromedioUsuario(idUsuario) {
    const parametros = new URLSearchParams({ idUsuario });
    const promedio = await manejarRespuesta(await fetchFresco(`${API_BASE_URL}/bitacoras/usuario/tiempo-promedio?${parametros}`));
    return typeof promedio === 'number' ? promedio : 0;
}

// Convierte tickets, calificaciones y tiempo promedio en las estructuras que
// consumen las gráficas y tarjetas del dashboard.
export function construirResumenUsuario(tickets, calificaciones, tiempoPromedio) {
    const prioridades = [0, 0, 0, 0, 0];
    const indicePrioridad = { baja: 1, media: 2, alta: 3, crítica: 4, critica: 4 };
    tickets.forEach((ticket) => {
        const prioridad = String(ticket?.prioridad || '').trim().toLowerCase();
        prioridades[indicePrioridad[prioridad] ?? 0] += 1;
    });

    // El arreglo ya viene ordenado del más reciente al más antiguo (idTicket
    // descendente, igual que el resto de listados del sistema).
    const ultimosTickets = tickets.slice(0, 5);

    return {
        prioridades,
        calificaciones: Array.isArray(calificaciones) ? calificaciones : [0, 0, 0, 0, 0],
        tiempoPromedio: tiempoPromedio || 0,
        ultimosTickets
    };
}

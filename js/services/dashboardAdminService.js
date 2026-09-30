
import { API_BASE_URL, manejarRespuesta, apiFetch } from './apiConfig.js';

// Evita reutilizar respuestas guardadas por el navegador en un dashboard:
// sus contadores deben reflejar siempre el estado actual de la API.
function fetchFresco(url) {
    return apiFetch(url, { cache: 'no-store' });
}

// Obtiene los tickets usados por contadores y por el ranking de técnicos.
export async function obtenerTickets() {
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/tickets`));
}

// El departamento del admin no se filtra por un id que manda el front, el backend lo resuelve del usuario autenticado en la cookie.
export async function obtenerMetricasDashboard(idUsuarioAdmin) {
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/estadisticas/metricas`));
}

export async function obtenerResolucionPorDia(idUsuarioAdmin) {
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/estadisticas/resolucion-por-dia`));
}

//El departamento del admin ya no se filtra por un id que manda el front, el backend lo resuelve del usuario autenticado en la cookie.
export async function obtenerResumenMensual(idUsuarioAdmin, fechaInicio, fechaFin) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const query = params.toString();
    const url = `${API_BASE_URL}/tickets/resumen-mensual${query ? `?${query}` : ''}`;
    return manejarRespuesta(await fetchFresco(url));
}

// Panel "Mi resumen": paginado y filtrado por el departamento del admin
export async function obtenerResumenPanelAdmin(idUsuarioAdmin, categoria, pagina = 1, tamano = 5) {
    const params = new URLSearchParams({ categoria, pagina, tamano });
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/tickets/resumen-panel-admin?${params.toString()}`));
}

// Contadores para las tarjetas Pendientes/Vencidos/Vencen hoy
export async function obtenerContadoresPanelAdmin(idUsuarioAdmin) {
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/tickets/resumen-panel-admin/contadores`));
}

// Limpia y ordena el promedio de satisfacción devuelto por /estadisticas/metricas.
// El dashboard vuelve así a premiar la calificación, no la cantidad de tickets.
export function obtenerTopTecnicosPorCalificacion(datos, limite = 3) {
    if (!Array.isArray(datos)) return [];
    return datos
        .map((item) => ({
            tecnico: String(item?.tecnico || 'Técnico sin nombre').trim(),
            promedio: Math.max(0, Math.min(5, Number(item?.promedio) || 0))
        }))
        .filter((item) => item.promedio > 0)
        .sort((a, b) => b.promedio - a.promedio || a.tecnico.localeCompare(b.tecnico, 'es'))
        .slice(0, Math.max(0, limite));
}

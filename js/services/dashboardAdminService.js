/*
 * SERVICIO DEL DASHBOARD ADMINISTRATIVO
 * Las consultas usan cache:no-store para mostrar datos recientes. Además de
 * acceder a endpoints, este archivo normaliza el ranking por calificación que
 * ya calcula el backend a partir de las evaluaciones.
 */
import { API_BASE_URL, manejarRespuesta } from './apiConfig.js';

// Evita reutilizar respuestas guardadas por el navegador en un dashboard:
// sus contadores deben reflejar siempre el estado actual de la API.
function fetchFresco(url) {
    return fetch(url, { cache: 'no-store' });
}

// Obtiene los tickets usados por contadores y por el ranking de técnicos.
export async function obtenerTickets() {
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/tickets`));
}

export async function obtenerMetricasDashboard() {
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/estadisticas/metricas`));
}

export async function obtenerResolucionPorDia() {
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/estadisticas/resolucion-por-dia`));
}

export async function obtenerResumenMensual(fechaInicio, fechaFin) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const query = params.toString();
    const url = `${API_BASE_URL}/tickets/resumen-mensual${query ? `?${query}` : ''}`;
    return manejarRespuesta(await fetchFresco(url));
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

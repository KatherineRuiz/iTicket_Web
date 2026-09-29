/*
 * SERVICIO DEL DASHBOARD ADMINISTRATIVO
 * Las consultas usan cache:no-store para mostrar datos recientes. Además de
 * acceder a endpoints, este archivo normaliza el ranking por calificación que
 * ya calcula el backend a partir de las evaluaciones.
 */
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

// idUsuarioAdmin filtra las metricas al departamento del admin (obligatorio, igual que en el resto del dashboard)
export async function obtenerMetricasDashboard(idUsuarioAdmin) {
    const params = new URLSearchParams({ idUsuarioAdmin });
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/estadisticas/metricas?${params.toString()}`));
}

export async function obtenerResolucionPorDia(idUsuarioAdmin) {
    const params = new URLSearchParams({ idUsuarioAdmin });
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/estadisticas/resolucion-por-dia?${params.toString()}`));
}

// idUsuarioAdmin filtra el resumen al departamento del admin (obligatorio para el dashboard)
export async function obtenerResumenMensual(idUsuarioAdmin, fechaInicio, fechaFin) {
    const params = new URLSearchParams();
    if (idUsuarioAdmin) params.append('idUsuarioAdmin', idUsuarioAdmin);
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const query = params.toString();
    const url = `${API_BASE_URL}/tickets/resumen-mensual${query ? `?${query}` : ''}`;
    return manejarRespuesta(await fetchFresco(url));
}

// Panel "Mi resumen": paginado y filtrado por el departamento del admin
export async function obtenerResumenPanelAdmin(idUsuarioAdmin, categoria, pagina = 1, tamano = 5) {
    const params = new URLSearchParams({ idUsuarioAdmin, categoria, pagina, tamano });
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/tickets/resumen-panel-admin?${params.toString()}`));
}

// Contadores para las tarjetas Pendientes/Vencidos/Vencen hoy
export async function obtenerContadoresPanelAdmin(idUsuarioAdmin) {
    const params = new URLSearchParams({ idUsuarioAdmin });
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/tickets/resumen-panel-admin/contadores?${params.toString()}`));
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

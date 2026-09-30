import { API_BASE_URL, manejarRespuesta, apiFetch } from './apiConfig.js';

// Todas las lecturas del dashboard omiten la caché para evitar cifras antiguas.
function fetchFresco(url) {
    return apiFetch(url, { cache: 'no-store' });
}

// Panel "Asignaciones": paginado y filtrado por los tickets asignados al técnico.
// categoria: "pendientes" (por defecto), "vencidos" o "hoy".
export async function obtenerResumenPanelTecnico(idUsuario, categoria, pagina = 1, tamano = 5) {
    const parametros = new URLSearchParams({ categoria, pagina, tamano });
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/tickets/resumen-panel-tecnico?${parametros}`));
}

// Contadores para las tarjetas Pendientes/Vencidos/Vencen hoy del mismo panel.
export async function obtenerContadoresPanelTecnico(idUsuario) {
    return manejarRespuesta(await fetchFresco(`${API_BASE_URL}/tickets/resumen-panel-tecnico/contadores`));
}

// El backend ya filtra por técnico: solo trae la distribución de calificaciones
// de los tickets asignados a este usuario, en el orden 5, 4, 3, 2 y 1 estrellas.
export async function getCalificacionesTecnico(idUsuario) {
    const distribucion = await manejarRespuesta(await fetchFresco(`${API_BASE_URL}/evaluaciones/tecnico/calificaciones`));
    return Array.isArray(distribucion) ? distribucion : [0, 0, 0, 0, 0];
}

// El backend ya filtra por técnico y limita el cálculo a la última semana.
export async function getResolucionPorDiaTecnico(idUsuario) {
    const filas = await manejarRespuesta(await fetchFresco(`${API_BASE_URL}/bitacoras/tecnico/resolucion-por-dia`));
    return Array.isArray(filas) ? filas : [];
}

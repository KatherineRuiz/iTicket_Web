import { API_BASE_URL, manejarRespuesta } from './apiConfig.js';
 
// Wrapper de fetch que siempre pide datos frescos (evita que el navegador
// reuse una respuesta vieja en caché, como pasó con la lista de usuarios)
function fetchFresco(url) {
    return fetch(url, { cache: 'no-store' });
}
 
// ---------- OBTENER TICKETS PROPIOS ----------
export async function getTicketsPropios(idUsuario, pagina = 1, tamano = 20, filtros = {}) {
    const parametros = new URLSearchParams({ idUsuario, pagina, tamano });
 
    if (filtros.busqueda) parametros.append("busqueda", filtros.busqueda);
    if (filtros.prioridad) parametros.append("prioridad", filtros.prioridad);
    if (filtros.estado) parametros.append("estado", filtros.estado);
    if (filtros.fecha) parametros.append("fecha", filtros.fecha);
 
    const respuesta = await fetchFresco(`${API_BASE_URL}/tickets/mis-tickets?${parametros}`);
    return manejarRespuesta(respuesta);
}
 
// ---------- OBTENER INDICADORES DE ESTADO PROPIOS ----------
export async function getIndicadoresEstadoPropios(idUsuario) {
    const respuesta = await fetchFresco(`${API_BASE_URL}/tickets/indicadores/${idUsuario}`);
    return manejarRespuesta(respuesta);
}
 
// ---------- OBTENER CALIFICACIONES DEL TÉCNICO ----------
export async function getCalificacionesTecnico(idUsuario) {
    const respuesta = await fetchFresco(`${API_BASE_URL}/evaluaciones/tecnico/${idUsuario}`);
    return manejarRespuesta(respuesta);
}
 
// ---------- OBTENER TIEMPO PROMEDIO DE RESOLUCIÓN ----------
export async function getTiempoPromedioResolucion(idUsuario) {
    const respuesta = await fetchFresco(`${API_BASE_URL}/tickets/tiempo-promedio/${idUsuario}`);
    return manejarRespuesta(respuesta);
}
 
// ---------- OBTENER TICKETS POR ESTADO ----------
export async function getTicketsPorEstado(idUsuario, estado) {
    const parametros = new URLSearchParams({ idUsuario, estado });
    const respuesta = await fetchFresco(`${API_BASE_URL}/tickets/por-estado?${parametros}`);
    return manejarRespuesta(respuesta);
}
 
// ---------- OBTENER TICKETS QUE VENCEN HOY ----------
export async function getTicketsVencenHoy(idUsuario) {
    const respuesta = await fetchFresco(`${API_BASE_URL}/tickets/vencen-hoy/${idUsuario}`);
    return manejarRespuesta(respuesta);
}
 
// ---------- OBTENER RESUMEN COMPLETO DEL DASHBOARD ----------
export async function getResumenDashboard(idUsuario) {
    const respuesta = await fetchFresco(`${API_BASE_URL}/dashboard/tecnico/${idUsuario}`);
    return manejarRespuesta(respuesta);
}
 
// ---------- PROCESAR DATOS PARA GRÁFICOS (UTILITY) ----------
export function procesarDatosGraficos(tickets) {
    return {
        calificaciones: procesarCalificaciones(tickets),
        tiempos: procesarTiemposResolucion(tickets)
    };
}
 
// ---------- PROCESAR CALIFICACIONES ----------
function procesarCalificaciones(tickets) {
    const resueltos = tickets.filter(t => t.estado === 'Resuelto' || t.estado === 'Cerrado');
 
    const calificaciones = {
        '5 Estrellas': 0, '4 Estrellas': 0, '3 Estrellas': 0, '2 Estrellas': 0, '1 Estrella': 0
    };
 
    resueltos.forEach(t => {
        const calif = t.calificacion || 0;
        if (calif >= 4.5) calificaciones['5 Estrellas']++;
        else if (calif >= 3.5) calificaciones['4 Estrellas']++;
        else if (calif >= 2.5) calificaciones['3 Estrellas']++;
        else if (calif >= 1.5) calificaciones['2 Estrellas']++;
        else if (calif > 0) calificaciones['1 Estrella']++;
    });
 
    const total = Object.values(calificaciones).reduce((a, b) => a + b, 0);
    if (total === 0) return [45, 30, 15, 7, 3]; // Datos de ejemplo
 
    return Object.values(calificaciones).map(v => Math.round((v / total) * 100));
}
 
// ---------- PROCESAR TIEMPOS DE RESOLUCIÓN ----------
function procesarTiemposResolucion(tickets) {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const horasPorDia = {};
    dias.forEach(d => horasPorDia[d] = { total: 0, count: 0 });
 
    tickets.forEach(t => {
        if (t.fechaCreacion && t.fechaResolucion) {
            const fecha = new Date(t.fechaCreacion);
            const dia = dias[fecha.getDay() - 1] || dias[0];
            const diffHoras = (new Date(t.fechaResolucion) - new Date(t.fechaCreacion)) / (1000 * 60 * 60);
            if (horasPorDia[dia]) {
                horasPorDia[dia].total += diffHoras;
                horasPorDia[dia].count++;
            }
        }
    });
 
    const promedios = dias.map(dia =>
        horasPorDia[dia].count > 0 ? Math.round(horasPorDia[dia].total / horasPorDia[dia].count) : 0
    );
 
    if (promedios.every(v => v === 0)) return [12, 19, 3, 5, 2, 3, 8]; // Datos de ejemplo
 
    return promedios;
}
 
// ---------- CONTADORES POR ESTADO ----------
export function obtenerContadoresPorEstado(tickets) {
    const contadores = {
        pendientes: 0, enProceso: 0, enEspera: 0, resueltos: 0, cerrados: 0, vencidos: 0, vencenHoy: 0
    };
 
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
 
    tickets.forEach(t => {
        switch (t.estado) {
            case 'Pendiente': contadores.pendientes++; break;
            case 'En proceso': contadores.enProceso++; break;
            case 'En espera': contadores.enEspera++; break;
            case 'Resuelto': contadores.resueltos++; break;
            case 'Cerrado': contadores.cerrados++; break;
        }
 
        if (t.fechaVencimiento && t.estado !== 'Cerrado' && t.estado !== 'Resuelto') {
            const fechaVenc = new Date(t.fechaVencimiento);
            if (fechaVenc < hoy) contadores.vencidos++;
            if (fechaVenc.toDateString() === hoy.toDateString()) contadores.vencenHoy++;
        }
    });
 
    return contadores;
}
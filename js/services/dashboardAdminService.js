// js/services/dashboardService.js
const API_BASE = "http://localhost:8080/api";

export async function obtenerTickets() {
    const resp = await fetch(`${API_BASE}/tickets`);
    if (!resp.ok) throw new Error(`Error al obtener tickets: ${resp.status}`);
    const json = await resp.json();
    return json.data ?? json;
}

export async function obtenerMetricasDashboard() {
    const resp = await fetch(`${API_BASE}/estadisticas/metricas`);
    if (!resp.ok) throw new Error(`Error al obtener métricas: ${resp.status}`);
    const json = await resp.json();
    return json.data ?? json;
}

export async function obtenerResolucionPorDia() {
    const resp = await fetch(`${API_BASE}/estadisticas/resolucion-por-dia`);
    if (!resp.ok) throw new Error(`Error al obtener resolución por día: ${resp.status}`);
    const json = await resp.json();
    return json.data ?? json;
}

export async function obtenerResumenMensual(fechaInicio, fechaFin) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    const url = `${API_BASE}/tickets/resumen-mensual?${params.toString()}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Error al obtener resumen mensual: ${resp.status}`);
    const json = await resp.json();
    return json.data ?? json;
}
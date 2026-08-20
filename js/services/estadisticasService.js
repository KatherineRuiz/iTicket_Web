// ============================================================
// CONSTANTES GLOBALES DE URLS Y ENDPOINTS
// ============================================================
const API_BASE_URL = "http://localhost:8080/api";

const ENDPOINTS = {
    METRICAS: `${API_BASE_URL}/estadisticas/metricas`,
    ALERTAS_INSATISFACCION: `${API_BASE_URL}/estadisticas/alertas`,
    EQUIPOS_MAS_REPORTADOS: `${API_BASE_URL}/estadisticas/equipos-reportados`
};

// ============================================================
// SERVICIOS
// ============================================================

export async function obtenerMetricas(
    fechaInicio = '',
    fechaFin = '',
    pageAlertas = 0,
    sizeAlertas = 5
) {
    try {
        const params = new URLSearchParams();
        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);
        params.append('pageAlertas', pageAlertas);
        params.append('sizeAlertas', sizeAlertas);

        const url = `${ENDPOINTS.METRICAS}?${params.toString()}`;
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`Error al obtener métricas: ${respuesta.status}`);
        }

        const registros = await respuesta.json();
        return registros.data;
    } catch (error) {
        console.error("Error al obtener métricas: ", error);
        throw error;
    }
}

export async function obtenerAlertas(fechaInicio = '', fechaFin = '', page = 0, size = 5) {
    try {
        const params = new URLSearchParams();
        // El backend acepta LocalDate (YYYY-MM-DD), NO LocalDateTime
        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);

        const url = `${ENDPOINTS.ALERTAS_INSATISFACCION}?${params.toString()}`;
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`Error al obtener alertas: ${respuesta.status}`);
        }

        const json = await respuesta.json();
        if (json.success || json.exito) {
            // El backend devuelve una lista plana en json.data.
            // Paginamos del lado del cliente para mantener la tabla limpia.
            const listaCompleta = json.data || [];
            const inicio = page * size;
            const fin = inicio + size;
            const paginada = listaCompleta.slice(inicio, fin);

            return {
                content: paginada,
                totalPages: Math.ceil(listaCompleta.length / size),
                totalElements: listaCompleta.length
            };
        }
        return null;
    } catch (error) {
        console.error("Error al obtener alertas de insatisfacción: ", error);
        return null;
    }
}

export async function obtenerEquiposMasReportados(fechaInicio = '', fechaFin = '', page = 0, size = 5) {
    try {
        const params = new URLSearchParams();
        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);

        const url = `${ENDPOINTS.EQUIPOS_MAS_REPORTADOS}?${params.toString()}`;
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`Error al obtener equipos reportados: ${respuesta.status}`);
        }

        const json = await respuesta.json();
        if (json.success || json.exito) {
            // Paginación del lado del cliente
            const listaCompleta = json.data || [];
            const inicio = page * size;
            const fin = inicio + size;
            const paginada = listaCompleta.slice(inicio, fin);

            return {
                content: paginada,
                totalPages: Math.ceil(listaCompleta.length / size),
                totalElements: listaCompleta.length
            };
        }
        return null;
    } catch (error) {
        console.error("Error al obtener equipos más reportados: ", error);
        return null;
    }
}
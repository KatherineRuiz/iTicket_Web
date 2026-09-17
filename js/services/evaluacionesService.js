import { API_BASE_URL } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/evaluaciones`;

// 1. Crear evaluación de ticket resuelto
export async function crearEvaluacion(evaluacion) {
    try {
        const respuesta = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(evaluacion)
        });

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.mensaje || cuerpo?.message || "Error al registrar la evaluación");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al registrar la evaluación:", error);
        throw error;
    }
}

// 2. Obtener evaluaciones paginadas con filtros opcionales (búsqueda, calificación y fecha)
export async function obtenerEvaluaciones(
    idUsuarioAdmin,
    page = 0, 
    size = 10, 
    busqueda = "", 
    calificacion = "", 
    fecha = ""
) {
    try {
        const params = new URLSearchParams({
            idUsuarioAdmin: idUsuarioAdmin,
            page: page.toString(),
            size: size.toString()
        });

        if (busqueda && busqueda.trim() !== "") {
            params.append("busqueda", busqueda.trim());
        }

        if (calificacion && calificacion !== "" && calificacion !== "0" && calificacion !== "todos") {
            params.append("calificacion", calificacion);
        }

        if (fecha && fecha.trim() !== "") {
            params.append("fecha", fecha.trim());
        }

        const respuesta = await fetch(`${API_URL}?${params.toString()}`);

        if (!respuesta.ok) {
            throw new Error("Error al obtener las evaluaciones");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al obtener las evaluaciones:", error);
        return null;
    }
}

// 3. Obtener métricas / KPIs de evaluaciones (Promedio, Total, Satisfechos, Insatisfechos, Porcentaje)
export async function obtenerMetricasEvaluaciones(idUsuarioAdmin, busqueda = "", calificacion = "", fecha = "") {
    try {
        const params = new URLSearchParams();
        params.append("idUsuarioAdmin", idUsuarioAdmin);

        if (busqueda && busqueda.trim() !== "") {
            params.append("busqueda", busqueda.trim());
        }

        if (calificacion && calificacion !== "" && calificacion !== "0" && calificacion !== "todos") {
            params.append("calificacion", calificacion);
        }

        if (fecha && fecha.trim() !== "") {
            params.append("fecha", fecha.trim());
        }

        const queryString = params.toString();
        const url = queryString ? `${API_URL}/metricas?${queryString}` : `${API_URL}/metricas`;

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error("Error al obtener las métricas de evaluaciones");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al obtener las métricas de evaluaciones:", error);
        return null;
    }
}

// 4. Obtener el conteo total de evaluaciones
export async function obtenerEvaluacionesConteo() {
    try {
        const respuesta = await fetch(`${API_URL}/contar_evaluaciones`);

        if (!respuesta.ok) {
            throw new Error("Error al obtener el conteo de evaluaciones");
        }

        const resultado = await respuesta.json();
        return resultado.data || 0;
    } catch (error) {
        console.error("Error al obtener el conteo de evaluaciones:", error);
        return 0;
    }
}
import { API_BASE_URL } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/ubicaciones`;

export async function getUbicaciones() {
    try {
        const respuesta = await fetch(API_URL);
        if (!respuesta.ok) throw new Error("Error al obtener las ubicaciones");
        const registros = await respuesta.json();
        return registros.data;
    } catch (error) {
        console.error("Error al obtener las ubicaciones: ", error);
        throw error;
    }
}

export async function crearUbicacion(nombreUbicacion, idTipoUbicacion) {
    const respuesta = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreUbicacion, idTipoUbicacion })
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.message || "No se pudo crear la ubicación");
    return resultado.data;
}

export async function eliminarUbicacion(id) {
    const respuesta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!respuesta.ok) throw new Error("No se pudo eliminar la ubicación");
}

export async function actualizarUbicacion(id, nombreUbicacion, idTipoUbicacion) {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreUbicacion, idTipoUbicacion })
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.message || "No se pudo actualizar la ubicación");
    return resultado.data;
}

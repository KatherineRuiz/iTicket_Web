import { API_BASE_URL, manejarRespuesta } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/ubicaciones`;

export async function getUbicaciones() {
    try {
        const respuesta = await fetch(API_URL);
        return await manejarRespuesta(respuesta);
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
    return await manejarRespuesta(respuesta);
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
    return await manejarRespuesta(respuesta);
}

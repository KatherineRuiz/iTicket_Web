import { API_BASE_URL, manejarRespuesta, apiFetch } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/tipoubicacion`;

export async function getTiposUbicacion() {
    const respuesta = await apiFetch(API_URL);
    return await manejarRespuesta(respuesta);
}

export async function crearTipoUbicacion(nombre) {
    const respuesta = await apiFetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_tipo_ubicacion: nombre })
    });
    return await manejarRespuesta(respuesta);
}

export async function eliminarTipoUbicacion(id) {
    const respuesta = await apiFetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!respuesta.ok) throw new Error("No se pudo eliminar el tipo de ubicación");
}

export async function actualizarTipoUbicacion(id, nombre) {
    const respuesta = await apiFetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_tipo_ubicacion: nombre })
    });
    return await manejarRespuesta(respuesta);
}

import { API_BASE_URL, manejarRespuesta, apiFetch } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/marcas`;

export async function getMarcas() {
    const respuesta = await apiFetch(API_URL);
    return await manejarRespuesta(respuesta);
}

export async function crearMarca(nombreMarca) {
    const respuesta = await apiFetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreMarca })
    });
    return await manejarRespuesta(respuesta);
}

export async function eliminarMarca(id) {
    const respuesta = await apiFetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!respuesta.ok) throw new Error("No se pudo eliminar la marca");
}

export async function actualizarMarca(id, nombreMarca) {
    const respuesta = await apiFetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreMarca })
    });
    return await manejarRespuesta(respuesta);
}

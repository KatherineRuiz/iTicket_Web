import { API_BASE_URL, manejarRespuesta, apiFetch } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/modelos`;

export async function getModelos() {
    const respuesta = await apiFetch(API_URL);
    return await manejarRespuesta(respuesta);
}

export async function crearModelo(nombreModelo, idMarca) {
    const respuesta = await apiFetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreModelo, idMarca })
    });
    return await manejarRespuesta(respuesta);
}

export async function eliminarModelo(id) {
    const respuesta = await apiFetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!respuesta.ok) throw new Error("No se pudo eliminar el modelo");
}

export async function actualizarModelo(id, nombreModelo, idMarca) {
    const respuesta = await apiFetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreModelo, idMarca })
    });
    return await manejarRespuesta(respuesta);
}
import { API_BASE_URL, manejarRespuesta, apiFetch } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/categorias`;

export async function getCategorias() {
    const respuesta = await apiFetch(API_URL);
    return await manejarRespuesta(respuesta);
}

export async function crearCategoria(nombreCategoria) {
    const respuesta = await apiFetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreCategoria })
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
        const error = new Error(resultado.message || "No se pudo crear la categoría");
        error.status = respuesta.status;
        throw error;
    }
    return resultado.data;
}

export async function eliminarCategoria(id) {
    const respuesta = await apiFetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!respuesta.ok) throw new Error("No se pudo eliminar la categoría");
}

export async function actualizarCategoria(id, nombreCategoria) {
    const respuesta = await apiFetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreCategoria })
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
        const error = new Error(resultado.message || "No se pudo actualizar la categoría");
        error.status = respuesta.status;
        throw error;
    }
    return resultado.data;
}

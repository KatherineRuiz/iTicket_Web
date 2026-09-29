import { API_BASE_URL, manejarRespuesta, apiFetch } from './apiConfig.js';
 
const URL_AREAS = `${API_BASE_URL}/areas`;
 
export async function getAreas() {
    const respuesta = await apiFetch(URL_AREAS);
    return manejarRespuesta(respuesta);
}
 
export async function getAreaById(id) {
    const respuesta = await apiFetch(`${URL_AREAS}/${id}`);
    return manejarRespuesta(respuesta);
}
 
export async function crearArea(area) {
    const respuesta = await apiFetch(URL_AREAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(area)
    });
    return manejarRespuesta(respuesta);
}
 
export async function actualizarArea(id, area) {
    const respuesta = await apiFetch(`${URL_AREAS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(area)
    });
    return manejarRespuesta(respuesta);
}
 
export async function eliminarArea(id) {
    const respuesta = await apiFetch(`${URL_AREAS}/${id}`, { method: "DELETE" });
    return manejarRespuesta(respuesta);
}
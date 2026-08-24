import { API_BASE_URL, manejarRespuesta } from './apiConfig.js';

const URL_ROLES = `${API_BASE_URL}/roles`;

export async function getRoles() {
    const respuesta = await fetch(URL_ROLES);
    return manejarRespuesta(respuesta);
}

export async function getRolById(id) {
    const respuesta = await fetch(`${URL_ROLES}/${id}`);
    return manejarRespuesta(respuesta);
}

export async function crearRol(rol) {
    const respuesta = await fetch(URL_ROLES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rol)
    });
    return manejarRespuesta(respuesta);
}

export async function actualizarRol(id, rol) {
    const respuesta = await fetch(`${URL_ROLES}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rol)
    });
    return manejarRespuesta(respuesta);
}

export async function eliminarRol(id) {
    const respuesta = await fetch(`${URL_ROLES}/${id}`, { method: "DELETE" });
    return manejarRespuesta(respuesta);
}

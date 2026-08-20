import { API_BASE_URL, manejarRespuesta } from './apiConfig.js';
 
const URL_USUARIOS = `${API_BASE_URL}/usuarios`;
 
export async function getUsuarios() {
    const respuesta = await fetch(URL_USUARIOS);
    return manejarRespuesta(respuesta);
}
 
export async function getUsuarioById(id) {
    const respuesta = await fetch(`${URL_USUARIOS}/${id}`);
    return manejarRespuesta(respuesta);
}
 
export async function crearUsuario(usuario) {
    const respuesta = await fetch(URL_USUARIOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario)
    });
    return manejarRespuesta(respuesta);
}
 
export async function actualizarUsuario(id, usuario) {
    const respuesta = await fetch(`${URL_USUARIOS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario)
    });
    return manejarRespuesta(respuesta);
}
 
export async function eliminarUsuario(id) {
    const respuesta = await fetch(`${URL_USUARIOS}/${id}`, { method: "DELETE" });
    return manejarRespuesta(respuesta);
}
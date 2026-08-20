import { API_BASE_URL, manejarRespuesta } from './apiConfig.js';
 
const URL_DEPARTAMENTOS = `${API_BASE_URL}/departamentos`;
 
export async function getDepartamentos() {
    const respuesta = await fetch(URL_DEPARTAMENTOS);
    return manejarRespuesta(respuesta);
}
 
export async function getDepartamentoById(id) {
    const respuesta = await fetch(`${URL_DEPARTAMENTOS}/${id}`);
    return manejarRespuesta(respuesta);
}
 
export async function crearDepartamento(departamento) {
    const respuesta = await fetch(URL_DEPARTAMENTOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(departamento)
    });
    return manejarRespuesta(respuesta);
}
 
export async function actualizarDepartamento(id, departamento) {
    const respuesta = await fetch(`${URL_DEPARTAMENTOS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(departamento)
    });
    return manejarRespuesta(respuesta);
}
 
export async function eliminarDepartamento(id) {
    const respuesta = await fetch(`${URL_DEPARTAMENTOS}/${id}`, { method: "DELETE" });
    return manejarRespuesta(respuesta);
}
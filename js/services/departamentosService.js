import { API_BASE_URL, manejarRespuesta, apiFetch } from './apiConfig.js';
 
const URL_DEPARTAMENTOS = `${API_BASE_URL}/departamentos`;
 
export async function getDepartamentos() {
    const respuesta = await apiFetch(URL_DEPARTAMENTOS);
    return manejarRespuesta(respuesta);
}
 
export async function getDepartamentoById(id) {
    const respuesta = await apiFetch(`${URL_DEPARTAMENTOS}/${id}`);
    return manejarRespuesta(respuesta);
}
 
export async function crearDepartamento(departamento) {
    const respuesta = await apiFetch(URL_DEPARTAMENTOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(departamento)
    });
    return manejarRespuesta(respuesta);
}
 
export async function actualizarDepartamento(id, departamento) {
    const respuesta = await apiFetch(`${URL_DEPARTAMENTOS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(departamento)
    });
    return manejarRespuesta(respuesta);
}
 
export async function eliminarDepartamento(id) {
    const respuesta = await apiFetch(`${URL_DEPARTAMENTOS}/${id}`, { method: "DELETE" });
    return manejarRespuesta(respuesta);
}

//Departamentos que reciben tickets. La lista es la misma para todos, no depende del area
export async function getDepartamentosAsignables() {
    try {
        const respuesta = await apiFetch(`${URL_DEPARTAMENTOS}/asignables`);
        if (!respuesta.ok) {
            console.error("Error al obtener los departamentos asignables");
            throw new Error("Error al obtener los departamentos asignables");
        }

        const registros = await respuesta.json();
        return registros.data;
    } catch (error) {
        console.error("Error al obtener los departamentos asignables:", error);
        throw error;
    }
}
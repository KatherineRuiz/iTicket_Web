import { API_BASE_URL, manejarRespuesta, apiFetch } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/bitacoras`

//Obtener la bitácora paginada del departamento del administrador/técnico (incluye los eliminados).
//El departamento ya no se filtra por un id que manda el front, el backend lo
//resuelve del usuario autenticado en la cookie.
export async function getBitacoras(pagina = 1, tamano = 10, filtros = {}) {
    try {
        const parametros = new URLSearchParams({ pagina, tamano })

        if (filtros.busqueda) parametros.append("busqueda", filtros.busqueda);
        if (filtros.estado) parametros.append("estado", filtros.estado);

        const respuesta = await apiFetch(`${API_URL}?${parametros}`);

        if (!respuesta.ok) {
            console.error("Error al obtener las bitácoras");
            throw new Error("Error al obtener las bitácoras");
        }
        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al obtener las bitácoras:", error);
        throw error;
    }
}

export async function getBitacorasPorTicket(idTicket) {
    try{
        const respuesta = await apiFetch(`${API_URL}/bitacoraTicket/${idTicket}`);
        if(!respuesta.ok){
            console.error("Error al obtener las bitácoras del ticket");
            throw new Error("Error al obtener las bitácoras del ticket");
        }
        const bitacoras = await respuesta.json();
        return bitacoras.data;
    } catch (error) {
        console.error("Error al obtener la bitacora del ticket:", error);
        throw error;
    }
}
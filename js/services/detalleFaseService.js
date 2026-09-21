import { API_BASE_URL, manejarRespuesta } from "./apiConfig.js";

// URL de la API
const API_URL = `${API_BASE_URL}/detalleFase`;

//Obtener la lista completa de detalles de fase
export async function getDetallesFase() {
    try {
        const respuesta = await fetch(API_URL);

        if (respuesta.status === 204) {
            return [];
        }

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || 'Error al obtener los detalles de la fase');
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error('Error en getDetallesFase:', error);
        throw error;
    }
}

//Crear un nuevo detalle de fase
export async function crearDetalleFase(detalle) {
    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(detalle)
        });

        const cuerpo = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
            throw new Error(cuerpo?.message || 'Error al crear el detalle de la fase');
        }

        return cuerpo.data;
    } catch (error) {
        console.error('Error en crearDetalleFase:', error);
        throw error;
    }
}

//Actualizar un detalle de fase existente
export async function actualizarDetalleFase(id, detalleActualizado) {
    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(detalleActualizado)
        });

        const cuerpo = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
            throw new Error(cuerpo?.message || 'Error al actualizar el detalle de la fase');
        }

        return cuerpo.data;
    } catch (error) {
        console.error('Error en actualizarDetalleFase:', error);
        throw error;
    }
}

//Eliminar un detalle de fase existente
export async function eliminarDetalleFase(id) {
    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        //204 No Content -> el detalle fue eliminado correctamente, no hay body que parsear
        if (respuesta.status === 204) {
            return true;
        }

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || 'Error al eliminar el detalle de la fase');
        }

        return true;
    } catch (error) {
        console.error('Error en eliminarDetalleFase:', error);
        throw error;
    }
}

//Obtener listado de detalles segun la fase seleccionada
export async function getDetallesFasePorFase(idFase) {
    try {
        const respuesta = await fetch(`${API_URL}/idFase/${idFase}`);

        //204 o 404 -> esta fase todavia no tiene detalles registrados
        if (respuesta.status === 204 || respuesta.status === 404) {
            return [];
        }

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || 'Error al obtener los detalles de la fase por fase');
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error('Error en getDetallesFasePorFase:', error);
        throw error;
    }
}

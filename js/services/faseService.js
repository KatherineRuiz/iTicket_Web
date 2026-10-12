import { API_BASE_URL, manejarRespuesta, apiFetch } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/fases`;

// Obtiene la lista completa. Un 204 es válido y se normaliza a arreglo vacío.
export async function getFases() {
    try {
        const respuesta = await apiFetch(API_URL);

        //204 No Content -> no hay fases registradas todavia
        if (respuesta.status === 204) {
            return [];
        }

        if(!respuesta.ok) {
            throw new Error("Error al obtener las fases");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    }
    catch (error) {
        console.error("Error al obtener las fases:", error);
        throw error;
    }
}

// Busca por nombre; encodeURIComponent protege espacios y caracteres especiales.
// Un 404 significa que no existe y se devuelve null, no un error de interfaz.
export async function getNombreFase(name) {
    try {
        const respuesta = await apiFetch(`${API_URL}/nombreFase/${encodeURIComponent(name)}`);

        //404 Not Found -> no hay fase con ese nombre
        if (respuesta.status === 404) {
            return null;
        }

        if (!respuesta.ok) {
            throw new Error("Error al obtener la fase");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al obtener la fase:", error);
        throw error;
    }
}

// Crea una fase enviando el objeto recibido como JSON.
export async function crearFase(fase) {
    try {
        const respuesta = await apiFetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(fase)
        });

        const resultado = await respuesta.json().catch(() => null);
        if (!respuesta.ok) {
            throw new Error(resultado?.message || "Error al crear la fase");
        }
        return resultado?.data;
    } catch (error) {
        console.error("Error al crear la fase:", error);
        throw error;
    }
}

// Actualiza una fase existente y devuelve la representación nueva de la API.
// Leer el mensaje de error del backend ayuda a explicar restricciones concretas.
export async function actualizarFase(id, faseActualizada) {
    try {
        const respuesta = await apiFetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(faseActualizada)
        });

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || "Error al actualizar la fase");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al actualizar la fase:", error);
        throw error;
    }
}

// Elimina una fase. Un 204 confirma éxito aunque no exista cuerpo para leer.
export async function eliminarFase(id) {
    try {
        const respuesta = await apiFetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        //204 No Content -> la fase fue eliminada correctamente
        if (respuesta.status === 204) {
            return;
        }

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || "Error al eliminar la fase");
        }

        return true;
    }
    catch (error) {
        console.error("Error al eliminar la fase:", error);
        throw error;
    }
}

// Obtiene únicamente las fases relacionadas con un proyecto. Tanto 204 como 404
// se convierten en [] porque para la vista ambos significan "sin fases".
export async function getFasesPorProyecto(idProyecto) {
    try {
        const respuesta = await apiFetch(`${API_URL}/proyecto/${idProyecto}`);

        //204 No Content -> el proyecto todavia no tiene fases registradas
        if (respuesta.status === 204) {
            return [];
        }

        if (respuesta.status === 404) {
            return [];
        }

        if (!respuesta.ok) {
            throw new Error("Error al obtener las fases del proyecto");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al obtener las fases del proyecto:", error);
        throw error;
    }
}

// Reabre una fase ya finalizada (acción solo para Administrador, ver FaseService.reabrirFase
// en el backend). Devuelve la fase ya actualizada con finalizado = false.
export async function reabrirFase(id) {
    try {
        const respuesta = await apiFetch(`${API_URL}/${id}/reabrir`, {
            method: "PATCH"
        });

        const cuerpo = await respuesta.json().catch(() => null);
        if (!respuesta.ok) {
            throw new Error(cuerpo?.message || "Error al reabrir la fase");
        }
        return cuerpo?.data;
    } catch (error) {
        console.error("Error al reabrir la fase:", error);
        throw error;
    }
}

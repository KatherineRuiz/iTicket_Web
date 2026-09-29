import { API_BASE_URL, manejarRespuesta, apiFetch } from "./apiConfig.js";

//Configuracion de URL
const API_URL = `${API_BASE_URL}/proyectos`;

//Obtener la lista completa de proyectos
export async function getProyectos() {
    try {
        const respuesta = await apiFetch(API_URL);

        //204 No Content -> no hay proyectos registrados todavia
        if (respuesta.status === 204) {
            return [];
        }

        if (!respuesta.ok) {
            throw new Error("Error al obtener los proyectos");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al obtener los proyectos:", error);
        throw error;
    }
}

//Obtener un proyecto por ID
export async function getProyecto(id) {
    try {
        const respuesta = await apiFetch(`${API_URL}/${id}`);

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || "Error al obtener el proyecto");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al obtener el proyecto:", error);
        throw error;
    }
}

//Crear un nuevo proyecto
export async function crearProyecto(proyecto) {
    try {
        const respuesta = await apiFetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(proyecto)
        });

        const cuerpo = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
            throw new Error(cuerpo?.message || "Error al crear el proyecto");
        }

        return cuerpo.data;
    } catch (error) {
        console.error("Error al crear el proyecto:", error);
        throw error;
    }
}

//Actualizar un proyecto existente
export async function actualizarProyecto(id, proyecto) {
    try {
        const respuesta = await apiFetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(proyecto)
        });

        const cuerpo = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
            throw new Error(cuerpo?.message || "Error al actualizar el proyecto");
        }

        return cuerpo.data;
    } catch (error) {
        console.error("Error al actualizar el proyecto:", error);
        throw error;
    }
}

//Eliminar un proyecto
export async function eliminarProyecto(id) {
    try {
        const respuesta = await apiFetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        //204 No Content -> eliminado correctamente
        if (respuesta.status === 204) {
            return true;
        }

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || "Error al eliminar el proyecto");
        }

        return true;
    } catch (error) {
        console.error("Error al eliminar el proyecto:", error);
        throw error;
    }
}

//Buscar proyectos por nombre (coincidencia parcial)
export async function buscarProyectosPorNombre(nombre) {
    try {
        const respuesta = await apiFetch(`${API_URL}/nombre?nombre=${encodeURIComponent(nombre)}`);

        if (respuesta.status === 404) {
            return [];
        }

        if (!respuesta.ok) {
            throw new Error("Error al buscar los proyectos");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al buscar los proyectos:", error);
        throw error;
    }
}

//Buscar proyectos por tipo (Construcción, Remodelación, Ampliación, Mantenimiento)
export async function buscarProyectosPorTipo(tipo) {
    try {
        const respuesta = await apiFetch(`${API_URL}/tipo/${encodeURIComponent(tipo)}`);

        if (respuesta.status === 404) {
            return [];
        }

        if (!respuesta.ok) {
            throw new Error("Error al buscar los proyectos");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al buscar los proyectos:", error);
        throw error;
    }
}

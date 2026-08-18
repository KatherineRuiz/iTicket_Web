const API_URL = "http://localhost:8080/api/fases";
//Obtener la lista completa de fases 
export async function getFases() {
    try {
        const respuesta = await fetch(API_URL);

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

//Metodo para obtener una fase por nombre
export async function getNombreFase(name) {
    try {
        const respuesta = await fetch(`${API_URL}/${name}`);

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

//Crear una nueva fase
export async function crearFase(fase) {
    try {
        const respuesta = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(fase)
        });

        if (!respuesta.ok) {
            throw new Error("Error al crear la fase");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al crear la fase:", error);
        throw error;
    }
}

//Actualizar una fase existente, y corrigiendo el error de actualización de la lista de fases en memoria local
export async function actualizarFase(id, faseActualizada) {
    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
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

//Eliminar una fase
export async function eliminarFase(id) {
    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
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

//Obtener todas las fases de un proyecto especifico
export async function getFasesPorProyecto(idProyecto) {
    try {
        const respuesta = await fetch(`${API_URL}/proyecto/${idProyecto}`);

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
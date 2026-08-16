const API_URL = "http://localhost:8080/api/comentarios";

//Crea un comentario asociado a un ticket
export async function crearComentario(dto) {
    try {
        const respuesta = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dto)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.message || "Error al crear el comentario");
        }

        return resultado.data;
    } catch (error) {
        console.error("Error al crear comentario:", error);
        throw error;
    }
}

//Eliminar un comentario
export async function eliminarComentario(idComentario) {
    try {
        const respuesta = await fetch(`${API_URL}/${idComentario}`, { 
            method: "DELETE" 
        });

        if (!respuesta.ok) {
            throw new Error("Error al eliminar el comentario");
        }

        return true;
    } catch (error) {
        console.error("Error al eliminar comentario:", error);
        throw error;
    }
}

//Obtener todos los comentarios de un ticket
export async function obtenerComentariosPorTicket(idTicket) {
    try {
        const respuesta = await fetch(`${API_URL}/ticket/${idTicket}`);

        if (respuesta.status === 404) {
            return [];
        }
        if (!respuesta.ok) {
            throw new Error("Error al obtener los comentarios del ticket");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al obtener comentarios:", error);
        throw error;
    }
}

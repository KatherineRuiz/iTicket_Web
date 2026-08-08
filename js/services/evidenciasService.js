const API_URL = "http://localhost:8080/api/evidencias";


//Sube un archivo de evidencia asociado a un ticket ya creado
export async function subirEvidencia(archivo, idTicket) {
    try {
        const formData = new FormData();
        formData.append("archivo", archivo);
        formData.append("idTicket", idTicket);

        const respuesta = await fetch(`${API_URL}/subir`, {
            method: "POST",
            body: formData
        });

        if (!respuesta.ok) {
            throw new Error("Error al subir la evidencia");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al subir evidencia:", error);
        throw error;
    }
}

//Obtener todas las evidencias de un ticket
export async function obtenerEvidenciasPorTicket(idTicket) {
    try {
        const respuesta = await fetch(`${API_URL}/ticket/${idTicket}`);

        if (respuesta.status === 204) {
            return [];
        }
        if (!respuesta.ok) {
            throw new Error("Error al obtener las evidencias del ticket");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al obtener evidencias:", error);
        throw error;
    }
}

//Eliminar evidencia
export async function eliminarEvidencia(idEvidencia) {
    try {
        const respuesta = await fetch(`${API_URL}/${idEvidencia}`, { method: "DELETE" });

        if (!respuesta.ok) {
            throw new Error("Error al eliminar la evidencia");
        }

        return true;
    } catch (error) {
        console.error("Error al eliminar evidencia:", error);
        throw error;
    }
}
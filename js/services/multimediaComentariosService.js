const API_URL = "http://localhost:8080/api/multimediaComentarios";

//Sube un archivo adjunto asociado a un comentario ya creado
export async function subirMultimediaComentario(archivo, idComentario) {
    try {
        const formData = new FormData();
        formData.append("archivo", archivo);
        formData.append("idComentario", idComentario);

        const respuesta = await fetch(`${API_URL}/subir`, {
            method: "POST",
            body: formData
        });

        if (!respuesta.ok) {
            throw new Error("Error al subir el archivo del comentario");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al subir multimedia del comentario:", error);
        throw error;
    }
}

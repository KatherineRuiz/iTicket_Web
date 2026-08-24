const API_URL = "http://localhost:8080/api/modelos";

export async function getModelos() {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) throw new Error("Error al obtener los modelos");
    const registros = await respuesta.json();
    return registros.data;
}

export async function crearModelo(nombreModelo, idMarca) {
    const respuesta = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreModelo, idMarca })
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.message || "No se pudo crear el modelo");
    return resultado.data;
}

export async function eliminarModelo(id) {
    const respuesta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!respuesta.ok) throw new Error("No se pudo eliminar el modelo");
}

export async function actualizarModelo(id, nombreModelo, idMarca) {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreModelo, idMarca })
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.message || "No se pudo actualizar el modelo");
    return resultado.data;
}
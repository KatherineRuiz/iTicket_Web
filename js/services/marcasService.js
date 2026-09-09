const API_URL = "http://localhost:8080/api/marcas";

export async function getMarcas() {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) throw new Error("Error al obtener las marcas");
    const registros = await respuesta.json();
    return registros.data;
}

export async function crearMarca(nombreMarca) {
    const respuesta = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreMarca })
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.message || "No se pudo crear la marca");
    return resultado.data;
}

export async function eliminarMarca(id) {
    const respuesta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!respuesta.ok) throw new Error("No se pudo eliminar la marca");
}

export async function actualizarMarca(id, nombreMarca) {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreMarca })
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.message || "No se pudo actualizar la marca");
    return resultado.data;
}

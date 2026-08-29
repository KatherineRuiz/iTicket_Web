const API_URL = "http://localhost:8080/api/tipoubicacion";

export async function getTiposUbicacion() {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) throw new Error("Error al obtener los tipos de ubicación");
    const registros = await respuesta.json();
    return registros.data;
}

export async function crearTipoUbicacion(nombre) {
    const respuesta = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_tipo_ubicacion: nombre })
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.message || "No se pudo crear el tipo de ubicación");
    return resultado.data;
}

export async function eliminarTipoUbicacion(id) {
    const respuesta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!respuesta.ok) throw new Error("No se pudo eliminar el tipo de ubicación");
}

export async function actualizarTipoUbicacion(id, nombre) {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_tipo_ubicacion: nombre })
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.message || "No se pudo actualizar el tipo de ubicación");
    return resultado.data;
}

const API_URL = "http://localhost:8080/api/articulos";

export async function getArticulosPaginados(pagina = 1, tamano = 10, filtros = {}) {
    const params = new URLSearchParams({ pagina, tamano });

    if (filtros.busqueda) params.append("busqueda", filtros.busqueda);
    if (filtros.idCategoria) params.append("idCategoria", filtros.idCategoria);
    if (filtros.idUbicacion) params.append("idUbicacion", filtros.idUbicacion);

    const respuesta = await fetch(`${API_URL}/paginado?${params.toString()}`);
    if (!respuesta.ok) throw new Error("Error al obtener los artículos");
    const registros = await respuesta.json();
    return registros.data; // { articulos, totalElementos, totalPaginas, paginaActual }
}

export async function crearArticulo(codigoArticulo, idCategoria, idUbicacion, idModelo) {
    const cuerpo = { codigoArticulo, idCategoria, idUbicacion };
    if (idModelo) cuerpo.idModelo = idModelo;

    const respuesta = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo)
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.message || "No se pudo crear el artículo");
    return resultado.data;
}

export async function eliminarArticulo(id) {
    const respuesta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!respuesta.ok) throw new Error("No se pudo eliminar el artículo");
}
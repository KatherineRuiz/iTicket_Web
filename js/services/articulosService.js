import { API_BASE_URL } from "./apiConfig.js";

const API_URL = `${API_BASE_URL}/articulos`;

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
    if (!respuesta.ok) {
        const error = new Error(resultado.message || "No se pudo crear el artículo");
        error.status = respuesta.status;
        throw error;
    }
    return resultado.data;
}

export async function eliminarArticulo(id) {
    const respuesta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!respuesta.ok) throw new Error("No se pudo eliminar el artículo");
}

// Busca artículos por coincidencia parcial. encodeURIComponent impide que
// espacios o caracteres especiales rompan el parámetro de la URL.
export async function buscarArticulosPorCodigoParcial(fragmento) {
    try{
        const respuesta = await fetch(`${API_URL}/buscar?codigo=${encodeURIComponent(fragmento)}`);
        if(!respuesta.ok){
            console.error("Error al buscar artículos");
            throw new Error("Error al buscar artículos");
        }

        const registros = await respuesta.json();
        return registros.data;
    } catch(error){
        console.error("Error al buscar artículos: ", error);
        throw error;
    }
}

export async function obtenerCodigosNoInventariados(codigos) {
    const codigosUnicos = [...new Set((codigos || []).map((codigo) => String(codigo).trim()).filter(Boolean))];
    const comprobaciones = await Promise.all(codigosUnicos.map(async (codigo) => {
        const resultados = await buscarArticulosPorCodigoParcial(codigo);
        const codigoBuscado = codigo.toLocaleUpperCase("es");
        const existe = Array.isArray(resultados) && resultados.some((articulo) =>
            String(articulo?.codigoArticulo || "").trim().toLocaleUpperCase("es") === codigoBuscado
        );
        return existe ? null : codigo;
    }));

    return comprobaciones.filter(Boolean);
}

export async function actualizarArticulo(id, codigoArticulo, idCategoria, idUbicacion, idModelo) {
    const respuesta = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigoArticulo, idCategoria, idUbicacion, idModelo })
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
        const error = new Error(resultado.message || "No se pudo actualizar el artículo");
        error.status = respuesta.status;
        throw error;
    }
    return resultado.data;
}

import { API_BASE_URL, manejarRespuesta, apiFetch } from "./apiConfig.js";

const URL_USUARIOS = `${API_BASE_URL}/usuarios`;

export async function getUsuarioById(idUsuario) {
    const respuesta = await apiFetch(`${URL_USUARIOS}/${idUsuario}`);
    return manejarRespuesta(respuesta);
}

// Alias conservado porque authService.js todavía importa este nombre.
export async function getUsuarioPorId(idUsuario) {
    return getUsuarioById(idUsuario);
}

export async function crearUsuario(usuario) {
    const respuesta = await apiFetch(URL_USUARIOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario)
    });

    return manejarRespuesta(respuesta);
}

export async function actualizarUsuario(idUsuario, usuario) {
    const respuesta = await apiFetch(`${URL_USUARIOS}/${idUsuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario)
    });

    return manejarRespuesta(respuesta);
}

//Autoservicio: el usuario ya no viaja en la ruta, el backend lo resuelve de la cookie de sesion.
export async function cambiarClave(idUsuario, claveActual, claveNueva) {
    const respuesta = await apiFetch(`${URL_USUARIOS}/clave`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claveActual, claveNueva })
    });

    return manejarRespuesta(respuesta);
}

//Autoservicio: el usuario ya no viaja en la ruta, el backend lo resuelve de la cookie de sesion.
export async function actualizarFotoPerfil(idUsuario, archivo) {
    const formulario = new FormData();
    formulario.append("archivo", archivo);
    const controlador = new AbortController();
    const limiteEspera = window.setTimeout(() => controlador.abort(), 30000);

    try {
        const respuesta = await apiFetch(`${URL_USUARIOS}/imagen`, {
            method: "PATCH",
            body: formulario,
            signal: controlador.signal
        });
        return await manejarRespuesta(respuesta);
    } catch (error) {
        if (error?.name === "AbortError") {
            throw new Error("La subida tardó demasiado. Intenta nuevamente.");
        }
        throw error;
    } finally {
        window.clearTimeout(limiteEspera);
    }
}

export async function eliminarUsuario(idUsuario) {
    const respuesta = await apiFetch(`${URL_USUARIOS}/${idUsuario}`, {
        method: "DELETE"
    });

    return manejarRespuesta(respuesta);
}

// Obtiene la lista completa que alimenta la tabla de administración.
export async function getUsuarios() {
    const respuesta = await apiFetch(URL_USUARIOS);
    return manejarRespuesta(respuesta);
}

export async function getTecnicosPorDepartamento(idDepartamento) {
    const parametros = new URLSearchParams({ idDepartamento });
    const respuesta = await apiFetch(
        `${URL_USUARIOS}/tecnicos?${parametros}`
    );

    return manejarRespuesta(respuesta);
}

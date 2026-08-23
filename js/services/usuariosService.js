import { API_BASE_URL, manejarRespuesta } from "./apiConfig.js";

const URL_USUARIOS = `${API_BASE_URL}/usuarios`;

export async function getUsuarioById(idUsuario) {
    const respuesta = await fetch(`${URL_USUARIOS}/${idUsuario}`);
    return manejarRespuesta(respuesta);
}

// Este nombre lo utiliza actualmente authService.js
export async function getUsuarioPorId(idUsuario) {
    return getUsuarioById(idUsuario);
}

export async function crearUsuario(usuario) {
    const respuesta = await fetch(URL_USUARIOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario)
    });

    return manejarRespuesta(respuesta);
}

export async function actualizarUsuario(idUsuario, usuario) {
    const respuesta = await fetch(`${URL_USUARIOS}/${idUsuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario)
    });

    return manejarRespuesta(respuesta);
}

export async function eliminarUsuario(idUsuario) {
    const respuesta = await fetch(`${URL_USUARIOS}/${idUsuario}`, {
        method: "DELETE"
    });

    return manejarRespuesta(respuesta);
}

//Obtener la lista completa de usuarios
export async function getUsuarios() {
    const respuesta = await fetch(URL_USUARIOS);
    return manejarRespuesta(respuesta);
}

export async function getTecnicosPorDepartamento(idDepartamento) {
    const parametros = new URLSearchParams({ idDepartamento });
    const respuesta = await fetch(
        `${URL_USUARIOS}/tecnicos?${parametros}`
    );

    return manejarRespuesta(respuesta);
}
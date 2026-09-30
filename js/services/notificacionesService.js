import { API_BASE_URL, manejarRespuesta, apiFetch } from './apiConfig.js';

const URL_NOTIFICACIONES = `${API_BASE_URL}/notificaciones`;

function obtenerIdUsuarioLogueado() {
    try {
        const sesion = JSON.parse(sessionStorage.getItem("usuarioLogueado"));
        return sesion?.idUsuario ?? null;
    } catch {
        return null;
    }
}

// Paginado y limitado al ultimo mes por el backend. El usuario ya no viaja
// en la URL, el backend lo resuelve de la cookie de sesion.
export async function getNotificaciones(pagina = 1, tamano = 10) {
    const params = new URLSearchParams({ pagina, tamano });
    const respuesta = await apiFetch(`${URL_NOTIFICACIONES}?${params.toString()}`);
    return manejarRespuesta(respuesta);
}

export async function contarNoLeidas() {
    const respuesta = await apiFetch(`${URL_NOTIFICACIONES}/no-leidas/contador`);
    return manejarRespuesta(respuesta);
}

export async function marcarComoLeida(id) {
    const respuesta = await apiFetch(`${URL_NOTIFICACIONES}/${id}/leida`, { method: "PATCH" });
    return manejarRespuesta(respuesta);
}

export async function marcarTodasComoLeidas() {
    const respuesta = await apiFetch(`${URL_NOTIFICACIONES}/leerTodas`, { method: "PATCH" });
    return manejarRespuesta(respuesta);
}
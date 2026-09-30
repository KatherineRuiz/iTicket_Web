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

// Paginado y limitado al ultimo mes por el backend
export async function getNotificaciones(pagina = 1, tamano = 10) {
    const idUsuario = obtenerIdUsuarioLogueado();
    if (!idUsuario) return { notificaciones: [], totalElementos: 0, totalPaginas: 0, paginaActual: 1 };
    const params = new URLSearchParams({ idUsuario, pagina, tamano });
    const respuesta = await apiFetch(`${URL_NOTIFICACIONES}?${params.toString()}`);
    return manejarRespuesta(respuesta);
}

export async function contarNoLeidas() {
    const idUsuario = obtenerIdUsuarioLogueado();
    if (!idUsuario) return 0;
    const respuesta = await apiFetch(`${URL_NOTIFICACIONES}/no-leidas/contador?idUsuario=${idUsuario}`);
    return manejarRespuesta(respuesta);
}

export async function marcarComoLeida(id) {
    const idUsuario = obtenerIdUsuarioLogueado();
    const respuesta = await apiFetch(`${URL_NOTIFICACIONES}/${id}/leida?idUsuario=${idUsuario}`, { method: "PATCH" });
    return manejarRespuesta(respuesta);
}

export async function marcarTodasComoLeidas() {
    const idUsuario = obtenerIdUsuarioLogueado();
    const respuesta = await apiFetch(`${URL_NOTIFICACIONES}/leerTodas?idUsuario=${idUsuario}`, { method: "PATCH" });
    return manejarRespuesta(respuesta);
}
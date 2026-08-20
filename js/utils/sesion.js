// Lee los datos del usuario que inició sesión (guardados por index.js en sessionStorage al autenticarse)
export function obtenerUsuarioLogueado() {
    const datos = sessionStorage.getItem("usuarioLogueado");
    if (!datos) return null;

    try {
        return JSON.parse(datos);
    } catch (error) {
        console.error("No se pudo leer el usuario logueado:", error);
        return null;
    }
}

// Devuelve el id del usuario logueado. Si no hay sesión guardada, redirige al login.
export function obtenerIdUsuario() {
    const usuario = obtenerUsuarioLogueado();

    if (!usuario || !usuario.idUsuario) {
        window.location.href = "index.html";
        return null;
    }

    return usuario.idUsuario;
}

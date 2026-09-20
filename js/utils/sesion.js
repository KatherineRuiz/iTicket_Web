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

/* Convierte el nombre del rol que viene de la base ("Administrador", "Tecnico", "Usuario")
   en una clave corta: "admin", "tecnico" o "usuario". */
export function normalizarRol(nombreRol) {
    const texto = String(nombreRol ?? "").toLowerCase();
    if (texto.includes("admin")) return "admin";
    if (texto.includes("tecnic") || texto.includes("técnic")) return "tecnico";
    return "usuario";
}

/* Rol del usuario que inició sesión. Se lee siempre de su sesión, no de una marca aparte,
   para que el menú y los permisos correspondan al usuario que realmente entró. */
export function obtenerRolUsuario() {
    const usuario = obtenerUsuarioLogueado();
    if (!usuario) return "usuario";
    return normalizarRol(usuario.nombreRol ?? usuario.rol);
}

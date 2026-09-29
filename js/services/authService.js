import { API_BASE_URL, manejarRespuesta, apiFetch } from "./apiConfig.js";

const API_AUTH_URL = `${API_BASE_URL}/auth`;

// Envia correo y contraseña. La API responde con los datos del usuario y pone el token en una cookie HttpOnly.
export async function login(correo, clave) {
    try {
        const respuesta = await apiFetch(`${API_AUTH_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, clave })
        });

        return await manejarRespuesta(respuesta);
    } catch (error) {
        console.error("Error en el login:", error);
        throw error;
    }
}

// Pregunta a la API quien es el usuario de la cookie actual (id, correo y rol salen del token).
export async function obtenerSesion() {
    const respuesta = await apiFetch(`${API_AUTH_URL}/me`);
    return manejarRespuesta(respuesta);
}

// Le pide a la API que borre la cookie de sesion.
export async function cerrarSesion() {
    const respuesta = await apiFetch(`${API_AUTH_URL}/logout`, { method: "POST" });
    return manejarRespuesta(respuesta);
}
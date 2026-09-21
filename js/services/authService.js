import { API_AUTH_BASE_URL, manejarRespuesta } from "./apiConfig.js";

const API_AUTH_URL = API_AUTH_BASE_URL;

// Envía correo y contraseña a la API de autenticación
export async function login(correo, clave) {
    try {
        const respuesta = await fetch(`${API_AUTH_URL}/login`, {
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
import {
    API_BASE_URL,
    manejarRespuesta
} from "./apiConfig.js"; // Importa la URL base y el manejador común de respuestas.

const CHATBOT_URL = `${API_BASE_URL}/chatbot`;

/**
 * Envía al backend el mensaje del usuario conectado.
 */
export async function enviarMensajeChatbot(idUsuario, mensaje, idConversacion = null) {
    if (!idUsuario) {
        throw new Error("No se pudo identificar al usuario.");
    }

    const mensajeLimpio = mensaje?.trim();

    if (!mensajeLimpio) {
        throw new Error("Escribe un mensaje para continuar.");
    }

    const respuesta = await fetch(`${CHATBOT_URL}/mensaje`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            idUsuario,
            idConversacion,
            mensaje: mensajeLimpio
        })
    });

    return manejarRespuesta(respuesta);
}

/** Obtiene las cinco conversaciones más recientes del usuario. */
export async function obtenerConversacionesChatbot(idUsuario) {
    validarUsuario(idUsuario);
    const respuesta = await fetch(
        `${CHATBOT_URL}/conversaciones?idUsuario=${encodeURIComponent(idUsuario)}`
    );
    return manejarRespuesta(respuesta);
}

/** Obtiene todos los mensajes de una conversación propia. */
export async function obtenerConversacionChatbot(idUsuario, idConversacion) {
    validarUsuario(idUsuario);
    const respuesta = await fetch(
        `${CHATBOT_URL}/conversaciones/${encodeURIComponent(idConversacion)}`
        + `?idUsuario=${encodeURIComponent(idUsuario)}`
    );
    return manejarRespuesta(respuesta);
}

/** Elimina una conversación propia y todos sus mensajes. */
export async function eliminarConversacionChatbot(idUsuario, idConversacion) {
    validarUsuario(idUsuario);
    const respuesta = await fetch(
        `${CHATBOT_URL}/conversaciones/${encodeURIComponent(idConversacion)}`
        + `?idUsuario=${encodeURIComponent(idUsuario)}`,
        { method: "DELETE" }
    );
    return manejarRespuesta(respuesta);
}

function validarUsuario(idUsuario) {
    if (!idUsuario) {
        throw new Error("No se pudo identificar al usuario.");
    }
}

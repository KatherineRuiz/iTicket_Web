// URL base de la API. Cuando haya dominio real, solo se cambia aqui.
export const API_BASE_URL = "https://iticketapi-3e643051c995.herokuapp.com/api";

// Paginas que se pueden abrir sin sesion iniciada (login, primer usuario y recuperar contraseña).
const PAGINAS_PUBLICAS = [
    "", "index.html", "primerUsuario.html",
    "recuperarContrasena.html", "codigoVerificacion.html", "nuevaContrasena.html"
];

export function esPaginaPublica() {
    const pagina = window.location.pathname.split("/").pop();
    return PAGINAS_PUBLICAS.includes(pagina);
}

// Borra lo que el navegador guarda de la sesion (el token no esta aqui: vive en la cookie HttpOnly).
export function limpiarSesionLocal() {
    sessionStorage.clear();
    localStorage.removeItem("rolUsuario");
    localStorage.removeItem("menuColapsado");
}

/* Reemplaza a fetch en todos los services:
   1. credentials: "include" -> el navegador guarda y manda la cookie authToken.
   2. Si la API responde 401 (sesion vencida o sin sesion), limpia la sesion y manda al login. */
export async function apiFetch(url, opciones = {}) {
    const respuesta = await fetch(url, { ...opciones, credentials: "include" });

    if (respuesta.status === 401 && !esPaginaPublica()) {
        limpiarSesionLocal();
        window.location.replace("index.html");
    }
    return respuesta;
}

export async function manejarRespuesta(respuesta) {

    if (respuesta.status === 204) return null;

    let cuerpo = null;
    try {
        cuerpo = await respuesta.json();
    } catch (e) {
    }

    if (!respuesta.ok || (cuerpo && cuerpo.success === false)) {
        const mensaje = (cuerpo && (cuerpo.message || cuerpo.error)) || `Error ${respuesta.status}`;

        const errorObj = new Error(mensaje);
        if (cuerpo && cuerpo.errorCode) {
            errorObj.errorCode = cuerpo.errorCode;
        }
        throw errorObj;
    }

    if (cuerpo && Object.prototype.hasOwnProperty.call(cuerpo, 'data')) {
        return cuerpo.data;
    }
    return cuerpo;
}
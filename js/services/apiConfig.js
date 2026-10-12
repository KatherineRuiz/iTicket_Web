/* URL base de la API

   Desplegado se usa "/api", que vercel.json reenvia a Heroku. Asi el navegador
   solo ve el dominio de Vercel, la cookie de sesion queda del mismo sitio y los
   celulares dejan de bloquearla por ser de terceros (asi ya funciona en iOS)

   Trabajando local no hay proxy de Vercel, asi que ahi se le sigue hablando
   directo a la API, por eso el if en api base url*/
const enLocal = ["localhost", "127.0.0.1"].includes(location.hostname);

export const API_BASE_URL = enLocal ? "https://iticketapi-3e643051c995.herokuapp.com/api" : "/api"; // Aqui se pregunta si esta en local, si no esta, usa la ruta /api que es la que se reescribe en vercel.json para apuntar a Heroku

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
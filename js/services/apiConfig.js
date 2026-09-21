// Ahora, en lugar de usar http://localhost:8080/api en todos lados, se ocupa una variable y se importa a los lugares que se va a necesitar, para que cuando tengamos un dominio solo se cambie la ruta aqui y ya no hayan problemas de cambiar todos los demas archivos
export const API_BASE_URL = "http://localhost:8080/api";
export const API_AUTH_BASE_URL = "http://localhost:8081/api/auth";

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
export const API_BASE_URL = "http://localhost:8080/api";
 
export async function manejarRespuesta(respuesta) {

    if (respuesta.status === 204) return null;
 
    let cuerpo = null;
    try {
        cuerpo = await respuesta.json();
    } catch (e) {
    }
 
    if (!respuesta.ok || (cuerpo && cuerpo.success === false)) {
        const mensaje = (cuerpo && (cuerpo.message || cuerpo.error)) || `Error ${respuesta.status}`;
        throw new Error(mensaje);
    }
 
    if (cuerpo && Object.prototype.hasOwnProperty.call(cuerpo, 'data')) {
        return cuerpo.data;
    }
    return cuerpo;
}
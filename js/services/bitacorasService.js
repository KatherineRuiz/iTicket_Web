const API_URL = "http://localhost:8080/api/bitacoras"

//Obtener la bitácora completa (todos los tickets, incluidos los eliminados)
export async function getBitacoras() {
    try {
        const respuesta = await fetch(API_URL);

        //204 No Content -> no hay bitacoras registradas todavia
        if (respuesta.status === 204) {
            return [];
        }

        if (!respuesta.ok) {
            console.error("Error al obtener las bitácoras");
            throw new Error("Error al obtener las bitácoras");
        }
        const resultado = await respuesta.json();
        return resultado.data;
    } catch (error) {
        console.error("Error al obtener las bitácoras:", error);
        throw error;
    }
}

export async function getBitacorasPorTicket(idTicket) {
    try{
        const respuesta = await fetch(`${API_URL}/bitacoraTicket/${idTicket}`);
        if(!respuesta.ok){
            console.error("Error al obtener las bitácoras del ticket");
            throw new Error("Error al obtener las bitácoras del ticket");
        }
        const bitacoras = await respuesta.json();
        return bitacoras.data;
    } catch (error) {
        console.error("Error al obtener la bitacora del ticket:", error);
        throw error;
    }
}
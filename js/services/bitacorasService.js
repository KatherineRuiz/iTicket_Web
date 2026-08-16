const API_URL = "http://localhost:8080/api/bitacoras"

export async function getBitacorasPorTicket(idTicket) {
    try{
        const respuesta = await fetch(`${API_URL}/bitacoraTicket/${idTicket}`);
        if(!respuesta.ok){
            console.error("Error al obtener las bitácoras del ticket");
            throw new error("Error al obtener las bitácoras del ticket");
        }
        const bitacoras = await respuesta.json();
        return bitacoras.data;
    } catch (error) {
        console.error("Error al obtener la bitacora del ticket:", error);
        throw error;
    }
}
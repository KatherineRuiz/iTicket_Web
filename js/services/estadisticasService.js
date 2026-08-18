const API_URL_TICKETS = 'http://localhost:8080/api/tickets';
const API_URL_EVALUACIONES = 'http://localhost:8080/api/evaluaciones';

export async function obtenerTickets() {
    try {
        const respuesta = await fetch(API_URL_TICKETS);
        
        if (!respuesta.ok) {
            throw new Error('Error al obtener los tickets');
        }else{
        
        const datos = await respuesta.json();
        return datos.data ||[];
}
    
    } catch (error) {
        console.error('Error al obtener los tickets:', error);
    return[];
    }
}


export async function obtenerEvaluaciones(){
try{

    const respuesta = await fetch(API_URL_EVALUACIONES);
    if(!respuesta.ok){
        throw new Error('Error al obtener las evaluaciones');
    }else{
        const datos = await respuesta.json();
        return datos.data || [];
    }

}catch(error){
    console.error('Error al obtener las evaluaciones:', error);
    return [];

}}
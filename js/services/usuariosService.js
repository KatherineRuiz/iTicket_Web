const API_URL = "http://localhost:8080/api/usuarios";

export async function getTecnicosPorDepartamento(idDepartamento) {
    try {
        const respuesta = await fetch(`${API_URL}/tecnicos?idDepartamento=${idDepartamento}`);
        if (!respuesta.ok) throw new Error("Error al obtener los técnicos");
        const resultado = await respuesta.json();
        return resultado.data;
    }
    catch (error) {
        console.error("Error al obtener técnicos:", error);
        throw error;
    }
}
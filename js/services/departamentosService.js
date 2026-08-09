const API_URL = "http://localhost:8080/api/departamentos"

//Obtener los departamentos asignables a tickets según el área del usuario
export async function getDepartamentosAsignables(idUsuario) {
    try {
        const respuesta = await fetch(`${API_URL}/asignables/${idUsuario}`);
        if (!respuesta.ok) {
            console.error("Error al obtener los departamentos asignables");
            throw new Error("Error al obtener los departamentos asignables");
        }

        const registros = await respuesta.json();
        return registros.data;
    } catch (error) {
        console.error("Error al obtener los departamentos asignables:", error);
        throw error;
    }
} 
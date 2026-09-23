import { API_BASE_URL, manejarRespuesta } from "./apiConfig.js";

//Configuracion de URL
const API_URL = `${API_BASE_URL}/tickets`;

//Obtener la lista completa de tickets
export async function getTickets() {
    try{
        const respuesta = await fetch(API_URL);
        return await manejarRespuesta(respuesta);
    }catch (error) {
        console.error("Error al obtener los tickets:", error);
        throw error;
    }
}

//Crear nuevo ticket
export async function crearTicket(ticket) {
    try{
        const respuesta = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(ticket)
        });

        const cuerpo = await respuesta.json().catch(() => null);

        if(!respuesta.ok) {
            if (cuerpo && cuerpo.errorCode) {
                throw new Error(`[${cuerpo.errorCode}] ${cuerpo.message}`);
            }
            throw new Error(cuerpo?.message || "Error al crear el ticket");
        }

        return cuerpo;
    }catch(error){
        console.error("Error al crear el ticket: ", error);
        throw error;
    }
}

//Obtener un ticket por ID
export async function getTicket(id) {
    try{
        const respuesta = await fetch(`${API_URL}/${id}`);
        
        if(!respuesta.ok){
            console.error("Error al obtener el ticket");
            throw new Error("Error al obtener el ticket");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    } catch(error){
        console.error("Error al obtener el ticket: ", error);
        throw error;
    }
}

//Obtener los contadores de tickets segun el estado
export async function getIndicadoresEstado(idUsuario) {
    try{
        const respuesta = await fetch(`${API_URL}/indicadores/gestion/${idUsuario}`);

        if(!respuesta.ok){
            console.error("Error al obtener los indicadores de estado de los tickets");
            throw new Error("Error al obtener los indicadores de estado de los tickets")
        }

        const contadores = await respuesta.json();
        return contadores.data;
    } catch (error){
        console.error("Error al obtener los indicadores de estado de los tickets:", error);
        throw error;
    }
}

//Obtener los contadores de tickets propios segun el estado
export async function getIndicadoresEstadoPropios(idUsuario) {
    try{
        const respuesta = await fetch(`${API_URL}/indicadores/${idUsuario}`);

        if(!respuesta.ok){
            console.error("Error al obtener los indicadores de estado de los tickets");
            throw new Error("Error al obtener los indicadores de estado de los tickets")
        }

        const contadores = await respuesta.json();
        return contadores.data;
    } catch (error){
        console.error("Error al obtener los indicadores de estado de los tickets:", error);
        throw error;
    }
}

//Aprobar tickets asignando prioridad, tecnico y fecha de vencimiento
export async function asignarTicket(id, idUsuarioAdmin, asignacion) {
    try{
        const respuesta = await fetch(`${API_URL}/${id}/asignacion?idUsuario=${idUsuarioAdmin}`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(asignacion)
        });

        if(!respuesta.ok){
            throw new Error("Error al asignar el ticket");
        }

        const registroActualizado = await respuesta.json();
        return registroActualizado;
    }
    catch(error){
        console.error("Error al asignar ticket: ", error);
        throw error;
    }
}

//Eliminar ticket
export async function eliminarTicket(id, idUsuario) {
    try {
        const respuesta = await fetch(`${API_URL}/${id}?idUsuario=${idUsuario}`, {
            method: "DELETE"
        });

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || "Error al eliminar el ticket");
        }

        return true;
    }
    catch (error) {
        console.error("Error al eliminar ticket:", error);
        throw error;
    }
}

export async function getAprobacionesPendientes(limite = 5, idUsuario) {
    try{
        const respuesta = await fetch(`${API_URL}/aprobaciones-pendientes?limite=${limite}&idUsuarioAdmin=${idUsuario}`);

        if(!respuesta.ok){
            throw new Error("Error al obrtener los tickets con aprobaciones pendientes");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    }catch(error){
        console.error("Error al obtener aprobaciones pendientes: ", error);
        throw error;
    }
}

export async function getTicketsPorDepartamento(idUsuarioAdmin, pagina = 1, tamano = 10, filtros = {}) {
    try {
        const parametros = new URLSearchParams({idUsuarioAdmin, pagina, tamano})

        if(filtros.busqueda) parametros.append("busqueda", filtros.busqueda);
        if(filtros.prioridad) parametros.append("prioridad", filtros.prioridad);
        if(filtros.estado) parametros.append("estado", filtros.estado);
        if(filtros.fecha) parametros.append("fecha", filtros.fecha);

        const respuesta = await fetch(`${API_URL}/departamento?${parametros}`);

        if (!respuesta.ok) {
            throw new Error("Error al obtener los tickets");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    }
    catch (error) {
        console.error("Error al obtener tickets:", error);
        throw error;
    }
}

export async function getTicketsAsignados(idUsuario, pagina = 1, tamano = 5, filtros = {}) {
    try {
        const parametros = new URLSearchParams({idUsuario, pagina, tamano})

        if(filtros.busqueda) parametros.append("busqueda", filtros.busqueda);
        if(filtros.prioridad) parametros.append("prioridad", filtros.prioridad);
        if(filtros.estado) parametros.append("estado", filtros.estado);
        if(filtros.fecha) parametros.append("fecha", filtros.fecha);

        const respuesta = await fetch(`${API_URL}/tickets-asignados?${parametros}`);

        if (!respuesta.ok) {
            throw new Error("Error al obtener los tickets asignados");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    }
    catch (error) {
        console.error("Error al obtener tickets asignados:", error);
        throw error;
    }
}

export async function getTicketsPropios(idUsuario, pagina = 1, tamano = 5, filtros = {}) {
    try {
        const parametros = new URLSearchParams({idUsuario, pagina, tamano})

        if(filtros.busqueda) parametros.append("busqueda", filtros.busqueda);
        if(filtros.prioridad) parametros.append("prioridad", filtros.prioridad);
        if(filtros.estado) parametros.append("estado", filtros.estado);
        if(filtros.fecha) parametros.append("fecha", filtros.fecha);

        const respuesta = await fetch(`${API_URL}/mis-tickets?${parametros}`);

        if (!respuesta.ok) {
            throw new Error("Error al obtener los tickets asignados");
        }

        const resultado = await respuesta.json();
        return resultado.data;
    }
    catch (error) {
        console.error("Error al obtener tickets asignados:", error);
        throw error;
    }
}

//Cambiar departamento de un ticket (solo un administrador, y solo mientras el ticket esta "Nuevo")
export async function actualizarDepartamento(id, departamento, idUsuario) {
    try{
        const respuesta = await fetch(`${API_URL}/reasignar/${id}?idUsuario=${idUsuario}`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(departamento)
        });

        if(!respuesta.ok){
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || "Error al reasignar el departamento del ticket");
        }

        const registroActualizado = await respuesta.json();
        return registroActualizado;
    }
    catch(error){
        console.error("Error al reasignar el departamento del ticket: ", error);
        throw error;
    }
}

//Obtener tickets propios con estado "Resuelto" para evaluaciones
export async function getTicketsPendientesEvaluacion(idUsuario) {
    return getTicketsPropios(idUsuario, 1, 50, { estado: "Resuelto" });
}

//Editar ticket como creador (asunto, descripcion, departamento y detalle según tipo)
export async function editarComoCreador(id, dto, idUsuario) {
    try {
        const respuesta = await fetch(`${API_URL}/${id}/editar-creador?idUsuario=${idUsuario}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dto)
        });

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || "Error al editar el ticket");
        }

        return await respuesta.json();
    } catch (error) {
        console.error("Error al editar el ticket como creador:", error);
        throw error;
    }
}

//Reasignar ticket como administrador (fecha, prioridad, técnico)
export async function editarComoGestor(id, dto, idUsuario) {
    try {
        const respuesta = await fetch(`${API_URL}/${id}/gestion?idUsuario=${idUsuario}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dto)
        });

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || "Error al reasignar el ticket");
        }

        return await respuesta.json();
    } catch (error) {
        console.error("Error al editar el ticket como gestor:", error);
        throw error;
    }
}

//Cambiar estado del ticket (solo el usuario asignado, entre "En proceso" y "En espera")
export async function editarEstadoAsignado(id, estado, idUsuario) {
    try {
        const respuesta = await fetch(`${API_URL}/${id}/estado-asignado?idUsuario=${idUsuario}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado })
        });

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || "Error al actualizar el estado del ticket");
        }

        return await respuesta.json();
    } catch (error) {
        console.error("Error al actualizar el estado del ticket:", error);
        throw error;
    }
}

//Crear oeditar el reporte técnico
export async function reportarTicket(id, dto, idUsuario) {
    try {
        const respuesta = await fetch(`${API_URL}/${id}/reporte?idUsuario=${idUsuario}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dto)
        });

        if (!respuesta.ok) {
            const cuerpo = await respuesta.json().catch(() => null);
            throw new Error(cuerpo?.message || "Error al registrar el reporte del ticket");
        }

        return await respuesta.json();
    } catch (error) {
        console.error("Error al registrar el reporte del ticket:", error);
        throw error;
    }
}
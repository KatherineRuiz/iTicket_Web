// Se confirma si hay evaluaciones pendientes antes de crear un ticket. Si las hay, se redirige a la página de evaluaciones pendientes. Si no, se puede crear el ticket
import { getTicketsPendientesEvaluacion } from "../services/ticketsService.js";
import { mostrarConfirmacion, mostrarError } from "./sweetAlerts.js";

let comprobando = false;

export async function permitirCrearTicket(idUsuario) {
    if (comprobando) return false;
    comprobando = true;
    try {
        const resultado = await getTicketsPendientesEvaluacion(idUsuario);
        if (!Array.isArray(resultado?.tickets)) throw new Error("Respuesta de evaluaciones inválida");
        if (resultado.tickets.length === 0 && !(Number(resultado.totalElementos) > 0)) return true;

        const resolver = await mostrarConfirmacion(
            "Tienes evaluaciones pendientes",
            "Resuelve tus evaluaciones pendientes antes de crear un nuevo ticket.",
            "Resolver",
            "Cancelar ticket",
        );
        window.location.href = resolver ? "misTickets.html?evaluar=pendientes" : "misTickets.html";
        return false;
    } catch {
        mostrarError("No se pudieron comprobar tus evaluaciones pendientes. Intenta crear el ticket nuevamente.");
        return false;
    } finally {
        comprobando = false;
    }
}

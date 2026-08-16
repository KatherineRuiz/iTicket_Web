//Estados en los que un ticket sigue "en curso" o se vencio
export const ESTADOS_EN_CURSO = ["Asignado", "En proceso", "En espera"];
export const ESTADOS_EN_CURSO_VENCIDO = ["Asignado", "En proceso", "En espera", "Vencido"];

//El creador solo puede editar mientras el ticket sigue "Nuevo"
export function puedeEditarComoCreador(ticket, idUsuario) {
    return ticket.creador === idUsuario && ticket.estado === "Nuevo";
}

//Solo un admin puede reasignar
export function puedeReasignar(ticket, rol) {
    return rol === "administrador" && ESTADOS_EN_CURSO_VENCIDO.includes(ticket.estado);
}

//El usuario asignado edita el estado entre "En proceso" y "En espera"
export function puedeCambiarEstado(ticket, idUsuario) {
    return ticket.tecnicoAsignado === idUsuario && ESTADOS_EN_CURSO.includes(ticket.estado);
}

//Solo se puede reportar si el ticket ya está "En proceso", "En espera" o "Vencido"
export function puedeReportar(ticket, idUsuario) {
    return ticket.tecnicoAsignado === idUsuario && ["En proceso", "En espera", "Vencido", "Resuelto"].includes(ticket.estado);
}

export function obtenerPermisos(ticket, idUsuario, rol) {
    return {
        editarCreador: puedeEditarComoCreador(ticket, idUsuario),
        reasignar: puedeReasignar(ticket, rol),
        cambiarEstado: puedeCambiarEstado(ticket, idUsuario),
        reportar: puedeReportar(ticket, idUsuario)
    };
}
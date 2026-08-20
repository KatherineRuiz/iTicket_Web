export function formatearFecha24H(fechaIso) {
    if (!fechaIso) return "-";
    const fecha = new Date(fechaIso);
    
    return fecha.toLocaleString("es-SV", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

export function formatearFecha12H(fechaIso) {
    if (!fechaIso) return "-";
    const fecha = new Date(fechaIso);
    
    return fecha.toLocaleString("es-SV", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

/*Para cargar la fecha en los inputs */
export function formatearParaDateTimeLocal(fechaIso) {
    if (!fechaIso) return "";
    
    // Si viene como string ISO directo (ej: "2026-08-15T14:30:00")
    if (typeof fechaIso === "string") {
        return fechaIso.slice(0, 16);
    }
    
    const fecha = normalizarFecha(fechaIso);
    if (!fecha) return "";

    const pad = (n) => String(n).padStart(2, "0");
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
}
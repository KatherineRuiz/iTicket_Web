document.addEventListener("DOMContentLoaded", inicializarNotificaciones);
document.addEventListener("iticket:layout-ready", inicializarNotificaciones);

function inicializarNotificaciones() {
    const btnNotificaciones = document.getElementById("btnNotificaciones");
    const panelNotificaciones = document.getElementById("panelNotificaciones");
    const notificacionesOverlay = document.getElementById("notificacionesOverlay");
    if (!btnNotificaciones || !panelNotificaciones || !notificacionesOverlay) return;
    // El atributo funciona como candado porque layout-ready puede ocurrir después
    // de DOMContentLoaded; sin él se duplicarían los listeners.
    if (btnNotificaciones.dataset.notificacionesListas === "true") return;
    btnNotificaciones.dataset.notificacionesListas = "true";

    // Al abrir notificaciones se cierra el menú móvil para no superponer paneles.
    btnNotificaciones.addEventListener("click", function (evento) {
        evento.preventDefault();
        notificacionesOverlay.classList.add("activo");
        panelNotificaciones.classList.add("activo");
        document.getElementById("menuLateral")?.classList.remove("mobile-abierto");
        document.getElementById("overlay")?.classList.remove("activo");
    });

    // Solo el fondo cierra el panel; los clics dentro del contenido no lo hacen.
    notificacionesOverlay.addEventListener("click", function (evento) {
        if (evento.target !== notificacionesOverlay) return;
        notificacionesOverlay.classList.remove("activo");
        panelNotificaciones.classList.remove("activo");
    });
}

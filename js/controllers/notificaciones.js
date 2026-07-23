document.addEventListener("DOMContentLoaded", function () {
    const btnNotificaciones = document.getElementById("btnNotificaciones");
    const panelNotificaciones = document.getElementById("panelNotificaciones");
    const notificacionesOverlay = document.getElementById("notificacionesOverlay");

    const menuLateral = document.getElementById("menuLateral");
    const mainContent = document.querySelector(".main");
    const ticketsMenu = document.getElementById("ticketsMenu");
    const equiposMenu = document.getElementById("equiposMenu");
    const menuOverlay = document.getElementById("overlay");

    // Controladores de apertura y cierre
    function abrirNotificaciones(e) {
        if (e) e.preventDefault(); 
        
        // Aqui se activan los estilos y transiciones de entrada
        notificacionesOverlay.classList.add("activo");
        panelNotificaciones.classList.add("activo");

        // Colapsar el menú lateral en pantallas de escritorio
        if (window.innerWidth >= 1215) {
            if (menuLateral) {
                menuLateral.classList.add("colapsado");
            }
            if (mainContent) {  
                mainContent.classList.add("expandido");
            }
            if (ticketsMenu) {
                ticketsMenu.classList.remove("abrir");
            }
            if (equiposMenu) {
                equiposMenu.classList.remove("abrir");
            }
            localStorage.setItem("menuColapsado", "true");
        } else {
            // En móviles, si el menú móvil estaba abierto, lo cerramos
            if (menuLateral) {
                menuLateral.classList.remove("mobile-expandido");
            }
            if (menuOverlay) {
                menuOverlay.classList.remove("activo");
            }
        }
    }

    function cerrarNotificaciones() {
        // Removemos las clases activas regresando todo a su posición original
        notificacionesOverlay.classList.remove("activo");
        panelNotificaciones.classList.remove("activo");
    }

    if (btnNotificaciones) {
        btnNotificaciones.addEventListener("click", abrirNotificaciones);
    }

    // Cerrar al dar click fuera del panel 
    if (notificacionesOverlay) {
        notificacionesOverlay.addEventListener("click", cerrarNotificaciones);
    }
});
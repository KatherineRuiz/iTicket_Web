document.addEventListener("DOMContentLoaded", function () {
    const menu = document.getElementById("menuLateral");
    const btnMenu = document.getElementById("btnMenu");
    const overlay = document.getElementById("overlay");
    const btnTickets = document.getElementById("btnTickets");
    const ticketsMenu = document.getElementById("ticketsMenu");
    const btnEquipos = document.getElementById("btnEquipos");
    const equiposMenu = document.getElementById("equiposMenu");
    const mainContent = document.querySelector(".main");
    const perfilBienvenida = document.getElementById("perfilBienvenida");

    // ===  ANIMACIÓN DE BIENVENIDA ===
    if (perfilBienvenida) {
        setTimeout(function () {
            perfilBienvenida.classList.add("abrir");
        }, 100);
    }

    // ===  OMPORTAMIENTO DEL MENÚ LATERAL ===
    function controlarMenu() {
        if (window.innerWidth >= 1215) {
            menu.classList.toggle("colapsado");
            if (mainContent) {
                mainContent.classList.toggle("expandido");
            }
            ticketsMenu.classList.remove("abrir");
            if (equiposMenu) equiposMenu.classList.remove("abrir");
        } else {
            menu.classList.toggle("mobile-expandido");
            if (menu.classList.contains("mobile-expandido")) {
                overlay.classList.add("activo");
            } else {
                overlay.classList.remove("activo");
            }
        }
    }

    if (btnMenu) {
        btnMenu.addEventListener("click", controlarMenu);
    }

    // Cerrar menú móvil al hacer clic en el fondo oscuro
    if (overlay) {
        overlay.addEventListener("click", function () {
            menu.classList.remove("mobile-expandido");
            overlay.classList.remove("activo");
        });
    }

    // Submenú de Tickets
    if (btnTickets) {
        btnTickets.addEventListener("click", function (e) {
            e.preventDefault();
            if (menu.classList.contains("colapsado") && window.innerWidth >= 768) {
                menu.classList.remove("colapsado");
                if (mainContent) { mainContent.classList.remove("expandido"); }
            }

            if (equiposMenu && equiposMenu.classList.contains("abrir")) {
                equiposMenu.classList.remove("abrir");
                setTimeout(function () {
                    ticketsMenu.classList.add("abrir");
                }, 150);
            } else {
                ticketsMenu.classList.toggle("abrir");
            }
        });
    }

    // Submenú de Equipos
    if (btnEquipos) {
        btnEquipos.addEventListener("click", function (e) {
            e.preventDefault();
            if (menu.classList.contains("colapsado") && window.innerWidth >= 768) {
                menu.classList.remove("colapsado");
                if (mainContent) { mainContent.classList.remove("expandido"); }
            }

            if (ticketsMenu && ticketsMenu.classList.contains("abrir")) {
                ticketsMenu.classList.remove("abrir");
                setTimeout(function () {
                    if (equiposMenu) equiposMenu.classList.add("abrir");
                }, 150);
            } else {
                if (equiposMenu) equiposMenu.classList.toggle("abrir");
            }
        });
    }

    // ===TRANSICIÓN SUAVE AL CAMBIAR DE PÁGINA ===
    document.querySelectorAll("a[href]").forEach(function (enlace) {
        const destino = enlace.getAttribute("href");

        // Ignoramos hashes (#) o enlaces externos para que no se rompan las interacciones
        if (!destino || destino.startsWith("#") || destino.startsWith("http")) return;

        enlace.addEventListener("click", function (evento) {
            evento.preventDefault();
            document.body.classList.add("salida-pagina");

            setTimeout(function () {
                window.location.href = destino;
            }, 400);
        });
    });
});
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

    //Animacion de bienvenida
    if (perfilBienvenida) {
        setTimeout(function () {
            perfilBienvenida.classList.add("abrir");
        }, 100);
    }

    //Función para controlar el Menu lateral
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
    btnMenu.addEventListener("click", controlarMenu);

    //Para cerrar el menú al hacer clic afuera
    if (overlay) {
        overlay.addEventListener("click", function () {
            menu.classList.remove("mobile-expandido");
            overlay.classList.remove("activo"); // Quitamos el fondo oscuro
        });
    }

    //Para el submenu de Tickets
    btnTickets.addEventListener("click", function (e) {
        e.preventDefault();
        if (menu.classList.contains("colapsado") && window.innerWidth >= 768) {
            menu.classList.remove("colapsado");
            if (mainContent) { mainContent.classList.remove("expandido"); }
        }

        //Si un submenu esta desplegado, se cierra antes de abrir el otro
        if (equiposMenu && equiposMenu.classList.contains("abrir")) {
            equiposMenu.classList.remove("abrir");

            setTimeout(function () {
                ticketsMenu.classList.add("abrir");
            }, 150);
        } else {
            ticketsMenu.classList.toggle("abrir");
        }
    });

    //Para el submenu de Equipos
    if (btnEquipos) {
        btnEquipos.addEventListener("click", function (e) {
            e.preventDefault();
            if (menu.classList.contains("colapsado") && window.innerWidth >= 768) {
                menu.classList.remove("colapsado");
                if (mainContent) { mainContent.classList.remove("expandido"); }
            }

            if (ticketsMenu.classList.contains("abrir")) {
                ticketsMenu.classList.remove("abrir");

                setTimeout(function () {
                    equiposMenu.classList.add("abrir");
                }, 150);
            } else {
                equiposMenu.classList.toggle("abrir");
            }
        });
    }
});
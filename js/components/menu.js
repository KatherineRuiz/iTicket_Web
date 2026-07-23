document.addEventListener("DOMContentLoaded", function () {
    // Inyección de menú en todas las interfaces
    (function () {
        var contenedor = document.getElementById("contenedorMenuLateral");
        if (!contenedor) return;

        var html = window.__menuCacheHTML || sessionStorage.getItem("iticket_menu");

        function inicializar() {
            const menu = document.getElementById("menuLateral");
            if (!menu) return;

            const btnMenu = document.getElementById("btnMenu");
            const overlay = document.getElementById("overlay");
            const btnTickets = document.getElementById("btnTickets");
            const ticketsMenu = document.getElementById("ticketsMenu");
            const btnEquipos = document.getElementById("btnEquipos");
            const equiposMenu = document.getElementById("equiposMenu");
            const mainContent = document.querySelector(".main");
            const perfilBienvenida = document.getElementById("perfilBienvenida");
            const nombrePerfil = document.getElementById("nombrePerfil");
            const fotoLetra = document.getElementById("fotoLetra");

            // 1. Inicializar el estado del menú colapsado desde localStorage
            if (window.innerWidth >= 1215) {
                const menuColapsado = localStorage.getItem("menuColapsado");
                if (menuColapsado === "true") {
                    menu.classList.add("colapsado");
                    if (mainContent) mainContent.classList.add("expandido");
                } else if (menuColapsado === "false") {
                    menu.classList.remove("colapsado");
                    if (mainContent) mainContent.classList.remove("expandido");
                }
            }

            // 2. Animación perfil bienvenida (Generar inicial y degradado)
            if (perfilBienvenida && fotoLetra && nombrePerfil) {
                const nombreCompleto = nombrePerfil.textContent;
                const nombreExtraido = nombreCompleto.split(',')[1]?.trim() || nombreCompleto;
                const inicial = nombreExtraido.charAt(0).toUpperCase() || "?";
                fotoLetra.textContent = inicial;

                const tonoBase = Math.floor(Math.random() * (240 - 210 + 1)) + 210; // Rango Azul
                const tonoSecundario = tonoBase + 15;
                const color1 = `hsl(${tonoBase}, 85%, 35%)`;
                const color2 = `hsl(${tonoSecundario}, 85%, 20%)`;

                perfilBienvenida.style.background = `linear-gradient(135deg, ${color1}, ${color2})`;

                setTimeout(function () {
                    const overflowOriginal = perfilBienvenida.style.overflow;
                    perfilBienvenida.style.overflow = "visible";
                    perfilBienvenida.classList.add("abrir");
                    perfilBienvenida.style.width = "fit-content";

                    const anchoTexto = nombrePerfil.scrollWidth;
                    const anchoReal = anchoTexto + 70;

                    perfilBienvenida.classList.remove("abrir");
                    perfilBienvenida.style.width = "50px";
                    perfilBienvenida.style.overflow = overflowOriginal;
                    perfilBienvenida.offsetHeight; // trigger reflow

                    perfilBienvenida.classList.add("abrir");
                    perfilBienvenida.style.width = anchoReal + "px";

                    setTimeout(function() {
                        perfilBienvenida.classList.remove("abrir");
                        perfilBienvenida.style.width = "50px";
                    }, 5000);
                }, 100);
            }

            // 3. Toggle del menú lateral
            function controlarMenu() {
                if (window.innerWidth >= 1215) {
                    menu.classList.toggle("colapsado");
                    if (mainContent) mainContent.classList.toggle("expandido");
                    if (ticketsMenu) ticketsMenu.classList.remove("abrir");
                    if (equiposMenu) equiposMenu.classList.remove("abrir");

                    const estaColapsado = menu.classList.contains("colapsado");
                    localStorage.setItem("menuColapsado", estaColapsado ? "true" : "false");
                } else {
                    menu.classList.toggle("mobile-expandido");
                    if (overlay) {
                        if (menu.classList.contains("mobile-expandido")) {
                            overlay.classList.add("activo");
                        } else {
                            overlay.classList.remove("activo");
                        }
                    }
                }
            }

            if (btnMenu) btnMenu.addEventListener("click", controlarMenu);

            if (overlay) {
                overlay.addEventListener("click", function () {
                    menu.classList.remove("mobile-expandido");
                    overlay.classList.remove("activo");
                });
            }

            // 4. Submenú Tickets
            if (btnTickets && ticketsMenu) {
                btnTickets.addEventListener("click", function (e) {
                    e.preventDefault();
                    if (menu.classList.contains("colapsado") && window.innerWidth >= 768) {
                        menu.classList.remove("colapsado");
                        if (mainContent) mainContent.classList.remove("expandido");
                    }
                    if (equiposMenu && equiposMenu.classList.contains("abrir")) {
                        equiposMenu.classList.remove("abrir");
                        setTimeout(function () { ticketsMenu.classList.add("abrir"); }, 150);
                    } else {
                        ticketsMenu.classList.toggle("abrir");
                    }
                });
            }

            // 5. Submenú Equipos
            if (btnEquipos && equiposMenu) {
                btnEquipos.addEventListener("click", function (e) {
                    e.preventDefault();
                    if (menu.classList.contains("colapsado") && window.innerWidth >= 768) {
                        menu.classList.remove("colapsado");
                        if (mainContent) mainContent.classList.remove("expandido");
                    }
                    if (ticketsMenu && ticketsMenu.classList.contains("abrir")) {
                        ticketsMenu.classList.remove("abrir");
                        setTimeout(function () { equiposMenu.classList.add("abrir"); }, 150);
                    } else {
                        equiposMenu.classList.toggle("abrir");
                    }
                });
            }

            // 6. Cerrar menú al hacer clic en enlaces de navegación finales
            const enlacesNavegacion = menu.querySelectorAll(".nav-link:not(#btnTickets):not(#btnEquipos), .submenu a");
            enlacesNavegacion.forEach(function (enlace) {
                enlace.addEventListener("click", function () {
                    if (window.innerWidth >= 1215) {
                        menu.classList.add("colapsado");
                        if (mainContent) mainContent.classList.add("expandido");
                        localStorage.setItem("menuColapsado", "true");
                    } else {
                        menu.classList.remove("mobile-expandido");
                        if (overlay) overlay.classList.remove("activo");
                    }
                    if (ticketsMenu) ticketsMenu.classList.remove("abrir");
                    if (equiposMenu) equiposMenu.classList.remove("abrir");
                });
            });

            // 7. Marcar opción activa según URL actual
            var paginaActual = window.location.pathname.split("/").pop() || "index.html";
            marcarOpcionActiva(menu, paginaActual);

            // 8. Visibilidad por rol
            var rolActivo = localStorage.getItem("rolUsuario") || "admin";
            aplicarVisibilidadPorRol(rolActivo);
        }

        if (html) {
            contenedor.innerHTML = html;
            inicializar();

            // Actualizar caché de forma asíncrona
            fetch("components/menu.html")
                .then(function (r) { return r.ok ? r.text() : null; })
                .then(function (nuevoHtml) {
                    if (nuevoHtml) sessionStorage.setItem("iticket_menu", nuevoHtml);
                })
                .catch(function () {});
        } else {
            // Primera carga del menú
            fetch("components/menu.html")
                .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
                .then(function (nuevoHtml) {
                    sessionStorage.setItem("iticket_menu", nuevoHtml);
                    window.__menuCacheHTML = nuevoHtml;
                    contenedor.innerHTML = nuevoHtml;
                    inicializar();
                })
                .catch(function () {
                    console.error("[iTicket] No se pudo cargar el menú lateral.");
                });
        }
    })();

    function marcarOpcionActiva(menu, paginaActual) {
        menu.querySelectorAll(".menu-opcion.activo").forEach(function (el) {
            el.classList.remove("activo");
        });
        menu.querySelectorAll("a[href]").forEach(function (enlace) {
            var href = enlace.getAttribute("href");
            if (href && href !== "#" && href === paginaActual) {
                var li = enlace.closest("li.menu-opcion");
                if (li) li.classList.add("activo");
                var submenu = enlace.closest(".submenu");
                if (submenu) {
                    var padre = submenu.closest(".menu-opcion");
                    if (padre) padre.classList.add("abrir");
                }
            }
        });
    }

    function aplicarVisibilidadPorRol(rolActual) {
        if (!rolActual) return;
        var rol = rolActual.toLowerCase().trim();
        document.querySelectorAll("[data-roles]").forEach(function (el) {
            var permitidos = el.dataset.roles.split(",").map(function (r) { return r.trim().toLowerCase(); });
            el.classList.toggle("d-none", !permitidos.includes(rol));
        });
    }

    window.cambiarRolSimulado = function (nuevoRol) {
        localStorage.setItem("rolUsuario", nuevoRol);
        aplicarVisibilidadPorRol(nuevoRol);
        console.log("[iTicket] Rol →", nuevoRol);
    };
});
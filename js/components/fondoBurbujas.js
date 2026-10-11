/* ============================================================
   BURBUJAS ANIMADAS DE LOS FONDOS

   Hay dos lugares del sistema que usaban una foto de fondo con burbujas ya
   dibujadas encima:

     - Las pantallas de sesion (login, recuperar, codigo, nueva contrasena y
       primer usuario), con img/login/Background.png.
     - La tarjeta "Nuestros mejores tecnicos" del dashboard de administrador,
       con img/bg-tecnicos.png.

   Como las burbujas eran pixeles de la imagen y no elementos, no habia forma
   de moverlas. Ahora el color de fondo lo pinta el CSS de cada pantalla y cada
   burbuja es un <span> aparte, con su propia animacion.

   Se crean desde aqui y no en el HTML porque son puro adorno: no aportan nada
   al contenido y repetir etiquetas vacias en seis paginas solo ensuciaria el
   marcado. La capa lleva aria-hidden, asi que para un lector de pantalla no
   existe.

   Aqui solo se crean los elementos. Tamano, posicion, color y movimiento de
   cada burbuja estan en login.css y en dashboard.css; si la persona pidio
   menos animacion en su sistema, esas hojas las dejan quietas.
   ============================================================ */
(function () {
    "use strict";

    var BURBUJAS_PANTALLA = 8;
    var BURBUJAS_TARJETA = 4;

    function crearCapa(cantidad) {
        var capa = document.createElement("div");
        capa.className = "fondo-burbujas";
        capa.setAttribute("aria-hidden", "true");

        for (var i = 0; i < cantidad; i++) {
            capa.appendChild(document.createElement("span"));
        }
        return capa;
    }

    function iniciar() {
        // Pantallas de sesion: se reconocen porque son las unicas que cargan
        // login.css. La capa va de primer hijo del body para quedar detras de todo.
        var esPantallaDeSesion = document.querySelector('link[href*="login.css"]');
        if (esPantallaDeSesion && !document.querySelector("body > .fondo-burbujas")) {
            document.body.insertBefore(crearCapa(BURBUJAS_PANTALLA), document.body.firstChild);
        }

        // Tarjeta de mejores tecnicos: la capa vive dentro de la tarjeta
        var tarjetas = document.querySelectorAll(".tecnicos");
        for (var i = 0; i < tarjetas.length; i++) {
            if (tarjetas[i].querySelector(".fondo-burbujas")) continue;
            tarjetas[i].insertBefore(crearCapa(BURBUJAS_TARJETA), tarjetas[i].firstChild);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();

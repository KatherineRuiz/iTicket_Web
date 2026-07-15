//=========================================
//Validaciones de correo y contraseña y cosas de login

function esCorreoValido(correo) {
    const texto = correo.trim();
    const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return texto.length > 0 && texto.length <= 50 && patron.test(texto);
}
function esContrasenaValida(contrasena) {
    return contrasena.trim().length >= 6 && contrasena.trim().length <= 18;
}
// Ojito para mostrar/ocultar contraseña
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".btn-toggle-ojo").forEach(function (boton) {
        boton.setAttribute("type", "button");

        const input = boton.closest(".position-relative")?.querySelector("input");
        const icono = boton.querySelector("i");
        if (!input || !icono) return;

        const cambiar = (mostrar) => {
            input.type = mostrar ? "text" : "password";
            icono.classList.toggle("bi-eye", !mostrar);
            icono.classList.toggle("bi-eye-slash", mostrar);
        };

        boton.addEventListener("mousedown", () => cambiar(true));
        boton.addEventListener("touchstart", () => cambiar(true));
        ["mouseup", "mouseleave", "touchend"].forEach(evento =>
            boton.addEventListener(evento, () => cambiar(false))
        );
    });
});
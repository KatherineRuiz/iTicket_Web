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
    const botonesOjo = document.querySelectorAll(".btn-toggle-ojo");

    botonesOjo.forEach(function (boton) {
        boton.addEventListener("click", function () {
            const contenedor = boton.closest(".position-relative");
            const input = contenedor ? contenedor.querySelector("input") : null;
            const icono = boton.querySelector("i");

            if (input && icono) {
                const tipoActual = input.getAttribute("type");
                const nuevoTipo = tipoActual === "password" ? "text" : "password";
                input.setAttribute("type", nuevoTipo);

                icono.classList.toggle("bi-eye");
                icono.classList.toggle("bi-eye-slash");
            }
        });
    });
});
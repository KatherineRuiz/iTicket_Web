    document.addEventListener("DOMContentLoaded", function () {
    const formularioLogin = document.querySelector("#formLogin");

    if (formularioLogin) {
        formularioLogin.addEventListener("submit", function (evento) {
        evento.preventDefault();

        const correo = formularioLogin.querySelector('input[type="email"]').value;
        const contrasena = formularioLogin.querySelector(
            'input[type="password"]',
        ).value;

        if (!esCorreoValido(correo)) {
            mostrarError("Ingresa un correo electrónico válido.", false);
            return;
        }

        if (!esContrasenaValida(contrasena)) {
            mostrarError(
            "Contraseña inválida. Debe tener entre 6 y 18 caracteres.",
            '<a href="recuperarContrasena.html">¿Olvidaste tu contraseña?</a>',
            );
            return;
        }
        mostrarExitoRedireccion("¡Sesión Iniciada!", "", "dashboardAdmin.html");
        });
    }
    });

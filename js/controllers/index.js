import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";

document.addEventListener("DOMContentLoaded", function () {
    const formularioLogin = document.querySelector("#formLogin");

    if (formularioLogin) {
        formularioLogin.addEventListener("submit", function (evento) {
            evento.preventDefault();

            // Captura de datos del formulario
            const correo = formularioLogin.querySelector('input[type="email"]').value;
            const contrasena = formularioLogin.querySelector('input[type="password"]').value;

            // 1. Validaciones de entrada
            if (!esCorreoValido(correo)) {
                mostrarError("Ingresa un correo electrónico válido.", false);
                return;
            }

            if (!esContrasenaValida(contrasena)) {
                mostrarError(
                    "Contraseña inválida. Debe tener entre 6 y 18 caracteres.",
                    '<a href="recuperarContrasena.html">¿Olvidaste tu contraseña?</a>'
                );
                return;
            }

            // 2. Guardar datos de sesión temporalmente
            const nombreUsuario = correo.split('@')[0];
            sessionStorage.setItem('usuarioLogueado', JSON.stringify({
                idUsuario: 1, //Temporal segun el usuario que se esta simulando
                nombre: nombreUsuario,
                correo: correo,
                rolUsuario: 1
            }));

            // 3. Notificación de éxito y redirección al Dashboard
            mostrarExitoRedireccion("¡Sesión Iniciada!", "", "dashboardAdmin.html");
        });
    }
});
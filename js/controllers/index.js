import { login } from "../services/authService.js";
import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";

document.addEventListener("DOMContentLoaded", function () {
    const formularioLogin = document.querySelector("#formLogin");
    const botonIniciarSesion = document.querySelector("#btnIniciarSesion");

    if (formularioLogin) {
        formularioLogin.addEventListener("submit", async function (evento) {
            evento.preventDefault();

            const correo = document.querySelector("#txtCorreo").value;
            const contrasena = document.querySelector("#txtClave").value;

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

            botonIniciarSesion.disabled = true;

            try {
                const usuario = await login(correo, contrasena);

                if (!usuario) {
                    mostrarError("Correo o contraseña incorrectos.", false);
                    botonIniciarSesion.disabled = false;
                    return;
                }

                sessionStorage.setItem("usuarioLogueado", JSON.stringify(usuario));
                mostrarExitoRedireccion("¡Sesión Iniciada!", "", "dashboardAdmin.html");
            } catch (error) {
                mostrarError("No se pudo conectar con el servidor. Intenta de nuevo.", false);
                botonIniciarSesion.disabled = false;
            }
        });
    }
});
import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";

// dejo las validaciones aca mismo para poder usar los sweetAlerts directo sin tanto lio
function esCorreoValido(correo) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
}

function esContrasenaValida(contrasena) {
    // la alerta decia entre 6 y 18 asi que le pongo ese limite
    return contrasena.length >= 6 && contrasena.length <= 18;
}

document.addEventListener("DOMContentLoaded", function () {
    const formularioLogin = document.querySelector("#formLogin");

    if (formularioLogin) {
        // le pongo async por si despues metemos el await del fetch a la API
        formularioLogin.addEventListener("submit", async function (evento) {
            evento.preventDefault();

            // agarramos los datos del form
            const correo = formularioLogin.querySelector('input[type="email"]').value;
            const contrasena = formularioLogin.querySelector('input[type="password"]').value;

            // validamos que no manden basura usando mis funciones de arriba
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

            // aca va ir el fetch a spring boot para el token
            // por mientras dejo esto simulado que tenia mi compañera
            if (correo && contrasena) {
                const nombreUsuario = correo.split('@')[0];
                
                // guardamos la sesion temporal para que no chille el dashboard
                sessionStorage.setItem('usuarioLogueado', JSON.stringify({
                    idUsuario: 1, 
                    nombre: nombreUsuario,
                    correo: correo,
                    rolUsuario: "Administrador" // dejo este formato por ahora
                }));

                // tiramos la alerta chida y pal dashboard
                mostrarExitoRedireccion("¡Sesión Iniciada!", "", "dashboardAdmin.html");
            }
        });
    }
});
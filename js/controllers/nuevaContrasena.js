import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";

document.addEventListener("DOMContentLoaded", function () {
    const formularioNueva = document.querySelector("#formNuevaContrasena");
    
    // Obtener el token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Bloquear si no hay token
    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Acceso Denegado',
            text: 'No tienes permisos para ver esta página.',
            allowOutsideClick: false,
            confirmButtonColor: '#0d6efd'
        }).then(() => {
            window.location.href = 'index.html';
        });
        return;
    }

    if (formularioNueva) {
        formularioNueva.addEventListener("submit", async function (evento) {
            evento.preventDefault();

            const inputsPassword = formularioNueva.querySelectorAll('input[type="password"]');
            const boton = formularioNueva.querySelector('button');
            const nuevaContra = inputsPassword[0].value;
            const confirmarContra = inputsPassword[1].value;

            if (!esContrasenaValida(nuevaContra)) {
                mostrarError("Contraseña inválida. Debe tener entre 6 y 18 caracteres.", false);
                return;
            }

            if (nuevaContra !== confirmarContra) {
                mostrarError("Las contraseñas no coinciden. Por favor, verifícalas.", false);
                return;
            }

            boton.disabled = true;
            boton.innerHTML = 'Guardando...';

            try {
                const response = await fetch('http://localhost:8080/api/auth/restablecer-contrasena', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: token, nuevaContrasena: nuevaContra })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Ocurrió un error al restablecer la contraseña');
                }

                mostrarExitoRedireccion("¡Contraseña Restablecida!", "Tu contraseña ha sido actualizada correctamente.", "index.html");
            } catch (error) {
                mostrarError(error.message, false);
            } finally {
                boton.disabled = false;
                boton.innerHTML = 'Restablecer contraseña';
            }
        });
    }
});
import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";

document.addEventListener("DOMContentLoaded", function () {
    const formularioNueva = document.querySelector("#formNuevaContrasena");
    
    // Obtener el token de la sesion
    

    // Bloquear si no hay token
    

    if (formularioNueva) {
        formularioNueva.addEventListener("submit", async function (evento) {
            evento.preventDefault();

            const inputsPassword = formularioNueva.querySelectorAll('input[type="password"]');
            const boton = formularioNueva.querySelector('button');
            const nuevaContra = inputsPassword[0].value;
            const confirmarContra = inputsPassword[1].value;

            // Validación básica manual porque la funcion global no se ha importado
            if (nuevaContra.trim().length < 6 || nuevaContra.trim().length > 18) {
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
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nuevaContrasena: nuevaContra })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Ocurrió un error al restablecer la contraseña');
                }

                // Limpiar la sesion
                
                
                
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


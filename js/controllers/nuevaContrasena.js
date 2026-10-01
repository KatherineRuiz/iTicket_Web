import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";
import { API_BASE_URL } from "../services/apiConfig.js";

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

            // Validaciï¿½n bï¿½sica manual porque la funcion global no se ha importado
            if (nuevaContra.trim().length < 6 || nuevaContra.trim().length > 18) {
                mostrarError("Contraseï¿½a invï¿½lida. Debe tener entre 6 y 18 caracteres.", false);
                return;
            }

            if (nuevaContra !== confirmarContra) {
                mostrarError("Las contraseÃ±as no coinciden. Por favor, verifÃ­calas.", false);
                return;
            }

            boton.disabled = true;
            boton.innerHTML = 'Guardando...';

            try {
                const response = await fetch(`${API_BASE_URL}/auth/restablecer-contrasena`, {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nuevaContrasena: nuevaContra })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'OcurriÃ³ un error al restablecer la contraseÃ±a');
                }

                // Limpiar la sesion
                
                
                
                mostrarExitoRedireccion("ContraseÃ±a Restablecida!", "Tu contraseÃ±a ha sido actualizada correctamente.", "index.html");
            } catch (error) {
                mostrarError(error.message, false);
            } finally {
                boton.disabled = false;
                boton.innerHTML = 'Restablecer contraseÃ±a';
            }
        });
    }
});



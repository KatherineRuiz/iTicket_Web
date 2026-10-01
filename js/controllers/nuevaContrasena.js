import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";
import { API_BASE_URL, apiFetch } from "../services/apiConfig.js";

document.addEventListener("DOMContentLoaded", function () {
    const formularioNueva = document.querySelector("#formNuevaContrasena");

    if (formularioNueva) {
        formularioNueva.addEventListener("submit", async function (evento) {
            evento.preventDefault();

            const inputsPassword = formularioNueva.querySelectorAll('input[type="password"]');
            const boton = formularioNueva.querySelector('button');
            const nuevaContra = inputsPassword[0].value;
            const confirmarContra = inputsPassword[1].value;

            if (nuevaContra.trim().length < 6 || nuevaContra.trim().length > 18) {
                mostrarError("Contrasena invalida. Debe tener entre 6 y 18 caracteres.", false);
                return;
            }

            if (nuevaContra !== confirmarContra) {
                mostrarError("Las contrasenas no coinciden. Por favor, verificalas.", false);
                return;
            }

            boton.disabled = true;
            boton.innerHTML = 'Guardando...';

            try {
                const response = await apiFetch(`${API_BASE_URL}/auth/restablecer-contrasena`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nuevaContrasena: nuevaContra })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Ocurrio un error al restablecer la contrasena');
                }

                mostrarExitoRedireccion("Contrasena Restablecida!", "Tu contrasena ha sido actualizada correctamente.", "index.html");
            } catch (error) {
                mostrarError(error.message, false);
            } finally {
                boton.disabled = false;
                boton.innerHTML = 'Restablecer contraseña';
            }
        });
    }
});
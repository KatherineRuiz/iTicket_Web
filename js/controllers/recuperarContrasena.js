import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";
import { API_BASE_URL, apiFetch } from "../services/apiConfig.js";

document.addEventListener("DOMContentLoaded", function () {
    const formularioRecuperacion = document.querySelector("#formRecovery");

    if (formularioRecuperacion) {
        formularioRecuperacion.addEventListener("submit", async function (evento) {
            evento.preventDefault();

            const correo = formularioRecuperacion.querySelector('input[type="email"]').value;
            const boton = formularioRecuperacion.querySelector('button');

            if (!esCorreoValido(correo)) {
                mostrarError("Ingresa un correo electronico valido para recuperar tu contrasena.", false);
                return;
            }

            boton.disabled = true;
            boton.innerHTML = 'Enviando...';

            try {
                const response = await apiFetch(`${API_BASE_URL}/auth/recuperar-contrasena`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo: correo })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Ocurrio un error al enviar el correo');
                }

                mostrarExitoRedireccion("Codigo Enviado", "Revisa tu bandeja de entrada o spam.", "codigoVerificacion.html");
            } catch (error) {
                mostrarError(error.message, false);
            } finally {
                boton.disabled = false;
                boton.innerHTML = 'Enviar código';
            }
        });
    }
});
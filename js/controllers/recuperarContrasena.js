import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";

document.addEventListener("DOMContentLoaded", function () {
    const formularioRecuperacion = document.querySelector("#formRecovery");

    if (formularioRecuperacion) {
        formularioRecuperacion.addEventListener("submit", async function (evento) {
            evento.preventDefault();

            const correo = formularioRecuperacion.querySelector('input[type="email"]').value;
            const boton = formularioRecuperacion.querySelector('button');

            if (!esCorreoValido(correo)) {
                mostrarError("Ingresa un correo electrónico válido para recuperar tu contraseña.", false);
                return;
            }

            boton.disabled = true;
            boton.innerHTML = 'Enviando...';

            try {
                const response = await fetch('http://localhost:8080/api/auth/recuperar-contrasena', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo: correo })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Ocurrió un error al enviar el correo');
                }

                mostrarExitoRedireccion("Código Enviado", "Revisa tu bandeja de entrada o spam.", "codigoVerificacion.html");
            } catch (error) {
                mostrarError(error.message, false);
            } finally {
                boton.disabled = false;
                boton.innerHTML = 'Enviar código';
            }
        });
    }
});
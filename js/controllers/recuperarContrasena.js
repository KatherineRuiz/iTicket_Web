import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";
    document.addEventListener("DOMContentLoaded", function () {
    const formularioRecuperacion = document.querySelector("#formRecovery");

    if (formularioRecuperacion) {
        formularioRecuperacion.addEventListener("submit", function (evento) {
        evento.preventDefault();

        const correo = formularioRecuperacion.querySelector(
            'input[type="email"]',
        ).value;

        if (!esCorreoValido(correo)) {
            mostrarError(
            "Ingresa un correo electrónico válido para recuperar tu contraseña.",
            false,
            );
            return;
        }

        // Llamada optimizada al cascarón
        mostrarExitoRedireccion(
            "Código Enviado",
            "Revisa tu bandeja de entrada o spam.",
            "codigoVerificacion.html",
        );
        });
    }
    });

document.addEventListener("DOMContentLoaded", function () {
    const formularioNueva = document.querySelector("#formNuevaContrasena");

    if (formularioNueva) {
        formularioNueva.addEventListener("submit", function (evento) {
            evento.preventDefault();

            const inputsPassword = formularioNueva.querySelectorAll(
                'input[type="password"]',
            );
            const nuevaContra = inputsPassword[0].value;
            const confirmarContra = inputsPassword[1].value;

            if (!esContrasenaValida(nuevaContra)) {
                mostrarError(
                    "Contraseña inválida. Debe tener entre 6 y 18 caracteres.",
                    false,
                );
                return;
            }

            if (nuevaContra !== confirmarContra) {
                mostrarError(
                    "Las contraseñas no coinciden. Por favor, verifícalas.",
                    false,
                );
                return;
            }

            // Llamada optimizada al cascarón reutilizado
            mostrarExitoRedireccion(
                "¡Contraseña Restablecida!",
                "Tu contraseña ha sido actualizada correctamente.",
                "index.html",
            );
        });
    }
});

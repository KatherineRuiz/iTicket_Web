document.addEventListener("DOMContentLoaded", function () {
    const formularioLogin = document.querySelector("#formLogin");

    if (formularioLogin) {
        formularioLogin.addEventListener("submit", function (evento) {
            evento.preventDefault();

            const correo = formularioLogin.querySelector('input[type="email"]').value;
            const contrasena = formularioLogin.querySelector(
                'input[type="password"]',
            ).value;

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
            mostrarExitoRedireccion("¡Sesión Iniciada!", "", "dashboardAdmin.html");
        });
    }
});

document.getElementById('formLogin').addEventListener('submit', function (e) {
    e.preventDefault(); // Evita la recarga automática

    const correo = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    // Aquí irá tu consumo de API / Fetch a Spring Boot más adelante.
    // Ejemplo de simulación local:
    if (correo && password) {
        // Extraemos un nombre para mostrar dinámicamente en el Dashboard
        const nombreUsuario = correo.split('@')[0];

        // Guardamos temporalmente los datos en sessionStorage/localStorage
        sessionStorage.setItem('usuarioLogueado', JSON.stringify({
            idUsuario: 1, //Temporal segun el usuario que se esta simulando
            nombre: nombreUsuario,
            correo: correo,
            rolUsuario: 1
        }));

        // Redirigimos al Dashboard tras autenticar
        window.location.href = 'dashboardAdmin.html';
    }
});

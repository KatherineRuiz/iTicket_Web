import { login } from "../services/authService.js";
import { getUsuarioById } from "../services/usuariosService.js";
import { API_BASE_URL } from "../services/apiConfig.js";
import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";

/* Si la base de datos todavía no tiene usuarios, se manda a crear el primer administrador.
   Se pregunta por /setup/estado y no por /usuarios: esa ruta exige ser administrador, así
   que desde el login siempre respondía 401 y dejaba un error rojo en la consola. */
async function revisarPrimerUsuario() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/setup/estado`);
        const cuerpo = await respuesta.json().catch(() => null);
        if (respuesta.ok && cuerpo?.data?.hayUsuarios === false) {
            window.location.replace("primerUsuario.html");
        }
    } catch (error) {
        // Si la API no responde se queda en el login; el error se verá al intentar iniciar sesión
        console.warn("No se pudo revisar si existen usuarios:", error);
    }
}

revisarPrimerUsuario();

// true mientras hay una peticion de login en curso; evita que pageshow reactive el boton a medio envio
let iniciandoSesion = false;

/* Al volver al login con el boton "atras", el navegador restaura los valores que tenia
   el formulario (incluida la contraseña), ya sea desde la cache atras/adelante o con su
   restauracion de formularios. pageshow se dispara despues de esa restauracion, asi que
   aqui se limpia el formulario y se reactiva el boton por si quedo deshabilitado. */
window.addEventListener("pageshow", function (evento) {
    // persisted = se volvio con "atras" desde la cache del navegador: el login anterior ya termino
    if (evento.persisted) iniciandoSesion = false;
    if (iniciandoSesion) return;

    const formularioLogin = document.querySelector("#formLogin");
    if (formularioLogin) formularioLogin.reset();

    const botonIniciarSesion = document.querySelector("#btnIniciarSesion");
    if (botonIniciarSesion) botonIniciarSesion.disabled = false;
});

document.addEventListener("DOMContentLoaded", function () {
    const formularioLogin = document.querySelector("#formLogin");
    const botonIniciarSesion = document.querySelector("#btnIniciarSesion");

    if (formularioLogin) {
        formularioLogin.addEventListener("submit", async function (evento) {
            evento.preventDefault();

            const correo = document.querySelector("#txtCorreo").value;
            const contrasena = document.querySelector("#txtClave").value;

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

            if (iniciandoSesion) return;
            iniciandoSesion = true;
            botonIniciarSesion.disabled = true;

            try {
                const usuario = await login(correo, contrasena);

                if (!usuario) {
                    mostrarError("Correo o contraseña incorrectos.", false);
                    iniciandoSesion = false;
                    botonIniciarSesion.disabled = false;
                    return;
                }

                // El login puede devolver datos básicos. Esta segunda consulta
                // completa nombre, departamento, correo y fotografía del perfil.
                const detalleUsuario = await getUsuarioById(usuario.idUsuario).catch(() => null);
                const sesion = { ...usuario, ...(detalleUsuario || {}) };
                const nombreRol = String(sesion.nombreRol || '').toLowerCase();
                const rol = nombreRol.includes('técnico') || nombreRol.includes('tecnico')
                    ? 'tecnico'
                    : nombreRol.includes('admin')
                        ? 'admin'
                        : 'usuario';
                const destino = rol === 'tecnico'
                    ? 'dashboardTecnicos.html'
                    : rol === 'admin'
                        ? 'dashboardAdmin.html'
                        : 'dashboardUsuarios.html';

                // sessionStorage conserva los datos del usuario mientras la
                // pestaña está abierta; el dashboard reproduce su saludo cada
                // vez que se visita, sin necesitar una marca adicional.
                sessionStorage.setItem("usuarioLogueado", JSON.stringify(sesion));
                localStorage.setItem("rolUsuario", rol);
                // Se limpia antes de salir para que la copia del login que guarda el navegador no tenga la contraseña
                formularioLogin.reset();
                mostrarExitoRedireccion("¡Sesión Iniciada!", "", destino);
            } catch (error) {
                mostrarError(error.message || "No se pudo conectar con el servidor. Intenta de nuevo.", false);
                iniciandoSesion = false;
                botonIniciarSesion.disabled = false;
            }
        });
    }
});

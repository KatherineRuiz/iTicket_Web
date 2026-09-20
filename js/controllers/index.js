import { login } from "../services/authService.js";
import { getUsuarioById, getUsuarios } from "../services/usuariosService.js";
import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";

// Si la base de datos todavía no tiene usuarios, se manda a crear el primer administrador
async function revisarPrimerUsuario() {
    try {
        const usuarios = await getUsuarios();
        if (!usuarios || usuarios.length === 0) {
            window.location.replace("primerUsuario.html");
        }
    } catch (error) {
        // Si la API no responde se queda en el login; el error se verá al intentar iniciar sesión
        console.warn("No se pudo revisar si existen usuarios:", error);
    }
}

revisarPrimerUsuario();

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

            botonIniciarSesion.disabled = true;

            try {
                const usuario = await login(correo, contrasena);

                if (!usuario) {
                    mostrarError("Correo o contraseña incorrectos.", false);
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
                mostrarExitoRedireccion("¡Sesión Iniciada!", "", destino);
            } catch (error) {
                mostrarError("No se pudo conectar con el servidor. Intenta de nuevo.", false);
                botonIniciarSesion.disabled = false;
            }
        });
    }
});

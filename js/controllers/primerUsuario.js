import { API_BASE_URL } from "../services/apiConfig.js";
import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";

const form = document.getElementById("formPrimerUsuario");
const btnCrear = document.getElementById("btnCrear");
const bloqueDepartamento = document.getElementById("bloqueDepartamento");
const bloqueNuevoDepartamento = document.getElementById("bloqueNuevoDepartamento");
const selDepartamento = document.getElementById("selDepartamento");
const valor = (id) => document.getElementById(id).value.trim();

let idRolAdministrador = null;
let hayDepartamentos = false;

async function obtener(ruta) {
    const respuesta = await fetch(`${API_BASE_URL}${ruta}`);
    const cuerpo = await respuesta.json().catch(() => null);
    if (!respuesta.ok) throw new Error(cuerpo?.message || "No se pudo conectar con la API.");
    return cuerpo?.data ?? [];
}

async function registrar(ruta, datos) {
    const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
    const cuerpo = await respuesta.json().catch(() => null);
    if (!respuesta.ok || cuerpo?.success === false) {
        throw new Error(cuerpo?.message || "No se pudo guardar la información.");
    }
    return cuerpo.data;
}

async function iniciar() {
    try {
        // Esta pantalla solo sirve mientras no exista ningún usuario
        const usuarios = await obtener("/usuarios");
        if (usuarios.length > 0) {
            window.location.replace("index.html");
            return;
        }

        const roles = await obtener("/roles");
        idRolAdministrador = roles.find((rol) => rol.nombreRol === "Administrador")?.idRol;
        if (!idRolAdministrador) {
            throw new Error("No existe el rol Administrador. Revisa que se haya ejecutado el script de la base de datos.");
        }

        const departamentos = await obtener("/departamentos/asignables");
        hayDepartamentos = departamentos.length > 0;

        if (hayDepartamentos) {
            selDepartamento.innerHTML = departamentos
                .map((d) => `<option value="${d.idDepartamento}">${d.nombreDepartamento}</option>`)
                .join("");
            bloqueDepartamento.hidden = false;
        } else {
            bloqueNuevoDepartamento.hidden = false;
        }
    } catch (error) {
        mostrarError(error.message);
        btnCrear.disabled = true;
    }
}

function validar() {
    if (!valor("txtNombre") || !valor("txtCorreo") || !valor("txtClave")) {
        return "Completa todos los campos.";
    }
    if (valor("txtClave").length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (valor("txtClave") !== valor("txtConfirmar")) return "Las contraseñas no coinciden.";
    if (!hayDepartamentos && (!valor("txtArea") || !valor("txtDepartamento"))) {
        return "Indica el área y el departamento.";
    }
    return null;
}

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const mensajeError = validar();
    if (mensajeError) {
        mostrarError(mensajeError);
        return;
    }

    btnCrear.disabled = true;
    try {
        let idDepartamento = Number(selDepartamento.value);

        if (!hayDepartamentos) {
            const area = await registrar("/areas", { nombreArea: valor("txtArea") });
            const departamento = await registrar("/departamentos", {
                nombreDepartamento: valor("txtDepartamento"),
                tipoDepartamento: document.getElementById("selTipo").value,
                idArea: area.idArea
            });
            idDepartamento = departamento.idDepartamento;
        }

        await registrar("/usuarios", {
            nombreUsuario: valor("txtNombre"),
            correo: valor("txtCorreo"),
            clave: valor("txtClave"),
            idRol: idRolAdministrador,
            idDepartamento,
            estado: true
        });

        mostrarExitoRedireccion(
            "Administrador creado",
            "Ya puedes iniciar sesión con tu correo y contraseña.",
            "index.html"
        );
    } catch (error) {
        mostrarError(error.message);
        btnCrear.disabled = false;
    }
});

iniciar();
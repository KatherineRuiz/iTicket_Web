import { API_BASE_URL } from "../services/apiConfig.js";
import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";

const TOTAL_PASOS = 3;
// El login solo acepta contraseñas de hasta 18 caracteres (ver index.js)
const CLAVE_MINIMO = 8;
const CLAVE_MAXIMO = 18;

const form = document.getElementById("formPrimerUsuario");
const btnSiguiente = document.getElementById("btnSiguiente");
const btnAtras = document.getElementById("btnAtras");
const errorPaso = document.getElementById("errorPaso");
const bloqueDepartamento = document.getElementById("bloqueDepartamento");
const bloqueNuevoDepartamento = document.getElementById("bloqueNuevoDepartamento");
const selDepartamento = document.getElementById("selDepartamento");
const txtClave = document.getElementById("txtClave");
const txtConfirmar = document.getElementById("txtConfirmar");
const valor = (id) => document.getElementById(id).value.trim();

let pasoActual = 1;
let idRolAdministrador = null;
let hayDepartamentos = false;
let configuracionLista = false;
// Si el área o el departamento ya se crearon y luego falla el usuario, no se vuelven a crear
let idDepartamentoCreado = null;
let idAreaCreada = null;

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
            selDepartamento.replaceChildren(...departamentos.map((d) => new Option(d.nombreDepartamento, d.idDepartamento)));
            bloqueDepartamento.hidden = false;
        } else {
            bloqueNuevoDepartamento.hidden = false;
        }
        configuracionLista = true;
    } catch (error) {
        mostrarError(error.message);
        btnSiguiente.disabled = true;
    }
}

// ---------- Pasos ----------

function mostrarPaso(numero) {
    const haciaAtras = numero < pasoActual;
    pasoActual = numero;

    document.querySelectorAll(".paso").forEach((paso) => {
        const activo = Number(paso.dataset.paso) === numero;
        paso.classList.toggle("activo", activo);
        paso.classList.toggle("desde-atras", activo && haciaAtras);
    });

    document.querySelectorAll("[data-indicador]").forEach((indicador) => {
        const n = Number(indicador.dataset.indicador);
        indicador.classList.toggle("activo", n === numero);
        indicador.classList.toggle("completado", n < numero);
        if (n === numero) indicador.setAttribute("aria-current", "step");
        else indicador.removeAttribute("aria-current");
    });

    btnAtras.hidden = numero === 1;
    btnSiguiente.textContent = numero === TOTAL_PASOS ? "Crear administrador" : "Siguiente";
    errorPaso.textContent = "";

    // Enfoca el primer campo visible del paso
    const primerCampo = document.querySelector(`.paso[data-paso="${numero}"] :is(input, select):not([hidden] *)`);
    primerCampo?.focus();
}

function validarPaso(numero) {
    if (numero === 1) {
        if (!valor("txtNombre")) return "Escribe tu nombre.";
        const correo = document.getElementById("txtCorreo");
        if (!correo.value.trim()) return "Escribe tu correo electrónico.";
        if (!correo.checkValidity()) return "El correo electrónico no es válido.";
    }
    if (numero === 2) {
        const clave = txtClave.value;
        if (clave.length < CLAVE_MINIMO || clave.length > CLAVE_MAXIMO) {
            return `La contraseña debe tener entre ${CLAVE_MINIMO} y ${CLAVE_MAXIMO} caracteres.`;
        }
        if (clave !== txtConfirmar.value) return "Las contraseñas no coinciden.";
    }
    if (numero === 3) {
        if (!configuracionLista) return "Espera un momento, aún se está cargando la información.";
        if (!hayDepartamentos && !idDepartamentoCreado && (!valor("txtArea") || !valor("txtDepartamento"))) {
            return "Indica el área y el departamento.";
        }
    }
    return null;
}

function actualizarRequisitosClave() {
    const clave = txtClave.value;
    document.getElementById("reqLongitud").classList.toggle(
        "cumplido",
        clave.length >= CLAVE_MINIMO && clave.length <= CLAVE_MAXIMO
    );
    document.getElementById("reqCoincide").classList.toggle(
        "cumplido",
        clave.length > 0 && clave === txtConfirmar.value
    );
}

txtClave.addEventListener("input", actualizarRequisitosClave);
txtConfirmar.addEventListener("input", actualizarRequisitosClave);

btnAtras.addEventListener("click", () => {
    if (pasoActual > 1) mostrarPaso(pasoActual - 1);
});

// El error se limpia en cuanto el usuario vuelve a escribir
form.addEventListener("input", () => {
    errorPaso.textContent = "";
});

// ---------- Envío ----------

async function crearAdministrador() {
    let idDepartamento = Number(selDepartamento.value);

    if (!hayDepartamentos) {
        if (!idDepartamentoCreado) {
            if (!idAreaCreada) {
                const area = await registrar("/areas", { nombreArea: valor("txtArea") });
                idAreaCreada = area.idArea;
            }
            const departamento = await registrar("/departamentos", {
                nombreDepartamento: valor("txtDepartamento"),
                tipoDepartamento: document.getElementById("selTipo").value,
                idArea: idAreaCreada
            });
            idDepartamentoCreado = departamento.idDepartamento;
        }
        idDepartamento = idDepartamentoCreado;
    }

    await registrar("/usuarios", {
        nombreUsuario: valor("txtNombre"),
        correo: valor("txtCorreo"),
        clave: txtClave.value,
        idRol: idRolAdministrador,
        idDepartamento,
        estado: true
    });
}

// Enter o "Siguiente" avanzan de paso; en el último se crea la cuenta
form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (btnSiguiente.disabled) return;

    const mensajeError = validarPaso(pasoActual);
    if (mensajeError) {
        errorPaso.textContent = mensajeError;
        return;
    }

    if (pasoActual < TOTAL_PASOS) {
        mostrarPaso(pasoActual + 1);
        return;
    }

    btnSiguiente.disabled = true;
    btnAtras.disabled = true;
    btnSiguiente.textContent = "Creando...";
    try {
        await crearAdministrador();
        mostrarExitoRedireccion(
            "Administrador creado",
            "Ya puedes iniciar sesión con tu correo y contraseña.",
            "index.html"
        );
    } catch (error) {
        mostrarError(error.message);
        btnSiguiente.disabled = false;
        btnAtras.disabled = false;
        btnSiguiente.textContent = "Crear administrador";
    }
});

iniciar();

import { getTicket, editarComoCreador, editarComoGestor, editarEstadoAsignado, reportarTicket, eliminarTicket } from "../services/ticketsService.js";
import { obtenerEvidenciasPorTicket, eliminarEvidencia, subirEvidencia } from "../services/evidenciasService.js";
import { getDepartamentosAsignables } from "../services/departamentosService.js";
import { buscarArticulosPorCodigoParcial, obtenerCodigosNoInventariados } from "../services/articulosService.js";
import { getTecnicosPorDepartamento, getUsuarioById } from "../services/usuariosService.js";
import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/sweetAlerts.js";
import { validarFormularioTicket, validarFormularioAprobacion, validarFormularioReporte } from "../validators/ticketsValidator.js";
import { obtenerPermisos } from "../validators/permisosTicket.js";
import { getBitacorasPorTicket } from "../services/bitacorasService.js";
import { crearComentario, obtenerComentariosPorTicket, eliminarComentario } from "../services/comentariosService.js";
import { subirMultimediaComentario } from "../services/multimediaComentariosService.js";
import { formatearFecha24H, formatearFecha12H, formatearParaDateTimeLocal } from "../utils/formateadores.js";
import { validarFormularioComentario } from "../validators/comentariosValidator.js";
import { obtenerIdUsuario } from "../utils/sesion.js";

const CATEGORIA_POR_TIPO = { "Articulo": "equipos", "General": "general", "Software": "software" };
const limiteEvidenciasTicket = 5;
const limiteMultimediaComentario = 3;

const targetaTicket = document.getElementById("targetaTicket");
const btnVolver = document.getElementById("btnVolver");
const txtCreador = document.getElementById("txtCreador");
const badgePrioridad = document.getElementById("badgePrioridad");
const txtAsunto = document.getElementById("txtAsunto");
const txtEstado = document.getElementById("txtEstado");
const dtFechaCreacion = document.getElementById("dtFechaCreacion");
const filaVencimiento = document.getElementById("filaVencimiento");
const dtFechaVencimiento = document.getElementById("dtFechaVencimiento");
const txtDescripcion = document.getElementById("txtDescripcion");
const txtUbicacion = document.getElementById("txtUbicacion");
const filaEquipo = document.getElementById("filaEquipo");
const txtEquipoTicket = document.getElementById("txtEquipoTicket");
const filaSoftware = document.getElementById("filaSoftware");
const txtSoftwareTicket = document.getElementById("txtSoftwareTicket");
const filaTecnico = document.getElementById("filaTecnico");
const txtTecnicoAsignado = document.getElementById("txtTecnicoAsignado");
const txtDepartamento = document.getElementById("txtDepartamento");
const galeriaEvidenciasVista = document.getElementById("galeriaEvidenciasVista");

const btnAbrirEdicionCreador = document.getElementById("btnAbrirEdicionCreador");
const btnAbrirReasignacion = document.getElementById("btnAbrirReasignacion");
const btnAbrirEstadoAsignado = document.getElementById("btnAbrirEstadoAsignado");
const btnEliminarTicket = document.getElementById("btnEliminarTicket");

//Modal: edición como creador
const modalEdicionCreadorEl = document.getElementById("modalEdicionCreador");
const frmEdicionCreador = document.getElementById("frmEdicionCreador");
const txtAsuntoEdicion = document.getElementById("txtAsuntoEdicion");
const txtDescripcionEdicion = document.getElementById("txtDescripcionEdicion");
const sltDepartamentoEdicion = document.getElementById("sltDepartamentoEdicion");
const campoCodigoEdicion = document.getElementById("campoCodigoEdicion");
const txtCodigoEdicion = document.getElementById("txtCodigoEdicion");
const btnAgregarCodigoEdicion = document.getElementById("btnAgregarCodigoEdicion");
const sugerenciasCodigosEdicion = document.getElementById("sugerenciasCodigosEdicion");
const listaCodigosEdicion = document.getElementById("listaCodigosEdicion");
const campoUbicacionEdicion = document.getElementById("campoUbicacionEdicion");
const txtUbicacionEdicion = document.getElementById("txtUbicacionEdicion");
const campoSoftwareEdicion = document.getElementById("campoSoftwareEdicion");
const txtNombreSoftwareEdicion = document.getElementById("txtNombreSoftwareEdicion");
const txtVersionEdicion = document.getElementById("txtVersionEdicion");
const btnAgregarSoftwareEdicion = document.getElementById("btnAgregarSoftwareEdicion");
const listaSoftwareEdicion = document.getElementById("listaSoftwareEdicion");
const txtUbicacionSoftwareEdicion = document.getElementById("txtUbicacionSoftwareEdicion");
const btnAgregarEvidenciaEdicion = document.getElementById("btnAgregarEvidenciaEdicion");
const galeriaMultimediaEdicion = document.getElementById("galeriaMultimediaEdicion");
const inputEvidenciaEdicion = document.getElementById("inputEvidenciaEdicion");

//Modal: reasignación
const modalReasignacionEl = document.getElementById("modalReasignacion");
const frmReasignacion = document.getElementById("frmReasignacion");
const sltPrioridadEdicion = document.getElementById("sltPrioridadEdicion");
const sltTecnicoEdicion = document.getElementById("sltTecnicoEdicion");
const dtFechaVencimientoEdicion = document.getElementById("dtFechaVencimientoEdicion");

//Modal: estado
const modalEstadoAsignadoEl = document.getElementById("modalEstadoAsignado");
const frmEstadoAsignado = document.getElementById("frmEstadoAsignado");
const sltEstadoAsignado = document.getElementById("sltEstadoAsignado");

//Modal: reporte técnico
const modalReporteEl = document.getElementById("modalReporte");
const btnGestionarReporte = document.getElementById("btnGestionarReporte");
const txtBotonReporte = document.getElementById("txtBotonReporte");
const frmReporteTicket = document.getElementById("frmReporteTicket");
const txtDescripcionFalla = document.getElementById("txtDescripcionFalla");
const txtDescripcionSolucion = document.getElementById("txtDescripcionSolucion");
const tablaReporteTecnico = document.getElementById("tablaReporteTecnico");

const tablaBitacora = document.getElementById("tablaBitacora");

//Comentarios
const listaComentarios = document.getElementById("listaComentarios");
const frmComentario = document.getElementById("frmComentario");
const txtComentario = document.getElementById("txtComentario");
const btnEnviarComentario = document.getElementById("btnEnviarComentario");
const btnAdjuntarComentario = document.getElementById("btnAdjuntarComentario");
const inputComentarioMultimedia = document.getElementById("inputComentarioMultimedia");
const galeriaComentarioAdjuntos = document.getElementById("galeriaComentarioAdjuntos");

const img = document.getElementById('imagenVista');
const modalVistaPrevia = new bootstrap.Modal(document.getElementById('modalVistaPrevia'));

let idTicketActual = null;
let ticketActual = null;
let evidenciasActuales = [];
let archivosNuevosEvidencia = [];
let listaCodigosEquipos = [];
let listaSoftwareVersion = [];
let departamentosCargados = false;
let listaDepartamentosDisponibles = [];
let temporizadorBusqueda = null;
let comentariosActuales = [];
let archivosComentarioSeleccionados = [];
const idUsuario = obtenerIdUsuario();
// nombreRol viene de getUsuarioById (la API de usuarios), la sesión guardada en el login solo trae idRol numérico
let rol = "";

document.addEventListener("DOMContentLoaded", () => {
    if (btnVolver) {
        btnVolver.addEventListener("click", function (e) {
            if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
                e.preventDefault();
                window.history.back();
            }
        });
    }

    idTicketActual = obtenerIdTicketDesdeURL();
    if (!idTicketActual) {
        mostrarError("No se especificó el ticket a mostrar.");
        return;
    }

    cargarTicket();
    cargarBitacoras();
});

function obtenerIdTicketDesdeURL() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get("id");
}

async function cargarTicket() {
    try {
        const [ticket, evidencias, comentarios, usuarioActual] = await Promise.all([
            getTicket(idTicketActual),
            obtenerEvidenciasPorTicket(idTicketActual),
            obtenerComentariosPorTicket(idTicketActual),
            getUsuarioById(idUsuario)
        ]);

        ticketActual = ticket;
        evidenciasActuales = evidencias || [];
        comentariosActuales = comentarios || [];
        rol = (usuarioActual?.nombreRol || "").toLowerCase();

        renderizarVista();
        configurarPermisos();
        renderizarReporte();
        renderizarComentarios();
    } catch (error) {
        console.error("Error al cargar el ticket:", error);
        mostrarError(error.message || "No se pudo cargar la información del ticket.");
    }
}

function renderizarVista() {
    const t = ticketActual;
    const prio = t.prioridad || '';

    txtCreador.textContent = t.correoCreador;
    txtAsunto.textContent = t.asunto;
    txtEstado.textContent = t.estado;
    txtDescripcion.textContent = t.descripcion;
    txtUbicacion.textContent = t.ubicacion;
    txtDepartamento.textContent = t.nombreDepartamento;
    dtFechaCreacion.textContent = formatearFecha12H(t.fechaCreacion);

    targetaTicket.classList.add(`borde-lateral-${prio}`);
    badgePrioridad.textContent = t.prioridad ?? "";
    badgePrioridad.classList.add(`prioridad-${t.prioridad}`);

    if (t.fechaVencimiento) {
        dtFechaVencimiento.textContent = formatearFecha12H(t.fechaVencimiento);
        filaVencimiento.classList.remove("d-none");
    } else {
        filaVencimiento.classList.add("d-none");
    }

    if (t.tipoTicket === "Articulo" && t.codigosArticulos?.length) {
        txtEquipoTicket.textContent = t.codigosArticulos.join(", ");
        filaEquipo.classList.remove("d-none");
    } else {
        filaEquipo.classList.add("d-none");
    }

    if (t.tipoTicket === "Software" && t.detallesSoftware?.length) {
        txtSoftwareTicket.textContent = t.detallesSoftware
            .map((sw) => `${sw.nombreSoftware} ${sw.version}`)
            .join(", ");
        filaSoftware.classList.remove("d-none");
    } else {
        filaSoftware.classList.add("d-none");
    }

    if (t.correoTecnico) {
        txtTecnicoAsignado.textContent = t.correoTecnico;
        filaTecnico.classList.remove("d-none");
    } else {
        filaTecnico.classList.add("d-none");
    }

    renderizarGaleriaVista();
}

function renderizarGaleriaVista() {
    galeriaEvidenciasVista.innerHTML = "";

    if (evidenciasActuales.length === 0) {
        galeriaEvidenciasVista.classList.remove("contenedor-evidencias");
        galeriaEvidenciasVista.classList.add("contenedor-evidencias-null");
        galeriaEvidenciasVista.innerHTML = `<p class="text-muted small mb-0">Sin evidencias adjuntas.</p>`;
        return;
    }
    galeriaEvidenciasVista.classList.add("contenedor-evidencias");

    evidenciasActuales.forEach((evidencia) => {
        galeriaEvidenciasVista.insertAdjacentHTML("beforeend", `
            <div class="tarjeta-foto-evidencia overflow-hidden rounded-3" onclick="abrirVistaImagen('${evidencia.evidenciaUrl}')">
                <img src="${evidencia.evidenciaUrl}" alt="Evidencia" class="img-fluid object-fit-cover w-100 h-100" />
            </div>
        `);
    });
}

function configurarPermisos() {
    const permisos = obtenerPermisos(ticketActual, idUsuario, rol);

    btnAbrirEdicionCreador.classList.toggle("d-none", !permisos.editarCreador);
    btnAbrirReasignacion.classList.toggle("d-none", !permisos.reasignar);
    btnAbrirEstadoAsignado.classList.toggle("d-none", !permisos.cambiarEstado);
    btnGestionarReporte.classList.toggle("d-none", !permisos.reportar);
    btnEliminarTicket.classList.toggle("d-none", !permisos.eliminar);
}

//El creador elimina su ticket mientras siga en estado "Nuevo" (misma regla que editarComoCreador)
btnEliminarTicket?.addEventListener("click", async () => {
    const confirmar = await mostrarConfirmacion(
        "¿Eliminar este ticket?",
        "Esta acción no se puede revertir.",
        "Eliminar"
    );
    if (!confirmar) return;

    try {
        await eliminarTicket(ticketActual.idTicket, idUsuario);
        mostrarExitoSimple("¡Ticket eliminado!", "Tu ticket fue eliminado correctamente.");
        window.setTimeout(() => {
            window.location.href = "misTickets.html";
        }, 1200);
    } catch (error) {
        mostrarError(error.message || "No se pudo eliminar el ticket.");
    }
});

//Modal de edición (creador)

modalEdicionCreadorEl?.addEventListener("show.bs.modal", () => {
    cargarEdicionCreador();
});

async function cargarEdicionCreador() {
    const t = ticketActual;

    frmEdicionCreador.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

    txtAsuntoEdicion.value = t.asunto;
    txtDescripcionEdicion.value = t.descripcion;

    campoCodigoEdicion.classList.add("d-none");
    campoUbicacionEdicion.classList.add("d-none");
    campoSoftwareEdicion.classList.add("d-none");

    listaCodigosEquipos = [];
    listaSoftwareVersion = [];

    await cargarDepartamentosEdicion();
    sltDepartamentoEdicion.value = t.departamento;
    liberarDepartamento();

    if (t.tipoTicket === "Articulo") {
        campoCodigoEdicion.classList.remove("d-none");
        listaCodigosEquipos = [...(t.codigosArticulos ?? [])];
        renderizarCodigosEdicion();
    } else if (t.tipoTicket === "General") {
        campoUbicacionEdicion.classList.remove("d-none");
        txtUbicacionEdicion.value = t.ubicacion;
    } else if (t.tipoTicket === "Software") {
        campoSoftwareEdicion.classList.remove("d-none");
        listaSoftwareVersion = (t.detallesSoftware ?? []).map((sw) => ({ nombreSoftware: sw.nombreSoftware, version: sw.version }));
        renderizarSoftwareEdicion();
        txtUbicacionSoftwareEdicion.value = t.ubicacion ?? "";
        forzarDepartamentoIT();
    }

    archivosNuevosEvidencia = [];
    renderizarGaleriaEdicion();
}

function forzarDepartamentoIT() {
    if (!sltDepartamentoEdicion || listaDepartamentosDisponibles.length === 0) return;

    //Por tipo y no por nombre: cada area puede llamar distinto a su departamento de IT
    const departamentoIT = listaDepartamentosDisponibles.find((d) => d.tipoDepartamento === "IT");

    if (departamentoIT) {
        sltDepartamentoEdicion.value = departamentoIT.idDepartamento;
    }

    sltDepartamentoEdicion.disabled = true;
}

function liberarDepartamento() {
    if (!sltDepartamentoEdicion) return;
    sltDepartamentoEdicion.disabled = false;
}

async function cargarDepartamentosEdicion() {
    if (departamentosCargados) return;
    try {
        const departamentos = await getDepartamentosAsignables();
        listaDepartamentosDisponibles = departamentos;

        sltDepartamentoEdicion.innerHTML = '<option value="" selected disabled>Selecciona un departamento...</option>';
        departamentos.forEach((dep) => {
            const opcion = document.createElement("option");
            opcion.value = dep.idDepartamento;
            opcion.textContent = dep.nombreDepartamento;
            sltDepartamentoEdicion.appendChild(opcion);
        });
        departamentosCargados = true;
    } catch (error) {
        console.error("Error al cargar departamentos:", error);
        mostrarError(error.message || "No se pudieron cargar los departamentos.");
    }
}

function renderizarCodigosEdicion() {
    listaCodigosEdicion.innerHTML = "";
    listaCodigosEquipos.forEach((codigo, index) => {
        const badge = document.createElement("span");
        badge.className = "badge text-white p-2 rounded-4 d-flex align-items-center gap-2 fs-6 shadow-sm";
        badge.style.backgroundColor = "#90BFDB";
        badge.innerHTML = `
            <span>${escapeHTML(codigo)}</span>
            <button type="button" class="btn-close btn-close-white small" style="font-size: 0.65rem;"
                aria-label="Eliminar" data-index="${index}"></button>
        `;
        listaCodigosEdicion.appendChild(badge);
    });
}

listaCodigosEdicion?.addEventListener("click", (e) => {
    const boton = e.target.closest("button[data-index]");
    if (!boton) return;
    listaCodigosEquipos.splice(Number(boton.dataset.index), 1);
    renderizarCodigosEdicion();
});

function agregarCodigoEdicion(codigo) {
    if (!codigo) return;
    if (listaCodigosEquipos.includes(codigo)) {
        mostrarError("Este código ya fue agregado.");
        return;
    }
    listaCodigosEquipos.push(codigo);
    renderizarCodigosEdicion();
}

if (btnAgregarCodigoEdicion) {
    btnAgregarCodigoEdicion.addEventListener("click", () => {
        agregarCodigoEdicion(txtCodigoEdicion.value.trim());
        txtCodigoEdicion.value = "";
        txtCodigoEdicion.focus();
    });

    txtCodigoEdicion.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            btnAgregarCodigoEdicion.click();
        }
    });

    txtCodigoEdicion.addEventListener("input", () => {
        const fragmento = txtCodigoEdicion.value.trim();
        if (fragmento.length < 2) {
            sugerenciasCodigosEdicion.classList.add("d-none");
            sugerenciasCodigosEdicion.innerHTML = "";
            return;
        }
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(async () => {
            try {
                const resultados = await buscarArticulosPorCodigoParcial(fragmento);
                renderizarSugerenciasCodigo(resultados);
            } catch (error) {
                console.error("Error al buscar artículos:", error);
                sugerenciasCodigosEdicion.classList.add("d-none");
            }
        }, 350);
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest("#campoCodigoEdicion")) {
            sugerenciasCodigosEdicion.classList.add("d-none");
        }
    });
}

function renderizarSugerenciasCodigo(resultados) {
    sugerenciasCodigosEdicion.innerHTML = "";
    if (resultados.length === 0) {
        sugerenciasCodigosEdicion.classList.add("d-none");
        return;
    }
    resultados.forEach((articulo) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "list-group-item list-group-item-action";
        item.textContent = `${articulo.codigoArticulo} (${articulo.nombreUbicacion})`;
        item.addEventListener("click", () => {
            agregarCodigoEdicion(articulo.codigoArticulo);
            txtCodigoEdicion.value = "";
            sugerenciasCodigosEdicion.classList.add("d-none");
            sugerenciasCodigosEdicion.innerHTML = "";
        });
        sugerenciasCodigosEdicion.appendChild(item);
    });
    sugerenciasCodigosEdicion.classList.remove("d-none");
}

function renderizarSoftwareEdicion() {
    listaSoftwareEdicion.innerHTML = "";
    listaSoftwareVersion.forEach((item, index) => {
        const badge = document.createElement("span");
        badge.className = "badge text-white p-2 rounded-4 d-flex align-items-center gap-2 fs-6 shadow-sm";
        badge.style.backgroundColor = "#90BFDB";
        badge.innerHTML = `
            <span>${escapeHTML(item.nombreSoftware)} — v.${escapeHTML(item.version)}</span>
            <button type="button" class="btn-close btn-close-white small" style="font-size: 0.65rem;"
                aria-label="Eliminar" data-index="${index}"></button>
        `;
        listaSoftwareEdicion.appendChild(badge);
    });
}

listaSoftwareEdicion?.addEventListener("click", (e) => {
    const boton = e.target.closest("button[data-index]");
    if (!boton) return;
    listaSoftwareVersion.splice(Number(boton.dataset.index), 1);
    renderizarSoftwareEdicion();
});

if (btnAgregarSoftwareEdicion) {
    btnAgregarSoftwareEdicion.addEventListener("click", () => {
        const nombre = txtNombreSoftwareEdicion.value.trim();
        const version = txtVersionEdicion.value.trim();
        if (!nombre || !version) return;

        const yaExiste = listaSoftwareVersion.some((item) => item.nombreSoftware.toLowerCase() === nombre.toLowerCase() && item.version === version);
        if (yaExiste) {
            mostrarError("Este software con esa versión ya fue agregado.");
            return;
        }

        listaSoftwareVersion.push({ nombreSoftware: nombre, version });
        txtNombreSoftwareEdicion.value = "";
        txtVersionEdicion.value = "";
        renderizarSoftwareEdicion();
        txtNombreSoftwareEdicion.focus();
    });
}

function renderizarGaleriaEdicion() {
    const contenedor = document.getElementById("galeriaMultimediaEdicion");
    contenedor.innerHTML = "";

    //Evidencias ya guardadas en el servidor
    evidenciasActuales.forEach((ev) => {
        const miniatura = document.createElement("div");
        miniatura.className = "miniatura-foto";
        miniatura.innerHTML = `
            <img src="${ev.evidenciaUrl}" alt="Evidencia">
            <button type="button" class="btn-eliminar-foto btn-eliminar-evidencia" data-id-evidencia="${ev.idEvidencia}" aria-label="Eliminar evidencia">
                <i class="bi bi-x"></i>
            </button>
        `;
        contenedor.appendChild(miniatura);
    });

    //Evidencias nuevas, aún no subidas
    archivosNuevosEvidencia.forEach((archivo, index) => {
        const lector = new FileReader();
        lector.onload = function (e) {
            const miniatura = document.createElement("div");
            miniatura.className = "miniatura-foto";
            miniatura.innerHTML = `
                <img src="${e.target.result}" alt="Nueva evidencia">
                <button type="button" class="btn-eliminar-foto btn-eliminar-nueva" data-index="${index}" aria-label="Eliminar foto">
                    <i class="bi bi-x"></i>
                </button>
            `;
            contenedor.appendChild(miniatura);
        };
        lector.readAsDataURL(archivo);
    });

    if (btnAgregarEvidenciaEdicion) {
        btnAgregarEvidenciaEdicion.disabled = (evidenciasActuales.length + archivosNuevosEvidencia.length) >= limiteEvidenciasTicket;
    }
}

if (btnAgregarEvidenciaEdicion) {
    btnAgregarEvidenciaEdicion.addEventListener("click", () => inputEvidenciaEdicion.click());
}

if (inputEvidenciaEdicion) {
    inputEvidenciaEdicion.addEventListener("change", function () {
        const nuevosArchivos = Array.from(this.files);
        const espacioDisponible = limiteEvidenciasTicket - evidenciasActuales.length - archivosNuevosEvidencia.length;

        if (nuevosArchivos.length > espacioDisponible) {
            archivosNuevosEvidencia = archivosNuevosEvidencia.concat(nuevosArchivos.slice(0, Math.max(espacioDisponible, 0)));
            mostrarError(`Solo puedes tener un máximo de ${limiteEvidenciasTicket} evidencias por ticket.`);
        } else {
            archivosNuevosEvidencia = archivosNuevosEvidencia.concat(nuevosArchivos);
        }

        renderizarGaleriaEdicion();
        this.value = "";
    });
}

galeriaMultimediaEdicion?.addEventListener("click", async (e) => {
    const btnEliminarExistente = e.target.closest(".btn-eliminar-evidencia");
    if (btnEliminarExistente) {
        const idEvidencia = Number(btnEliminarExistente.dataset.idEvidencia);
        const confirmar = await mostrarConfirmacion("¿Eliminar esta evidencia?", "Esta acción no se puede revertir", "Eliminar");
        if (!confirmar) return;

        try {
            await eliminarEvidencia(idEvidencia);
            evidenciasActuales = evidenciasActuales.filter((ev) => ev.idEvidencia !== idEvidencia);
            renderizarGaleriaEdicion();
            renderizarGaleriaVista();
        } catch (error) {
            console.error("Error al eliminar evidencia:", error);
            mostrarError(error.message || "No se pudo eliminar la evidencia.");
        }
        return;
    }

    const btnEliminarNueva = e.target.closest(".btn-eliminar-nueva");
    if (btnEliminarNueva) {
        archivosNuevosEvidencia.splice(Number(btnEliminarNueva.dataset.index), 1);
        renderizarGaleriaEdicion();
    }
});

//Traduce los campos que devuelve la función de validarFormularioTicket
const mapeoCamposEdicionCreador = {
    txtAsunto: "txtAsuntoEdicion",
    txtDescripcion: "txtDescripcionEdicion",
    sltDepartamento: "sltDepartamentoEdicion",
    txtCodigo: "txtCodigoEdicion",
    txtUbicacion: "txtUbicacionEdicion",
    txtNombreSoftware: "txtNombreSoftwareEdicion",
    txtVersion: "txtVersionEdicion",
    txtUbicacionSoftware: "txtUbicacionSoftwareEdicion"
};

frmEdicionCreador?.addEventListener("submit", async (e) => {
    e.preventDefault();
    frmEdicionCreador.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

    const categoria = CATEGORIA_POR_TIPO[ticketActual.tipoTicket];
    const datosFormulario = {
        asunto: txtAsuntoEdicion.value,
        descripcion: txtDescripcionEdicion.value,
        idDepartamento: sltDepartamentoEdicion.value,
        ubicacion: txtUbicacionEdicion.value,
        listaCodigos: listaCodigosEquipos,
        listaSoftware: listaSoftwareVersion,
        ubicacionesSoftware: txtUbicacionSoftwareEdicion.value
    };

    const errores = validarFormularioTicket(categoria, datosFormulario);
    if (errores.length > 0) {
        errores.forEach((error) => {
            const idReal = mapeoCamposEdicionCreador[error.campo] ?? error.campo;
            const campo = document.getElementById(idReal);
            if (campo) campo.classList.add("is-invalid");
        });
        mostrarError(errores.map((e) => e.mensaje).join(" "));
        return;
    }

    if (ticketActual.tipoTicket === "Articulo") {
        let codigosInvalidos;
        try {
            codigosInvalidos = await obtenerCodigosNoInventariados(listaCodigosEquipos);
        } catch (error) {
            console.error("Error al comprobar los códigos del inventario:", error);
            mostrarError(error.message || "No pudimos comprobar los equipos en este momento. Intenta guardar nuevamente.");
            return;
        }

        if (codigosInvalidos.length > 0) {
            txtCodigoEdicion.classList.add("is-invalid");
            const listado = codigosInvalidos.map((codigo) => `"${codigo}"`).join(", ");
            mostrarError(`${codigosInvalidos.length === 1 ? "El código" : "Los códigos"} ${listado} no ${codigosInvalidos.length === 1 ? "pertenece" : "pertenecen"} al inventario. Elimínalo${codigosInvalidos.length === 1 ? "" : "s"} e ingresa ${codigosInvalidos.length === 1 ? "uno correcto" : "códigos correctos"}.`);
            return;
        }
    }

    const dto = {
        asunto: datosFormulario.asunto.trim(),
        descripcion: datosFormulario.descripcion.trim(),
        departamento: Number(datosFormulario.idDepartamento)
    };

    if (ticketActual.tipoTicket === "Articulo") {
        dto.codigosArticulos = listaCodigosEquipos;
    } else if (ticketActual.tipoTicket === "General") {
        dto.descripcionUbicacion = datosFormulario.ubicacion.trim();
    } else if (ticketActual.tipoTicket === "Software") {
        dto.detallesSoftware = listaSoftwareVersion.map((item) => ({
            nombreSoftware: item.nombreSoftware,
            version: item.version,
            descripcionUbicaciones: datosFormulario.ubicacionesSoftware.trim()
        }));
    }

    try {
        await editarComoCreador(idTicketActual, dto, idUsuario);

        if (archivosNuevosEvidencia.length > 0) {
            const subidas = archivosNuevosEvidencia.map((archivo) => subirEvidencia(archivo, idTicketActual));
            await Promise.all(subidas);
        }

        mostrarExitoSimple("¡Ticket actualizado!", "Los cambios se guardaron correctamente.");
        await cargarTicket();
        cerrarModal(modalEdicionCreadorEl);
    } catch (error) {
        console.error("Error al editar el ticket:", error);
        mostrarError(error.message || "No se pudo actualizar el ticket.");
    }
});

//Modal de reasignacion (para administradores)

modalReasignacionEl?.addEventListener("show.bs.modal", () => {
    cargarDatosReasignacion();
});

async function cargarDatosReasignacion() {

    frmReasignacion.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

    sltPrioridadEdicion.value = ticketActual.prioridad ?? "";
    dtFechaVencimientoEdicion.value = formatearParaDateTimeLocal(ticketActual.fechaVencimiento);;
    await cargarTecnicosEdicion();
    if (ticketActual.tecnicoAsignado) {
        sltTecnicoEdicion.value = ticketActual.tecnicoAsignado;
    }
}

async function cargarTecnicosEdicion() {
    try {
        const tecnicos = await getTecnicosPorDepartamento(ticketActual.departamento);
        sltTecnicoEdicion.innerHTML = '<option value="" selected disabled>Selecciona un técnico...</option>';
        tecnicos.forEach((tecnico) => {
            const opcion = document.createElement("option");
            opcion.value = tecnico.idUsuario;
            opcion.textContent = `${tecnico.correo} (${tecnico.nombreRol})`;
            sltTecnicoEdicion.appendChild(opcion);
        });
    } catch (error) {
        console.error("Error al cargar técnicos:", error);
        mostrarError(error.message || "No se pudieron cargar los técnicos disponibles.");
    }
}

frmReasignacion?.addEventListener("submit", async (e) => {
    e.preventDefault();
    frmReasignacion.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

    const datos = {
        prioridad: sltPrioridadEdicion.value,
        tecnicoAsignado: sltTecnicoEdicion.value,
        fechaVencimiento: dtFechaVencimientoEdicion.value
    };

    const errores = validarFormularioAprobacion(datos);
    if (errores.length > 0) {
        errores.forEach((error) => {
            const idCampo = error.campo === "sltPrioridad" ? "sltPrioridadEdicion"
                : error.campo === "sltTecnico" ? "sltTecnicoEdicion"
                    : "dtFechaVencimientoEdicion";
            const campo = document.getElementById(idCampo);
            if (campo) campo.classList.add("is-invalid");
        });
        mostrarError(errores.map((e) => e.mensaje).join(" "));
        return;
    }

    const confirmar = await mostrarConfirmacion("¿Deseas reasignar este ticket?", "El ticket volverá al estado 'Asignado'", "Reasignar");
    if (!confirmar) return;

    try {
        await editarComoGestor(idTicketActual, {
            fechaVencimiento: datos.fechaVencimiento,
            tecnicoAsignado: Number(datos.tecnicoAsignado),
            prioridad: datos.prioridad
        }, idUsuario);

        mostrarExitoSimple("¡Ticket reasignado!", "Los cambios se guardaron correctamente.");
        await cargarTicket();
        await cargarBitacoras();
        cerrarModal(modalReasignacionEl);
    } catch (error) {
        console.error("Error al reasignar el ticket:", error);
        mostrarError(error.message || "No se pudo reasignar el ticket.");
    }
});

//Modal de cambio de estado (para usuario asignado)

modalEstadoAsignadoEl?.addEventListener("show.bs.modal", () => {
    if (["En proceso", "En espera"].includes(ticketActual.estado)) {
        sltEstadoAsignado.value = ticketActual.estado;
    }
});

frmEstadoAsignado?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        await editarEstadoAsignado(idTicketActual, sltEstadoAsignado.value, idUsuario);
        mostrarExitoSimple("¡Estado actualizado!", "El estado del ticket fue actualizado.");
        await cargarTicket();
        await cargarBitacoras();
        cerrarModal(modalEstadoAsignadoEl);
    } catch (error) {
        console.error("Error al actualizar el estado:", error);
        mostrarError(error.message || "No se pudo actualizar el estado del ticket.");
    }
});

//Modal de reporte técnico

function renderizarReporte() {
    const t = ticketActual;

    if (t.descripcionFalla && t.descripcionSolucion) {
        tablaReporteTecnico.innerHTML = `
            <tr>
                <td class="fw-bold text-break">${escapeHTML(t.correoTecnico ?? "")}</td>
                <td class="text-dark text-wrap text-break">${escapeHTML(t.descripcionFalla)}</td>
                <td class="text-dark text-wrap text-break">${escapeHTML(t.descripcionSolucion)}</td>
            </tr>
        `;
        txtBotonReporte.textContent = "Editar reporte";
        txtDescripcionFalla.value = t.descripcionFalla;
        txtDescripcionSolucion.value = t.descripcionSolucion;
    } else {
        tablaReporteTecnico.innerHTML = `
            <tr><td colspan="3" class="text-muted">Aún no se ha registrado un reporte para este ticket.</td></tr>
        `;
        txtBotonReporte.textContent = "Agregar reporte";
        txtDescripcionFalla.value = "";
        txtDescripcionSolucion.value = "";
    }
}

frmReporteTicket?.addEventListener("submit", async (e) => {
    e.preventDefault();
    frmReporteTicket.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

    const datos = {
        descripcionFalla: txtDescripcionFalla.value,
        descripcionSolucion: txtDescripcionSolucion.value
    };

    const errores = validarFormularioReporte(datos);
    if (errores.length > 0) {
        errores.forEach((error) => {
            const campo = document.getElementById(error.campo);
            if (campo) campo.classList.add("is-invalid");
        });
        mostrarError(errores.map((e) => e.mensaje).join(" "));
        return;
    }

    try {
        await reportarTicket(idTicketActual, {
            descripcionFalla: datos.descripcionFalla.trim(),
            descripcionSolucion: datos.descripcionSolucion.trim()
        }, idUsuario);

        mostrarExitoSimple("¡Reporte guardado!", "El ticket pasó a estado 'Resuelto'.");
        await cargarTicket();
        await cargarBitacoras();
        cerrarModal(modalReporteEl);
    } catch (error) {
        console.error("Error al guardar el reporte:", error);
        mostrarError(error.message || "No se pudo guardar el reporte.");
    }
});

function cerrarModal(modalEl) {
    const instancia = bootstrap.Modal.getInstance(modalEl);
    if (instancia) instancia.hide();
}

function escapeHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

//Cargar y mostrar bitácoras
async function cargarBitacoras() {
    try{
        const bitacoras = await getBitacorasPorTicket(idTicketActual);

        tablaBitacora.innerHTML = "";

        bitacoras.forEach((bitacora) => {
            tablaBitacora.innerHTML += `
            <tr>
                <td class="fw-bold">${bitacora.correoUsuario}</td>
                <td>${bitacora.nuevoEstado}</td>
                <td>${formatearFecha12H(bitacora.fechaHora)}</td>
            </tr>
            `
        });
    }catch (error) {
        console.error("Error al cargar la tabla de bitácoras:", error);
        mostrarError(error.message || "Oops... No se pudo cargar la bitácora");
    }
}

//Comentarios

function renderizarComentarios() {
    if (comentariosActuales.length === 0) {
        listaComentarios.innerHTML = `<p class="text-muted small mb-0">Aún no hay comentarios. ¡Sé el primero en escribir uno!</p>`;
        return;
    }

    listaComentarios.innerHTML = comentariosActuales.map((comentario) => {
        const esPropio = Number(comentario.idUsuarioComentario) === idUsuario;
        const tipo = esPropio ? "propio" : "otro";

        const correo = !esPropio ? `<span class="correo-comentario">${escapeHTML(comentario.correoUsuario ?? "")}</span>`: "";
        const galeria = (comentario.multimediaUrls && comentario.multimediaUrls.length > 0) ? `<div class="galeria-burbuja-comentario">${comentario.multimediaUrls.map((url) => `<img src="${url}" alt="Imagen adjunta" onclick="abrirVistaImagen('${url}')">`).join("")}</div>` : "";

        const btnEliminar = esPropio ? `
            <button type="button" class="btn-eliminar-comentario" data-id-comentario="${comentario.id}" aria-label="Eliminar comentario" title="Eliminar comentario">
                   <i class="bi bi-trash3"></i>
            </button>`: "";

        return `
            <div class="burbuja-comentario-wrapper ${tipo}">
                ${correo}
                <div class="burbuja-comentario ${tipo} animar-mensaje">
                    <span class="text-break">${escapeHTML(comentario.comentario)}</span>
                    ${galeria}
                </div>
                <div class="pie-comentario">
                    <span class="hora-comentario">${formatearFecha12H(comentario.fechaHora)}</span>
                    ${btnEliminar}
                </div>
            </div>
        `;
    }).join("");

    listaComentarios.scrollTop = listaComentarios.scrollHeight;
}

listaComentarios?.addEventListener("click", async (e) => {
    const btnEliminar = e.target.closest(".btn-eliminar-comentario");
    if (!btnEliminar) return;

    const idComentario = Number(btnEliminar.dataset.idComentario);

    const confirmar = await mostrarConfirmacion("¿Deseas eliminar este comentario?", "Esta acción no se puede revertir", "Eliminar");
    if (!confirmar) return;

    try {
        await eliminarComentario(idComentario, idUsuario);
        comentariosActuales = comentariosActuales.filter((c) => c.id !== idComentario);
        renderizarComentarios();
    } catch (error) {
        console.error("Error al eliminar el comentario:", error);
        mostrarError(error.message || "No se pudo eliminar el comentario.");
    }
});

function renderizarGaleriaComentario() {
    if (archivosComentarioSeleccionados.length === 0) {
        galeriaComentarioAdjuntos.classList.add("d-none");
        galeriaComentarioAdjuntos.innerHTML = "";
        return;
    }

    galeriaComentarioAdjuntos.classList.remove("d-none");
    galeriaComentarioAdjuntos.innerHTML = "";

    archivosComentarioSeleccionados.forEach((archivo, index) => {
        const lector = new FileReader();
        lector.onload = function (e) {
            const miniatura = document.createElement("div");
            miniatura.className = "miniatura-foto";
            miniatura.innerHTML = `
                <img src="${e.target.result}" alt="Adjunto ${index + 1}">
                <button type="button" class="btn-eliminar-foto" data-index="${index}" aria-label="Eliminar adjunto">
                    <i class="bi bi-x"></i>
                </button>
            `;
            galeriaComentarioAdjuntos.appendChild(miniatura);
        };
        lector.readAsDataURL(archivo);
    });
}

if (btnAdjuntarComentario) {
    btnAdjuntarComentario.addEventListener("click", () => inputComentarioMultimedia.click());
}

if (inputComentarioMultimedia) {
    inputComentarioMultimedia.addEventListener("change", function () {
        let combinados = archivosComentarioSeleccionados.concat(Array.from(this.files));

        if (combinados.length > limiteMultimediaComentario) {
            combinados = combinados.slice(0, limiteMultimediaComentario);
            mostrarError(`Solo puedes adjuntar un máximo de ${limiteMultimediaComentario} imágenes por comentario.`);
        }

        archivosComentarioSeleccionados = combinados;
        renderizarGaleriaComentario();
        this.value = "";
    });
}

//El textarea del comentario crece junto con el texto
if (txtComentario) {
    txtComentario.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";

        if (this.scrollHeight >= 60) {
            this.style.overflowY = "auto";
        } else {
            this.style.overflowY = "hidden";
        }
    });
}

galeriaComentarioAdjuntos?.addEventListener("click", (e) => {
    const btnEliminar = e.target.closest(".btn-eliminar-foto");
    if (btnEliminar) {
        archivosComentarioSeleccionados.splice(Number(btnEliminar.dataset.index), 1);
        renderizarGaleriaComentario();
    }
});

frmComentario?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!idUsuario) {
        mostrarError("No se pudo identificar al usuario. Inicia sesión nuevamente.");
        return;
    }

    const comentario = txtComentario.value.trim();

    const errores = validarFormularioComentario(comentario);
    if (errores.length > 0) {
        errores.forEach((error) => {
            const campo = document.getElementById(error.campo);
            if (campo) campo.classList.add("is-invalid");
        });
        mostrarError(errores.map((e) => e.mensaje).join(" "));
        return;
    }

    btnEnviarComentario.disabled = true;

    try {
        const comentarioCreado = await crearComentario({
            comentario: comentario,
            idTicket: idTicketActual,
            idUsuarioComentario: idUsuario
        });

        if (archivosComentarioSeleccionados.length > 0) {
            const subidas = archivosComentarioSeleccionados.map((archivo) =>
                subirMultimediaComentario(archivo, comentarioCreado.id)
            );
            await Promise.all(subidas);
        }

        txtComentario.value = "";
        txtComentario.style.height = "auto";
        archivosComentarioSeleccionados = [];
        renderizarGaleriaComentario();

        comentariosActuales = await obtenerComentariosPorTicket(idTicketActual);
        renderizarComentarios();
    } catch (error) {
        console.error("Error al enviar el comentario:", error);
        mostrarError(error.message || "No se pudo enviar el comentario.");
    } finally {
        btnEnviarComentario.disabled = false;
    }
});

//Función para cargar la url y mostrar el modal de vista previa
window.abrirVistaImagen = function (url) {
    if (document.activeElement) {
        document.activeElement.blur();
    }
    img.src = url;
    modalVistaPrevia.show();
}

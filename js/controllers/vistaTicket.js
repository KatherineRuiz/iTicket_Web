import { getTicket, editarComoCreador, editarComoGestor, editarEstadoAsignado, reportarTicket } from "../services/ticketsService.js";
import { obtenerEvidenciasPorTicket, eliminarEvidencia, subirEvidencia } from "../services/evidenciasService.js";
import { getDepartamentosAsignables } from "../services/departamentosService.js";
import { getUbicaciones } from "../services/ubicacionesService.js";
import { buscarArticulosPorCodigoParcial } from "../services/articulosService.js";
import { getTecnicosPorDepartamento } from "../services/usuariosService.js";
import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/sweetAlerts.js";
import { validarFormularioTicket, validarFormularioAprobacion, validarFormularioReporte } from "../validators/ticketsValidator.js";
import { obtenerPermisos } from "../validators/permisosTicket.js";


const CATEGORIA_POR_TIPO = { "Articulo": "equipos", "General": "general", "Software": "software" };

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
const galeriaEvidenciasVista = document.getElementById("galeriaEvidenciasVista");
const btnEditarTicket = document.getElementById("btnEditarTicket");

const modoVistaContenido = document.getElementById("modoVistaContenido");
const modoEdicionContenido = document.getElementById("modoEdicionContenido");
const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");

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
const sltUbicacionSoftwareEdicion = document.getElementById("sltUbicacionSoftwareEdicion");
const galeriaEvidenciasEdicion = document.getElementById("galeriaEvidenciasEdicion");
const btnAgregarEvidenciaEdicion = document.getElementById("btnAgregarEvidenciaEdicion");
const inputEvidenciaEdicion = document.getElementById("inputEvidenciaEdicion");

const frmReasignacion = document.getElementById("frmReasignacion");
const sltPrioridadEdicion = document.getElementById("sltPrioridadEdicion");
const sltTecnicoEdicion = document.getElementById("sltTecnicoEdicion");
const dtFechaVencimientoEdicion = document.getElementById("dtFechaVencimientoEdicion");

const frmEstadoAsignado = document.getElementById("frmEstadoAsignado");
const sltEstadoAsignado = document.getElementById("sltEstadoAsignado");

const btnGestionarReporte = document.getElementById("btnGestionarReporte");
const txtBotonReporte = document.getElementById("txtBotonReporte");
const frmReporteTicket = document.getElementById("frmReporteTicket");
const txtDescripcionFalla = document.getElementById("txtDescripcionFalla");
const txtDescripcionSolucion = document.getElementById("txtDescripcionSolucion");
const cuerpoReporteTecnico = document.getElementById("cuerpoReporteTecnico");
const modalReporteEl = document.getElementById("modalReporte");

let idTicketActual = null;
let ticketActual = null;
let evidenciasActuales = []; //[{idEvidencia, evidenciaUrl}]
let archivosNuevosEvidencia = [];
let listaCodigosEquipos = [];
let listaSoftwareVersion = [];
let departamentosCargados = false;
let ubicacionesCargadas = false;
let tecnicosCargados = false;
let temporizadorBusqueda = null;

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
});

function obtenerIdTicketDesdeURL() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get("id");
}


function obtenerSesion() {
    const usuarioGuardado = sessionStorage.getItem("usuarioLogueado");
    const idUsuario = usuarioGuardado ? Number(JSON.parse(usuarioGuardado).idUsuario) : null;
    const rol = (localStorage.getItem("rolUsuario") || "").toLowerCase();
    return { idUsuario, rol };
}

async function cargarTicket() {
    try {
        const [ticket, evidencias] = await Promise.all([
            getTicket(idTicketActual),
            obtenerEvidenciasPorTicket(idTicketActual)
        ]);

        ticketActual = ticket;
        evidenciasActuales = evidencias || [];

        renderizarVista();
        configurarPermisos();
        renderizarReporte();
    } catch (error) {
        console.error("Error al cargar el ticket:", error);
        mostrarError("No se pudo cargar la información del ticket.");
    }
}

function renderizarVista() {
    const t = ticketActual;

    txtCreador.textContent = t.correoCreador ?? "";
    txtAsunto.textContent = t.asunto ?? "";
    txtEstado.textContent = t.estado ?? "";
    txtDescripcion.textContent = t.descripcion ?? "";
    txtUbicacion.textContent = t.ubicacion ?? "Sin definir";
    dtFechaCreacion.textContent = t.fechaCreacion ?? "";

    badgePrioridad.textContent = t.prioridad ?? "Sin prioridad";
    badgePrioridad.className = `badge fondo-${clasePrioridad(t.prioridad)} rounded-pill px-3 py-2 text-center flex-shrink-0`;

    if (t.fechaVencimiento) {
        dtFechaVencimiento.textContent = t.fechaVencimiento;
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
            .map((sw) => `${sw.nombreSoftware} (v.${sw.version})`)
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

function clasePrioridad(prioridad) {
    const mapa = { Critica: "peligro-suave", Alta: "advertencia-suave", Media: "advertencia-suave-2", Baja: "exito-suave" };
    return mapa[prioridad] ?? "peligro-suave";
}

function renderizarGaleriaVista() {
    galeriaEvidenciasVista.innerHTML = "";

    if (evidenciasActuales.length === 0) {
        galeriaEvidenciasVista.innerHTML = `<p class="text-muted small mb-0">Sin evidencias adjuntas.</p>`;
        return;
    }

    evidenciasActuales.forEach((ev) => {
        galeriaEvidenciasVista.insertAdjacentHTML("beforeend", `
            <div class="tarjeta-foto-evidencia overflow-hidden rounded-3">
                <img src="${ev.evidenciaUrl}" alt="Evidencia" class="img-fluid object-fit-cover w-100 h-100" />
            </div>
        `);
    });
}

function configurarPermisos() {
    const { idUsuario, rol } = obtenerSesion();
    const permisos = obtenerPermisos(ticketActual, idUsuario, rol);

    const hayAlgunPermiso = permisos.editarCreador || permisos.reasignar || permisos.cambiarEstado;
    btnEditarTicket.classList.toggle("d-none", !hayAlgunPermiso);

    btnGestionarReporte.classList.toggle("d-none", !permisos.reportar);

    btnEditarTicket.onclick = () => activarModoEdicion(permisos, idUsuario);
    btnCancelarEdicion.onclick = () => desactivarModoEdicion();
}

async function activarModoEdicion(permisos, idUsuario) {
    modoVistaContenido.classList.add("d-none");
    modoEdicionContenido.classList.remove("d-none");

    frmEdicionCreador.classList.toggle("d-none", !permisos.editarCreador);
    frmReasignacion.classList.toggle("d-none", !permisos.reasignar);
    frmEstadoAsignado.classList.toggle("d-none", !permisos.cambiarEstado);

    if (permisos.editarCreador) await prepararBloqueCreador();
    if (permisos.reasignar) await prepararBloqueReasignacion();
    if (permisos.cambiarEstado) prepararBloqueEstado();
}

function desactivarModoEdicion() {
    modoEdicionContenido.classList.add("d-none");
    modoVistaContenido.classList.remove("d-none");
}

//===================== BLOQUE 1: EDICIÓN COMO CREADOR =====================

async function prepararBloqueCreador() {
    const t = ticketActual;

    txtAsuntoEdicion.value = t.asunto ?? "";
    txtDescripcionEdicion.value = t.descripcion ?? "";

    campoCodigoEdicion.classList.add("d-none");
    campoUbicacionEdicion.classList.add("d-none");
    campoSoftwareEdicion.classList.add("d-none");

    listaCodigosEquipos = [];
    listaSoftwareVersion = [];

    if (t.tipoTicket === "Articulo") {
        campoCodigoEdicion.classList.remove("d-none");
        listaCodigosEquipos = [...(t.codigosArticulos ?? [])];
        renderizarCodigosEdicion();
    } else if (t.tipoTicket === "General") {
        campoUbicacionEdicion.classList.remove("d-none");
        txtUbicacionEdicion.value = t.ubicacion ?? "";
    } else if (t.tipoTicket === "Software") {
        campoSoftwareEdicion.classList.remove("d-none");
        listaSoftwareVersion = (t.detallesSoftware ?? []).map((sw) => ({ nombreSoftware: sw.nombreSoftware, version: sw.version }));
        renderizarSoftwareEdicion();
        await cargarUbicacionesEdicion();
        preseleccionarUbicacionSoftware(t.ubicacion);
    }

    await cargarDepartamentosEdicion();
    sltDepartamentoEdicion.value = t.departamento;

    archivosNuevosEvidencia = [];
    renderizarGaleriaEdicion();
}

async function cargarDepartamentosEdicion() {
    if (departamentosCargados) return;
    const { idUsuario } = obtenerSesion();
    try {
        const departamentos = await getDepartamentosAsignables(idUsuario);
        sltDepartamentoEdicion.innerHTML = '<option value="" selected disabled>Selecciona un departamento</option>';
        departamentos.forEach((dep) => {
            const opcion = document.createElement("option");
            opcion.value = dep.idDepartamento;
            opcion.textContent = dep.nombreDepartamento;
            sltDepartamentoEdicion.appendChild(opcion);
        });
        departamentosCargados = true;
    } catch (error) {
        console.error("Error al cargar departamentos:", error);
        mostrarError("No se pudieron cargar los departamentos.");
    }
}

async function cargarUbicacionesEdicion() {
    if (ubicacionesCargadas) return;
    try {
        const ubicaciones = await getUbicaciones();
        sltUbicacionSoftwareEdicion.innerHTML = '<option value="" selected disabled>Selecciona la ubicación</option>';
        ubicaciones.forEach((ub) => {
            const opcion = document.createElement("option");
            opcion.value = ub.id;
            opcion.textContent = ub.nombreUbicacion;
            sltUbicacionSoftwareEdicion.appendChild(opcion);
        });
        ubicacionesCargadas = true;
    } catch (error) {
        console.error("Error al cargar ubicaciones:", error);
        mostrarError("No se pudieron cargar las ubicaciones.");
    }
}

//El backend solo devuelve el nombre de la ubicación (no el id), así que se busca por texto
function preseleccionarUbicacionSoftware(nombreUbicacion) {
    if (!nombreUbicacion) return;
    const opcion = Array.from(sltUbicacionSoftwareEdicion.options).find((o) => o.textContent === nombreUbicacion);
    if (opcion) sltUbicacionSoftwareEdicion.value = opcion.value;
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
            <span>${escapeHTML(item.nombreSoftware)} — ${escapeHTML(item.version)}</span>
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

        const yaExiste = listaSoftwareVersion.some(
            (item) => item.nombreSoftware.toLowerCase() === nombre.toLowerCase() && item.version === version
        );
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

//Evidencias: eliminación inmediata de las ya existentes
function renderizarGaleriaEdicion() {
    galeriaEvidenciasEdicion.innerHTML = "";

    evidenciasActuales.forEach((ev) => {
        galeriaEvidenciasEdicion.insertAdjacentHTML("beforeend", `
            <div class="miniatura-foto position-relative" style="width: 90px; height: 90px;" data-id-evidencia="${ev.idEvidencia}">
                <img src="${ev.evidenciaUrl}" alt="Evidencia" class="w-100 h-100 rounded-3" style="object-fit: cover;">
                <button type="button" class="btn-eliminar-foto btn-eliminar-evidencia" data-id-evidencia="${ev.idEvidencia}" aria-label="Eliminar">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `);
    });

    archivosNuevosEvidencia.forEach((archivo, index) => {
        const lector = new FileReader();
        lector.onload = (e) => {
            galeriaEvidenciasEdicion.insertAdjacentHTML("beforeend", `
                <div class="miniatura-foto position-relative" style="width: 90px; height: 90px;">
                    <img src="${e.target.result}" alt="Nueva evidencia" class="w-100 h-100 rounded-3" style="object-fit: cover;">
                    <button type="button" class="btn-eliminar-foto btn-eliminar-nueva" data-index="${index}" aria-label="Eliminar">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `);
        };
        lector.readAsDataURL(archivo);
    });
}

galeriaEvidenciasEdicion?.addEventListener("click", async (e) => {
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
            mostrarError("No se pudo eliminar la evidencia.");
        }
        return;
    }

    const btnEliminarNueva = e.target.closest(".btn-eliminar-nueva");
    if (btnEliminarNueva) {
        archivosNuevosEvidencia.splice(Number(btnEliminarNueva.dataset.index), 1);
        renderizarGaleriaEdicion();
    }
});

if (btnAgregarEvidenciaEdicion) {
    btnAgregarEvidenciaEdicion.addEventListener("click", () => inputEvidenciaEdicion.click());

    inputEvidenciaEdicion.addEventListener("change", function () {
        archivosNuevosEvidencia = archivosNuevosEvidencia.concat(Array.from(this.files));
        renderizarGaleriaEdicion();
        this.value = "";
    });
}

frmEdicionCreador?.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelectorAll("#frmEdicionCreador .is-invalid").forEach((el) => el.classList.remove("is-invalid"));

    const categoria = CATEGORIA_POR_TIPO[ticketActual.tipoTicket];
    const datosFormulario = {
        asunto: txtAsuntoEdicion.value,
        descripcion: txtDescripcionEdicion.value,
        idDepartamento: sltDepartamentoEdicion.value,
        ubicacion: txtUbicacionEdicion.value,
        listaCodigos: listaCodigosEquipos,
        listaSoftware: listaSoftwareVersion,
        idUbicacionSoftware: sltUbicacionSoftwareEdicion.value
    };

    const errores = validarFormularioTicket(categoria, datosFormulario);
    if (errores.length > 0) {
        errores.forEach((error) => {
            const campo = document.getElementById(error.campo);
            if (campo) campo.classList.add("is-invalid");
        });
        mostrarError(errores.map((e) => e.mensaje).join(" "));
        return;
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
            ubicacion: Number(datosFormulario.idUbicacionSoftware)
        }));
    }

    const { idUsuario } = obtenerSesion();

    try {
        await editarComoCreador(idTicketActual, dto, idUsuario);

        if (archivosNuevosEvidencia.length > 0) {
            const subidas = archivosNuevosEvidencia.map((archivo) => subirEvidencia(archivo, idTicketActual));
            await Promise.all(subidas);
        }

        mostrarExitoSimple("¡Ticket actualizado!", "Los cambios se guardaron correctamente.");
        await cargarTicket();
        desactivarModoEdicion();
    } catch (error) {
        console.error("Error al editar el ticket:", error);
        mostrarError(error.message || "No se pudo actualizar el ticket.");
    }
});

//===================== BLOQUE 2: REASIGNACIÓN (ADMIN) =====================

async function prepararBloqueReasignacion() {
    sltPrioridadEdicion.value = ticketActual.prioridad ?? "";
    dtFechaVencimientoEdicion.value = "";
    await cargarTecnicosEdicion();
    if (ticketActual.tecnicoAsignado) {
        sltTecnicoEdicion.value = ticketActual.tecnicoAsignado;
    }
}

async function cargarTecnicosEdicion() {
    tecnicosCargados = false; //Puede cambiar el departamento entre visitas, siempre se recarga
    try {
        const tecnicos = await getTecnicosPorDepartamento(ticketActual.departamento);
        sltTecnicoEdicion.innerHTML = '<option value="" selected disabled>Selecciona un técnico</option>';
        tecnicos.forEach((tecnico) => {
            const opcion = document.createElement("option");
            opcion.value = tecnico.idUsuario;
            opcion.textContent = `${tecnico.correo} (${tecnico.nombreRol})`;
            sltTecnicoEdicion.appendChild(opcion);
        });
        tecnicosCargados = true;
    } catch (error) {
        console.error("Error al cargar técnicos:", error);
        mostrarError("No se pudieron cargar los técnicos disponibles.");
    }
}

frmReasignacion?.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelectorAll("#frmReasignacion .is-invalid").forEach((el) => el.classList.remove("is-invalid"));

    const datos = {
        prioridad: sltPrioridadEdicion.value,
        tecnicoAsignado: sltTecnicoEdicion.value,
        fechaVencimiento: dtFechaVencimientoEdicion.value
    };

    const errores = validarFormularioAprobacion(datos);
    if (errores.length > 0) {
        errores.forEach((error) => {
            const campo = document.getElementById(error.campo === "sltPrioridad" ? "sltPrioridadEdicion" : error.campo === "sltTecnico" ? "sltTecnicoEdicion" : "dtFechaVencimientoEdicion");
            if (campo) campo.classList.add("is-invalid");
        });
        mostrarError(errores.map((e) => e.mensaje).join(" "));
        return;
    }

    const confirmar = await mostrarConfirmacion("¿Reasignar este ticket?", "El ticket volverá al estado 'Asignado'", "Reasignar");
    if (!confirmar) return;

    const { idUsuario } = obtenerSesion();

    try {
        await editarComoGestor(idTicketActual, {
            fechaVencimiento: datos.fechaVencimiento,
            tecnicoAsignado: Number(datos.tecnicoAsignado),
            prioridad: datos.prioridad
        }, idUsuario);

        mostrarExitoSimple("¡Ticket reasignado!", "Los cambios se guardaron correctamente.");
        await cargarTicket();
        desactivarModoEdicion();
    } catch (error) {
        console.error("Error al reasignar el ticket:", error);
        mostrarError(error.message || "No se pudo reasignar el ticket.");
    }
});

//===================== BLOQUE 3: CAMBIO DE ESTADO (ASIGNADO) =====================

function prepararBloqueEstado() {
    if (["En proceso", "En espera"].includes(ticketActual.estado)) {
        sltEstadoAsignado.value = ticketActual.estado;
    }
}

frmEstadoAsignado?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { idUsuario } = obtenerSesion();

    try {
        await editarEstadoAsignado(idTicketActual, sltEstadoAsignado.value, idUsuario);
        mostrarExitoSimple("¡Estado actualizado!", "El estado del ticket fue actualizado.");
        await cargarTicket();
        desactivarModoEdicion();
    } catch (error) {
        console.error("Error al actualizar el estado:", error);
        mostrarError(error.message || "No se pudo actualizar el estado del ticket.");
    }
});

//===================== REPORTE TÉCNICO =====================

function renderizarReporte() {
    const t = ticketActual;

    if (t.descripcionFalla && t.descripcionSolucion) {
        cuerpoReporteTecnico.innerHTML = `
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
        cuerpoReporteTecnico.innerHTML = `
            <tr><td colspan="3" class="text-muted">Aún no se ha generado un reporte para este ticket.</td></tr>
        `;
        txtBotonReporte.textContent = "Agregar reporte";
        txtDescripcionFalla.value = "";
        txtDescripcionSolucion.value = "";
    }
}

frmReporteTicket?.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelectorAll("#frmReporteTicket .is-invalid").forEach((el) => el.classList.remove("is-invalid"));

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

    const { idUsuario } = obtenerSesion();

    try {
        await reportarTicket(idTicketActual, {
            descripcionFalla: datos.descripcionFalla.trim(),
            descripcionSolucion: datos.descripcionSolucion.trim()
        }, idUsuario);

        mostrarExitoSimple("¡Reporte guardado!", "El ticket pasó a estado 'Resuelto'.");
        await cargarTicket();

        const instancia = bootstrap.Modal.getInstance(modalReporteEl);
        if (instancia) instancia.hide();
    } catch (error) {
        console.error("Error al guardar el reporte:", error);
        mostrarError(error.message || "No se pudo guardar el reporte.");
    }
});

function escapeHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}
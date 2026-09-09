import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/sweetAlerts.js";
import {
    getTiposUbicacion,
    crearTipoUbicacion,
    actualizarTipoUbicacion,
    eliminarTipoUbicacion,
} from "../services/tipoUbicacionService.js";
import {
    getUbicaciones,
    crearUbicacion,
    actualizarUbicacion,
    eliminarUbicacion,
} from "../services/ubicacionesService.js";

document.addEventListener("DOMContentLoaded", async function () {
    const formTipoUbicacion = document.querySelector("#formTipoUbicacion");
    const formUbicacion = document.querySelector("#formUbicacion");
    const tablaTiposUbicacion = document.querySelector("#tablaTiposUbicacion");
    const tablaUbicaciones = document.querySelector("#tablaUbicaciones");
    const selectTipoUbicacion = document.querySelector("#selectTipoUbicacion");
    const tipoUbicacionId = document.querySelector("#tipoUbicacionId");
    const txtNombreTipoUbicacion = document.querySelector("#txtNombreTipoUbicacion");
    const tituloFormTipoUbicacion = document.querySelector("#tituloFormTipoUbicacion");
    const btnTextoTipoUbicacion = document.querySelector("#btnTextoTipoUbicacion");
    const btnCancelarTipoUbicacion = document.querySelector("#btnCancelarTipoUbicacion");
    const ubicacionId = document.querySelector("#ubicacionId");
    const txtNombreUbicacion = document.querySelector("#txtNombreUbicacion");
    const tituloFormUbicacion = document.querySelector("#tituloFormUbicacion");
    const btnTextoUbicacion = document.querySelector("#btnTextoUbicacion");
    const btnCancelarUbicacion = document.querySelector("#btnCancelarUbicacion");
    let tiposActuales = [];
    let ubicacionesActuales = [];

    // Promise.all actualiza tipos y ubicaciones al mismo tiempo. Esto también
    // renueva el select porque depende del catálogo de tipos.
    async function recargarTablasUbicaciones() {
        await Promise.all([cargarTiposUbicacion(), cargarUbicaciones()]);
    }

    // ===== TIPO DE UBICACIÓN =====

    async function cargarTiposUbicacion() {
        try {
            const tipos = await getTiposUbicacion();
            tiposActuales = tipos;
            pintarTablaTipos(tipos);
            pintarSelectTipos(tipos);
        } catch (error) {
            mostrarError("No se pudieron cargar los tipos de ubicación.", false);
        }
    }

    function pintarTablaTipos(tipos) {
        if (!tipos || tipos.length === 0) {
            tablaTiposUbicacion.innerHTML = `
                <tr><td colspan="2" class="text-center text-muted py-3">No hay tipos de ubicación registrados</td></tr>
            `;
            return;
        }

        tablaTiposUbicacion.innerHTML = tipos.map(tipo => `
            <tr>
                <td class="text-center fw-bold">${tipo.nombre_tipo_ubicacion}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary btn-editar-tipo" data-id="${tipo.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-link text-danger p-0 btn-eliminar-tipo" data-id="${tipo.id}">
                        <i class="bi bi-trash fs-5"></i>
                    </button>
                </td>
            </tr>
        `).join("");

        document.querySelectorAll(".btn-editar-tipo").forEach(boton => {
            boton.addEventListener("click", () => cargarTipoEnFormulario(boton.dataset.id));
        });
        document.querySelectorAll(".btn-eliminar-tipo").forEach(boton => {
            boton.addEventListener("click", () => confirmarEliminarTipo(boton.dataset.id));
        });
    }

    function cargarTipoEnFormulario(id) {
        const tipo = tiposActuales.find(item => item.id == id);
        if (!tipo) return;
        tipoUbicacionId.value = tipo.id;
        txtNombreTipoUbicacion.value = tipo.nombre_tipo_ubicacion;
        tituloFormTipoUbicacion.textContent = "Editar tipo de ubicación";
        btnTextoTipoUbicacion.textContent = "Actualizar tipo de ubicación";
        btnCancelarTipoUbicacion.classList.remove("d-none");
        txtNombreTipoUbicacion.focus();
    }

    function limpiarFormularioTipo() {
        formTipoUbicacion.reset();
        tipoUbicacionId.value = "";
        tituloFormTipoUbicacion.textContent = "Agregar tipo de ubicación";
        btnTextoTipoUbicacion.textContent = "Guardar tipo de ubicación";
        btnCancelarTipoUbicacion.classList.add("d-none");
    }

    btnCancelarTipoUbicacion.addEventListener("click", limpiarFormularioTipo);

    function pintarSelectTipos(tipos) {
        const valorSeleccionado = selectTipoUbicacion.value;
        const opcionPlaceholder = '<option selected disabled value="">Selecciona el tipo de ubicación...</option>';
        selectTipoUbicacion.innerHTML = opcionPlaceholder + tipos.map(tipo =>
            `<option value="${tipo.id}">${tipo.nombre_tipo_ubicacion}</option>`
        ).join("");
        if (tipos.some(tipo => tipo.id == valorSeleccionado)) {
            selectTipoUbicacion.value = valorSeleccionado;
        }
    }

    formTipoUbicacion.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const nombre = txtNombreTipoUbicacion.value.trim();
        const id = tipoUbicacionId.value;

        if (!nombre) {
            mostrarError("El nombre del tipo de ubicación es obligatorio.", false);
            return;
        }
        if (nombre.length > 50) {
            mostrarError("El nombre no puede superar los 50 caracteres.", false);
            return;
        }

        const nombreNormalizado = nombre.toLocaleLowerCase("es").replace(/\s+/g, " ");
        const tipoDuplicado = tiposActuales.some(tipo =>
            String(tipo.id) !== String(id) &&
            String(tipo.nombre_tipo_ubicacion).trim().toLocaleLowerCase("es").replace(/\s+/g, " ") === nombreNormalizado
        );
        if (tipoDuplicado) {
            mostrarError(`El tipo de ubicación '${nombre}' ya está registrado.`, false);
            return;
        }

        try {
            if (id) {
                await actualizarTipoUbicacion(id, nombre);
                mostrarExitoSimple("¡Listo!", "Tipo de ubicación actualizado correctamente.");
            } else {
                await crearTipoUbicacion(nombre);
                mostrarExitoSimple("¡Listo!", "Tipo de ubicación creado correctamente.");
            }
            limpiarFormularioTipo();
            await recargarTablasUbicaciones();
        } catch (error) {
            mostrarError(error.message || "No se pudo guardar el tipo de ubicación.", false);
        }
    });

    async function confirmarEliminarTipo(id) {
        const confirmado = await mostrarConfirmacion(
            "¿Eliminar este tipo de ubicación?",
            "Esta acción no se puede deshacer.",
            "Sí, eliminar"
        );
        if (!confirmado) return;

        try {
            await eliminarTipoUbicacion(id);
            mostrarExitoSimple("¡Listo!", "Tipo de ubicación eliminado.");
            await recargarTablasUbicaciones();
        } catch (error) {
            mostrarError("No se pudo eliminar. Puede que esté en uso por alguna ubicación.", false);
        }
    }

    // ===== UBICACIONES ESPECÍFICAS =====

    async function cargarUbicaciones() {
        try {
            const ubicaciones = await getUbicaciones();
            ubicacionesActuales = ubicaciones;
            pintarTablaUbicaciones(ubicaciones);
        } catch (error) {
            mostrarError("No se pudieron cargar las ubicaciones.", false);
        }
    }

    function pintarTablaUbicaciones(ubicaciones) {
        if (!ubicaciones || ubicaciones.length === 0) {
            tablaUbicaciones.innerHTML = `
                <tr><td colspan="3" class="text-center text-muted py-3">No hay ubicaciones registradas</td></tr>
            `;
            return;
        }

        tablaUbicaciones.innerHTML = ubicaciones.map(ubicacion => `
            <tr>
                <td class="text-center fw-bold">${ubicacion.nombreUbicacion}</td>
                <td class="text-center">${ubicacion.nombreTipoUbicacion}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary btn-editar-ubicacion" data-id="${ubicacion.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-link text-danger p-0 btn-eliminar-ubicacion" data-id="${ubicacion.id}">
                        <i class="bi bi-trash fs-5"></i>
                    </button>
                </td>
            </tr>
        `).join("");

        document.querySelectorAll(".btn-editar-ubicacion").forEach(boton => {
            boton.addEventListener("click", () => cargarUbicacionEnFormulario(boton.dataset.id));
        });
        document.querySelectorAll(".btn-eliminar-ubicacion").forEach(boton => {
            boton.addEventListener("click", () => confirmarEliminarUbicacion(boton.dataset.id));
        });
    }

    function cargarUbicacionEnFormulario(id) {
        const ubicacion = ubicacionesActuales.find(item => item.id == id);
        if (!ubicacion) return;
        ubicacionId.value = ubicacion.id;
        txtNombreUbicacion.value = ubicacion.nombreUbicacion;
        selectTipoUbicacion.value = ubicacion.idTipoUbicacion;
        tituloFormUbicacion.textContent = "Editar ubicación";
        btnTextoUbicacion.textContent = "Actualizar ubicación";
        btnCancelarUbicacion.classList.remove("d-none");
        txtNombreUbicacion.focus();
    }

    // Elimina el id oculto y restaura los textos de creación.
    function limpiarFormularioUbicacion() {
        formUbicacion.reset();
        ubicacionId.value = "";
        tituloFormUbicacion.textContent = "Agregar ubicación";
        btnTextoUbicacion.textContent = "Guardar ubicación";
        btnCancelarUbicacion.classList.add("d-none");
    }

    btnCancelarUbicacion.addEventListener("click", limpiarFormularioUbicacion);

    formUbicacion.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const nombre = txtNombreUbicacion.value.trim();
        const idTipoUbicacion = selectTipoUbicacion.value;
        const id = ubicacionId.value;

        if (!nombre) {
            mostrarError("El nombre de la ubicación es obligatorio.", false);
            return;
        }
        if (nombre.length > 50) {
            mostrarError("El nombre no puede superar los 50 caracteres.", false);
            return;
        }
        if (!idTipoUbicacion) {
            mostrarError("Selecciona un tipo de ubicación.", false);
            return;
        }

        const nombreNormalizado = nombre.toLocaleLowerCase("es").replace(/\s+/g, " ");
        const ubicacionDuplicada = ubicacionesActuales.some(ubicacion =>
            String(ubicacion.id) !== String(id) &&
            String(ubicacion.nombreUbicacion).trim().toLocaleLowerCase("es").replace(/\s+/g, " ") === nombreNormalizado
        );
        if (ubicacionDuplicada) {
            mostrarError(`La ubicación '${nombre}' ya está registrada.`, false);
            return;
        }

        try {
            if (id) {
                await actualizarUbicacion(id, nombre, Number(idTipoUbicacion));
                mostrarExitoSimple("¡Listo!", "Ubicación actualizada correctamente.");
            } else {
                await crearUbicacion(nombre, Number(idTipoUbicacion));
                mostrarExitoSimple("¡Listo!", "Ubicación creada correctamente.");
            }
            limpiarFormularioUbicacion();
            await recargarTablasUbicaciones();
        } catch (error) {
            mostrarError(error.message || "No se pudo guardar la ubicación.", false);
        }
    });

    async function confirmarEliminarUbicacion(id) {
        const confirmado = await mostrarConfirmacion(
            "¿Eliminar esta ubicación?",
            "Esta acción no se puede deshacer.",
            "Sí, eliminar"
        );
        if (!confirmado) return;

        try {
            await eliminarUbicacion(id);
            mostrarExitoSimple("¡Listo!", "Ubicación eliminada.");
            await recargarTablasUbicaciones();
        } catch (error) {
            mostrarError("No se pudo eliminar. Puede que esté en uso por algún artículo.", false);
        }
    }

    await recargarTablasUbicaciones();
});

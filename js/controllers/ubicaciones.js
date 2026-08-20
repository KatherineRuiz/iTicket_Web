import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/sweetAlerts.js";
import {
    getTiposUbicacion,
    crearTipoUbicacion,
    eliminarTipoUbicacion,
} from "../services/tipoUbicacionService.js";
import {
    getUbicaciones,
    crearUbicacion,
    eliminarUbicacion,
} from "../services/ubicacionesService.js";

document.addEventListener("DOMContentLoaded", async function () {
    const formTipoUbicacion = document.querySelector("#formTipoUbicacion");
    const formUbicacion = document.querySelector("#formUbicacion");
    const tablaTiposUbicacion = document.querySelector("#tablaTiposUbicacion");
    const tablaUbicaciones = document.querySelector("#tablaUbicaciones");
    const selectTipoUbicacion = document.querySelector("#selectTipoUbicacion");

    // Carga inicial: solo lo que la pantalla necesita mostrar de entrada.
    // No se piden detalles extra hasta que el usuario los necesite (crear/editar).
    await cargarTiposUbicacion();
    await cargarUbicaciones();

    // ===== TIPO DE UBICACIÓN =====

    async function cargarTiposUbicacion() {
        try {
            const tipos = await getTiposUbicacion();
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
                    <button class="btn btn-link text-danger p-0 btn-eliminar-tipo" data-id="${tipo.id}">
                        <i class="bi bi-trash fs-5"></i>
                    </button>
                </td>
            </tr>
        `).join("");

        document.querySelectorAll(".btn-eliminar-tipo").forEach(boton => {
            boton.addEventListener("click", () => confirmarEliminarTipo(boton.dataset.id));
        });
    }

    function pintarSelectTipos(tipos) {
        const opcionPlaceholder = '<option selected disabled value="">Selecciona el tipo de ubicación...</option>';
        selectTipoUbicacion.innerHTML = opcionPlaceholder + tipos.map(tipo =>
            `<option value="${tipo.id}">${tipo.nombre_tipo_ubicacion}</option>`
        ).join("");
    }

    formTipoUbicacion.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const nombre = document.querySelector("#txtNombreTipoUbicacion").value.trim();

        if (!nombre) {
            mostrarError("El nombre del tipo de ubicación es obligatorio.", false);
            return;
        }
        if (nombre.length > 50) {
            mostrarError("El nombre no puede superar los 50 caracteres.", false);
            return;
        }

        try {
            await crearTipoUbicacion(nombre);
            mostrarExitoSimple("¡Listo!", "Tipo de ubicación creado correctamente.");
            formTipoUbicacion.reset();
            await cargarTiposUbicacion();
        } catch (error) {
            mostrarError(error.message || "No se pudo crear el tipo de ubicación.", false);
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
            await cargarTiposUbicacion();
            await cargarUbicaciones(); // por si alguna ubicación dependía de este tipo
        } catch (error) {
            mostrarError("No se pudo eliminar. Puede que esté en uso por alguna ubicación.", false);
        }
    }

    // ===== UBICACIONES ESPECÍFICAS =====

    async function cargarUbicaciones() {
        try {
            const ubicaciones = await getUbicaciones();
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
                    <button class="btn btn-link text-danger p-0 btn-eliminar-ubicacion" data-id="${ubicacion.id}">
                        <i class="bi bi-trash fs-5"></i>
                    </button>
                </td>
            </tr>
        `).join("");

        document.querySelectorAll(".btn-eliminar-ubicacion").forEach(boton => {
            boton.addEventListener("click", () => confirmarEliminarUbicacion(boton.dataset.id));
        });
    }

    formUbicacion.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const nombre = document.querySelector("#txtNombreUbicacion").value.trim();
        const idTipoUbicacion = selectTipoUbicacion.value;

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

        try {
            await crearUbicacion(nombre, Number(idTipoUbicacion));
            mostrarExitoSimple("¡Listo!", "Ubicación creada correctamente.");
            formUbicacion.reset();
            await cargarUbicaciones();
        } catch (error) {
            mostrarError(error.message || "No se pudo crear la ubicación.", false);
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
            await cargarUbicaciones();
        } catch (error) {
            mostrarError("No se pudo eliminar. Puede que esté en uso por algún artículo.", false);
        }
    }
});
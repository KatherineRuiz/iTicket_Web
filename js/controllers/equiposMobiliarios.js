import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/sweetAlerts.js";
import { getCategorias, crearCategoria, eliminarCategoria } from "../services/categoriasService.js";
import { getMarcas, crearMarca, eliminarMarca } from "../services/marcasService.js";
import { getModelos, crearModelo, eliminarModelo } from "../services/modelosService.js";
import { getUbicaciones } from "../services/ubicacionesService.js";
import { getArticulosPaginados, crearArticulo, actualizarArticulo, eliminarArticulo } from "../services/articulosService.js";

document.addEventListener("DOMContentLoaded", async function () {

    // ===== ESTADO DE LA TABLA PRINCIPAL =====
    let paginaActual = 1;
    const TAMANO_PAGINA = 10;
    let filtroBusqueda = "";
    let filtroCategoria = "";
    let filtroUbicacion = "";
    let temporizadorBusqueda = null;

    // Después de cualquier CRUD se actualizan en paralelo la tabla principal y todo lo que pudo haber cambiado
    async function recargarTablasEquipos() {
        await Promise.all([
            cargarArticulos(),
            cargarFiltros(),
            cargarCategorias(),
            cargarMarcas(),
            cargarModelos(),
            cargarSelectMarcas(),
            cargarSelectsArticulo(),
        ]);
    }

    const tablaArticulos = document.querySelector("#tablaArticulos");
    const txtTotalRegistros = document.querySelector("#txtTotalRegistros");
    const txtResumenPaginacion = document.querySelector("#txtResumenPaginacion");
    const controlesPaginacion = document.querySelector("#controlesPaginacion");
    const txtBuscarArticulo = document.querySelector("#txtBuscarArticulo");
    const selectFiltroCategoria = document.querySelector("#selectFiltroCategoria");
    const selectFiltroUbicacion = document.querySelector("#selectFiltroUbicacion");

    // Carga inicial: solo la tabla principal y los selects de filtro.
    // Categorías, Marcas, Modelos "de gestión" NO se piden aquí -- se piden
    // solo cuando el usuario abre el modal correspondiente (carga bajo demanda real).
    // ===== TABLA PRINCIPAL DE ARTÍCULOS =====

    async function cargarArticulos() {
        try {
            const resultado = await getArticulosPaginados(paginaActual, TAMANO_PAGINA, {
                busqueda: filtroBusqueda,
                idCategoria: filtroCategoria,
                idUbicacion: filtroUbicacion,
            });
            pintarTablaArticulos(resultado.articulos);
            pintarResumen(resultado);
            pintarPaginacion(resultado);
        } catch (error) {
            mostrarError("No se pudieron cargar los artículos.", false);
        }
    }

    function pintarTablaArticulos(articulos) {
        if (!articulos || articulos.length === 0) {
            tablaArticulos.innerHTML = `
                <tr><td colspan="6" class="text-center text-muted py-3">No se encontraron artículos</td></tr>
            `;
            return;
        }

        tablaArticulos.innerHTML = articulos.map(articulo => `
            <tr>
                <td class="fw-bold">${articulo.codigoArticulo}</td>
                <td>${articulo.nombreModelo ?? "—"}</td>
                <td>
                    <span class="categoria-celda">
                        <i class="bi bi-tag me-1 text-success"></i> ${articulo.nombreCategoria}
                    </span>
                </td>
                <td>${articulo.nombreUbicacion}</td>
                <td>${articulo.nombreMarca ?? "—"}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary btn-editar-articulo" data-id="${articulo.idArticulo}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-link text-danger p-0 btn-eliminar-articulo" data-id="${articulo.idArticulo}">
                        <i class="bi bi-trash fs-5"></i>
                    </button>
                </td>
            </tr>
        `).join("");

        document.querySelectorAll(".btn-editar-articulo").forEach(boton => {
            boton.addEventListener("click", () => {
                const articulo = articulos.find(item => item.idArticulo == boton.dataset.id);
                if (articulo) abrirEdicionArticulo(articulo);
            });
        });
        document.querySelectorAll(".btn-eliminar-articulo").forEach(boton => {
            boton.addEventListener("click", () => confirmarEliminarArticulo(boton.dataset.id));
        });
    }

    function pintarResumen(resultado) {
        const inicio = resultado.articulos.length === 0 ? 0 : (paginaActual - 1) * TAMANO_PAGINA + 1;
        const fin = (paginaActual - 1) * TAMANO_PAGINA + resultado.articulos.length;
        txtResumenPaginacion.textContent = `Mostrando ${inicio}-${fin} de ${resultado.totalElementos}`;
        txtTotalRegistros.textContent = resultado.totalElementos;
    }

    function pintarPaginacion(resultado) {
        const totalPaginas = resultado.totalPaginas;
        controlesPaginacion.innerHTML = "";

        if (totalPaginas <= 1) return;

        const crearBoton = (texto, pagina, deshabilitado = false, activo = false) => `
            <li class="page-item ${deshabilitado ? "disabled" : ""}">
                <a class="page-link border-0 bg-transparent ${activo ? "fw-bold text-primary" : "text-dark"}"
                   href="#" data-pagina="${pagina}">${texto}</a>
            </li>
        `;

        let html = crearBoton('<i class="bi bi-chevron-left"></i>', paginaActual - 1, paginaActual === 1);

        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || Math.abs(i - paginaActual) <= 1) {
                html += crearBoton(i, i, false, i === paginaActual);
            } else if (i === 2 || i === totalPaginas - 1) {
                html += `<li class="page-item"><span class="mx-1 text-muted">...</span></li>`;
            }
        }

        html += crearBoton('<i class="bi bi-chevron-right"></i>', paginaActual + 1, paginaActual === totalPaginas);

        controlesPaginacion.innerHTML = html;

        controlesPaginacion.querySelectorAll("a[data-pagina]").forEach(enlace => {
            enlace.addEventListener("click", async (evento) => {
                evento.preventDefault();
                const nuevaPagina = Number(enlace.dataset.pagina);
                if (nuevaPagina < 1 || nuevaPagina > totalPaginas || nuevaPagina === paginaActual) return;
                paginaActual = nuevaPagina;
                await cargarArticulos();
            });
        });
    }

    async function confirmarEliminarArticulo(id) {
        const confirmado = await mostrarConfirmacion(
            "¿Eliminar este artículo?",
            "Esta acción no se puede deshacer.",
            "Sí, eliminar"
        );
        if (!confirmado) return;

        try {
            await eliminarArticulo(id);
            mostrarExitoSimple("¡Listo!", "Artículo eliminado.");
            await recargarTablasEquipos();
        } catch (error) {
            mostrarError("No se pudo eliminar el artículo.", false);
        }
    }

    // Búsqueda con debounce: espera a que el usuario deje de escribir 400ms
    // antes de consultar la API, en vez de hacer una petición por cada tecla.
    txtBuscarArticulo.addEventListener("input", () => {
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(async () => {
            filtroBusqueda = txtBuscarArticulo.value.trim();
            paginaActual = 1;
            await cargarArticulos();
        }, 400);
    });

    selectFiltroCategoria.addEventListener("change", async () => {
        filtroCategoria = selectFiltroCategoria.value;
        paginaActual = 1;
        await cargarArticulos();
    });

    selectFiltroUbicacion.addEventListener("change", async () => {
        filtroUbicacion = selectFiltroUbicacion.value;
        paginaActual = 1;
        await cargarArticulos();
    });

    // Los selects de filtro sí se cargan de una vez (son pocos registros y
    // el usuario los necesita disponibles desde que entra a la pantalla).
    async function cargarFiltros() {
        try {
            const [categorias, ubicaciones] = await Promise.all([getCategorias(), getUbicaciones()]);

            selectFiltroCategoria.innerHTML = '<option value="">Todas</option>' +
                categorias.map(c => `<option value="${c.idCategoria}">${c.nombreCategoria}</option>`).join("");
            if (categorias.some(c => c.idCategoria == filtroCategoria)) {
                selectFiltroCategoria.value = filtroCategoria;
            }

            selectFiltroUbicacion.innerHTML = '<option value="">Todas</option>' +
                ubicaciones.map(u => `<option value="${u.id}">${u.nombreUbicacion}</option>`).join("");
            if (ubicaciones.some(u => u.id == filtroUbicacion)) {
                selectFiltroUbicacion.value = filtroUbicacion;
            }
        } catch (error) {
            mostrarError("No se pudieron cargar los filtros.", false);
        }
    }

    // ===== MODAL: GESTIONAR CATEGORÍAS (carga bajo demanda) =====

    const modalCategoria = document.querySelector("#modalAgregarCategoria");
    const formCategoria = document.querySelector("#formCategoria");
    const tablaCategorias = document.querySelector("#tablaCategorias");

    modalCategoria.addEventListener("shown.bs.modal", cargarCategorias);

    async function cargarCategorias() {
        try {
            const categorias = await getCategorias();
            pintarTablaCategorias(categorias);
        } catch (error) {
            mostrarError("No se pudieron cargar las categorías.", false);
        }
    }

    function pintarTablaCategorias(categorias) {
        if (!categorias || categorias.length === 0) {
            tablaCategorias.innerHTML = `<tr><td colspan="2" class="text-center text-muted py-3">No hay categorías registradas</td></tr>`;
            return;
        }
        tablaCategorias.innerHTML = categorias.map(c => `
            <tr>
                <td class="text-center">${c.nombreCategoria}</td>
                <td class="text-center">
                    <button class="btn btn-link text-danger p-0 btn-eliminar-categoria" data-id="${c.idCategoria}">
                        <i class="bi bi-trash fs-5"></i>
                    </button>
                </td>
            </tr>
        `).join("");

        document.querySelectorAll(".btn-eliminar-categoria").forEach(boton => {
            boton.addEventListener("click", async () => {
                const confirmado = await mostrarConfirmacion("¿Eliminar esta categoría?", "Esta acción no se puede deshacer.", "Sí, eliminar");
                if (!confirmado) return;
                try {
                    await eliminarCategoria(boton.dataset.id);
                    mostrarExitoSimple("¡Listo!", "Categoría eliminada.");
                    await recargarTablasEquipos();
                } catch (error) {
                    mostrarError("No se pudo eliminar. Puede que esté en uso por algún artículo.", false);
                }
            });
        });
    }

    formCategoria.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        const nombre = document.querySelector("#txtNombreCategoria").value.trim();

        if (!nombre) return mostrarError("El nombre de la categoría es obligatorio.", false);
        if (nombre.length > 50) return mostrarError("El nombre no puede superar los 50 caracteres.", false);

        try {
            await crearCategoria(nombre);
            mostrarExitoSimple("¡Listo!", "Categoría creada correctamente.");
            formCategoria.reset();
            await recargarTablasEquipos();
        } catch (error) {
            mostrarError(error.message || "No se pudo crear la categoría.", false);
        }
    });

    // ===== MODAL: GESTIONAR MARCAS (carga bajo demanda) =====

    const modalMarca = document.querySelector("#modalAgregarMarca");
    const formMarca = document.querySelector("#formMarca");
    const tablaMarcas = document.querySelector("#tablaMarcas");

    modalMarca.addEventListener("shown.bs.modal", cargarMarcas);

    async function cargarMarcas() {
        try {
            const marcas = await getMarcas();
            pintarTablaMarcas(marcas);
        } catch (error) {
            mostrarError("No se pudieron cargar las marcas.", false);
        }
    }

    function pintarTablaMarcas(marcas) {
        if (!marcas || marcas.length === 0) {
            tablaMarcas.innerHTML = `<tr><td colspan="2" class="text-center text-muted py-3">No hay marcas registradas</td></tr>`;
            return;
        }
        tablaMarcas.innerHTML = marcas.map(m => `
            <tr>
                <td class="text-center">${m.nombreMarca}</td>
                <td class="text-center">
                    <button class="btn btn-link text-danger p-0 btn-eliminar-marca" data-id="${m.idMarca}">
                        <i class="bi bi-trash fs-5"></i>
                    </button>
                </td>
            </tr>
        `).join("");

        document.querySelectorAll(".btn-eliminar-marca").forEach(boton => {
            boton.addEventListener("click", async () => {
                const confirmado = await mostrarConfirmacion("¿Eliminar esta marca?", "Esta acción no se puede deshacer.", "Sí, eliminar");
                if (!confirmado) return;
                try {
                    await eliminarMarca(boton.dataset.id);
                    mostrarExitoSimple("¡Listo!", "Marca eliminada.");
                    await recargarTablasEquipos();
                } catch (error) {
                    mostrarError("No se pudo eliminar. Puede que esté en uso por algún modelo.", false);
                }
            });
        });
    }

    formMarca.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        const nombre = document.querySelector("#txtNombreMarca").value.trim();

        if (!nombre) return mostrarError("El nombre de la marca es obligatorio.", false);
        if (nombre.length > 50) return mostrarError("El nombre no puede superar los 50 caracteres.", false);

        try {
            await crearMarca(nombre);
            mostrarExitoSimple("¡Listo!", "Marca creada correctamente.");
            formMarca.reset();
            await recargarTablasEquipos();
        } catch (error) {
            mostrarError(error.message || "No se pudo crear la marca.", false);
        }
    });

    // ===== MODAL: GESTIONAR MODELOS (carga bajo demanda) =====

    const modalModelo = document.querySelector("#modalAgregarModelos");
    const formModelo = document.querySelector("#formModelo");
    const tablaModelos = document.querySelector("#tablaModelos");
    const selectMarcaModelo = document.querySelector("#selectMarcaModelo");

    modalModelo.addEventListener("shown.bs.modal", async () => {
        await Promise.all([cargarModelos(), cargarSelectMarcas()]);
    });

    async function cargarModelos() {
        try {
            const modelos = await getModelos();
            pintarTablaModelos(modelos);
        } catch (error) {
            mostrarError("No se pudieron cargar los modelos.", false);
        }
    }

    async function cargarSelectMarcas() {
        try {
            const marcas = await getMarcas();
            selectMarcaModelo.innerHTML = '<option selected disabled value="">Selecciona la marca...</option>' +
                marcas.map(m => `<option value="${m.idMarca}">${m.nombreMarca}</option>`).join("");
        } catch (error) {
            mostrarError("No se pudieron cargar las marcas.", false);
        }
    }

    function pintarTablaModelos(modelos) {
        if (!modelos || modelos.length === 0) {
            tablaModelos.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">No hay modelos registrados</td></tr>`;
            return;
        }
        tablaModelos.innerHTML = modelos.map(m => `
            <tr>
                <td class="text-center">${m.nombreModelo}</td>
                <td class="text-center">${m.nombreMarca}</td>
                <td class="text-center">
                    <button class="btn btn-link text-danger p-0 btn-eliminar-modelo" data-id="${m.idModelo}">
                        <i class="bi bi-trash fs-5"></i>
                    </button>
                </td>
            </tr>
        `).join("");

        document.querySelectorAll(".btn-eliminar-modelo").forEach(boton => {
            boton.addEventListener("click", async () => {
                const confirmado = await mostrarConfirmacion("¿Eliminar este modelo?", "Esta acción no se puede deshacer.", "Sí, eliminar");
                if (!confirmado) return;
                try {
                    await eliminarModelo(boton.dataset.id);
                    mostrarExitoSimple("¡Listo!", "Modelo eliminado.");
                    await recargarTablasEquipos();
                } catch (error) {
                    mostrarError("No se pudo eliminar. Puede que esté en uso por algún artículo.", false);
                }
            });
        });
    }

    formModelo.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        const nombre = document.querySelector("#txtNombreModelo").value.trim();
        const idMarca = selectMarcaModelo.value;

        if (!nombre) return mostrarError("El nombre del modelo es obligatorio.", false);
        if (nombre.length > 50) return mostrarError("El nombre no puede superar los 50 caracteres.", false);
        if (!idMarca) return mostrarError("Selecciona una marca.", false);

        try {
            await crearModelo(nombre, Number(idMarca));
            mostrarExitoSimple("¡Listo!", "Modelo creado correctamente.");
            formModelo.reset();
            await recargarTablasEquipos();
        } catch (error) {
            mostrarError(error.message || "No se pudo crear el modelo.", false);
        }
    });

    // ===== MODAL: GESTIONAR ARTÍCULOS (carga bajo demanda) =====

    const modalArticulo = document.querySelector("#modalAgregarArticulos");
    const formArticulo = document.querySelector("#formArticulo");
    const selectCategoriaArticulo = document.querySelector("#selectCategoriaArticulo");
    const selectUbicacionArticulo = document.querySelector("#selectUbicacionArticulo");
    const selectModeloArticulo = document.querySelector("#selectModeloArticulo");
    const articuloId = document.querySelector("#articuloId");
    const txtCodigoArticulo = document.querySelector("#txtCodigoArticulo");
    const tituloFormArticulo = document.querySelector("#tituloFormArticulo");
    const btnTextoArticulo = document.querySelector("#btnTextoArticulo");
    const btnCancelarArticulo = document.querySelector("#btnCancelarArticulo");
    let articuloPendienteEdicion = null;

    // Guarda temporalmente el registro porque los selectores se cargan cuando
    // Bootstrap termina de abrir el modal.
    function abrirEdicionArticulo(articulo) {
        articuloPendienteEdicion = articulo;
        bootstrap.Modal.getOrCreateInstance(modalArticulo).show();
    }

    // Aplica el registro pendiente después de que existan todas sus opciones.
    function cargarArticuloEnFormulario(articulo) {
        articuloId.value = articulo.idArticulo;
        txtCodigoArticulo.value = articulo.codigoArticulo;
        selectCategoriaArticulo.value = articulo.idCategoria;
        selectUbicacionArticulo.value = articulo.idUbicacion;
        selectModeloArticulo.value = articulo.idModelo ?? "";
        tituloFormArticulo.textContent = "Editar artículo";
        btnTextoArticulo.textContent = "Actualizar artículo";
        btnCancelarArticulo.classList.remove("d-none");
        txtCodigoArticulo.focus();
    }

    // Devuelve el modal al modo creación y descarta cualquier edición pendiente.
    function limpiarFormularioArticulo() {
        formArticulo.reset();
        articuloId.value = "";
        articuloPendienteEdicion = null;
        tituloFormArticulo.textContent = "Agregar artículo";
        btnTextoArticulo.textContent = "Guardar artículo";
        btnCancelarArticulo.classList.add("d-none");
    }

    btnCancelarArticulo.addEventListener("click", limpiarFormularioArticulo);
    modalArticulo.addEventListener("hidden.bs.modal", limpiarFormularioArticulo);

    // Consulta de nuevo los tres catálogos y reconstruye los dropdowns del
    // artículo. Se usa tanto al abrir el modal como después de cualquier CRUD.
    async function cargarSelectsArticulo() {
        try {
            const [categorias, ubicaciones, modelos] = await Promise.all([getCategorias(), getUbicaciones(), getModelos()]);

            selectCategoriaArticulo.innerHTML = '<option selected disabled value="">Selecciona la categoría...</option>' +
                categorias.map(c => `<option value="${c.idCategoria}">${c.nombreCategoria}</option>`).join("");

            selectUbicacionArticulo.innerHTML = '<option selected disabled value="">Selecciona la ubicación...</option>' +
                ubicaciones.map(u => `<option value="${u.id}">${u.nombreUbicacion}</option>`).join("");

            selectModeloArticulo.innerHTML = '<option selected value="">Sin modelo asignado</option>' +
                modelos.map(m => `<option value="${m.idModelo}">${m.nombreMarca} - ${m.nombreModelo}</option>`).join("");

            if (articuloPendienteEdicion) cargarArticuloEnFormulario(articuloPendienteEdicion);
        } catch (error) {
            mostrarError("No se pudieron cargar los datos del formulario.", false);
        }
    }

    modalArticulo.addEventListener("shown.bs.modal", async () => {
        await cargarSelectsArticulo();
    });

    formArticulo.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        const codigo = txtCodigoArticulo.value.trim();
        const idCategoria = selectCategoriaArticulo.value;
        const idUbicacion = selectUbicacionArticulo.value;
        const idModelo = selectModeloArticulo.value;
        const id = articuloId.value;

        if (!codigo) return mostrarError("El código del artículo es obligatorio.", false);
        if (codigo.length > 20) return mostrarError("El código no puede superar los 20 caracteres.", false);
        if (!idCategoria) return mostrarError("Selecciona una categoría.", false);
        if (!idUbicacion) return mostrarError("Selecciona una ubicación.", false);

        try {
            if (id) {
                await actualizarArticulo(id, codigo, Number(idCategoria), Number(idUbicacion), idModelo ? Number(idModelo) : null);
                mostrarExitoSimple("¡Listo!", "Artículo actualizado correctamente.");
            } else {
                await crearArticulo(codigo, Number(idCategoria), Number(idUbicacion), idModelo ? Number(idModelo) : null);
                mostrarExitoSimple("¡Listo!", "Artículo creado correctamente.");
                paginaActual = 1;
            }
            limpiarFormularioArticulo();
            await recargarTablasEquipos();

            const instanciaModal = bootstrap.Modal.getInstance(modalArticulo);
            instanciaModal.hide();
        } catch (error) {
            mostrarError(error.message || "No se pudo guardar el artículo.", false);
        }
    });

    await cargarArticulos();
    await cargarFiltros();
});

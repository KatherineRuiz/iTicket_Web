import { getProyecto, actualizarProyecto, eliminarProyecto } from "../services/proyectosService.js";
import { getFases, getFasesPorProyecto, getNombreFase, crearFase, actualizarFase, eliminarFase } from "../services/faseService.js";
import { getDetallesFase, getDetallesFasePorFase, crearDetalleFase, actualizarDetalleFase, eliminarDetalleFase } from "../services/detalleFaseService.js";
import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/sweetAlerts.js";
import { getUsuarios } from "../services/usuariosService.js";
import { validarFormularioProyecto } from "../validators/proyectosValidator.js";
import { validarFormularioFase } from "../validators/fasesValidators.js";
import { validarFormularioDetalleFase } from "../validators/detalleFaseValidator.js";


//si no existe un proyecto creado en la Api, se redirige a la pagina de proyectos
//porque no se puede mostrar la vista de un proyecto inexistente.
const parametros = new URLSearchParams(window.location.search);
const idProyecto = parametros.get('id');

if (!idProyecto) {
    mostrarError("No se especificó ningún proyecto.");
    window.location.href = "proyectos.html";
} else {
    document.addEventListener('DOMContentLoaded', () => {
        inicializarVistaProyecto(idProyecto);
    });
}

async function inicializarVistaProyecto(id) {

    //Se obtiene el proyecto desde la API y en caso de no existir, se redirige a la página de proyectos con un mensaje de error.
    let proyecto;
    try {
        proyecto = await getProyecto(id);
    } catch (error) {
        mostrarError("El proyecto solicitado no existe o no se pudo cargar.");
        window.location.href = "proyectos.html";
        return;
    }

    //Solo se piden los usuarios una vez y luego quedan en caché
    //Se usan para resolver coordinador/supervisor por correo en el formulario de edición
    let usuariosCache = null;
    let cargandoUsuarios = null;

    function obtenerUsuarios() {
        if (usuariosCache) return Promise.resolve(usuariosCache);
        if (!cargandoUsuarios) {
            cargandoUsuarios = getUsuarios()
                .then((usuarios) => { usuariosCache = usuarios; return usuariosCache; })
                .finally(() => { cargandoUsuarios = null; });
        }
        return cargandoUsuarios;
    }

    let fases = [];
    let idFaseContador = 1;
    let idDetalleContador = 1;
    let faseSeleccionadaId = null;
    let faseEnEdicionId = null;

    // Referencias del DOM
    const selectFase = document.getElementById('selectFase');
    const tarjetaFase = document.getElementById('tarjetaFaseSeleccionada');
    const listaDetalleVista = document.getElementById('listaDetalleFaseVista');

    const formAgregarFase = document.getElementById('formAgregarFase');
    const formAgregarDetalle = document.getElementById('formAgregarDetalle');
    const formEditarDetalle = document.getElementById('formEditarDetalle');
    const txtBotonGuardarFase = document.getElementById('txtBotonGuardarFase');

    const modoVistaProyecto = document.getElementById('modoVistaProyecto');
    const modoEdicionProyecto = document.getElementById('modoEdicionProyecto');
    const btnEditarProyecto = document.getElementById('btnEditarProyecto');
    const btnCancelarEdicionProyecto = document.getElementById('btnCancelarEdicionProyecto');

    const btnCrearFase = document.getElementById('btnCrearFase');
    const btnEditarFase = document.getElementById('btnEditarFase');
    const btnEliminarFase = document.getElementById('btnEliminarFase');
    const btnAgregarDetalle = document.getElementById('btnAgregarDetalle');
    const btnEditarDetalle = document.getElementById('btnEditarDetalle');
    const btnEliminarDetalle = document.getElementById('btnEliminarDetalle');
    const modalFasesProyecto = document.getElementById('modalFasesProyecto');
    const modalDetalleFase = document.getElementById('modalDetalleFase');
    const btnEliminarProyecto = document.getElementById('btnEliminarProyecto');
    // Utilidades
    function obtenerFasePorId(id) {
        return fases.find((f) => f.id === id);
    }

    //Pinta en pantalla los datos del proyecto que se trajo de la API
    function pintarDatosProyecto() {
        document.getElementById('txtNombreProyecto').textContent = proyecto.nombreProyecto;
        document.getElementById('txtUbicacionProyecto').textContent = proyecto.ubicacion;
        document.getElementById('txtTipoProyecto').textContent = proyecto.tipoProyecto;
        document.getElementById('txtCoordinadorProyecto').textContent = proyecto.nombreCoordinador;
        document.getElementById('txtSupervisorProyecto').textContent = proyecto.nombreSupervisor;
        document.getElementById('txtPresupuestoProyecto').textContent = Number(proyecto.presupuestoEstimado || 0).toFixed(2);
        document.getElementById('txtTotalProyecto').textContent = Number(proyecto.gastoTotal || 0).toFixed(2);
        document.getElementById('txtEstadoProyecto').textContent = proyecto.finalizado ? "Finalizado" : "En progreso";
    }

    function renderSelectFases() {
        selectFase.innerHTML = '<option value="">Selecciona una fase</option>';
        fases.forEach((f) => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.nombreFase;
            if (f.id === faseSeleccionadaId) opt.selected = true;
            selectFase.appendChild(opt);
        });
    }

    function renderTarjetaFase() {
        const fase = obtenerFasePorId(faseSeleccionadaId);
        if (!fase) {
            tarjetaFase.innerHTML =
                '<p class="text-muted mb-0">Selecciona o crea una fase para ver su información.</p>';
            return;
        }
        tarjetaFase.innerHTML = `
      <h6 class="text-navy fw-bold mb-3">${fase.nombreFase}</h6>
      <p class="meta-proyecto mb-1"><b>Departamento encargado:</b> ${fase.departamentoEncargado}</p>
      <p class="meta-proyecto mb-1"><b>Descripción:</b> ${fase.faseDescripcion}</p>
      <p class="meta-proyecto mb-1"><b>Inicio estimado:</b> ${fase.fechaInicioEstimada || '—'}</p>
      <p class="meta-proyecto mb-1"><b>Final estimado:</b> ${fase.fechaFinalEstimada || '—'}</p>
      <p class="meta-proyecto mb-1"><b>Proveedor:</b> ${fase.nombreProveedor || 'N/A'}</p>
      <p class="meta-proyecto mb-0"><b>Presupuesto estimado:</b> $${Number(fase.presupuestoEstimado).toFixed(2)}</p>
    `;
    }

    function normalizarDetalle(detalle) {
        if (!detalle) return null;

        const id = detalle.idDetalleFase ?? detalle.idDetalle ?? detalle.id ?? detalle.detalleId;
        const descripcion = detalle.descripcionDetalle ?? detalle.texto ?? detalle.descripcion ?? detalle.nombreDetalle ?? 'Detalle sin descripción';
        const completado = Boolean(detalle.completado ?? detalle.finalizado ?? false);
        const faseId = detalle.fase ?? detalle.idFase ?? detalle.faseId ?? detalle.fase?.id ?? detalle.fase?.idFase;

        return {
            id: id ?? Date.now(),
            descripcionDetalle: descripcion,
            texto: descripcion,
            completado,
            fase: faseId
        };
    }

    function renderListaDetalles() {
        const fase = obtenerFasePorId(faseSeleccionadaId);
        listaDetalleVista.innerHTML = '';
        listaDetalleVista.classList.remove('modo-edicion');

        if (!fase) {
            listaDetalleVista.innerHTML =
                '<li class="text-muted">Selecciona una fase para ver sus detalles.</li>';
            return;
        }

        const detalles = Array.isArray(fase.detalles) ? fase.detalles : [];
        if (detalles.length === 0) {
            listaDetalleVista.innerHTML =
                '<li class="text-muted">Esta fase aún no tiene detalles.</li>';
            return;
        }

        detalles.forEach((d) => {
            const detalle = normalizarDetalle(d);
            const li = document.createElement('li');
            li.className = 'd-flex align-items-center justify-content-between gap-2 py-2 border-bottom';
            li.innerHTML = `
        <div class="d-flex align-items-center gap-2 flex-grow-1">
            <input type="checkbox" class="form-check-input" data-id-detalle="${detalle.id}" ${detalle.completado ? 'checked' : ''}>
            <span class="${detalle.completado ? 'text-decoration-line-through text-muted' : ''}">${detalle.descripcionDetalle}</span>
        </div>
        <i class="bi bi-trash btnEliminarDetalle" data-id-detalle="${detalle.id}" title="Eliminar"></i>
      `;

            listaDetalleVista.appendChild(li);
        });
    }

    async function cargarDetallesDeFase(idFase) {
        const fase = obtenerFasePorId(idFase);
        if (!fase) return;

        try {
            const respuesta = await getDetallesFasePorFase(idFase);
            const detallesApi = Array.isArray(respuesta)
                ? respuesta
                : Array.isArray(respuesta?.data)
                    ? respuesta.data
                    : [];

            fase.detalles = detallesApi
                .map(normalizarDetalle)
                .filter(Boolean)
                .filter((detalle) => {
                    const ids = [detalle?.fase, detalle?.idFase, detalle?.faseId];
                    return ids.some((valor) => Number(valor) === Number(idFase));
                });
        } catch (error) {
            console.error('No se pudieron cargar los detalles de la fase:', error);
            fase.detalles = [];
        }

        renderListaDetalles();
    }

    function seleccionarFase(id) {
        faseSeleccionadaId = id ? Number(id) : null;
        renderTarjetaFase();
        renderListaDetalles();

        if (faseSeleccionadaId) {
            cargarDetallesDeFase(faseSeleccionadaId);
        }
    }

    //Carga los datos actuales del proyecto en el formulario de edición.
    async function cargarFormularioProyecto() {
        document.getElementById('txtNombreProyectoEdicion').value = proyecto.nombreProyecto;
        document.getElementById('txtUbicacionProyectoEdicion').value = proyecto.ubicacion;
        document.getElementById('txtTipoProyectoEdicion').value = proyecto.tipoProyecto;
        document.getElementById('txtDescripcionProyectoEdicion').value = proyecto.descripcionProyecto;
        document.getElementById('selectEstadoProyectoEdicion').value = proyecto.finalizado ? "Finalizado" : "En progreso";
        document.getElementById('numPresupuestoProyectoEdicion').value = proyecto.presupuestoEstimado;
        document.getElementById('numTotalProyectoEdicion').value = proyecto.gastoTotal;

        try {
            const usuarios = await obtenerUsuarios();
            const coordinador = usuarios.find(u => u.idUsuario === proyecto.coordinador);
            const supervisor = usuarios.find(u => u.idUsuario === proyecto.supervisor);
            document.getElementById('txtCoordinadorProyectoEdicion').value = coordinador ? coordinador.correo : '';
            document.getElementById('txtSupervisorProyectoEdicion').value = supervisor ? supervisor.correo : '';
        } catch (error) {
            mostrarError("No se pudo cargar la lista de usuarios para editar coordinador/supervisor.");
        }
    }

    function activarModoEdicionProyecto(editando) {
        if (editando) {
            modoVistaProyecto.classList.add('d-none');
            modoEdicionProyecto.classList.remove('d-none');
        } else {
            modoEdicionProyecto.classList.add('d-none');
            modoVistaProyecto.classList.remove('d-none');
        }
    }

    btnEditarProyecto.addEventListener('click', async () => {
        activarModoEdicionProyecto(true);
        await cargarFormularioProyecto();
    });
    btnCancelarEdicionProyecto.addEventListener('click', () => activarModoEdicionProyecto(false));

    btnEliminarProyecto.addEventListener('click', async () => {
        const confirmar = await mostrarConfirmacion('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.');
        if (!confirmar) {
            return;
        }

        try {
            await eliminarProyecto(proyecto.idProyecto);
            mostrarExitoSimple("¡Listo!", "El proyecto se eliminó correctamente");
            window.location.href = "proyectos.html";
        } catch (error) {
            mostrarError(error.message);
        }
    });

    //Guarda los cambios del proyecto llamando al PUT
    modoEdicionProyecto.addEventListener('submit', async (e) => {
        e.preventDefault();

        modoEdicionProyecto.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));

        const datosFormulario = {
            nombreProyecto: document.getElementById('txtNombreProyectoEdicion').value.trim(),
            tipoProyecto: document.getElementById('txtTipoProyectoEdicion').value,
            ubicacion: document.getElementById('txtUbicacionProyectoEdicion').value.trim(),
            descripcionProyecto: document.getElementById('txtDescripcionProyectoEdicion').value.trim(),
            presupuestoEstimado: document.getElementById('numPresupuestoProyectoEdicion').value,
            correoCoordinador: document.getElementById('txtCoordinadorProyectoEdicion').value.trim().toLowerCase(),
            correoSupervisor: document.getElementById('txtSupervisorProyectoEdicion').value.trim().toLowerCase()
        };

        
        const errores = validarFormularioProyecto(datosFormulario);
        if (errores.length > 0) {
            errores.forEach((error) => {
                const campo = document.getElementById(error.campo);
                if (campo) campo.classList.add('is-invalid');
            });
            mostrarError(errores.map((error) => error.mensaje).join(' '));
            return;
        }

        //--- Resolución de correos a idUsuario ---
        let usuarios;
        try {
            usuarios = await obtenerUsuarios();
        } catch (error) {
            mostrarError("No se pudo obtener la lista de usuarios.");
            return;
        }

        const coordinador = usuarios.find(u => (u.correo || '').toLowerCase() === datosFormulario.correoCoordinador);
        const supervisor = usuarios.find(u => (u.correo || '').toLowerCase() === datosFormulario.correoSupervisor);

        if (!coordinador) {
            document.getElementById('txtCoordinadorProyectoEdicion').classList.add('is-invalid');
            mostrarError(`No se encontró ningún usuario con el correo ${datosFormulario.correoCoordinador}`);
            return;
        }
        if (!supervisor) {
            document.getElementById('txtSupervisorProyectoEdicion').classList.add('is-invalid');
            mostrarError(`No se encontró ningún usuario con el correo ${datosFormulario.correoSupervisor}`);
            return;
        }

        const proyectoActualizado = {
            nombreProyecto: datosFormulario.nombreProyecto,
            tipoProyecto: datosFormulario.tipoProyecto,
            ubicacion: datosFormulario.ubicacion,
            descripcionProyecto: datosFormulario.descripcionProyecto,
            presupuestoEstimado: Number(datosFormulario.presupuestoEstimado),
            gastoTotal: Number(document.getElementById('numTotalProyectoEdicion').value),
            coordinador: coordinador.idUsuario,
            supervisor: supervisor.idUsuario,
            finalizado: document.getElementById('selectEstadoProyectoEdicion').value === "Finalizado"
        };

        try {
            //Se reemplaza el "proyecto" con la version que devuelve la API
            proyecto = await actualizarProyecto(proyecto.idProyecto, proyectoActualizado);
            mostrarExitoSimple("¡Listo!", "El proyecto se actualizó correctamente");
            pintarDatosProyecto();
            activarModoEdicionProyecto(false);
        } catch (error) {
            mostrarError(error.message);
        }
    });

    // Seleccion de fase
    selectFase.addEventListener('change', (e) => seleccionarFase(e.target.value));

    // Creacion de fase
    btnCrearFase.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        faseEnEdicionId = null;
        formAgregarFase.reset();
        txtBotonGuardarFase.textContent = 'Agregar fase';
        const instancia = bootstrap.Modal.getOrCreateInstance(modalFasesProyecto);
        instancia.show();
    });

    // Edicion de fase seleccionada
    btnEditarFase.addEventListener('click', () => {
        const fase = obtenerFasePorId(faseSeleccionadaId);
        if (!fase) {
            mostrarError('Selecciona una fase para editar.');
            return;
        }
        faseEnEdicionId = fase.id;
        document.getElementById('txtNombreFase').value = fase.nombreFase;
        document.getElementById('txtDepartamentoEncargado').value = fase.departamentoEncargado;
        document.getElementById('txtDesxripxionFase').value = fase.faseDescripcion;
        document.getElementById('txtFechaInicioEstimada').value = fase.fechaInicioEstimada;
        document.getElementById('txtFechaFinalEstimada').value = fase.fechaFinalEstimada;
        document.getElementById('txtProveedor').value = fase.nombreProveedor;
        document.getElementById('numPresupuesto').value = fase.presupuestoEstimado;
        txtBotonGuardarFase.textContent = 'Guardar cambios';
        new bootstrap.Modal(modalFasesProyecto).show();
    });

    //Eliminar fase seleccionada 
    document.getElementById('btnEliminarFase').addEventListener('click', async () => {
        if (!faseSeleccionadaId) {
            mostrarError('Selecciona una fase para eliminar.');
            return;
        }
        const fase = obtenerFasePorId(faseSeleccionadaId);
        if (!fase) {
            mostrarError('No se encontró la fase seleccionada.');
            return;
        }

        const confirmar = await mostrarConfirmacion(`¿Estás seguro de que deseas eliminar la fase "${fase.nombreFase}"?`);
        if (!confirmar) {
            return;
        }

        try {
            await eliminarFase(fase.id);
            fases = fases.filter((f) => f.id !== faseSeleccionadaId);
            faseSeleccionadaId = null;
            renderSelectFases();
            renderTarjetaFase();
            renderListaDetalles();
            mostrarExitoSimple("¡Listo!", "La fase se eliminó correctamente");
        } catch (error) {
            mostrarError(error.message);
        }
    });

    //Guarda los cambios de la fase (creación o edición)
    formAgregarFase.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombreFase = document.getElementById('txtNombreFase').value.trim();
    const departamentoEncargado = document.getElementById('txtDepartamentoEncargado').value.trim();
    const faseDescripcion = document.getElementById('txtDesxripxionFase').value.trim();
    const fechaInicioEstimada = document.getElementById('txtFechaInicioEstimada').value;
    const fechaFinalEstimada = document.getElementById('txtFechaFinalEstimada').value;
    const nombreProveedor = document.getElementById('txtProveedor').value.trim();
    const presupuestoEstimado = document.getElementById('numPresupuesto').value;

    const datosFase = {
        nombreFase,
        departamentoEncargado,
        faseDescripcion,
        fechaInicioEstimada,
        fechaFinalEstimada,
        nombreProveedor,
        presupuestoEstimado: Number(presupuestoEstimado),
        proyecto: proyecto.idProyecto
    };

    // Validaciones de fase
    formAgregarFase.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    const erroresValidacion = validarFormularioFase(datosFase);
    if (erroresValidacion.length > 0) {
        erroresValidacion.forEach((error) => {
            const campo = formAgregarFase.querySelector(`[id="${error.campo}"]`);
            if (campo) campo.classList.add('is-invalid');
        });
        mostrarError(erroresValidacion.map((error) => error.mensaje).join('<br>'));
        return;
    }

    try {
        if (faseEnEdicionId) {
            //Al editar, conservamos el estado "finalizado" y el gasto real que ya tenía la fase
            const faseOriginal = obtenerFasePorId(faseEnEdicionId);
            datosFase.finalizado = faseOriginal.finalizado ?? false;
            datosFase.gastoTotal = faseOriginal.gastoTotal ?? null;

            const faseActualizada = await actualizarFase(faseEnEdicionId, datosFase);
            const fase = obtenerFasePorId(faseEnEdicionId);
            Object.assign(fase, faseActualizada, { id: faseActualizada.idFase });
            mostrarExitoSimple("¡Listo!", "La fase se actualizó correctamente");
        } else {
            datosFase.finalizado = false;
            const nuevaFaseApi = await crearFase(datosFase);
            const nuevaFase = { id: nuevaFaseApi.idFase, detalles: [], ...nuevaFaseApi };
            fases.push(nuevaFase);
            faseSeleccionadaId = nuevaFase.id;
            mostrarExitoSimple("¡Listo!", "La fase se creó correctamente");
        }

        renderSelectFases();
        renderTarjetaFase();
        renderListaDetalles();
        formAgregarFase.reset();
        faseEnEdicionId = null;

        const instancia = bootstrap.Modal.getInstance(modalFasesProyecto);
        if (instancia) instancia.hide();
    } catch (error) {
        mostrarError(error.message);
    }
});

    //Agregar detalle a la fase seleccionada, ya conectado con la API de Detalle_fase (POST)
    btnAgregarDetalle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!faseSeleccionadaId) {
            mostrarError('Selecciona una fase para agregar un detalle.');
            return;
        }

        formAgregarDetalle.reset();
        const instancia = bootstrap.Modal.getOrCreateInstance(modalDetalleFase);
        instancia.show();
    });

    //Conectar con la API de Detalle_fase (POST)
    formAgregarDetalle.addEventListener('submit', async (e) => {
        e.preventDefault();
        const textoDetalle = document.getElementById('txtDetalleFase').value.trim();
        if (!textoDetalle) {
            mostrarError('El detalle no puede estar vacío.');
            return;
        }

        const fase = obtenerFasePorId(faseSeleccionadaId);
        if (!fase) {
            mostrarError('No se encontró la fase seleccionada.');
            return;
        }

        try {
            const nuevoDetalleApi = await crearDetalleFase({
                descripcionDetalle: textoDetalle,
                completado: false,
                fase: fase.id
            });

            const detalleNormalizado = normalizarDetalle({
                ...nuevoDetalleApi,
                descripcionDetalle: nuevoDetalleApi.descripcionDetalle ?? textoDetalle,
                texto: nuevoDetalleApi.texto ?? textoDetalle,
                completado: Boolean(nuevoDetalleApi.completado ?? false)
            });

            fase.detalles.push(detalleNormalizado);
            renderListaDetalles();
            mostrarExitoSimple("¡Listo!", "El detalle se agregó correctamente");
            formAgregarDetalle.reset();
            const instancia = bootstrap.Modal.getInstance(modalDetalleFase);
            if (instancia) instancia.hide();
        } catch (error) {
            mostrarError(error.message);
        }
    });

    // Modo de edicion de datalles de la fase ya conectado con la API de Detalle_fase
    btnEditarDetalle.addEventListener('click', () => {
        if (!faseSeleccionadaId) {
            mostrarError('Selecciona una fase para editar sus detalles.');
            return;
        }
        listaDetalleVista.classList.toggle('modo-edicion');
        const btnEliminarDetalle = document.querySelectorAll('.btnEliminarDetalle');
        btnEliminarDetalle.forEach((btn) => {
            btn.style.display = listaDetalleVista.classList.contains('modo-edicion') ? 'block' : 'none';
        });
    });

    //Eventos de la lista de detalles de la fase, ya conectados con la API de Detalle_fase
    listaDetalleVista.addEventListener('click', async (e) => {
        if (e.target.matches('.btnEliminarDetalle')) {
            const idDetalle = Number(e.target.dataset.idDetalle);
            const fase = obtenerFasePorId(faseSeleccionadaId);
            if (!fase) return;
            const detalle = fase.detalles.find((d) => d.id === idDetalle);
            if (!detalle) return;

            const confirmar = await mostrarConfirmacion('Deseas eliminar este detalle? Esta acción no se puede deshacer.');
            if (!confirmar) {
                return;
            }

            try {
                await eliminarDetalleFase(detalle.id);
                fase.detalles = fase.detalles.filter((d) => d.id !== idDetalle);
                renderListaDetalles();
                mostrarExitoSimple("¡Listo!", "El detalle se eliminó correctamente");
            } catch (error) {
                mostrarError(error.message);
            }
        }
    });


    listaDetalleVista.addEventListener('change', async (e) => {
        if (e.target.matches('input[type="checkbox"]')) {
            const idDetalle = Number(e.target.dataset.idDetalle);
            const fase = obtenerFasePorId(faseSeleccionadaId);
            if (!fase) return;

            const detalle = fase.detalles.find((d) => d.id === idDetalle);
            if (!detalle) return;

            const nuevoEstado = e.target.checked;

            const detalleActualizado = {
                descripcionDetalle: detalle.descripcionDetalle,
                completado: nuevoEstado,
                fase: fase.id
            };

            try {
                const respuestaApi = await actualizarDetalleFase(detalle.id, detalleActualizado);
                detalle.completado = respuestaApi.completado;
            }
            catch (error){
                e.target.checked = !nuevoEstado;
                mostrarError (error.message);
            }
            renderListaDetalles();
        }
    });

    //Se cargan las fases del proyecto desde la API
    //en caso de que existan; si no, se deja la lista vacía y se puede crear una nueva fase.
    try {
        const fasesApi = await(getFasesPorProyecto(proyecto.idProyecto));
        fases = fasesApi.map((f) => ({ id: f.idFase, detalles: [], ...f }));

        //El contador local sigue usándose solo para fases que se creen sin recargar la página
        //(mientras el POST/PUT de Fases no esté conectado); evita que choque con ids reales.
        const idMaximo = fases.reduce((max, f) => Math.max(max, f.id), 0);
        idFaseContador = idMaximo + 1;
    } catch (error) {
        mostrarError("No se pudieron cargar las fases de este proyecto.");
    }

    renderSelectFases();
    seleccionarFase(null);

    pintarDatosProyecto();
}
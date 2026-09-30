import { getProyecto, actualizarProyecto, eliminarProyecto } from "../services/proyectosService.js";
import { getFases, getFasesPorProyecto, getNombreFase, crearFase, actualizarFase, eliminarFase } from "../services/faseService.js";
import { getDetallesFase, getDetallesFasePorFase, crearDetalleFase, actualizarDetalleFase, eliminarDetalleFase } from "../services/detalleFaseService.js";
import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/sweetAlerts.js";
import { getUsuarios } from "../services/usuariosService.js";
import { validarFormularioProyecto } from "../validators/proyectosValidator.js";
import { validarFormularioFase } from "../validators/fasesValidators.js";
import { validarFormularioDetalleFase } from "../validators/detalleFaseValidator.js";
import { obtenerRolUsuario, obtenerUsuarioLogueado } from "../utils/sesion.js";
import { getDepartamentoById } from "../services/departamentosService.js";

/* Permisos: el administrador administra el proyecto, sus fases y sus detalles. El técnico
   solo consulta los proyectos de su departamento; un usuario normal no entra aquí. */
const rolActual = obtenerRolUsuario();
if (rolActual === "usuario") window.location.replace("dashboardUsuarios.html");
const soloLectura = rolActual === "tecnico";

// Identidad del técnico frente a ESTE proyecto en concreto. La matriz de permisos:
// Coordinador -> CRUD de fases y detalles, y consulta del proyecto.
// Supervisor  -> CRUD de detalles únicamente; fases y proyecto solo en consulta.
// Cualquier otro técnico -> todo en consulta (según su departamento).
function esCoordinadorDelProyecto(proyectoActual) {
    const idUsuario = obtenerUsuarioLogueado()?.idUsuario;
    return idUsuario != null && !!proyectoActual && Number(proyectoActual.coordinador) === Number(idUsuario);
}

function esSupervisorDelProyecto(proyectoActual) {
    const idUsuario = obtenerUsuarioLogueado()?.idUsuario;
    return idUsuario != null && !!proyectoActual && Number(proyectoActual.supervisor) === Number(idUsuario);
}

// "Responsable" = coordinador o supervisor (se usa solo para decidir si el técnico puede
// siquiera ABRIR el proyecto, no para decidir qué puede editar dentro de él).
function esResponsableDelProyecto(proyectoActual) {
    return esCoordinadorDelProyecto(proyectoActual) || esSupervisorDelProyecto(proyectoActual);
}

/* El técnico solo puede abrir proyectos con alguna fase de su departamento (o "Ambos"),
   o proyectos de los que es coordinador o supervisor. */
async function validarAccesoDelTecnico(fasesDelProyecto, proyectoActual) {
    if (!soloLectura) return true;

    if (esResponsableDelProyecto(proyectoActual)) return true;

    const idDepartamento = obtenerUsuarioLogueado()?.idDepartamento;
    let tipo = "";
    try {
        const departamento = idDepartamento ? await getDepartamentoById(idDepartamento) : null;
        tipo = String(departamento?.tipoDepartamento || "").toLowerCase();
    } catch (error) {
        console.error("No se pudo obtener el departamento del técnico:", error);
    }

    const permitido = (fasesDelProyecto || []).some((fase) => {
        const encargado = String(fase.departamentoEncargado || "").toLowerCase();
        return tipo && (encargado === tipo || encargado === "ambos");
    });

    if (!permitido) {
        mostrarError("Este proyecto no pertenece a tu departamento.");
        window.location.replace("proyectos.html");
    }
    return permitido;
}


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
        mostrarError(error.message || "El proyecto solicitado no existe o no se pudo cargar.");
        window.location.href = "proyectos.html";
        return;
    }

    // Permisos de escritura sobre fases/detalles de ESTE proyecto: el administrador siempre
    // puede; el técnico solo si es coordinador (fases) o coordinador/supervisor (detalles).
    let puedeEscribirFases = !soloLectura;
    let puedeEscribirDetalles = !soloLectura;
    if (soloLectura) {
        puedeEscribirFases = esCoordinadorDelProyecto(proyecto);
        puedeEscribirDetalles = puedeEscribirFases || esSupervisorDelProyecto(proyecto);
    }

    //Solo se piden los usuarios una vez y luego quedan en caché
    //Se usan para resolver coordinador/supervisor por correo en el formulario de edición
    let usuariosCache = null;
    let cargandoUsuarios = null;

    function obtenerUsuarios() {
        if (usuariosCache) return Promise.resolve(usuariosCache);
        if (!cargandoUsuarios) {
            cargandoUsuarios = getUsuarios()
                .then((usuarios) => { usuariosCache = usuarios; poblarListaCorreosUsuarios(usuarios); return usuariosCache; })
                .finally(() => { cargandoUsuarios = null; });
        }
        return cargandoUsuarios;
    }

    // Llena el <datalist> de correos para que, al escribir coordinador/supervisor, el navegador
    // sugiera "nombre — correo" de los usuarios ya cargados (evita tener que memorizar el correo).
    function poblarListaCorreosUsuarios(usuarios) {
        const listaCorreos = document.getElementById('listaUsuariosCorreoEdicion');
        if (!listaCorreos) return;

        listaCorreos.innerHTML = '';
        // Solo Administrador o Tecnico pueden ser coordinador/supervisor de un proyecto
        // (el backend también lo valida; esto es solo para no ofrecer opciones inválidas).
        const rolesValidosResponsable = ['administrador', 'tecnico'];
        (usuarios || [])
            .filter((usuario) => rolesValidosResponsable.includes(String(usuario.nombreRol || '').toLowerCase()))
            .forEach((usuario) => {
                if (!usuario.correo) return;
                const opcion = document.createElement('option');
                opcion.value = usuario.correo;
                opcion.label = `${usuario.nombreUsuario || ''} — ${usuario.correo}`;
                listaCorreos.appendChild(opcion);
            });
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

    // data-roles="admin" (aplicado por menu.js al cargar la página) oculta estos controles a
    // TODO técnico por defecto; aquí se vuelven a mostrar solo para quien sí tenga permiso
    // sobre ESTE proyecto en concreto (coordinador para fases, coordinador o supervisor para detalles).
    if (puedeEscribirFases) {
        [btnEditarFase, btnCrearFase, btnEliminarFase].forEach((btn) => btn?.classList.remove('d-none'));
    }
    if (puedeEscribirDetalles) {
        btnEditarDetalle?.parentElement?.classList.remove('d-none');
    }

    /* Muestra u oculta los campos de edición de la fase  */
    function mostrarCamposEdicionFase(mostrar) {
        ['campoGastoTotalFase', 'campoFechaInicioReal', 'campoFechaFinalReal']
            .forEach((id) => document.getElementById(id).classList.toggle('d-none', !mostrar));
    }

    /* Obtiene una fase por su ID */
    function obtenerFasePorId(id) {
        return fases.find((f) => f.id === id);
    }

    // Normaliza el valor de finalizado de la fase a un booleano
    function normalizarEstadoFase(valor) {
        if (valor === true || valor === false) return valor;

        //Convierte el valor a string, lo recorta y lo convierte a mayúsculas para compararlo con los valores permitidos.
        const texto = String(valor ?? '').trim().toUpperCase();
        if (texto === 'T' || texto === 'TRUE' || texto === '1') return true;
        if (texto === 'F' || texto === 'FALSE' || texto === '0' || texto === '') return false;

        return Boolean(valor);
    }

    //Pinta en pantalla los datos del proyecto que se trajo de la API
    function pintarDatosProyecto() {
        document.getElementById('txtNombreProyecto').textContent = proyecto.nombreProyecto;
        document.getElementById('txtUbicacionProyecto').textContent = proyecto.ubicacion;
        document.getElementById('txtTipoProyecto').textContent = proyecto.tipoProyecto;
        document.getElementById('txtCoordinadorProyecto').textContent = proyecto.nombreCoordinador;
        document.getElementById('txtSupervisorProyecto').textContent = proyecto.nombreSupervisor;
        document.getElementById('txtContratistaProyecto').textContent = proyecto.contratista || 'N/A';
        document.getElementById('txtPresupuestoProyecto').textContent = Number(proyecto.presupuestoEstimado || 0).toFixed(2);
        document.getElementById('txtTotalProyecto').textContent = Number(proyecto.gastoTotal || 0).toFixed(2);
        document.getElementById('txtEstadoProyecto').textContent = proyecto.finalizado ? "Finalizado" : "En progreso";
    }

    //Carga las fases del proyecto desde la API y las almacena en la variable "fases".
    //Luego, llama a las funciones para renderizar el select de fases y la tarjeta de la fase seleccionada.
    function renderSelectFases() {
        selectFase.innerHTML = '<option value="">Selecciona una fase</option>';
        fases.forEach((f) => {
            const finalizado = normalizarEstadoFase(f.finalizado ?? f.faseFinalizada ?? 'F');
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = `${f.nombreFase}`;
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

        //convierte el valor de finalizado a booleano
        const finalizado = normalizarEstadoFase(fase.finalizado ?? fase.faseFinalizada ?? 'F');

        tarjetaFase.innerHTML = `
      <h6 class="text-navy fw-bold mb-3">${fase.nombreFase}</h6>
      <p class="meta-proyecto mb-1"><b>Departamento encargado:</b> ${fase.departamentoEncargado}</p>
      <p class="meta-proyecto mb-1"><b>Descripción:</b> ${fase.faseDescripcion}</p>
      <p class="meta-proyecto mb-1"><b>Inicio estimado:</b> ${fase.fechaInicioEstimada || '—'}</p>
      <p class="meta-proyecto mb-1"><b>Final estimado:</b> ${fase.fechaFinalEstimada || '—'}</p>
      <p class="meta-proyecto mb-1"><b>Inicio real:</b> ${fase.fechaInicioReal || '—'}</p>
      <p class="meta-proyecto mb-1"><b>Final real:</b> ${fase.fechaFinalReal || '—'}</p>
      <p class="meta-proyecto mb-1"><b>Proveedor:</b> ${fase.nombreProveedor || 'N/A'}</p>
      <p class="meta-proyecto mb-0"><b>Presupuesto estimado:</b> $${Number(fase.presupuestoEstimado).toFixed(2)}</p>
      <p class="meta-proyecto mb-0"><b>Gasto total:</b> $${Number(fase.gastoTotal || 0).toFixed(2)}</p>
      <p class="meta-proyecto mb-0"><b>Estado de la fase:</b> ${finalizado ? 'Finalizada' : 'En progreso'}</p>
    `;
    }

    //Normalizar: convertir los datos de un formato a otro para que tengan una estructura consistente.
    //El formato estándar que se busca es un objeto con las siguientes propiedades: id, descripcionDetalle, texto, completado y fase.
    //Esto permite que el front-end pueda manejar los detalles de fase de manera consistente, sin importar cómo se reciban desde la API.
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

        //Se asegura de que la propiedad "detalles" de la fase sea un array. Si no lo es, se asigna un array vacío.
        const detalles = Array.isArray(fase.detalles) ? fase.detalles : [];
        if (detalles.length === 0) {
            listaDetalleVista.innerHTML =
                '<li class="text-muted">Esta fase aún no tiene detalles.</li>';
            return;
        }

        //Recorre cada detalle de la fase y crea un elemento <li> en la lista de detalles de la vista del proyecto.
        detalles.forEach((d) => {
            const detalle = normalizarDetalle(d);
            const li = document.createElement('li');
            li.className = 'd-flex align-items-center justify-content-between gap-2 py-2 border-bottom';
            li.innerHTML = `
        <div class="d-flex align-items-center gap-2 flex-grow-1">
            <input type="checkbox" class="form-check-input" data-id-detalle="${detalle.id}" ${detalle.completado ? 'checked' : ''} ${puedeEscribirDetalles ? '' : 'disabled'}>
            <span class="${detalle.completado ? 'text-decoration-line-through text-muted' : ''}">${detalle.descripcionDetalle}</span>
        </div>
        ${puedeEscribirDetalles ? `<i class="bi bi-trash btnEliminarDetalle" data-id-detalle="${detalle.id}" title="Eliminar"></i>` : ''}
      `;

            listaDetalleVista.appendChild(li);
        });
    }

    /* Esta función se encarga de cargar los detalles de una fase específica desde la API y mostrarlos en la vista del proyecto. */
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

    /* Esta función se encarga de seleccionar una fase específica y cargar sus detalles. */
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
        document.getElementById('txtContratistaProyectoEdicion').value = proyecto.contratista || '';

        try {
            const usuarios = await obtenerUsuarios();
            const coordinador = usuarios.find(u => u.idUsuario === proyecto.coordinador);
            const supervisor = usuarios.find(u => u.idUsuario === proyecto.supervisor);
            document.getElementById('txtCoordinadorProyectoEdicion').value = coordinador ? coordinador.correo : '';
            document.getElementById('txtSupervisorProyectoEdicion').value = supervisor ? supervisor.correo : '';
        } catch (error) {
            mostrarError(error.message || "No se pudo cargar la lista de usuarios para editar coordinador/supervisor.");
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
    //Escucha el evento de submit del formulario de edición del proyecto.
    //construye un objeto con los datos actualizados del proyecto y llama a la función actualizarProyecto para enviar los cambios a la API. Si la actualización es exitosa, muestra un mensaje de éxito, actualiza la vista del proyecto y desactiva el modo de edición.
    //Si ocurre algún error durante el proceso, muestra un mensaje de error.
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
            correoSupervisor: document.getElementById('txtSupervisorProyectoEdicion').value.trim().toLowerCase(),
            contratista: document.getElementById('txtContratistaProyectoEdicion').value.trim()
        };

        //Valida los datos del formulario
        const errores = validarFormularioProyecto(datosFormulario);
        if (errores.length > 0) {
            errores.forEach((error) => {
                const campo = document.getElementById(error.campo);
                if (campo) campo.classList.add('is-invalid');
            });
            mostrarError(errores.map((error) => error.mensaje).join(' '));
            return;
        }

        //Se obtienen los usuarios desde la API y se buscan los usuarios correspondientes a los correos de coordinador y supervisor ingresados en el formulario.
        let usuarios;
        try {
            usuarios = await obtenerUsuarios();
        } catch (error) {
            mostrarError(error.message || "No se pudo obtener la lista de usuarios.");
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
            contratista: datosFormulario.contratista || null,
            finalizado: document.getElementById('selectEstadoProyectoEdicion').value === "Finalizado"
        };

        try {
            await actualizarProyecto(proyecto.idProyecto, proyectoActualizado);
            // El GET posterior evita depender de una respuesta PUT parcial.
            await refrescarProyecto();
            mostrarExitoSimple("¡Listo!", "El proyecto se actualizó correctamente");
            activarModoEdicionProyecto(false);
        } catch (error) {
            mostrarError(error.message);
        }
    });

    //Refresca los datos del proyecto desde la API, esto para cuando se actualice el total al crear/editar/eliminar
    //una fase, puedan verse los cambios reflejados sin la necesidad de recargar la pagina
    async function refrescarProyecto() {
        try {
            proyecto = await getProyecto(proyecto.idProyecto);
            pintarDatosProyecto();
        } catch (error) {
            console.error("No se pudo refrescar el total del proyecto:", error);
        }
    }

    async function recargarFasesProyecto(idPreferido = faseSeleccionadaId) {
        const fasesApi = await getFasesPorProyecto(proyecto.idProyecto);

        // El técnico solo puede abrir proyectos de su departamento (o de los que es coordinador/supervisor)
        if (!(await validarAccesoDelTecnico(fasesApi, proyecto))) return;

        fases = fasesApi.map((fase) => ({ id: fase.idFase, detalles: [], ...fase }));

        // Las fases sin departamento interno ("Externo") solo son visibles para el coordinador,
        // el supervisor o el administrador; un técnico que solo tiene acceso por departamento no las ve.
        if (soloLectura && !esResponsableDelProyecto(proyecto)) {
            fases = fases.filter((fase) => String(fase.departamentoEncargado || '').toLowerCase() !== 'externo');
        }

        const seleccionExiste = fases.some((fase) => Number(fase.id) === Number(idPreferido));
        faseSeleccionadaId = seleccionExiste ? Number(idPreferido) : null;
        renderSelectFases();
        renderTarjetaFase();

        if (faseSeleccionadaId) {
            await cargarDetallesDeFase(faseSeleccionadaId);
        } else {
            renderListaDetalles();
        }
    }

    // Seleccion de fase
    selectFase.addEventListener('change', (e) => seleccionarFase(e.target.value));

    // Creacion de fase
    btnCrearFase.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        faseEnEdicionId = null;
        formAgregarFase.reset();
        mostrarCamposEdicionFase(false);
        document.getElementById('faseFinalizada').value = 'En progreso';
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
        /* Esta función permite editar una fase seleccionada. */
        faseEnEdicionId = fase.id;
        mostrarCamposEdicionFase(true);
        document.getElementById('txtNombreFase').value = fase.nombreFase;
        document.getElementById('txtDepartamentoEncargado').value = fase.departamentoEncargado;
        document.getElementById('txtDesxripxionFase').value = fase.faseDescripcion;
        document.getElementById('txtFechaInicioEstimada').value = fase.fechaInicioEstimada;
        document.getElementById('txtFechaFinalEstimada').value = fase.fechaFinalEstimada;
        document.getElementById('txtFechaInicioReal').value = fase.fechaInicioReal ?? '';
        document.getElementById('txtFechaFinalReal').value = fase.fechaFinalReal ?? '';
        document.getElementById('txtProveedor').value = fase.nombreProveedor;
        document.getElementById('numPresupuesto').value = fase.presupuestoEstimado;
        document.getElementById('numTotal').value = fase.gastoTotal ?? '';
        const finalizadoFase = normalizarEstadoFase(fase.finalizado ?? fase.faseFinalizada ?? false);
        document.getElementById('faseFinalizada').value = finalizadoFase ? 'Finalizada' : 'En progreso';
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
            await recargarFasesProyecto(null);
            await refrescarProyecto();
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
        const fechaInicioReal = document.getElementById('txtFechaInicioReal').value;
        const fechaFinalReal = document.getElementById('txtFechaFinalReal').value;
        const nombreProveedor = document.getElementById('txtProveedor').value.trim();
        const presupuestoEstimado = document.getElementById('numPresupuesto').value;
        const gastoTotal = document.getElementById('numTotal').value;
        const estadoFase = document.getElementById('faseFinalizada').value;
        const finalizado = estadoFase === 'Finalizada';

        //Construye un objeto "datosFase" con los datos del formulario, normalizando los valores de presupuesto y gasto total a números y asegurándose de que las fechas reales sean nulas si no se proporcionan.
        const datosFase = {
            nombreFase,
            departamentoEncargado,
            faseDescripcion,
            fechaInicioEstimada,
            fechaFinalEstimada,
            fechaInicioReal: fechaInicioReal || null,
            fechaFinalReal: fechaFinalReal || null,
            nombreProveedor,
            presupuestoEstimado: Number(presupuestoEstimado),
            gastoTotal: gastoTotal === '' || gastoTotal === null || gastoTotal === undefined ? null : Number(gastoTotal),
            estadoFase,
            finalizado,
            faseFinalizada: finalizado,
            proyecto: proyecto.idProyecto
        };

        // Validaciones de fase
        formAgregarFase.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
        const erroresValidacion = validarFormularioFase(datosFase, Boolean(faseEnEdicionId));
        if (erroresValidacion.length > 0) {
            erroresValidacion.forEach((error) => {
                const campo = formAgregarFase.querySelector(`[id="${error.campo}"]`);
                if (campo) campo.classList.add('is-invalid');
            });
            mostrarError(erroresValidacion.map((error) => error.mensaje).join('<br>'));
            return;
        }

        if (faseEnEdicionId && finalizado) {
            const faseActual = obtenerFasePorId(faseEnEdicionId);
            const detallesIncompletos = (faseActual?.detalles || []).some((d) => !normalizarDetalle(d).completado);
            if (detallesIncompletos) {
                mostrarError('No se puede finalizar la fase: todav\u00eda tiene detalles pendientes de completar.');
                return;
            }
        }

        // Bloqueo duro: el gasto total del proyecto (suma de todas sus fases) no puede superar
        // su presupuesto estimado. Se recalcula con las fases ya cargadas, excluyendo la fase
        // que se está editando (si aplica) y sumando el nuevo gasto propuesto para ella.
        const sumaOtrasFases = fases
            .filter((f) => f.id !== faseEnEdicionId)
            .reduce((acc, f) => acc + Number(f.gastoTotal || 0), 0);
        const gastoNuevoFase = datosFase.gastoTotal === null || datosFase.gastoTotal === undefined ? 0 : Number(datosFase.gastoTotal);
        const gastoTotalProyectado = sumaOtrasFases + gastoNuevoFase;
        const presupuestoProyecto = Number(proyecto.presupuestoEstimado || 0);
        if (gastoTotalProyectado > presupuestoProyecto) {
            mostrarError(`El gasto total del proyecto ($${gastoTotalProyectado.toFixed(2)}) superar\u00eda su presupuesto estimado ($${presupuestoProyecto.toFixed(2)}).`);
            return;
        }

        try {
            if (faseEnEdicionId) {
                const idFaseGuardada = faseEnEdicionId;
                await actualizarFase(idFaseGuardada, datosFase);
                await recargarFasesProyecto(idFaseGuardada);
                mostrarExitoSimple("¡Listo!", "La fase se actualizó correctamente");
            } else {
                const nuevaFaseApi = await crearFase(datosFase);
                const idNuevaFase = nuevaFaseApi.idFase ?? nuevaFaseApi.id;
                await recargarFasesProyecto(idNuevaFase);
                mostrarExitoSimple("¡Listo!", "La fase se creó correctamente");
            }
            await refrescarProyecto();
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
        //Previene que el evento de click se propague a otros elementos padres, evitando que se ejecuten otros manejadores de eventos que puedan estar asociados a esos elementos.
        event.stopPropagation();

        if (!faseSeleccionadaId) {
            mostrarError('Selecciona una fase para agregar un detalle.');
            return;
        }

        const faseSeleccionada = obtenerFasePorId(faseSeleccionadaId);
        const faseFinalizada = normalizarEstadoFase(faseSeleccionada?.finalizado ?? faseSeleccionada?.faseFinalizada ?? false);
        if (faseFinalizada) {
            mostrarError('No se pueden agregar detalles a una fase ya finalizada.');
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
            await crearDetalleFase({
                descripcionDetalle: textoDetalle,
                completado: false,
                fase: fase.id
            });
            await cargarDetallesDeFase(fase.id);
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

    //Escucha los clicks en la lista de detalles de la fase y si se hace click en un botón de eliminar, elimina el detalle correspondiente.
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
                await cargarDetallesDeFase(fase.id);
                mostrarExitoSimple("¡Listo!", "El detalle se eliminó correctamente");
            } catch (error) {
                mostrarError(error.message);
            }
        }
    });

    //Escucha los cambios en los chechbox de los detalles de la fase y actualiza el estado de completado en la API.
    listaDetalleVista.addEventListener('change', async (e) => {
        if (e.target.matches('input[type="checkbox"]')) {
            const idDetalle = Number(e.target.dataset.idDetalle);
            const fase = obtenerFasePorId(faseSeleccionadaId);
            if (!fase) return;

            const detalle = fase.detalles.find((d) => d.id === idDetalle);
            if (!detalle) return;

            const nuevoEstado = e.target.checked;

            //Se crea un objeto con los datos actualizados del detalle, manteniendo la descripción y la fase, pero cambiando el estado de completado.
            const detalleActualizado = {
                descripcionDetalle: detalle.descripcionDetalle,
                completado: nuevoEstado,
                fase: fase.id
            };

            //Se intenta actualizar el detalle en la API y si hay un error, se revierte el cambio en el checkbox y se muestra un mensaje de error.
            try {
                await actualizarDetalleFase(detalle.id, detalleActualizado);
                await cargarDetallesDeFase(fase.id);
            }
            catch (error) {
                e.target.checked = !nuevoEstado;
                renderListaDetalles();
                mostrarError(error.message);
            }
        }
    });

    //Se cargan las fases del proyecto desde la API
    //en caso de que existan; si no, se deja la lista vacía y se puede crear una nueva fase.
    try {
        await recargarFasesProyecto(null);

        //El contador local sigue usándose solo para fases que se creen sin recargar la página
        //(mientras el POST/PUT de Fases no esté conectado); evita que choque con ids reales.
        const idMaximo = fases.reduce((max, f) => Math.max(max, f.id), 0);
        idFaseContador = idMaximo + 1;
    } catch (error) {
        mostrarError(error.message || "No se pudieron cargar las fases de este proyecto.");
    }

    pintarDatosProyecto();
}

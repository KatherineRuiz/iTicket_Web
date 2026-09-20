import {
    getProyectos,
    crearProyecto,
    buscarProyectosPorNombre,
    buscarProyectosPorTipo
} from "../services/proyectosService.js";
import { getUsuarios } from "../services/usuariosService.js";
import { mostrarError, mostrarExitoSimple } from "../components/sweetAlerts.js";
import { validarFormularioProyecto } from "../validators/proyectosValidator.js";
import { obtenerRolUsuario, obtenerUsuarioLogueado } from "../utils/sesion.js";
import { getDepartamentoById } from "../services/departamentosService.js";
import { getFases } from "../services/faseService.js";

/* Permisos: el administrador ve y administra todo. El técnico solo consulta los proyectos
   de su departamento y no puede crearlos. Un usuario normal no entra a esta pantalla. */
const rolActual = obtenerRolUsuario();
if (rolActual === "usuario") window.location.replace("dashboardUsuarios.html");
const esTecnico = rolActual === "tecnico";

//Referencias a elementos del DOM
const graficoTipoProyecto = document.getElementById('graficoTipoProyecto');
const modalCrearProyectoEl = document.getElementById('modalCrearProyecto');
const modalCrearProyecto = new bootstrap.Modal(modalCrearProyectoEl);
const modalFasesProyectoEl = document.getElementById('modalFasesProyecto');
const modalFasesProyecto = modalFasesProyectoEl ? new bootstrap.Modal(modalFasesProyectoEl) : null;

const formCrearProyecto = document.getElementById('formCrearProyecto');
const contenedorProyectos = document.getElementById('contenedorProyectos');
const txtTotalProyectos = document.getElementById('txtTotalProyectos');
const txtProyectosTerminados = document.getElementById('txtProyectosTerminados');

const txtBuscarProyecto = document.getElementById('txtBuscarProyecto');
const sltFiltroTipo = document.getElementById('sltFiltroTipo');
const dtFiltroFecha = document.getElementById('dtFiltroFecha');

//Campos del formulario de creación
const txtNombreProyecto = document.getElementById('txtNombreProyecto');
const tipoProyectoSelect = document.getElementById('tipoProyecto');
const txtUbicacion = document.getElementById('txtUbicacion');
const txtContratista = document.getElementById('txtContratista');
const txtDescripcion = document.getElementById('txtDescripcion');
const numPresupuesto = document.getElementById('numPresupuesto');
const txtCoordinador = document.getElementById('txtCoordinador');
const txtSupervisor = document.getElementById('txtSupervisor');

//que hace?
/* Esta función se encarga de normalizar el tipo de proyecto, eliminando acentos y espacios en blanco, y convirtiendo todo a minúsculas. */
const TIPOS_PROYECTO = ['Construcción', 'Remodelación', 'Ampliación', 'Mantenimiento'];

function normalizarTipoProyecto(tipo) {
    if (tipo === null || tipo === undefined) return "";

    return String(tipo)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

//que hace?
/* Esta función se encarga de obtener el tipo de proyecto visible, es decir, el tipo de proyecto en su forma original (sin normalizar). */
function obtenerTipoProyectoVisible(tipo) {
    const normalizado = normalizarTipoProyecto(tipo);

    const equivalencias = {
        construccion: 'Construcción',
        remodelacion: 'Remodelación',
        ampliacion: 'Ampliación',
        mantenimiento: 'Mantenimiento'
    };

    return equivalencias[normalizado] || String(tipo || '').trim();
}

let usuariosCache = null; //null = aun no se ha pedido; se carga bajo demanda
let cargandoUsuarios = null; //promesa en curso, evita pedir la lista 2 veces si el usuario hace doble clic
let temporizadorBusqueda = null;
let graficoProyectos = null;

//Grafico de tipos de proyecto
/* Esta función se encarga de crear un gráfico de tipo donut que muestra la distribución de los proyectos por tipo. */
if (graficoTipoProyecto) {
    const grfTipoProyecto = graficoTipoProyecto.getContext('2d');
    graficoProyectos = new Chart(grfTipoProyecto, {
        type: 'doughnut',
        data: {
            labels: ['Construcción', 'Remodelación', 'Ampliación', 'Mantenimiento'],
            datasets: [{
                label: 'Número de proyectos',
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#184E8C',
                    '#539ECD',
                    '#ffe173',
                    '#ffbc66',
                ],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 200,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

//Solo se trae la lista principal de proyectos.
//La lista de usuarios se carga bajo demanda solo cuando el usuario abre el formulario
document.addEventListener('DOMContentLoaded', () => {
    cargarProyectos();
});

//Los usuarios solo se piden a la API cuando el usuario
// abre el formulario para crear un proyecto
modalCrearProyectoEl.addEventListener('show.bs.modal', () => {
    obtenerUsuarios().catch((error) => {
        console.error("No se pudieron cargar los usuarios:", error);
    });
});

//Devuelve la lista de usuarios, pidiendola a la API solo la primera vez que se necesita
function obtenerUsuarios() {
    if (usuariosCache) {
        return Promise.resolve(usuariosCache);
    }
    if (!cargandoUsuarios) {
        cargandoUsuarios = getUsuarios()
            .then((usuarios) => {
                usuariosCache = usuarios;
                return usuariosCache;
            })
            .finally(() => {
                cargandoUsuarios = null;
            });
    }
    return cargandoUsuarios;
}

/* Un proyecto pertenece a un departamento a través de sus fases (departamentoEncargado).
   El técnico solo ve los proyectos con alguna fase de su departamento o marcada como "Ambos". */
let tipoDepartamentoTecnico;

async function obtenerTipoDepartamento() {
    if (tipoDepartamentoTecnico !== undefined) return tipoDepartamentoTecnico;

    const idDepartamento = obtenerUsuarioLogueado()?.idDepartamento;
    try {
        const departamento = idDepartamento ? await getDepartamentoById(idDepartamento) : null;
        tipoDepartamentoTecnico = departamento?.tipoDepartamento ?? null;
    } catch (error) {
        console.error("No se pudo obtener el departamento del técnico:", error);
        tipoDepartamentoTecnico = null;
    }
    return tipoDepartamentoTecnico;
}

async function filtrarProyectosPermitidos(proyectos) {
    if (!esTecnico || !proyectos?.length) return proyectos;

    const tipo = (await obtenerTipoDepartamento() || "").toLowerCase();
    if (!tipo) return [];

    const fases = await getFases().catch(() => []);
    const idsPermitidos = new Set(
        fases
            .filter((fase) => {
                const encargado = String(fase.departamentoEncargado || "").toLowerCase();
                return encargado === tipo || encargado === "ambos";
            })
            .map((fase) => fase.proyecto)
    );

    return proyectos.filter((proyecto) => idsPermitidos.has(proyecto.idProyecto));
}

//Trae la lista de proyectos desde la API y refresca la vista completa
async function cargarProyectos() {
    try {
        const proyectos = await filtrarProyectosPermitidos(await getProyectos());
        renderizarProyectos(proyectos);
        actualizarIndicadores(proyectos);
        actualizarGrafico(proyectos);
    } catch (error) {
        contenedorProyectos.innerHTML = `<p class="text-danger text-center w-100 my-4">No se pudieron cargar los proyectos</p>`;
        mostrarError(error.message);
    }
}

//Renderizado de las tarjetas de proyectos
function renderizarProyectos(proyectos) {
    contenedorProyectos.innerHTML = "";

    if (!proyectos || proyectos.length === 0) {
        contenedorProyectos.innerHTML = `<p class="text-muted text-center w-100 my-4">No se encontraron proyectos</p>`;
        return;
    }

    //Se recorre la lista de proyectos y se genera el HTML para cada tarjeta de proyecto
    proyectos.forEach((proyecto) => {
        const tipoVisible = obtenerTipoProyectoVisible(proyecto.tipoProyecto);
        const presupuesto = Number(proyecto.presupuestoEstimado || 0).toFixed(2);
        const total = Number(proyecto.gastoTotal || 0).toFixed(2);
        const estado = proyecto.finalizado ? "Finalizado" : "En progreso";

        contenedorProyectos.innerHTML += `
            <article class="col-lg-6 col-md-12 col-sm-12">
                <div class="card tarjeta-proyecto border-0 shadow-sm rounded-4 p-3 position-relative h-100">
                    <div class="card-body">
                        <h6 class="tarjeta-titulo d-flex align-items-center gap-2 fw-bold mb-3">
                            <a href="vistaProyecto.html?id=${proyecto.idProyecto}"
                                class="text-decoration-none text-dark stretched-link">
                                ${proyecto.nombreProyecto}
                            </a>
                        </h6>
                        <p class="mb-1"><span class="fw-semibold">Ubicación:</span> <span class="text-muted">${proyecto.ubicacion}</span></p>
                        <p class="mb-1"><span class="fw-semibold">Tipo de proyecto:</span> <span class="text-muted">${tipoVisible}</span></p>
                        <p class="mb-1"><span class="fw-semibold">Coordinador:</span> <span class="text-muted">${proyecto.nombreCoordinador || ''}</span></p>
                        <p class="mb-1"><span class="fw-semibold">Supervisor:</span> <span class="text-muted">${proyecto.nombreSupervisor || ''}</span></p>
                        <p class="mb-1"><span class="fw-semibold">Presupuesto:</span> <span class="text-muted">$${presupuesto}</span></p>
                        <p class="mb-1"><span class="fw-semibold">Total:</span> <span class="text-muted">$${total}</span></p>
                        <p class="mb-0"><span class="fw-semibold">Estado:</span> <span class="text-muted">${estado}</span></p>
                    </div>
                </div>
            </article>
        `;
    });
}

//Actualiza las tarjetas de "Proyectos totales" y "Proyectos terminados"
function actualizarIndicadores(proyectos) {
    const total = proyectos ? proyectos.length : 0;
    const terminados = proyectos ? proyectos.filter(p => p.finalizado).length : 0;

    txtTotalProyectos.textContent = total;
    txtProyectosTerminados.textContent = terminados;
}

//Actualiza el grafico de dona con la cantidad de proyectos por tipo
function actualizarGrafico(proyectos) {
    if (!graficoProyectos) return;

    graficoProyectos.data.labels = TIPOS_PROYECTO;
    graficoProyectos.data.datasets[0].data = TIPOS_PROYECTO.map((tipo) =>
        (proyectos || []).filter((p) =>
            normalizarTipoProyecto(p.tipoProyecto) === normalizarTipoProyecto(tipo)
        ).length
    );

    graficoProyectos.update();
}

//Crear proyecto
formCrearProyecto.addEventListener('submit', async (e) => {
    e.preventDefault();

    //Limpiamos marcas de error de un intento anterior
    formCrearProyecto.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));

    const datosFormulario = {
        nombreProyecto: txtNombreProyecto.value.trim(),
        tipoProyecto: tipoProyectoSelect.value,
        ubicacion: txtUbicacion.value.trim(),
        contratista: txtContratista.value.trim(),
        descripcionProyecto: txtDescripcion.value.trim(),
        presupuestoEstimado: numPresupuesto.value,
        correoCoordinador: txtCoordinador.value.trim().toLowerCase(),
        correoSupervisor: txtSupervisor.value.trim().toLowerCase()
    };

    //Valida los datos del formulario y muestra errores si los hay
    const errores = validarFormularioProyecto(datosFormulario);

    if (errores.length > 0) {
        errores.forEach((error) => {
            const campo = document.getElementById(error.campo);
            if (campo) campo.classList.add('is-invalid');
        });
        const mensajes = errores.map((error) => error.mensaje).join(' ');
        mostrarError(mensajes);
        return;
    }

    /* Esta función se encarga de obtener la lista de usuarios y validar que los correos de coordinador y supervisor ingresados en el formulario correspondan a usuarios existentes. */
    let usuarios;
    try {
        usuarios = await obtenerUsuarios();
    } catch (error) {
        mostrarError("No se pudo obtener la lista de usuarios para validar el coordinador y el supervisor.");
        return;
    }

    const coordinador = usuarios.find(u => (u.correo || '').toLowerCase() === datosFormulario.correoCoordinador);
    const supervisor = usuarios.find(u => (u.correo || '').toLowerCase() === datosFormulario.correoSupervisor);

    if (!coordinador) {
        txtCoordinador.classList.add('is-invalid');
        mostrarError(`No se encontró ningún usuario con el correo ${datosFormulario.correoCoordinador}`);
        return;
    }

    if (!supervisor) {
        txtSupervisor.classList.add('is-invalid');
        mostrarError(`No se encontró ningún usuario con el correo ${datosFormulario.correoSupervisor}`);
        return;
    }

    const nuevoProyecto = {
        nombreProyecto: datosFormulario.nombreProyecto,
        tipoProyecto: datosFormulario.tipoProyecto,
        ubicacion: datosFormulario.ubicacion,
        descripcionProyecto: datosFormulario.descripcionProyecto,
        presupuestoEstimado: Number(datosFormulario.presupuestoEstimado),
        gastoTotal: 0,
        coordinador: coordinador.idUsuario,
        supervisor: supervisor.idUsuario,
        finalizado: false
    };

    try {
        await crearProyecto(nuevoProyecto);
        mostrarExitoSimple("¡Listo!", "El proyecto se creó correctamente");
        formCrearProyecto.reset();
        await cargarProyectos();

        modalCrearProyecto.hide();
        if (modalFasesProyecto) {
            modalFasesProyecto.show();
        }
    } catch (error) {
        mostrarError(error.message);
    }
});

//Busqueda y filtros
/* Esta función se encarga de buscar proyectos por nombre y aplicar filtros según el tipo y la fecha. */
txtBuscarProyecto.addEventListener('input', () => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(aplicarFiltros, 400);
});

sltFiltroTipo.addEventListener('change', aplicarFiltros);
dtFiltroFecha.addEventListener('change', aplicarFiltros);

// Normaliza una fecha para su comparación
function normalizarFechaParaComparar(fechaValor) {
    if (!fechaValor) return "";

    const valor = String(fechaValor).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return valor;
    }

    if (/^\d{4}-\d{2}-\d{2}T/.test(valor)) {
        return valor.slice(0, 10);
    }

    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
        return "";
    }

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
}

/* Esta función se encarga de filtrar una lista de proyectos por fecha. */
function filtrarPorFecha(proyectos, fechaSeleccionada) {
    if (!fechaSeleccionada) return proyectos;

    return (proyectos || []).filter((proyecto) => {
        const fechaProyecto = proyecto.fechaCreacion || proyecto.fechaInicioProyecto || proyecto.fechaProyecto || proyecto.createdAt;
        const fechaNormalizada = normalizarFechaParaComparar(fechaProyecto);

        return fechaNormalizada === fechaSeleccionada;
    });
}

async function aplicarFiltros() {
    const nombre = txtBuscarProyecto.value.trim();
    const tipo = sltFiltroTipo.value;
    const fecha = dtFiltroFecha ? dtFiltroFecha.value : "";

    try {
        let proyectos = [];

        if (nombre) {
            proyectos = await buscarProyectosPorNombre(nombre);
        } else {
            proyectos = await getProyectos();
        }

        proyectos = await filtrarProyectosPermitidos(proyectos);

        if (tipo) {
            proyectos = proyectos.filter((p) =>
                normalizarTipoProyecto(p.tipoProyecto) === normalizarTipoProyecto(tipo)
            );
        }

        if (fecha) {
            proyectos = filtrarPorFecha(proyectos, fecha);
        }

        renderizarProyectos(proyectos);
        actualizarIndicadores(proyectos);
        actualizarGrafico(proyectos);
    } catch (error) {
        mostrarError(error.message);
    }
}

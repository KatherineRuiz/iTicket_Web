import { getDepartamentos, crearDepartamento, actualizarDepartamento, eliminarDepartamento } from '../services/departamentosService.js';
import { getAreas } from '../services/areasService.js';
import { validarFormularioDepartamento } from '../validators/departamentosValidator.js';
import { mostrarError } from '../components/sweetAlerts.js';
import { inicializarOrdenamientoTabla, ordenarLista } from '../components/ordenamientoTabla.js';

const formDepartamento = document.getElementById('formDepartamento');
const departamentoIdInput = document.getElementById('departamentoId');
const nombreDepartamentoInput = document.getElementById('nombreDepartamento');
const selectAreaDepartamento = document.getElementById('selectAreaDepartamento');
const selectTipoDepartamento = document.getElementById('selectTipoDepartamento');
const tituloFormDepartamento = document.getElementById('tituloFormDepartamento');
const btnTextoDepartamento = document.getElementById('btnTextoDepartamento');
const btnCancelarDepartamento = document.getElementById('btnCancelarDepartamento');
const tablaDepartamentosBody = document.getElementById('tablaDepartamentosBody');
let departamentosActuales = [];
// Esta tabla trae todos sus registros, así que el orden se aplica aquí antes de pintarla
let ordenDepartamentos = '';

inicializarOrdenamientoTabla(tablaDepartamentosBody?.closest('table'), (orden) => {
    ordenDepartamentos = orden;
    pintarTablaDepartamentos(departamentosActuales);
});

window.addEventListener('iticket:recargar-tablas-usuarios', () => {
    cargarDepartamentos();
    llenarSelectAreas();
});

function recargarGestionUsuarios() {
    window.dispatchEvent(new CustomEvent('iticket:recargar-tablas-usuarios'));
}
 
document.addEventListener('DOMContentLoaded', async () => {
    await llenarSelectAreas();
    cargarDepartamentos();
});
 
export async function llenarSelectAreas() {
    try {
        const areas = await getAreas();
        selectAreaDepartamento.innerHTML = '<option selected disabled>Selecciona el área...</option>';
        areas.forEach(area => {
            const opcion = document.createElement('option');
            opcion.value = area.idArea;
            opcion.textContent = area.nombreArea;
            selectAreaDepartamento.appendChild(opcion);
        });
    } catch (error) {
        console.error(error);
        mostrarError('No se pudieron cargar las áreas');
    }
}
 
export async function cargarDepartamentos() {
    try {
        const departamentos = await getDepartamentos();
        departamentosActuales = departamentos || [];
        pintarTablaDepartamentos(departamentos);
        return departamentos;
    } catch (error) {
        console.error(error);
        mostrarError('No se pudieron cargar los departamentos');
        return [];
    }
}
 
function pintarTablaDepartamentos(departamentos) {
    tablaDepartamentosBody.innerHTML = '';
    ordenarLista(departamentos, ordenDepartamentos).forEach(dep => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td class="text-center">${dep.nombreDepartamento}</td>
            <td class="text-center">${dep.tipoDepartamento ?? ''}</td>
            <td class="text-center">${dep.nombreArea ?? ''}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary btn-editar-dep" data-id="${dep.idDepartamento}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-eliminar-dep" data-id="${dep.idDepartamento}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tablaDepartamentosBody.appendChild(fila);
    });
 
    document.querySelectorAll('.btn-editar-dep').forEach(btn =>
        btn.addEventListener('click', () => cargarDepartamentoEnFormulario(btn.dataset.id, departamentos))
    );
    document.querySelectorAll('.btn-eliminar-dep').forEach(btn =>
        btn.addEventListener('click', () => confirmarEliminarDepartamento(btn.dataset.id))
    );
}
 
function cargarDepartamentoEnFormulario(id, departamentos) {
    const dep = departamentos.find(d => d.idDepartamento == id);
    if (!dep) return;
 
    departamentoIdInput.value = dep.idDepartamento;
    nombreDepartamentoInput.value = dep.nombreDepartamento;
    if (dep.idArea) selectAreaDepartamento.value = dep.idArea;
    if (dep.tipoDepartamento) selectTipoDepartamento.value = dep.tipoDepartamento;
 
    tituloFormDepartamento.textContent = 'Editar departamento';
    btnTextoDepartamento.textContent = 'Actualizar departamento';
    btnCancelarDepartamento.style.display = 'block';
}
 
function limpiarFormularioDepartamento() {
    formDepartamento.reset();
    departamentoIdInput.value = '';
    tituloFormDepartamento.textContent = 'Agregar departamento';
    btnTextoDepartamento.textContent = 'Guardar departamento';
    btnCancelarDepartamento.style.display = 'none';
}
 
btnCancelarDepartamento.addEventListener('click', limpiarFormularioDepartamento);
 
formDepartamento.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    //Limpia marcas de error de un intento anterior
    document.querySelectorAll('#formDepartamento .is-invalid').forEach(el => el.classList.remove('is-invalid'));

    const departamento = {
        nombreDepartamento: nombreDepartamentoInput.value.trim(),
        tipoDepartamento: selectTipoDepartamento.value,
        idArea: Number(selectAreaDepartamento.value)
    };
    const id = departamentoIdInput.value;

    const errores = validarFormularioDepartamento(departamento);
    if (errores.length > 0) {
        errores.forEach(error => {
            const campo = document.getElementById(error.campo);
            if (campo) campo.classList.add('is-invalid');
        });
        mostrarError(errores.map(error => error.mensaje).join(' '));
        return;
    }

    const nombreNormalizado = departamento.nombreDepartamento.toLocaleLowerCase('es').replace(/\s+/g, ' ');
    const departamentoDuplicado = departamentosActuales.some(departamentoRegistrado =>
        String(departamentoRegistrado.idDepartamento) !== String(id) &&
        Number(departamentoRegistrado.idArea) === Number(departamento.idArea) &&
        String(departamentoRegistrado.nombreDepartamento).trim().toLocaleLowerCase('es').replace(/\s+/g, ' ') === nombreNormalizado
    );
    if (departamentoDuplicado) {
        mostrarError(`El departamento '${departamento.nombreDepartamento}' ya está registrado en el área seleccionada.`);
        return;
    }

    try {
        if (id) {
            await actualizarDepartamento(id, departamento);
            Swal.fire('Actualizado', 'El departamento se actualizó correctamente', 'success');
        } else {
            await crearDepartamento(departamento);
            Swal.fire('Creado', 'El departamento se creó correctamente', 'success');
        }
        limpiarFormularioDepartamento();
        recargarGestionUsuarios();
    } catch (error) {
        console.error(error);
        mostrarError(error.message || 'No se pudo guardar el departamento');
    }
});
 
function confirmarEliminarDepartamento(id) {
    Swal.fire({
        title: '¿Eliminar departamento?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (resultado) => {
        if (resultado.isConfirmed) {
            try {
                await eliminarDepartamento(id);
                Swal.fire('Eliminado', 'El departamento se eliminó correctamente', 'success');
                recargarGestionUsuarios();
            } catch (error) {
                console.error(error);
                mostrarError(error.message || 'No se pudo eliminar el departamento');
            }
        }
    });
}

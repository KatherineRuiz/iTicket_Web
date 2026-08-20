import { getDepartamentos, crearDepartamento, actualizarDepartamento, eliminarDepartamento } from '../services/departamentosService.js';
import { getAreas } from '../services/areasService.js';
 
const formDepartamento = document.getElementById('formDepartamento');
const departamentoIdInput = document.getElementById('departamentoId');
const nombreDepartamentoInput = document.getElementById('nombreDepartamento');
const selectAreaDepartamento = document.getElementById('selectAreaDepartamento');
const tituloFormDepartamento = document.getElementById('tituloFormDepartamento');
const btnTextoDepartamento = document.getElementById('btnTextoDepartamento');
const btnCancelarDepartamento = document.getElementById('btnCancelarDepartamento');
const tablaDepartamentosBody = document.getElementById('tablaDepartamentosBody');
 
document.addEventListener('DOMContentLoaded', async () => {
    await llenarSelectAreas();
    cargarDepartamentos();
});
 
async function llenarSelectAreas() {
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
        Swal.fire('Error', 'No se pudieron cargar las áreas', 'error');
    }
}
 
export async function cargarDepartamentos() {
    try {
        const departamentos = await getDepartamentos();
        pintarTablaDepartamentos(departamentos);
        return departamentos;
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron cargar los departamentos', 'error');
        return [];
    }
}
 
function pintarTablaDepartamentos(departamentos) {
    tablaDepartamentosBody.innerHTML = '';
    departamentos.forEach(dep => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td class="text-center">${dep.nombreDepartamento}</td>
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
 
    const departamento = {
        nombreDepartamento: nombreDepartamentoInput.value.trim(),
        idArea: Number(selectAreaDepartamento.value)
    };
    const id = departamentoIdInput.value;
 
    try {
        if (id) {
            await actualizarDepartamento(id, departamento);
            Swal.fire('Actualizado', 'El departamento se actualizó correctamente', 'success');
        } else {
            await crearDepartamento(departamento);
            Swal.fire('Creado', 'El departamento se creó correctamente', 'success');
        }
        limpiarFormularioDepartamento();
        cargarDepartamentos();
    } catch (error) {
        console.error(error);
        Swal.fire('Error', error.message || 'No se pudo guardar el departamento', 'error');
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
                cargarDepartamentos();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', error.message || 'No se pudo eliminar el departamento', 'error');
            }
        }
    });
}
import { getAreas, crearArea, actualizarArea, eliminarArea } from '../services/areasService.js';
 
const formArea = document.getElementById('formArea');
const areaIdInput = document.getElementById('areaId');
const nombreAreaInput = document.getElementById('nombreArea');
const tituloFormArea = document.getElementById('tituloFormArea');
const btnTextoArea = document.getElementById('btnTextoArea');
const btnCancelarArea = document.getElementById('btnCancelarArea');
const tablaAreasBody = document.getElementById('tablaAreasBody');
 
document.addEventListener('DOMContentLoaded', cargarAreas);
 
export async function cargarAreas() {
    try {
        const areas = await getAreas();
        pintarTablaAreas(areas);
        return areas;
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron cargar las áreas', 'error');
        return [];
    }
}
 
function pintarTablaAreas(areas) {
    tablaAreasBody.innerHTML = '';
    areas.forEach(area => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td class="text-center">${area.nombreArea}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary btn-editar-area" data-id="${area.idArea}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-eliminar-area" data-id="${area.idArea}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tablaAreasBody.appendChild(fila);
    });
 
    document.querySelectorAll('.btn-editar-area').forEach(btn =>
        btn.addEventListener('click', () => cargarAreaEnFormulario(btn.dataset.id, areas))
    );
    document.querySelectorAll('.btn-eliminar-area').forEach(btn =>
        btn.addEventListener('click', () => confirmarEliminarArea(btn.dataset.id))
    );
}
 
function cargarAreaEnFormulario(id, areas) {
    const area = areas.find(a => a.idArea == id);
    if (!area) return;
 
    areaIdInput.value = area.idArea;
    nombreAreaInput.value = area.nombreArea;
    tituloFormArea.textContent = 'Editar área';
    btnTextoArea.textContent = 'Actualizar área';
    btnCancelarArea.style.display = 'block';
}
 
function limpiarFormularioArea() {
    formArea.reset();
    areaIdInput.value = '';
    tituloFormArea.textContent = 'Agregar área';
    btnTextoArea.textContent = 'Guardar área';
    btnCancelarArea.style.display = 'none';
}
 
btnCancelarArea.addEventListener('click', limpiarFormularioArea);
 
formArea.addEventListener('submit', async (evento) => {
    evento.preventDefault();
 
    const area = { nombreArea: nombreAreaInput.value.trim() };
    const id = areaIdInput.value;
 
    try {
        if (id) {
            await actualizarArea(id, area);
            Swal.fire('Actualizada', 'El área se actualizó correctamente', 'success');
        } else {
            await crearArea(area);
            Swal.fire('Creada', 'El área se creó correctamente', 'success');
        }
        limpiarFormularioArea();
        cargarAreas();
    } catch (error) {
        console.error(error);
        Swal.fire('Error', error.message || 'No se pudo guardar el área', 'error');
    }
});
 
function confirmarEliminarArea(id) {
    Swal.fire({
        title: '¿Eliminar área?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (resultado) => {
        if (resultado.isConfirmed) {
            try {
                await eliminarArea(id);
                Swal.fire('Eliminada', 'El área se eliminó correctamente', 'success');
                cargarAreas();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', error.message || 'No se pudo eliminar el área', 'error');
            }
        }
    });
}
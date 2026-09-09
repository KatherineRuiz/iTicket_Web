import { getAreas, crearArea, actualizarArea, eliminarArea } from '../services/areasService.js';
import { validarFormularioArea } from '../validators/areasValidator.js';
import { mostrarError } from '../components/sweetAlerts.js';
 
const formArea = document.getElementById('formArea');
const areaIdInput = document.getElementById('areaId');
const nombreAreaInput = document.getElementById('nombreArea');
const tituloFormArea = document.getElementById('tituloFormArea');
const btnTextoArea = document.getElementById('btnTextoArea');
const btnCancelarArea = document.getElementById('btnCancelarArea');
const tablaAreasBody = document.getElementById('tablaAreasBody');
let areasActuales = [];

// Cualquier CRUD relacionado emite este evento para actualizar todas las
// tablas de la pantalla sin que el usuario tenga que recargar el navegador
window.addEventListener('iticket:recargar-tablas-usuarios', cargarAreas);

function recargarGestionUsuarios() {
    window.dispatchEvent(new CustomEvent('iticket:recargar-tablas-usuarios'));
}
 
document.addEventListener('DOMContentLoaded', cargarAreas);
 
export async function cargarAreas() {
    try {
        const areas = await getAreas();
        areasActuales = areas || [];
        pintarTablaAreas(areas);
        return areas;
    } catch (error) {
        console.error(error);
        mostrarError('No se pudieron cargar las áreas');
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

    //Limpia marcas de error de un intento anterior
    document.querySelectorAll('#formArea .is-invalid').forEach(el => el.classList.remove('is-invalid'));

    const area = { nombreArea: nombreAreaInput.value.trim() };
    const id = areaIdInput.value;

    const errores = validarFormularioArea(area);
    if (errores.length > 0) {
        errores.forEach(error => {
            const campo = document.getElementById(error.campo);
            if (campo) campo.classList.add('is-invalid');
        });
        mostrarError(errores.map(error => error.mensaje).join(' '));
        return;
    }

    const nombreNormalizado = area.nombreArea.toLocaleLowerCase('es').replace(/\s+/g, ' ');
    const areaDuplicada = areasActuales.some(areaRegistrada =>
        String(areaRegistrada.idArea) !== String(id) &&
        String(areaRegistrada.nombreArea).trim().toLocaleLowerCase('es').replace(/\s+/g, ' ') === nombreNormalizado
    );
    if (areaDuplicada) {
        mostrarError(`El área '${area.nombreArea}' ya está registrada.`);
        return;
    }

    try {
        if (id) {
            await actualizarArea(id, area);
            Swal.fire('Actualizada', 'El área se actualizó correctamente', 'success');
        } else {
            await crearArea(area);
            Swal.fire('Creada', 'El área se creó correctamente', 'success');
        }
        limpiarFormularioArea();
        recargarGestionUsuarios();
    } catch (error) {
        console.error(error);
        mostrarError(error.message || 'No se pudo guardar el área');
    }
});
 
function confirmarEliminarArea(id) {
    const areaSeleccionada = areasActuales.find(area => String(area.idArea) === String(id));
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
                recargarGestionUsuarios();
            } catch (error) {
                console.error(error);
                if (/no se puede eliminar|siendo (usado|utilizado)|dependiente|child record/i.test(error.message || '')) {
                    const nombreArea = areaSeleccionada?.nombreArea || 'seleccionada';
                    mostrarError(`El área '${nombreArea}' no se puede eliminar porque tiene departamentos asociados.`);
                    return;
                }
                mostrarError(error.message || 'No se pudo eliminar el área');
            }
        }
    });
}

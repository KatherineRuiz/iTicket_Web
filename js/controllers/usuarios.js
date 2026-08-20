import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../services/usuariosService.js';
import { getDepartamentos } from '../services/departamentosService.js';
 
const formUsuario = document.getElementById('formUsuario');
const usuarioIdInput = document.getElementById('usuarioId');
const nombreUsuarioInput = document.getElementById('nombreUsuario');
const selectRol = document.getElementById('selectRol');
const correoUsuarioInput = document.getElementById('correoUsuario');
const passwordUsuarioInput = document.getElementById('passwordUsuario');
const selectDepartamentoUsuario = document.getElementById('selectDepartamentoUsuario');
const campoEstadoUsuario = document.getElementById('campoEstadoUsuario');
const selectEstadoUsuario = document.getElementById('selectEstadoUsuario');
const tituloFormUsuario = document.getElementById('tituloFormUsuario');
const btnTextoUsuario = document.getElementById('btnTextoUsuario');
const btnCancelarUsuario = document.getElementById('btnCancelarUsuario');
const tablaUsuariosBody = document.getElementById('tablaUsuariosBody');
 
document.addEventListener('DOMContentLoaded', async () => {
    await llenarSelectDepartamentos();
    cargarUsuarios();
});
 
async function llenarSelectDepartamentos() {
    try {
        const departamentos = await getDepartamentos();
        selectDepartamentoUsuario.innerHTML = '<option selected disabled>Selecciona el departamento...</option>';
        departamentos.forEach(dep => {
            const opcion = document.createElement('option');
            opcion.value = dep.idDepartamento;
            opcion.textContent = dep.nombreDepartamento;
            selectDepartamentoUsuario.appendChild(opcion);
        });
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron cargar los departamentos', 'error');
    }
}
 
async function cargarUsuarios() {
    try {
        const usuarios = await getUsuarios();
        pintarTablaUsuarios(usuarios);
        return usuarios;
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
        return [];
    }
}
 
function pintarTablaUsuarios(usuarios) {
    tablaUsuariosBody.innerHTML = '';
    usuarios.forEach(usuario => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td class="text-center">${usuario.nombreUsuario}</td>
            <td class="text-center">${usuario.nombreRol ?? ''}</td>
            <td class="text-center">${usuario.nombreDepartamento ?? ''}</td>
            <td class="text-center">${usuario.estado === 'F' ? 'Inactivo' : 'Activo'}</td>
            <td class="text-center">${usuario.correo}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary btn-editar-usuario" data-id="${usuario.idUsuario}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-eliminar-usuario" data-id="${usuario.idUsuario}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tablaUsuariosBody.appendChild(fila);
    });
 
    document.querySelectorAll('.btn-editar-usuario').forEach(btn =>
        btn.addEventListener('click', () => cargarUsuarioEnFormulario(btn.dataset.id, usuarios))
    );
    document.querySelectorAll('.btn-eliminar-usuario').forEach(btn =>
        btn.addEventListener('click', () => confirmarEliminarUsuario(btn.dataset.id))
    );
}
 
function cargarUsuarioEnFormulario(id, usuarios) {
    const usuario = usuarios.find(u => u.idUsuario == id);
    if (!usuario) return;
 
    usuarioIdInput.value = usuario.idUsuario;
    nombreUsuarioInput.value = usuario.nombreUsuario;
    correoUsuarioInput.value = usuario.correo;
    passwordUsuarioInput.value = '';
    passwordUsuarioInput.required = false;
    passwordUsuarioInput.placeholder = 'Dejar en blanco para no cambiarla';
 
    if (usuario.idRol) selectRol.value = usuario.idRol;
    if (usuario.idDepartamento) selectDepartamentoUsuario.value = usuario.idDepartamento;
 
    campoEstadoUsuario.style.display = 'block';
    selectEstadoUsuario.value = usuario.estado === 'F' ? 'inactivo' : 'activo';
 
    tituloFormUsuario.textContent = 'Editar usuario';
    btnTextoUsuario.textContent = 'Actualizar usuario';
    btnCancelarUsuario.style.display = 'block';
}
 
function limpiarFormularioUsuario() {
    formUsuario.reset();
    usuarioIdInput.value = '';
    passwordUsuarioInput.required = true;
    passwordUsuarioInput.placeholder = 'Mínimo 8 caracteres';
    campoEstadoUsuario.style.display = 'none';
    tituloFormUsuario.textContent = 'Agregar usuario';
    btnTextoUsuario.textContent = 'Guardar usuario';
    btnCancelarUsuario.style.display = 'none';
}
 
btnCancelarUsuario.addEventListener('click', limpiarFormularioUsuario);
 
formUsuario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
 
    const id = usuarioIdInput.value;
 
    const usuario = {
        nombreUsuario: nombreUsuarioInput.value.trim(),
        correo: correoUsuarioInput.value.trim(),
        idRol: Number(selectRol.value),
        idDepartamento: Number(selectDepartamentoUsuario.value),
        estado: 'T' // Los usuarios nuevos se crean activos por defecto (el campo Estado va oculto al crear)
    };
    if (passwordUsuarioInput.value.trim()) {
        usuario.clave = passwordUsuarioInput.value.trim();
    }

    if (id) {
        usuario.estado = selectEstadoUsuario.value === 'activo' ? 'T' : 'F';
    }
 
    try {
        if (id) {
            await actualizarUsuario(id, usuario);
            Swal.fire('Actualizado', 'El usuario se actualizó correctamente', 'success');
        } else {
            await crearUsuario(usuario);
            Swal.fire('Creado', 'El usuario se creó correctamente', 'success');
        }
        limpiarFormularioUsuario();
        cargarUsuarios();
    } catch (error) {
        console.error(error);
        Swal.fire('Error', error.message || 'No se pudo guardar el usuario', 'error');
    }
});
 
function confirmarEliminarUsuario(id) {
    Swal.fire({
        title: '¿Eliminar usuario?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (resultado) => {
        if (resultado.isConfirmed) {
            try {
                await eliminarUsuario(id);
                Swal.fire('Eliminado', 'El usuario se eliminó correctamente', 'success');
                cargarUsuarios();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', error.message || 'No se pudo eliminar el usuario', 'error');
            }
        }
    });
}
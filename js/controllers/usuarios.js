import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../services/usuariosService.js';
import { getDepartamentos } from '../services/departamentosService.js';
import { getRoles } from '../services/rolesService.js';
import { validarFormularioUsuario } from '../validators/usuariosValidator.js';
import { mostrarError } from '../components/sweetAlerts.js';
 
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
let usuariosActuales = [];

// Áreas, departamentos y usuarios comparten este evento de actualización.
window.addEventListener('iticket:recargar-tablas-usuarios', () => {
    cargarUsuarios();
    llenarSelectDepartamentos();
});

function recargarGestionUsuarios() {
    window.dispatchEvent(new CustomEvent('iticket:recargar-tablas-usuarios'));
}

// Nombres guardados en BD frente a su escritura visual. La base conserva
// "Tecnico" sin tilde por su restricción CHECK, pero la interfaz sí la muestra.
const NOMBRES_ROL_VISUAL = {
    Tecnico: 'Técnico'
};

function formatearNombreRol(nombreRol) {
    return NOMBRES_ROL_VISUAL[nombreRol] ?? nombreRol;
}

document.addEventListener('DOMContentLoaded', async () => {
    await llenarSelectRoles();
    await llenarSelectDepartamentos();
    cargarUsuarios();
});

async function llenarSelectRoles() {
    try {
        const roles = await getRoles();
        selectRol.innerHTML = '<option value="" selected disabled>Selecciona el rol...</option>';
        roles.forEach(rol => {
            const opcion = document.createElement('option');
            opcion.value = rol.idRol;
            opcion.textContent = formatearNombreRol(rol.nombreRol);
            selectRol.appendChild(opcion);
        });
    } catch (error) {
        console.error(error);
        mostrarError(error.message || 'No se pudieron cargar los roles');
    }
}

export async function llenarSelectDepartamentos() {
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
        mostrarError(error.message || 'No se pudieron cargar los departamentos');
    }
}
 
async function cargarUsuarios() {
    try {
        const usuarios = await getUsuarios();
        usuariosActuales = usuarios || [];
        pintarTablaUsuarios(usuarios);
        return usuarios;
    } catch (error) {
        console.error(error);
        mostrarError(error.message || 'No se pudieron cargar los usuarios');
        return [];
    }
}
 
function pintarTablaUsuarios(usuarios) {
    tablaUsuariosBody.innerHTML = '';
    usuarios.forEach(usuario => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td class="text-center">${usuario.nombreUsuario}</td>
            <td class="text-center">${usuario.nombreRol ? formatearNombreRol(usuario.nombreRol) : ''}</td>
            <td class="text-center">${usuario.nombreDepartamento ?? ''}</td>
            <td class="text-center">${usuario.estado === false ? 'Inactivo' : 'Activo'}</td>
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
    selectEstadoUsuario.value = usuario.estado === false ? 'inactivo' : 'activo';
 
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

    //Limpia marcas de error de un intento anterior
    document.querySelectorAll('#formUsuario .is-invalid').forEach(el => el.classList.remove('is-invalid'));

    const id = usuarioIdInput.value;

    const usuario = {
        nombreUsuario: nombreUsuarioInput.value.trim(),
        correo: correoUsuarioInput.value.trim(),
        idRol: Number(selectRol.value),
        idDepartamento: Number(selectDepartamentoUsuario.value),
        estado: true // Los usuarios nuevos se crean activos por defecto (el campo Estado va oculto al crear)
    };
    if (passwordUsuarioInput.value.trim()) {
        usuario.clave = passwordUsuarioInput.value.trim();
    }

    if (id) {
        usuario.estado = selectEstadoUsuario.value === 'activo';
    }

    const errores = validarFormularioUsuario(usuario, Boolean(id));
    if (errores.length > 0) {
        errores.forEach(error => {
            const campo = document.getElementById(error.campo);
            if (campo) campo.classList.add('is-invalid');
        });
        mostrarError(errores.map(error => error.mensaje).join(' '));
        return;
    }

    const correoNormalizado = usuario.correo.toLocaleLowerCase('es');
    const correoDuplicado = usuariosActuales.some(usuarioRegistrado =>
        String(usuarioRegistrado.idUsuario) !== String(id) &&
        String(usuarioRegistrado.correo).trim().toLocaleLowerCase('es') === correoNormalizado
    );
    if (correoDuplicado) {
        mostrarError(`El correo '${usuario.correo}' ya está registrado.`);
        return;
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
        recargarGestionUsuarios();
    } catch (error) {
        console.error(error);
        mostrarError(error.message || 'No se pudo guardar el usuario');
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
                recargarGestionUsuarios();
            } catch (error) {
                console.error(error);
                mostrarError(error.message || 'No se pudo eliminar el usuario');
            }
        }
    });
}

// vistaTicket.js

document.addEventListener("DOMContentLoaded", function () {
    const botonEditar = document.getElementById('editarTicket');
    const botonEditarSuperior = document.getElementById('editarTicketSuperior'); // Botón superior
    const contenedorBotonEditarSuperior = document.getElementById('contenedorBotonEditarSuperior');
    const vistaEstatica = document.getElementById('modoVistaContenido');
    const vistaFormulario = document.getElementById('modoEdicionContenido');
    const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');
    const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');

    let esModoEdicion = false;

    function actualizarInterfazEdicion(editando) {
        if (editando) {
            if (vistaEstatica) vistaEstatica.classList.add('d-none');
            if (botonEditar) botonEditar.classList.add('d-none')
            if (contenedorBotonEditarSuperior) contenedorBotonEditarSuperior.classList.add('d-none');
            if (botonEditarSuperior) botonEditarSuperior.classList.add('d-none'); // Ocultar superior
            if (vistaFormulario) vistaFormulario.classList.remove('d-none');
        } else {
            if (vistaFormulario) vistaFormulario.classList.add('d-none');
            if (vistaEstatica) vistaEstatica.classList.remove('d-none');
            if (contenedorBotonEditarSuperior) contenedorBotonEditarSuperior.classList.remove('d-none');
            if (botonEditar) botonEditar.classList.remove('d-none'); // Mostrar superior
        }
    }

    if (botonEditar) {
        botonEditar.addEventListener('click', function (e) {
            e.preventDefault();
            esModoEdicion = !esModoEdicion;
            actualizarInterfazEdicion(esModoEdicion);
        });
    }

    if (botonEditarSuperior) {
        botonEditarSuperior.addEventListener('click', function (e) {
            e.preventDefault();
            esModoEdicion = !esModoEdicion;
            actualizarInterfazEdicion(esModoEdicion);
        });
    }

    if (btnCancelarEdicion) {
        btnCancelarEdicion.addEventListener('click', function (e) {
            e.preventDefault();
            esModoEdicion = !esModoEdicion;
            actualizarInterfazEdicion(esModoEdicion);
        });
    }

    if (btnGuardarEdicion) {
        btnGuardarEdicion.addEventListener('click', function (e) {
            e.preventDefault();
            esModoEdicion = !esModoEdicion;
            actualizarInterfazEdicion(esModoEdicion);
        });
    }
});
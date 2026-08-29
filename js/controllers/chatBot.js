const txtChat = document.getElementById('txtChat');
const cuerpoChat = document.getElementById('cuerpoChat');
const btnEnviar = document.getElementById('btnEnviar');

const RESPUESTAS_PREDETERMINADAS = {
    btnSugerencia1: {
        pregunta: 'Ver resumen de los tickets activos',
        respuesta: `
            <p>Actualmente existen 31 tickets aprobados y 5 a espera de ser aprobados.
            Los tickets aprobados y activos se clasifican en:</p>
            <ul class="mb-0">
                <li>10 tickets asignados</li>
                <li>15 tickets en progreso</li>
                <li>2 tickets en espera</li>
                <li>4 tickets resueltos</li>
            </ul>`
    },
    btnSugerencia2: {
        pregunta: 'Ver los tickets con calificaciones bajas en el mes',
        respuesta: `
            <p>En el mes de junio hubo 25 tickets con calificaciones bajas y regulares.</p>
            <ul class="mb-0">
                <li>5 tickets con 1 estrella</li>
                <li>14 tickets con 2 estrellas</li>
                <li>6 tickets con 3 estrellas</li>
            </ul>`
    },
    btnSugerencia3: {
        pregunta: 'Ver las ubicaciones con mayor cantidad de tickets este mes',
        respuesta: `
            <ul class="mb-0">
                <li><strong>Laboratorio 2:</strong> 11 tickets</li>
                <li><strong>Laboratorio Cisco:</strong> 9 tickets</li>
                <li><strong>Salón 2.2.16:</strong> 6 tickets</li>
                <li><strong>Administración:</strong> 5 tickets</li>
            </ul>`
    }
};

// El popover es informativo; si Bootstrap no cargó, el chat sigue funcionando.
if (window.bootstrap?.Popover) {
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((elemento) => {
        new bootstrap.Popover(elemento);
    });
}

// El campo crece con el texto hasta el límite visual definido en CSS.
txtChat?.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = `${this.scrollHeight}px`;
    this.style.overflowY = this.scrollHeight >= 120 ? 'auto' : 'hidden';
});

Object.entries(RESPUESTAS_PREDETERMINADAS).forEach(([idBoton, contenido]) => {
    document.getElementById(idBoton)?.addEventListener('click', () => {
        mostrarConsultaPredeterminada(contenido.pregunta, contenido.respuesta);
    });
});

/** Muestra la pregunta, una espera breve y la respuesta fija asociada. */
function mostrarConsultaPredeterminada(pregunta, respuesta) {
    agregarMensajeUsuario(pregunta);
    const espera = agregarIndicadorEscritura();

    window.setTimeout(() => {
        espera.remove();
        agregarMensajeBot(respuesta);
    }, 700);
}

/** Agrega un mensaje escrito por el usuario sin enviarlo a ningún servicio. */
function agregarMensajeUsuario(texto) {
    cuerpoChat.insertAdjacentHTML('beforeend', `
        <div class="d-flex justify-content-end align-items-end gap-2">
            <div class="mensaje usuario animar-mensaje"></div>
            <img src="img/user-oscuro.png" alt="Foto de perfil" class="perfil-usuario">
        </div>`);
    cuerpoChat.lastElementChild.querySelector('.mensaje').textContent = texto;
    desplazarAlFinal();
}

/** Agrega una respuesta que pertenece al catálogo fijo de sugerencias. */
function agregarMensajeBot(contenido) {
    cuerpoChat.insertAdjacentHTML('beforeend', `
        <div class="d-flex align-items-end gap-3">
            ${crearIconoBot()}
            <div class="mensaje bot animar-mensaje shadow-sm">${contenido}</div>
        </div>`);
    desplazarAlFinal();
}

/** Crea un indicador visual sin utilizar IDs repetidos en el documento. */
function agregarIndicadorEscritura() {
    const fila = document.createElement('div');
    fila.className = 'd-flex align-items-center gap-3 indicador-escritura';
    fila.innerHTML = `${crearIconoBot()}<span class="puntos-escritura" aria-label="Botick está escribiendo"><i></i><i></i><i></i></span>`;
    cuerpoChat.appendChild(fila);
    desplazarAlFinal();
    return fila;
}

function crearIconoBot() {
    return '<span class="perfil-bot rounded-pill" aria-hidden="true"><i class="bi bi-robot"></i></span>';
}

// Los mensajes libres quedan visibles, como en la maqueta original, pero no se
// inventa una respuesta mientras no exista la integración definitiva.
function enviarMensaje() {
    const mensaje = txtChat.value.trim();
    if (!mensaje) return;
    agregarMensajeUsuario(mensaje);
    txtChat.value = '';
    txtChat.style.height = 'auto';
}

function desplazarAlFinal() {
    cuerpoChat.scrollTop = cuerpoChat.scrollHeight;
}

btnEnviar?.addEventListener('click', enviarMensaje);
txtChat?.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' && !evento.shiftKey) {
        evento.preventDefault();
        enviarMensaje();
    }
});
const txtChat = document.getElementById('txtChat');
const cuerpoChat = document.getElementById('cuerpoChat');
const btnSugerencia1 = document.getElementById('btnSugerencia1');
const btnSugerencia2 = document.getElementById('btnSugerencia2');
const btnSugerencia3 = document.getElementById('btnSugerencia3');
const btnEnviar = document.getElementById('btnEnviar');
//Para inicializar el popover
const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))

//Evento para que el input del chat crezca junto al texto
txtChat.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';

    //Límite de 150px definidos en CSS
    if (this.scrollHeight >= 120) {
        this.style.overflowY = 'auto';
    } else {
        this.style.overflowY = 'hidden';
    }
});

/*Evento para la sugerencia 1*/
btnSugerencia1.addEventListener('click', function () {

    /*Para agregar al final sin redibujar todos los mensajes anteriores*/
    cuerpoChat.insertAdjacentHTML('beforeend', `
        <!--Mensaje del usuario-->
        <div class="d-flex justify-content-end align-items-end gap-2">
            <div class="mensaje usuario animar-mensaje ">
                Ver resumen de los tickets activos
            </div>
            <img src="img/user-oscuro.png" alt="Foto de perfil" class="perfil-usuario" id="imgPerfil">
        </div>
        <div class="spinner-border text-primary text-opacity-25" role="status" id='spinner'>
            <span class="visually-hidden">Loading...</span>
        </div>
    `);
    //Para que el scroll se adapta y se mueva al nuevo mensaje
    cuerpoChat.scrollTop = cuerpoChat.scrollHeight;

    setTimeout(function () {
        const spinner = document.getElementById('spinner');

        if (spinner) {
            spinner.remove();
        }
        cuerpoChat.insertAdjacentHTML('beforeend', `
        <!--Mensaje del bot-->
            <div class="d-flex align-items-end gap-3">
                <div class="perfil-bot p-2 rounded-pill">
                    <svg width="22" height="25" viewBox="0 0 52 46" fill="none" xmlns="http://www.w3.org/2000/svg"
                        class="d-flex chatbot-svg">
                        <path
                            d="M26 10.844V2H16.4M33.2 21.899V26.321M2 24.11H6.8M45.2 24.11H50M18.8 21.899V26.321M45.2 32.954C45.2 34.1268 44.6943 35.2516 43.7941 36.0809C42.8939 36.9101 41.673 37.376 40.4 37.376H18.3872C17.1143 37.3763 15.8936 37.8423 14.9936 38.6717L9.7088 43.5403C9.47049 43.7598 9.16689 43.9093 8.83637 43.9698C8.50586 44.0304 8.16328 43.9993 7.85194 43.8805C7.5406 43.7617 7.27449 43.5605 7.08725 43.3024C6.9 43.0443 6.80004 42.7408 6.8 42.4304V15.266C6.8 14.0932 7.30571 12.9685 8.20589 12.1392C9.10606 11.3099 10.327 10.844 11.6 10.844H40.4C41.673 10.844 42.8939 11.3099 43.7941 12.1392C44.6943 12.9685 45.2 14.0932 45.2 15.266V32.954Z"
                            stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>
                <div class="mensaje bot animar-mensaje shadow-sm">
                    <p>
                        Actualmente existen 31 tickets aprobados y 5 a espera de ser aprobados. 
                        Los tickest aprovados y activos se clasifican en:
                        <ul>
                            <li>10 Tickets asignados</li>
                            <li>15 Tickets en progreso</li>
                            <li>2 Tickets en espera</li>
                            <li>4 Tickets resueltos</li>
                        </ul>
                    </p>
                </div>
            </div>
        `
        );
        cuerpoChat.scrollTop = cuerpoChat.scrollHeight;
    }, 2000);

});

/*Evento para la sugerencia 2*/
btnSugerencia2.addEventListener('click', function () {
    cuerpoChat.scrollTop = cuerpoChat.scrollHeight;

    cuerpoChat.insertAdjacentHTML('beforeend', `
        <!--Mensaje del usuario-->
        <div class="d-flex justify-content-end align-items-end gap-2">
            <div class="mensaje usuario animar-mensaje ">
                Ver los tickets con calificaciones bajas en el mes
            </div>
            <img src="img/user-oscuro.png" alt="Foto de perfil" class="perfil-usuario" id="imgPerfil">
        </div>
        <div class="spinner-border text-primary text-opacity-25" role="status" id='spinner'>
            <span class="visually-hidden">Loading...</span>
        </div>
    `);
    cuerpoChat.scrollTop = cuerpoChat.scrollHeight;

    setTimeout(function () {
        const spinner = document.getElementById('spinner');

        if (spinner) {
            spinner.remove();
        }
        cuerpoChat.insertAdjacentHTML('beforeend', `
        <!--Mensaje del bot-->
            <div class="d-flex align-items-end gap-3">
                <div class="perfil-bot p-2 rounded-pill">
                    <svg width="22" height="25" viewBox="0 0 52 46" fill="none" xmlns="http://www.w3.org/2000/svg"
                        class="d-flex chatbot-svg">
                        <path
                            d="M26 10.844V2H16.4M33.2 21.899V26.321M2 24.11H6.8M45.2 24.11H50M18.8 21.899V26.321M45.2 32.954C45.2 34.1268 44.6943 35.2516 43.7941 36.0809C42.8939 36.9101 41.673 37.376 40.4 37.376H18.3872C17.1143 37.3763 15.8936 37.8423 14.9936 38.6717L9.7088 43.5403C9.47049 43.7598 9.16689 43.9093 8.83637 43.9698C8.50586 44.0304 8.16328 43.9993 7.85194 43.8805C7.5406 43.7617 7.27449 43.5605 7.08725 43.3024C6.9 43.0443 6.80004 42.7408 6.8 42.4304V15.266C6.8 14.0932 7.30571 12.9685 8.20589 12.1392C9.10606 11.3099 10.327 10.844 11.6 10.844H40.4C41.673 10.844 42.8939 11.3099 43.7941 12.1392C44.6943 12.9685 45.2 14.0932 45.2 15.266V32.954Z"
                            stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>
                <div class="mensaje bot animar-mensaje shadow-sm">
                    <p>
                        En el mes de junio hubieron 25 tickets con calificaciones bajas y regulares.
                        <ul>
                            <li>5 Tickets con 1 estrella</li>
                            <li>14 Tickets con 2 estrellas</li>
                            <li>6 Tickets con 3 estrellas</li>
                        </ul>
                    </p>
                </div>
            </div>
        `
        );
        cuerpoChat.scrollTop = cuerpoChat.scrollHeight;
    }, 2000);

});

/*Evento para la sugerencia 3*/
btnSugerencia3.addEventListener('click', function () {
    cuerpoChat.scrollTop = cuerpoChat.scrollHeight;

    cuerpoChat.insertAdjacentHTML('beforeend', `
        <!--Mensaje del usuario-->
        <div class="d-flex justify-content-end align-items-end gap-2">
            <div class="mensaje usuario animar-mensaje ">
               Ver las ubicaciones con mayor cantidad de tickets este mes
            </div>
            <img src="img/user-oscuro.png" alt="Foto de perfil" class="perfil-usuario" id="imgPerfil">
        </div>
        <div class="spinner-border text-primary text-opacity-25" role="status" id='spinner'>
            <span class="visually-hidden">Loading...</span>
        </div>
    `);
    cuerpoChat.scrollTop = cuerpoChat.scrollHeight;

    setTimeout(function () {
        const spinner = document.getElementById('spinner');

        if (spinner) {
            spinner.remove();
        }
        cuerpoChat.insertAdjacentHTML('beforeend', `
        <!--Mensaje del bot-->
            <div class="d-flex align-items-end gap-3">
                <div class="perfil-bot p-2 rounded-pill">
                    <svg width="22" height="25" viewBox="0 0 52 46" fill="none" xmlns="http://www.w3.org/2000/svg"
                        class="d-flex chatbot-svg">
                        <path
                            d="M26 10.844V2H16.4M33.2 21.899V26.321M2 24.11H6.8M45.2 24.11H50M18.8 21.899V26.321M45.2 32.954C45.2 34.1268 44.6943 35.2516 43.7941 36.0809C42.8939 36.9101 41.673 37.376 40.4 37.376H18.3872C17.1143 37.3763 15.8936 37.8423 14.9936 38.6717L9.7088 43.5403C9.47049 43.7598 9.16689 43.9093 8.83637 43.9698C8.50586 44.0304 8.16328 43.9993 7.85194 43.8805C7.5406 43.7617 7.27449 43.5605 7.08725 43.3024C6.9 43.0443 6.80004 42.7408 6.8 42.4304V15.266C6.8 14.0932 7.30571 12.9685 8.20589 12.1392C9.10606 11.3099 10.327 10.844 11.6 10.844H40.4C41.673 10.844 42.8939 11.3099 43.7941 12.1392C44.6943 12.9685 45.2 14.0932 45.2 15.266V32.954Z"
                            stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>
                <div class="mensaje bot animar-mensaje shadow-sm">
                    <p>
                        <ul>
                            <li><strong>Laboratorio 2:</strong> 11 tickets</li>
                            <li><strong>Laboratorio Cisco:</strong> 9 tickets</li>
                            <li><strong>Salón 2.2.16:</strong> 6 tickets</li>
                            <li><strong>Administración:</strong> 5 tickets</li>
                        </ul>
                    </p>
                </div>
            </div>
        `
        );
        cuerpoChat.scrollTop = cuerpoChat.scrollHeight;
    }, 2000);

});

//Para capturar y enviar la consulta
function enviarMensaje() {
    const txtMensaje = txtChat.value.trim();

    // Validamos que el usuario no envíe un mensaje vacío
    if (txtMensaje === "") {
        return;
    }

    cuerpoChat.insertAdjacentHTML('beforeend', `
        <!--Mensaje del usuario-->
        <div class="d-flex justify-content-end align-items-end gap-2">
            <div class="mensaje usuario animar-mensaje ">
               ${txtMensaje}
            </div>
            <img src="img/user-oscuro.png" alt="Foto de perfil" class="perfil-usuario" id="imgPerfil">
        </div>
        <div class="spinner-border text-primary text-opacity-25" role="status" id='spinner'>
            <span class="visually-hidden">Loading...</span>
        </div>
    `);

    txtChat.value = "";
    txtChat.style.height = 'auto';
    cuerpoChat.scrollTop = cuerpoChat.scrollHeight;

    /*Para borrar el spinner(temporar)*/
    setTimeout(function () {
        const spinner = document.getElementById('spinner');

        if (spinner) {
            spinner.remove();
        }
    }, 2000);
}

btnEnviar.addEventListener('click', enviarMensaje);

txtChat.addEventListener('keydown', function (event) {
    //Para verificar que la tecla presionada es Enter y no se esta presionando Shift
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        enviarMensaje();
    }
});
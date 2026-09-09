//====================================================================================
//AQUI SE ENCUNTRAN TODOS LOS ALERTAS DE SWEETALERTS 
//====================================================================================
//asi evistamos escribirlas cada que las necesitemos usar y asi simplemente
//  modificamos el mensaje o la redireccion en el controller

function convertirMensajeTecnico(mensaje) {
    const texto = String(mensaje || "").trim();
    if (!texto) return "No se pudo completar la operación.";

    if (/restricci[oó]n [uú]nica|unique constraint|ora-00001/i.test(texto)) {
        return "Ese dato ya está registrado.";
    }
    if (/ora-02292|integrity constraint.*child record|no se puede eliminar|est[aá] siendo (usado|utilizado)|llave for[aá]nea dependiente/i.test(texto)) {
        return "No se puede eliminar porque este registro está siendo utilizado en otra parte del sistema.";
    }
    if (/ora-02291|foreign key|llave for[aá]nea/i.test(texto)) {
        return "Uno de los datos seleccionados ya no existe. Actualiza la página y vuelve a intentarlo.";
    }
    if (/ora-01400|cannot insert null|not-null property/i.test(texto)) {
        return "Falta completar un campo obligatorio.";
    }
    if (/ora-02290|check constraint/i.test(texto)) {
        return "Uno de los datos ingresados no tiene un valor permitido.";
    }
    if (/failed to fetch|networkerror|load failed/i.test(texto)) {
        return "No se pudo conectar con el servidor. Comprueba que la API esté encendida e inténtalo nuevamente.";
    }
    if (/ora-\d+|sqlexception|jdbc|hibernate|stack trace|java\.[a-z]/i.test(texto)) {
        return "No se pudo completar la operación. Revisa los datos e inténtalo nuevamente.";
    }

    return texto;
}

export function mostrarExitoRedireccion(titulo, mensaje, urlDestino) {
    Swal.fire({
        title: titulo,
        text: mensaje,
        icon: "success",
        draggable: true,
    }).then(function () {
        window.location.href = urlDestino;
    });
}

export function mostrarErrorRedireccion(titulo, mensaje, urlDestino) {
    Swal.fire({
        title: "Oops...",
        text: convertirMensajeTecnico(mensaje),
        icon: "error",
    }).then(function () {
        window.location.href = urlDestino;
    });
}

export function mostrarExitoSimple(titulo, mensaje) {
    Swal.fire({
        title: titulo,
        text: mensaje,
        icon: "success",
        draggable: true
    });
}

export function mostrarError(mensaje, pieDePagina = false) {
    const configuracionAlerta = {
        icon: "error",
        title: "Oops...",
        text: convertirMensajeTecnico(mensaje),
    };

    if (pieDePagina) {
        configuracionAlerta.footer = pieDePagina;
    }

    Swal.fire(configuracionAlerta);
}

export function mostrarAlertaEspera(tiempoRestante, titulo = "¡Espera un momento!", mensaje = "Aún debes esperar antes de solicitar otro código.") {
    Swal.fire({
        title: titulo,
        text: mensaje,
        icon: "warning",
        timer: tiempoRestante,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
}

export function mostrarConfirmacion(titulo, mensaje, textoBotonConfirmar = "Sí, continuar", textoBotonCancelar = "Cancelar") {
    return Swal.fire({
        title: titulo || "¿Estás seguro?",
        text: mensaje,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#4393f6",
        cancelButtonColor: "#121F48",
        cancelButtonText: textoBotonCancelar,
        confirmButtonText: textoBotonConfirmar,
        draggable: true
    }).then((result) => {
        return result.isConfirmed;
    });
}

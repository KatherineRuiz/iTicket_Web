//====================================================================================
//AQUI SE ENCUNTRAN TODOS LOS ALERTAS DE SWEETALERTS 
//====================================================================================
//asi evistamos escribirlas cada que las necesitemos usar y asi simplemente
//  modificamos el mensaje o la redireccion en el controller

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
        text: mensaje || "¡Algo salió mal!",
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
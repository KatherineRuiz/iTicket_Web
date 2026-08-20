//Validar comentario de ticket
export function validarFormularioComentario(comentario) {
    const errores = [];

    if (!comentario || !comentario.trim()) {
        errores.push({ campo: "txtComentario", mensaje: "Debes escribir un comentario." });
    } else if (comentario.length > 500) {
        errores.push({ campo: "txtComentario", mensaje: "El comentario superar los 500 caracteres." });
    }

    return errores;
}
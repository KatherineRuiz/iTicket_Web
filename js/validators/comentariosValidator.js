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

//Valida si el usuario puede eliminar un comentario:
//solo si es suyo y ningún otro usuario comentó después
export function puedeEliminarComentario(comentarios, indice, idUsuario) {
    const comentario = comentarios[indice];
    if (!comentario || Number(comentario.idUsuarioComentario) !== idUsuario) return false;

    const comentariosPosteriores = comentarios.slice(indice + 1);
    return !comentariosPosteriores.some((c) => Number(c.idUsuarioComentario) !== idUsuario);
}


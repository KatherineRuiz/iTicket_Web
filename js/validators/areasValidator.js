//Validaciones del formulario de áreas (usuarios.html).
//El límite coincide con AreaDTO en la API.
export function validarFormularioArea(datos) {
    const errores = [];

    if (!datos.nombreArea || !datos.nombreArea.trim()) {
        errores.push({ campo: "nombreArea", mensaje: "El nombre del área es obligatorio." });
    } else if (datos.nombreArea.length > 50) {
        errores.push({ campo: "nombreArea", mensaje: "El nombre del área no puede superar los 50 caracteres." });
    }

    return errores;
}

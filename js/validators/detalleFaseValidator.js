//Validaciones para agregar detalle de la fase
export function validarFormularioDetalleFase(data) {
    const errores = [];

    // Validación de la descripción del detalle de la fase
    if (!data.descripcion || data.descripcion.trim() === '') {
        errores.push('La descripción del detalle de la fase es obligatoria.');
    }

    return errores;
}
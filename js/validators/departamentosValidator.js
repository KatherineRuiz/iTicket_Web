//Validaciones del formulario de departamentos (usuarios.html).
//Los límites y el tipo de departamento coinciden con DepartamentoDTO en la API.
export function validarFormularioDepartamento(datos) {
    const errores = [];

    if (!datos.nombreDepartamento || !datos.nombreDepartamento.trim()) {
        errores.push({ campo: "nombreDepartamento", mensaje: "El nombre del departamento es obligatorio." });
    } else if (datos.nombreDepartamento.length > 50) {
        errores.push({ campo: "nombreDepartamento", mensaje: "El nombre no puede superar los 50 caracteres." });
    }

    if (!datos.tipoDepartamento) {
        errores.push({ campo: "selectTipoDepartamento", mensaje: "Debes seleccionar el tipo de departamento." });
    }

    if (!datos.idArea) {
        errores.push({ campo: "selectAreaDepartamento", mensaje: "Debes seleccionar un área." });
    }

    return errores;
}

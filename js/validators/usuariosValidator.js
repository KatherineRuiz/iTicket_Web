//Validaciones del formulario de usuarios
export function validarFormularioUsuario(datos, esEdicion) {
    const errores = [];

    if (!datos.nombreUsuario || !datos.nombreUsuario.trim()) {
        errores.push({ campo: "nombreUsuario", mensaje: "El nombre del usuario es obligatorio." });
    } else if (datos.nombreUsuario.length > 30) {
        errores.push({ campo: "nombreUsuario", mensaje: "El nombre no puede superar los 30 caracteres." });
    }

    if (!datos.correo || !datos.correo.trim()) {
        errores.push({ campo: "correoUsuario", mensaje: "El correo es obligatorio." });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
        errores.push({ campo: "correoUsuario", mensaje: "El correo no tiene un formato válido." });
    } else if (datos.correo.length > 100) {
        errores.push({ campo: "correoUsuario", mensaje: "El correo no puede superar los 100 caracteres." });
    }

    //La contraseña solo se pide al crear: al editar un usuario no se toca su clave
    if (!esEdicion) {
        const claveEscrita = datos.clave && datos.clave.trim();
        if (!claveEscrita) {
            errores.push({ campo: "passwordUsuario", mensaje: "La contraseña es obligatoria." });
        } else if (datos.clave.length < 8) {
            errores.push({ campo: "passwordUsuario", mensaje: "La contraseña debe tener al menos 8 caracteres." });
        }
    }

    if (!datos.idRol) {
        errores.push({ campo: "selectRol", mensaje: "Debes seleccionar un rol." });
    }

    if (!datos.idDepartamento) {
        errores.push({ campo: "selectDepartamentoUsuario", mensaje: "Debes seleccionar un departamento." });
    }

    return errores;
}

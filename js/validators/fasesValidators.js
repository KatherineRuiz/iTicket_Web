//Validaciones en para el formulario de Crear Fase. Se ejecutan antes de enviar cualquier dato a la API, siguiendo los límites definidos en la base de datos (tabla FASES).

export function validarFormularioFase(datos) {
    const errores = [];

    //--- Nombre de la fase ---
    if (!datos.nombreFase || !datos.nombreFase.trim()) {
        errores.push({ campo: "txtNombreFase", mensaje: "El nombre de la fase es obligatorio." });
    } else if (datos.nombreFase.length > 100) {
        errores.push({ campo: "txtNombreFase", mensaje: "El nombre de la fase no puede superar los 100 caracteres." });
    }

    //--- Departamento encargado ---
    if (!datos.departamentoEncargado || !datos.departamentoEncargado.trim()) {
        errores.push({ campo: "txtDepartamentoEncargado", mensaje: "El departamento encargado es obligatorio." });
    } else if (datos.departamentoEncargado.length > 20) {
        errores.push({ campo: "txtDepartamentoEncargado", mensaje: "El departamento encargado no puede superar los 20 caracteres." });
    }

    //--- Descripción de la fase ---
    if (!datos.faseDescripcion || !datos.faseDescripcion.trim()) {
        errores.push({ campo: "txtDesxripxionFase", mensaje: "La descripción de la fase es obligatoria." });
    } else if (datos.faseDescripcion.length > 300) {
        errores.push({ campo: "txtDesxripxionFase", mensaje: "La descripción de la fase no puede superar los 300 caracteres." });
    }
    
    //Fecha Inicio estimada no debe ser mayor que la fecha del proyecto (fechaInicioProyecto) y no debe ser mayor que la fecha final estimada de la fase (fechaFinalEstimada)
    if (datos.fechaInicioEstimada && datos.fechaFinalEstimada) {
        const fechaInicio = new Date(datos.fechaInicioEstimada);
        const fechaFinal = new Date(datos.fechaFinalEstimada);
        if (fechaInicio > fechaFinal) {
            errores.push({ campo: "txtFechaInicioEstimada", mensaje: "La fecha de inicio estimada no puede ser mayor que la fecha final estimada." });
        }
    }

    //Fecha Final estimada no debe ser menor que la fecha de inicio estimada de la fase (fechaInicioEstimada) y no debe ser mayor que la fecha final del proyecto (fechaFinalProyecto)
    if (datos.fechaInicioEstimada && datos.fechaFinalEstimada) {
        const fechaInicio = new Date(datos.fechaInicioEstimada);
        const fechaFinal = new Date(datos.fechaFinalEstimada);
        if (fechaFinal < fechaInicio) {
            errores.push({ campo: "txtFechaFinalEstimada", mensaje: "La fecha final estimada no puede ser menor que la fecha de inicio estimada." });
        }
    }

    //Nombre del proveedor es obligatorio
    if (!datos.nombreProveedor || !datos.nombreProveedor.trim()) {
        errores.push({ campo: "txtProveedor", mensaje: "El nombre del proveedor es obligatorio." });
    }
    if (datos.nombreProveedor && datos.nombreProveedor.length > 100) {
        errores.push({ campo: "txtProveedor", mensaje: "El nombre del proveedor no puede superar los 100 caracteres." });
    }

    //Presupuesto estimado no debe ser menor que 0 y es obligatorio
    if (datos.presupuestoEstimado === "" || datos.presupuestoEstimado === null || datos.presupuestoEstimado === undefined) {
        errores.push({ campo: "numPresupuesto", mensaje: "El presupuesto estimado es obligatorio." });
    } else if (isNaN(Number(datos.presupuestoEstimado)) || Number(datos.presupuestoEstimado) < 0) {
        errores.push({ campo: "numPresupuesto", mensaje: "El presupuesto estimado debe ser un número mayor o igual a 0." });
    }

    return errores;
}
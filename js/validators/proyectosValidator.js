//Validaciones en JavaScript para el formulario "Crear proyecto"
//Se ejecutan antes de enviar cualquier dato a la API, siguiendo los límites
//definidos en la base de datos (tabla PROYECTOS).

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarFormularioProyecto(datos) {
    const errores = [];

    //--- Nombre del proyecto ---
    if (!datos.nombreProyecto || !datos.nombreProyecto.trim()) {
        errores.push({ campo: "txtNombreProyecto", mensaje: "El nombre del proyecto es obligatorio." });
    } else if (datos.nombreProyecto.length > 100) {
        errores.push({ campo: "txtNombreProyecto", mensaje: "El nombre del proyecto no puede superar los 100 caracteres." });
    } 

    //--- Tipo de proyecto ---
    if (!datos.tipoProyecto) {
        errores.push({ campo: "tipoProyecto", mensaje: "Debes seleccionar el tipo de proyecto." });
    }

    //--- Ubicación ---
    if (!datos.ubicacion || !datos.ubicacion.trim()) {
        errores.push({ campo: "txtUbicacion", mensaje: "La ubicación es obligatoria." });
    } else if (datos.ubicacion.length > 100) {
        errores.push({ campo: "txtUbicacion", mensaje: "La ubicación no puede superar los 100 caracteres." });
    }

    //--- Contratista (opcional) ---
    if (datos.contratista && datos.contratista.length > 100) {
        errores.push({ campo: "txtContratista", mensaje: "El contratista no puede superar los 100 caracteres." });
    } 

    //--- Descripción ---
    if (!datos.descripcionProyecto || !datos.descripcionProyecto.trim()) {
        errores.push({ campo: "txtDescripcion", mensaje: "La descripción es obligatoria." });
    } else if (datos.descripcionProyecto.length > 300) {
        errores.push({ campo: "txtDescripcion", mensaje: "La descripción no puede superar los 300 caracteres." });
    }

    //--- Presupuesto estimado ---
    if (datos.presupuestoEstimado === "" || datos.presupuestoEstimado === null || datos.presupuestoEstimado === undefined) {
        errores.push({ campo: "numPresupuesto", mensaje: "El presupuesto estimado es obligatorio." });
    } else if (isNaN(Number(datos.presupuestoEstimado)) || Number(datos.presupuestoEstimado) <= 0) {
        errores.push({ campo: "numPresupuesto", mensaje: "El presupuesto estimado debe ser mayor que 0." });
    }

    //--- Correo del coordinador ---
    if (!datos.correoCoordinador || !datos.correoCoordinador.trim()) {
        errores.push({ campo: "txtCoordinador", mensaje: "El correo del coordinador es obligatorio." });
    } else if (!PATRON_CORREO.test(datos.correoCoordinador)) {
        errores.push({ campo: "txtCoordinador", mensaje: "El correo del coordinador no tiene un formato válido." });
    }

    //--- Correo del supervisor ---
    if (!datos.correoSupervisor || !datos.correoSupervisor.trim()) {
        errores.push({ campo: "txtSupervisor", mensaje: "El correo del supervisor es obligatorio." });
    } else if (!PATRON_CORREO.test(datos.correoSupervisor)) {
        errores.push({ campo: "txtSupervisor", mensaje: "El correo del supervisor no tiene un formato válido." });
    }

    return errores;
}

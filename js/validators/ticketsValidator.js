//Validar los campos comunes de cualquier ticket
function validarCamposComunes(asunto, descripcion, idDepartamento) {
    const errores = [];

    if (!asunto.trim()) {
        errores.push({ campo: "txtAsunto", mensaje: "El asunto es obligatorio." });
    } else if (asunto.length > 100) {
        errores.push({ campo: "txtAsunto", mensaje: "El asunto no puede superar 100 caracteres." });
    }

    if (!descripcion.trim()) {
        errores.push({ campo: "txtDescripcion", mensaje: "La descripción es obligatoria." });
    } else if (descripcion.length > 500) {
        errores.push({ campo: "txtDescripcion", mensaje: "La descripción no puede superar los 500 caracteres" });
    }

    if (!idDepartamento) {
        errores.push({ campo: "sltDepartamento", mensaje: "Debes seleccionar un departamento." });
    }

    return errores;
}

//Valida los campos propios de la categoría "Articulo"
function validarCategoriaArticulo(listaCodigos) {
    const errores = [];

    if (listaCodigos.length === 0) {
        errores.push({ campo: "txtCodigo", mensaje: "Debes agregar al menos un código de equipo/mobiliario." });
    }

    listaCodigos.forEach((codigo) => {
        if (!/^[A-Za-z0-9-]+$/.test(codigo)) {
            errores.push({ campo: "txtCodigo", mensaje: `El código "${codigo}" contiene caracteres no permitidos.` })
        }
    });

    return errores;
}

//Valida los campos propio de la categoría "General"
function validarCategoriaGeneral(ubicacion) {
    const errores = [];

    if (!ubicacion.trim()) {
        errores.push({ campo: "txtUbicacion", mensaje: "Debes indicar la ubicación del problema." });
    } else if (ubicacion.length > 200) {
        errores.push({ campo: "txtUbicacion", mensaje: "La ubicación no puede superar 200 caracteres." });
    }

    return errores;
}

//Valida los campos propios de la categoría "Instalación de Software"
function validarCategoriaSoftware(listaSoftware, idUbicacionSoftware) {
    const errores = [];

    if (listaSoftware.length === 0) {
        errores.push({ campo: "txtNombreSoftware", mensaje: "Debes agregar al menos un software a instalar." });
    }

    listaSoftware.forEach((item) => {
        if (item.nombreSoftware.length > 50) {
            errores.push({ campo: "txtNombreSoftware", mensaje: `El software "${item.nombreSoftware}" supera los 50 caracteres.` });
        }
        if (item.version.length > 20) {
            errores.push({ campo: "txtVersion", mensaje: `La versión "${item.version}" supera los 20 caracteres.` });
        }
    });

    if (!idUbicacionSoftware) {
        errores.push({ campo: "sltUbicacionSoftware", mensaje: "Debes seleccionar la ubicación." });
    }

    return errores;
}

//Validacion para formulario de aprobacion de tickets
export function validarFormularioAprobacion(datos) {
    const errores = [];

    if (!datos.prioridad) {
        errores.push({ campo: "sltPrioridad", mensaje: "Selecciona una prioridad." });
    }

    if (!datos.tecnicoAsignado) {
        errores.push({ campo: "sltTecnico", mensaje: "Selecciona un técnico." });
    }

    if (!datos.fechaVencimiento) {
        errores.push({ campo: "dtFechaVencimiento", mensaje: "La fecha de vencimiento es obligatoria." });
    } else if (new Date(datos.fechaVencimiento) < new Date()) {
        errores.push({ campo: "dtFechaVencimiento", mensaje: "La fecha de vencimiento debe ser futura." });
    }

    return errores;
}

//valida todo el formulario según la categoría activa
export function validarFormularioTicket(categoria, datos) {
  let errores = validarCamposComunes(datos.asunto, datos.descripcion, datos.idDepartamento);
  const cat = categoria ? categoria.toLowerCase() : "";

  if (cat === "equipos") {
    errores = errores.concat(validarCategoriaArticulo(datos.listaCodigos));
  } else if (cat === "general") {
    errores = errores.concat(validarCategoriaGeneral(datos.ubicacion));
  } else if (cat === "software") {
    errores = errores.concat(validarCategoriaSoftware(datos.listaSoftware, datos.idUbicacionSoftware));
  }

  return errores;
}

//Validar formulario de reasignacion de departamento
export function validarFormularioReasignacionDep(datos) {
    const errores = [];

    if (!datos.departamento) {
        errores.push({ campo: "sltDepartamentoReasignar", mensaje: "Selecciona un departamento." });
    }

    return errores;
}

//Validar formulario de reporte técnico
export function validarFormularioReporte(datos) {
    const errores = [];

    if (!datos.descripcionFalla || !datos.descripcionFalla.trim()) {
        errores.push({ campo: "txtDescripcionFalla", mensaje: "Debes indicar el diagnóstico o descripción de la falla." });
    } else if (datos.descripcionFalla.length > 500) {
        errores.push({ campo: "txtDescripcionFalla", mensaje: "La descripción de la falla no puede superar los 500 caracteres." });
    }

    if (!datos.descripcionSolucion || !datos.descripcionSolucion.trim()) {
        errores.push({ campo: "txtDescripcionSolucion", mensaje: "Debes indicar la solución aplicada." });
    } else if (datos.descripcionSolucion.length > 500) {
        errores.push({ campo: "txtDescripcionSolucion", mensaje: "La descripción de la solución no puede superar los 500 caracteres." });
    }

    return errores;
}
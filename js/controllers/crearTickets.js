import { crearTicket } from "../services/ticketsService.js";
import { getDepartamentosAsignables } from "../services/.js";
import { getUbicaciones } from "../services/ubicacionesService.js";
import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/sweetAlerts.js";
import { validarFormularioTicket } from "../validators/ticketsValidator.js";
import { buscarArticulosPorCodigoParcial } from "../services/articulosService.js";
import { subirEvidencia } from "../services/evidenciasService.js";

const btnEquipos = document.getElementById("btn-equipos"); // tarjeta del formulario
const btnGeneral = document.getElementById("btn-general"); // tarjeta del formulario
const btnSoftware = document.getElementById("btn-Software");
const frmTicket = document.getElementById("frmTicket");
const campoCodigo = document.getElementById("campo-codigo");
const campoUbicacion = document.getElementById("campo-ubicacion");
const camposSoftware = document.getElementById("campos-Software");
const inputMultimedia = document.getElementById("inputMultimedia");
const cajaMultimedia = document.getElementById("cajaMultimedia");
const contenidoMultimedia = document.getElementById("contenidoMultimedia");
const galeriaMultimedia = document.getElementById("galeriaMultimedia");
const sugerenciasCodigos = document.getElementById("sugerenciasCodigos");

const txtAsunto = document.getElementById("txtAsunto");
const txtDescripcion = document.getElementById("txtDescripcion");
const txtCodigo = document.getElementById("txtCodigo");
const txtUbicacion = document.getElementById("txtUbicacion");
const txtNombreSoftware = document.getElementById("txtNombreSoftware");
const txtVersion = document.getElementById("txtVersion");
const sltDepartamento = document.getElementById("sltDepartamento");
const sltUbicacionSoftware = document.getElementById("sltUbicacionSoftware");

let listaCodigosEquipos = [];
const btnAgregarCodigo = document.getElementById("btnAgregarCodigo");
const listaCodigos = document.getElementById("listaCodigos");

let listaSoftwareVersion = [];
const btnAgregarSoftware = document.getElementById("btnAgregarSoftware");
const listaSoftware = document.getElementById("listaSoftware");

//Para no cargar los departamentos y las ubicaciones más de una vez
let departamentosCargados = false;
let ubicacionesCargadas = false;
let listaDepartamentosDisponibles = [];

let categoriaActual = "equipos";
const usuarioGuardado = sessionStorage.getItem("usuarioLogueado");

let archivosSeleccionados = []; //Aquí se "almacenan" los archivos elegidos
const limiteEvidencias = 10;

//Crear Tickets segun categoria
function cambiarCategoria(categoria) {

  categoriaActual = categoria;
  if (btnEquipos) btnEquipos.classList.remove("active-card");
  if (btnGeneral) btnGeneral.classList.remove("active-card");
  if (btnSoftware) btnSoftware.classList.remove("active-card");

  if (campoCodigo) campoCodigo.classList.remove("mostrar");
  if (campoUbicacion) campoUbicacion.classList.remove("mostrar");
  if (camposSoftware) camposSoftware.classList.remove("mostrar");
  if (txtDescripcion) txtDescripcion.placeholder = "Describe la falla o problema...";

  if (txtUbicacion) txtUbicacion.required = false;
  if (txtNombreSoftware) txtNombreSoftware.required = false;
  if (txtVersion) txtVersion.required = false;
  if (sltUbicacionSoftware) sltUbicacionSoftware.required = false;

  if (categoria === "equipos") {
    if (btnEquipos) btnEquipos.classList.add("active-card");
    if (campoCodigo) campoCodigo.classList.add("mostrar");
    liberarDepartamento();
  } else if (categoria === "general") {
    if (btnGeneral) btnGeneral.classList.add("active-card");
    if (campoUbicacion) campoUbicacion.classList.add("mostrar");
    if (txtUbicacion) txtUbicacion.required = true;
    liberarDepartamento();
  } else if (categoria === "software") {
    if (btnSoftware) btnSoftware.classList.add("active-card");
    if (camposSoftware) camposSoftware.classList.add("mostrar");
    if (txtDescripcion) txtDescripcion.placeholder = "Describe la instalación de software que necesitas";
    if (sltUbicacionSoftware) sltUbicacionSoftware.required = true;
    forzarDepartamentoIT();
  }
}

if (btnEquipos) {
  btnEquipos.addEventListener("click", () => cambiarCategoria("equipos"));
}
if (btnGeneral) {
  btnGeneral.addEventListener("click", () =>
    cambiarCategoria("general"),
  );
}
if (btnSoftware) {
  btnSoftware.addEventListener("click", () =>
    cambiarCategoria("software"),
  );
}

//Sincroniza el array con el input real, para que el <form> lo envíe correctamente
function actualizarInputFiles() {
  const dataTransfer = new DataTransfer();
  archivosSeleccionados.forEach((archivo) => dataTransfer.items.add(archivo));
  inputMultimedia.files = dataTransfer.files;
}

function renderizarGaleria() {
  if (archivosSeleccionados.length === 0) {
    contenidoMultimedia.classList.remove("d-none");
    galeriaMultimedia.classList.add("d-none");
    galeriaMultimedia.innerHTML = "";
    return;
  }

  contenidoMultimedia.classList.add("d-none");
  galeriaMultimedia.classList.remove("d-none");
  galeriaMultimedia.innerHTML = "";

  archivosSeleccionados.forEach((archivo, index) => {
    const lector = new FileReader();
    lector.onload = function (e) {
      const miniatura = document.createElement("div");
      miniatura.className = "miniatura-foto";
      miniatura.innerHTML = `
          <img src="${e.target.result}" alt="Foto ${index + 1}">
          <button type="button" class="btn-eliminar-foto" data-index="${index}" aria-label="Eliminar foto">
            <i class="bi bi-x"></i>
          </button>
        `;
      galeriaMultimedia.appendChild(miniatura);
    };
    lector.readAsDataURL(archivo);
  });

  // Tile para seguir agregando fotos (se oculta al llegar al límite)
  if (archivosSeleccionados.length < limiteEvidencias) {
    const agregarMas = document.createElement("div");
    agregarMas.className = "miniatura-agregar-mas";
    agregarMas.id = "btnAgregarMas";
    agregarMas.innerHTML = '<i class="bi bi-plus-lg"></i>';
    galeriaMultimedia.appendChild(agregarMas);
  }
}

if (inputMultimedia) {
  inputMultimedia.addEventListener("change", function () {
    const nuevosArchivos = Array.from(this.files);
    let combinados = archivosSeleccionados.concat(nuevosArchivos);

    if (combinados.length > limiteEvidencias) {
      combinados = combinados.slice(0, limiteEvidencias);
      mostrarError(`Solo puedes adjuntar un máximo de ${limiteEvidencias} imágenes por ticket.`);
    }

    archivosSeleccionados = combinados;
    actualizarInputFiles();
    renderizarGaleria();
    // Limpiamos el value para poder volver a seleccionar el mismo archivo si se elimina
    this.value = "";
  });
}

if (cajaMultimedia) {
  cajaMultimedia.addEventListener("click", function (e) {
    if (e.target.closest(".btn-eliminar-foto")) return;
    if (archivosSeleccionados.length === 0 || e.target.closest("#btnAgregarMas")) {
      inputMultimedia.click();
    }
  });
}

if (galeriaMultimedia) {
  galeriaMultimedia.addEventListener("click", function (e) {
    const btnEliminar = e.target.closest(".btn-eliminar-foto");
    if (btnEliminar) {
      e.stopPropagation();
      const indice = parseInt(btnEliminar.dataset.index, 10);
      archivosSeleccionados.splice(indice, 1);
      actualizarInputFiles();
      renderizarGaleria();
    }
  });
}

function renderizarCodigos() {
  listaCodigos.innerHTML = "";

  listaCodigosEquipos.forEach((codigo, index) => {
    const badgeCodigo = document.createElement("span");
    badgeCodigo.className = "badge bg-primary-custom text-white p-2 rounded-4 d-flex align-items-center gap-2 fs-6 shadow-sm";
    badgeCodigo.style.backgroundColor = "#90BFDB";

    badgeCodigo.innerHTML = `
      <span>${codigo}</span>
      <button type="button" class="btn-close btn-close-white small" style="font-size: 0.65rem;" 
        onclick="eliminarCodigo(${index})" aria-label="Eliminar"></button>
    `;
    listaCodigos.appendChild(badgeCodigo);
  });
}

//Funcion global
window.eliminarCodigo = function (index) {
  listaCodigosEquipos.splice(index, 1);
  renderizarCodigos();
};

function renderizarSoftware() {
  listaSoftware.innerHTML = "";

  listaSoftwareVersion.forEach((item, index) => {
    const badgeSoftware = document.createElement("span");
    badgeSoftware.className = "badge bg-primary-custom text-white p-2 rounded-4 d-flex align-items-center gap-2 fs-6 shadow-sm";
    badgeSoftware.style.backgroundColor = "#90BFDB";

    badgeSoftware.innerHTML = `
      <span>${item.nombreSoftware} — ${item.version}</span>
      <button type="button" class="btn-close btn-close-white small" style="font-size: 0.65rem;"
        onclick="eliminarSoftware(${index})" aria-label="Eliminar"></button>
    `;
    listaSoftware.appendChild(badgeSoftware);
  });
}

window.eliminarSoftware = function (index) {
  listaSoftwareVersion.splice(index, 1);
  renderizarSoftware();
};

if (btnAgregarSoftware && txtNombreSoftware && txtVersion) {
  btnAgregarSoftware.addEventListener("click", function () {
    const nombre = txtNombreSoftware.value.trim();
    const version = txtVersion.value.trim();

    if (nombre === "" || version === "") return;

    //Evitar duplicados por combinación nombre + versión
    const yaExiste = listaSoftwareVersion.some(
      (item) => item.nombreSoftware.toLowerCase() === nombre.toLowerCase() && item.version === version
    );
    if (yaExiste) {
      mostrarError("Este software con esa versión ya fue agregado.");
      return;
    }

    listaSoftwareVersion.push({ nombreSoftware: nombre, version: version });
    txtNombreSoftware.value = "";
    txtVersion.value = "";
    renderizarSoftware();
    txtNombreSoftware.focus();
  });

  //Enter en cualquiera de los dos inputs dispara el mismo botón
  [txtNombreSoftware, txtVersion].forEach((input) => {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        btnAgregarSoftware.click();
      }
    });
  });
}

function forzarDepartamentoIT() {
  if (!sltDepartamento || listaDepartamentosDisponibles.length === 0) return;

  const departamentoIT = listaDepartamentosDisponibles.find((d) => d.nombreDepartamento.trim().toUpperCase() === "IT");

  if (departamentoIT) {
    sltDepartamento.value = departamentoIT.idDepartamento;
  }

  sltDepartamento.disabled = true;
}

function liberarDepartamento() {
  if (!sltDepartamento) return;
  sltDepartamento.disabled = false;
}

//Cargar y mostrar los departamentos asignables segun el area del usuario logueado
async function cargarDepartamentos() {
  if (!sltDepartamento || departamentosCargados) return;

  const usuarioGuardado = sessionStorage.getItem("usuarioLogueado");
  if (!usuarioGuardado) {
    console.error("No hay usuario logueado en sessionStorage");
    mostrarError("No se pudo identificar al usuario. Inicia sesión nuevamente.");
    return;
  }

  const { idUsuario } = JSON.parse(usuarioGuardado);

  try {
    const departamentos = await getDepartamentosAsignables(idUsuario);
    listaDepartamentosDisponibles = departamentos;

    sltDepartamento.innerHTML = '<option selected disabled value="">Selecciona un departamento</option>';

    departamentos.forEach((departamento) => {
      const opcion = document.createElement("option");
      opcion.value = departamento.idDepartamento;
      opcion.textContent = departamento.nombreDepartamento;
      sltDepartamento.appendChild(opcion);
    });

    departamentosCargados = true;

    if (categoriaActual === "Software") {
      forzarDepartamentoIT();
    }
  } catch (error) {
    console.error("Error al cargar los departamentos: ", error);
    mostrarError("No se pudieron cargar los departamentos.");
  }
}

//Cargar y mostrar las ubicaciones
async function cargarUbicaciones() {
  if (!sltUbicacionSoftware || ubicacionesCargadas) return;

  try {
    const ubicaciones = await getUbicaciones();
    sltUbicacionSoftware.innerHTML = '<option selected disabled value="">Selecciona la ubicación</option>';

    ubicaciones.forEach((ubicacion) => {
      const opcion = document.createElement("option");
      opcion.value = ubicacion.id;
      opcion.textContent = ubicacion.nombreUbicacion;
      sltUbicacionSoftware.appendChild(opcion);
    });

    ubicacionesCargadas = true;
  } catch (error) {
    console.error("Error al cargar las ubicaciones: ", error);
    mostrarError("No se pudieron cargar las ubicaciones.");
  }
}

function agregarCodigoArticulo(codigo) {
  if (!codigo) return;

  if (listaCodigosEquipos.includes(codigo)) {
    mostrarError("Este código ya fue agregado.", true);
    return;
  }

  listaCodigosEquipos.push(codigo); 
  renderizarCodigos();
}

function renderizarSugerencias(resultados) {
  sugerenciasCodigos.innerHTML = "";

  if (resultados.length === 0) {
    sugerenciasCodigos.classList.add("d-none");
    return;
  }

  resultados.forEach((articulo) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "list-group-item list-group-item-action";
    item.textContent = `${articulo.codigoArticulo} (${articulo.nombreUbicacion})`;

    item.addEventListener("click", function () {
      agregarCodigoArticulo(articulo.codigoArticulo);
      txtCodigo.value = "";
      sugerenciasCodigos.classList.add("d-none");
      sugerenciasCodigos.innerHTML = "";
    });

    sugerenciasCodigos.appendChild(item);
  });

  sugerenciasCodigos.classList.remove("d-none");
}

//Autocompletado de códigos de artículos
let temporizadorBusqueda = null;

if (txtCodigo && sugerenciasCodigos) {
  txtCodigo.addEventListener("input", function () {
    const fragmento = txtCodigo.value.trim();

    if (fragmento.length < 2) {
      sugerenciasCodigos.classList.add("d-none");
      sugerenciasCodigos.innerHTML = "";
      return
    }

    //Agenda una petición cada que se teclea, pero solo se manda la ultima petición que se haga
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(async () => {
      try {
        const resultados = await buscarArticulosPorCodigoParcial(fragmento);
        renderizarSugerencias(resultados);
      } catch (error) {
        console.error("Error al buscar articulos: ", error);
        sugerenciasCodigos.classList.add("d-none");
      }
    }, 350);
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest("#campo-codigo")) {
      sugerenciasCodigos.classList.add("d-none");
    }
  });
}

if (btnAgregarCodigo && txtCodigo) {
  btnAgregarCodigo.addEventListener("click", function () {
    const valor = txtCodigo.value.trim();
    agregarCodigoArticulo(valor);
    txtCodigo.value = "";
    txtCodigo.focus();
  });

  txtCodigo.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      btnAgregarCodigo.click();
    }
  });
}

//Crear ticket
frmTicket.addEventListener("submit", async function (e) {
  e.preventDefault();

  //Limpia marcas de error de un intento anterior
  document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

  //Validación de usuario logueado(temporal)
  if (!usuarioGuardado) {
    mostrarError("No se pudo identificar al usuario. Inicia sesión nuevamente.")
    return;
  }
  const { idUsuario } = JSON.parse(usuarioGuardado);

  //Recolectar los datos actuales del formulario
  const datosFormulario = {
    asunto: txtAsunto.value,
    descripcion: txtDescripcion.value,
    idDepartamento: sltDepartamento.value,
    ubicacion: txtUbicacion.value,
    listaCodigos: listaCodigosEquipos,
    listaSoftware: listaSoftwareVersion,
    idUbicacionSoftware: sltUbicacionSoftware.value
  };

  //Validar
  const errores = validarFormularioTicket(categoriaActual, datosFormulario);

  if (errores.length > 0) {
    //Señala en el formulario cada campo con error
    errores.forEach((error) => {
      const campo = document.getElementById(error.campo);
      if (campo) campo.classList.add("is-invalid");
    });

    //Muestra todos los mensajes juntos
    const mensajes = errores.map((error) => error.mensaje).join(" ");
    mostrarError(mensajes);
    return;
  }

  const confirmar = await mostrarConfirmacion("¿Estás seguro de crear el ticket?","Podrás eliminarlo o editarlo mientras no se apruebe","Crear");
  if(!confirmar){
    return;
  }

  //Objeto base común
  const nuevoTicket = {
    asunto: datosFormulario.asunto.trim(),
    descripcion: datosFormulario.descripcion.trim(),
    departamento: Number(datosFormulario.idDepartamento),
    creador: Number(idUsuario),
    tipoTicket: ""
  };

  //Datos específicos según la categoría activa
  if (categoriaActual === "equipos") {
    nuevoTicket.tipoTicket = "Articulo";
    nuevoTicket.codigosArticulos = listaCodigosEquipos;

  } else if (categoriaActual === "general") {
    nuevoTicket.tipoTicket = "General";
    nuevoTicket.descripcionUbicacion = datosFormulario.ubicacion.trim();

  } else if (categoriaActual === "software") {
    nuevoTicket.tipoTicket = "Software";
    nuevoTicket.detallesSoftware = listaSoftwareVersion.map((item) => ({
      nombreSoftware: item.nombreSoftware,
      version: item.version,
      ubicacion: Number(datosFormulario.idUbicacionSoftware)
    }));
  }

  //Envío a la API
  try {
    const respuestaTicket = await crearTicket(nuevoTicket);
    const idTicketCreado = respuestaTicket.data.idTicket;

    //Subir evidencias
    if (archivosSeleccionados.length > 0) {
      const subidas = archivosSeleccionados.map((archivo) =>
        subirEvidencia(archivo, idTicketCreado)
      );

      //Espera a que todas las subidas terminen antes de continuar
      await Promise.all(subidas);
    }

    mostrarExitoSimple("¡Ticket creado!", "Tu ticket fue registrado correctamente.");
    limpiarFormulario();
  } catch (error) {
    console.error("Error al crear el ticket:", error);
    mostrarError("No se pudo crear el ticket. Por favor, revisa si los datos son correctos.");
  }
})

//Eventos para cargar los departamentos y las ubicaciones
if (sltDepartamento) {
  sltDepartamento.addEventListener("focus", cargarDepartamentos);
}
if (sltUbicacionSoftware) {
  sltUbicacionSoftware.addEventListener("focus", cargarUbicaciones);
}

//Para que los campos dejen de marcarse como inválidos
[txtAsunto, txtDescripcion, txtUbicacion, sltDepartamento, sltUbicacionSoftware, txtNombreSoftware, txtVersion].filter(Boolean).forEach((campo) => {
  const evento = campo.tagName === "SELECT" ? "change" : "input";
  campo.addEventListener(evento, function () {
    campo.classList.remove("is-invalid");
  });
});

function limpiarFormulario(){
  frmTicket.reset();
  listaCodigosEquipos = [];
  listaSoftwareVersion = [];
  archivosSeleccionados = [];

  listaCodigos.innerHTML = "";
  listaSoftware.innerHTML = "";
  galeriaMultimedia.innerHTML = ""
  galeriaMultimedia.classList.add("d-none");
  contenidoMultimedia.classList.remove("d-none");
}

document.addEventListener("DOMContentLoaded", function () {
  //Estado inicial por defecto
  cambiarCategoria("equipos");
});


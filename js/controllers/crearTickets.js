// crearTicket.js

document.addEventListener("DOMContentLoaded", function () {
  const btnEquiposCard = document.getElementById("btn-equipos"); // tarjeta del formulario
  const btnElectricidadCard = document.getElementById("btn-electricidad"); // tarjeta del formulario
  const btnInstalacion = document.getElementById("btn-instalacion");
  const formularioEstandar = document.getElementById("formulario-estandar");
  const formularioSoftware = document.getElementById("formulario-software");
  const campoCodigo = document.getElementById("campo-codigo");
  const campoUbicacion = document.getElementById("campo-ubicacion");
  const inputMultimedia = document.getElementById("inputMultimedia");
  const cajaMultimedia = document.getElementById("cajaMultimedia");
  const contenidoMultimedia = document.getElementById("contenidoMultimedia");
  const galeriaMultimedia = document.getElementById("galeriaMultimedia");

  //Crear Tickets segun categoria
  function cambiarCategoria(categoria) {
    if (btnEquiposCard) btnEquiposCard.classList.remove("active-card");
    if (btnElectricidadCard)
      btnElectricidadCard.classList.remove("active-card");
    if (btnInstalacion) btnInstalacion.classList.remove("active-card");
    if (campoCodigo) campoCodigo.classList.remove("mostrar");
    if (campoUbicacion) campoUbicacion.classList.remove("mostrar");

    if (categoria === "equipos") {
      if (btnEquiposCard) btnEquiposCard.classList.add("active-card");
      if (formularioSoftware) formularioSoftware.classList.add("d-none");
      if (formularioEstandar) formularioEstandar.classList.remove("d-none");
      if (campoCodigo) campoCodigo.classList.add("mostrar");
    } else if (categoria === "electricidad") {
      if (btnElectricidadCard) btnElectricidadCard.classList.add("active-card");
      if (formularioSoftware) formularioSoftware.classList.add("d-none");
      if (formularioEstandar) formularioEstandar.classList.remove("d-none");
      if (campoUbicacion) campoUbicacion.classList.add("mostrar");
    } else if (categoria === "instalacion") {
      if (btnInstalacion) btnInstalacion.classList.add("active-card");
      if (formularioEstandar) formularioEstandar.classList.add("d-none");
      if (formularioSoftware) formularioSoftware.classList.remove("d-none");
    }
  }

  if (btnEquiposCard) {
    btnEquiposCard.addEventListener("click", () => cambiarCategoria("equipos"));
  }
  if (btnElectricidadCard) {
    btnElectricidadCard.addEventListener("click", () =>
      cambiarCategoria("electricidad"),
    );
  }
  if (btnInstalacion) {
    btnInstalacion.addEventListener("click", () =>
      cambiarCategoria("instalacion"),
    );
  }

  // Estado inicial por defecto
  cambiarCategoria("equipos");

  let archivosSeleccionados = []; // Aquí se "almacenan" los archivos elegidos

    // Sincroniza el array con el input real, para que el <form> lo envíe correctamente
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

    // Tile para seguir agregando fotos
    const agregarMas = document.createElement("div");
    agregarMas.className = "miniatura-agregar-mas";
    agregarMas.id = "btnAgregarMas";
    agregarMas.innerHTML = '<i class="bi bi-plus-lg"></i>';
    galeriaMultimedia.appendChild(agregarMas);
  }

  if (inputMultimedia) {
    inputMultimedia.addEventListener("change", function () {
      const nuevosArchivos = Array.from(this.files);
      archivosSeleccionados = archivosSeleccionados.concat(nuevosArchivos);
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
});

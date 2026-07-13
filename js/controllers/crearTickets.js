// crearTicket.js

document.addEventListener("DOMContentLoaded", function () {
    const btnEquiposCard = document.getElementById("btn-equipos"); // tarjeta del formulario
    const btnElectricidadCard = document.getElementById("btn-electricidad"); // tarjeta del formulario
    const campoCodigo = document.getElementById("campo-codigo");
    const campoUbicacion = document.getElementById("campo-ubicacion");
   


    //Crear Tickets segun categoria
    function cambiarCategoria(categoria) {
        if (btnEquiposCard) btnEquiposCard.classList.remove("active-card");
        if (btnElectricidadCard) btnElectricidadCard.classList.remove("active-card");
        if (campoCodigo) campoCodigo.classList.remove("mostrar");
        if (campoUbicacion) campoUbicacion.classList.remove("mostrar");

        if (categoria === 'equipos') {
            if (btnEquiposCard) btnEquiposCard.classList.add("active-card");
            if (campoCodigo) campoCodigo.classList.add("mostrar");
        } else if (categoria === 'electricidad') {
            if (btnElectricidadCard) btnElectricidadCard.classList.add("active-card");
            if (campoUbicacion) campoUbicacion.classList.add("mostrar");
        }
    }

    if (btnEquiposCard) {
        btnEquiposCard.addEventListener("click", () => cambiarCategoria('equipos'));
    }
    if (btnElectricidadCard) {
        btnElectricidadCard.addEventListener("click", () => cambiarCategoria('electricidad'));
    }

    // Estado inicial por defecto
    cambiarCategoria('equipos');
});
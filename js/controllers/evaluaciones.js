document.addEventListener("DOMContentLoaded", function () {

    const FILAS_POR_PAGINA = 8;

    const inputBuscar        = document.getElementById("inputBuscar");
    const btnBuscar          = document.getElementById("btnBuscar");
    const filtroCalificacion = document.getElementById("filtroCalificacion");
    const filtroFecha        = document.getElementById("filtroFecha");
    const cuerpoTabla        = document.getElementById("cuerpoTabla");
    const estadoVacio        = document.getElementById("estadoVacio");
    const infoRegistros      = document.getElementById("infoRegistros");
    const paginacion         = document.getElementById("paginacion");

    let paginaActual = 1;
    const todasLasFilas = Array.from(cuerpoTabla.querySelectorAll("tr"));

    // Aplica los filtros activos y devuelve las filas que coinciden
    function obtenerFilasFiltradas() {
        const termino    = inputBuscar.value.trim().toLowerCase();
        const calFiltro  = filtroCalificacion.value;
        const fechaFiltro = filtroFecha.value;

        return todasLasFilas.filter(function (fila) {
            const celdas       = fila.querySelectorAll("td");
            const codigo       = celdas[0]?.textContent.toLowerCase() ?? "";
            const asunto       = celdas[1]?.textContent.toLowerCase() ?? "";
            const tecnico      = celdas[2]?.textContent.toLowerCase() ?? "";
            const calificacion = celdas[3]?.dataset.calificacion ?? "";
            const fechaTexto   = celdas[5]?.textContent.trim() ?? "";

            const coincideBusqueda =
                termino === "" ||
                codigo.includes(termino) ||
                asunto.includes(termino) ||
                tecnico.includes(termino);

            const coincideCalificacion = calFiltro === "" || calificacion === calFiltro;

            // Convierte "DD/MM/YYYY" a "YYYY-MM-DD" para comparar con el input date
            let coincideFecha = true;
            if (fechaFiltro !== "") {
                const partes = fechaTexto.split("/");
                const fechaNorm = partes.length === 3
                    ? `${partes[2]}-${partes[1].padStart(2, "0")}-${partes[0].padStart(2, "0")}`
                    : "";
                coincideFecha = fechaNorm === fechaFiltro;
            }

            return coincideBusqueda && coincideCalificacion && coincideFecha;
        });
    }

    // Muestra las filas de la página actual y actualiza el contador
    function renderizar() {
        const filasFiltradas = obtenerFilasFiltradas();
        const totalFiltradas = filasFiltradas.length;

        const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
        const fin    = Math.min(inicio + FILAS_POR_PAGINA, totalFiltradas);
        const filasPagina = filasFiltradas.slice(inicio, fin);

        todasLasFilas.forEach(function (fila) { fila.classList.add("d-none"); });
        filasPagina.forEach(function (fila)   { fila.classList.remove("d-none"); });

        estadoVacio.classList.toggle("d-none", totalFiltradas !== 0);

        infoRegistros.textContent =
            `Mostrando ${filasPagina.length} de ${totalFiltradas} evaluación${totalFiltradas !== 1 ? "es" : ""}`;

        renderizarPaginacion(totalFiltradas);
    }

    function renderizarPaginacion(totalFiltradas) {
        paginacion.innerHTML = "";
        const totalPaginas = Math.ceil(totalFiltradas / FILAS_POR_PAGINA);
        if (totalPaginas <= 1) return;

        paginacion.appendChild(crearItemPagina("&laquo;", paginaActual - 1, paginaActual === 1));

        obtenerRangoPaginas(paginaActual, totalPaginas).forEach(function (p) {
            if (p === "...") {
                const li = document.createElement("li");
                li.className = "page-item disabled";
                li.innerHTML = '<span class="page-link">…</span>';
                paginacion.appendChild(li);
            } else {
                paginacion.appendChild(crearItemPagina(p, p, false, p === paginaActual));
            }
        });

        paginacion.appendChild(crearItemPagina("&raquo;", paginaActual + 1, paginaActual === totalPaginas));
    }

    function crearItemPagina(etiqueta, pagina, deshabilitado, activo = false) {
        const li = document.createElement("li");
        li.className = `page-item${deshabilitado ? " disabled" : ""}${activo ? " active" : ""}`;

        const a = document.createElement("a");
        a.className = "page-link";
        a.href      = "#";
        a.innerHTML = etiqueta;

        if (!deshabilitado) {
            a.addEventListener("click", function (e) {
                e.preventDefault();
                paginaActual = pagina;
                renderizar();
                document.getElementById("tablaEvaluaciones")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        }

        li.appendChild(a);
        return li;
    }

    function obtenerRangoPaginas(actual, total) {
        if (total <= 7) return Array.from({ length: total }, function (_, i) { return i + 1; });
        if (actual <= 4) return [1, 2, 3, 4, 5, "...", total];
        if (actual >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
        return [1, "...", actual - 1, actual, actual + 1, "...", total];
    }

    // Eventos de búsqueda y filtros
    inputBuscar.addEventListener("input", function () { paginaActual = 1; renderizar(); });
    btnBuscar.addEventListener("click",   function () { paginaActual = 1; renderizar(); });

    inputBuscar.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { paginaActual = 1; renderizar(); }
    });

    filtroCalificacion.addEventListener("change", function () { paginaActual = 1; renderizar(); });
    filtroFecha.addEventListener("change",        function () { paginaActual = 1; renderizar(); });

    renderizar();

});

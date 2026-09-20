export function renderizarPaginacion(contenedor, paginaActual, totalPaginas, alCambiarPagina) {
    if (!contenedor) return;
    contenedor.innerHTML = "";

    const total = Math.max(0, Number(totalPaginas) || 0);
    const actual = Math.min(Math.max(1, Number(paginaActual) || 1), Math.max(1, total));
    if (total <= 1) return;

    agregarBoton(contenedor, '<i class="bi bi-chevron-left" aria-hidden="true"></i>', actual - 1, actual, actual === 1, false, alCambiarPagina, "Página anterior");

    let anterior = 0;
    obtenerPaginasVisibles(actual, total).forEach((pagina) => {
        if (anterior && pagina - anterior > 1) agregarSeparador(contenedor);
        agregarBoton(contenedor, String(pagina), pagina, actual, false, pagina === actual, alCambiarPagina, `Página ${pagina}`);
        anterior = pagina;
    });

    agregarBoton(contenedor, '<i class="bi bi-chevron-right" aria-hidden="true"></i>', actual + 1, actual, actual === total, false, alCambiarPagina, "Página siguiente");
}

function obtenerPaginasVisibles(actual, total) {
    if (total <= 5) return Array.from({ length: total }, (_, indice) => indice + 1);
    return [...new Set([1, total, actual - 1, actual, actual + 1])]
        .filter((pagina) => pagina >= 1 && pagina <= total)
        .sort((a, b) => a - b);
}

// Busca la tabla o lista que controla esta paginación: el primer tbody o lista cercana
// que no contenga a los propios botones de la paginación.
function buscarContenidoPaginado(contenedor) {
    let nodo = contenedor.parentElement;
    for (let nivel = 0; nodo && nivel < 6; nivel++, nodo = nodo.parentElement) {
        const encontrado = [...nodo.querySelectorAll("[data-contenido-paginado], tbody, .contenedor-lista-tickets")]
            .find((elemento) => !elemento.contains(contenedor));
        if (encontrado) return encontrado;
    }
    return null;
}

function agregarBoton(contenedor, contenido, pagina, actual, deshabilitado, activo, alCambiarPagina, etiqueta) {
    const elemento = document.createElement("li");
    elemento.className = `page-item${deshabilitado ? " disabled" : ""}${activo ? " active" : ""}`;
    elemento.innerHTML = `
        <button type="button" class="page-link" aria-label="${etiqueta}" ${deshabilitado ? "disabled" : ""}>
            ${contenido}
        </button>`;
    elemento.querySelector("button").addEventListener("click", () => {
        if (deshabilitado || activo) return;

        const direccion = pagina > actual ? 1 : -1;
        const contenidoPaginado = buscarContenidoPaginado(contenedor);
        if (window.animarCambioPagina && contenidoPaginado) {
            window.animarCambioPagina(contenidoPaginado, () => alCambiarPagina(pagina), direccion);
        } else {
            alCambiarPagina(pagina);
        }
    });
    contenedor.appendChild(elemento);
}

function agregarSeparador(contenedor) {
    const elemento = document.createElement("li");
    elemento.className = "page-item disabled paginacion-separador";
    elemento.innerHTML = '<span class="page-link" aria-hidden="true">…</span>';
    contenedor.appendChild(elemento);
}

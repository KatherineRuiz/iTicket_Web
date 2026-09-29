/*
 * Esta es la lógica de ordenamiento de tablas que se usa en varias partes del sistema
 */

const ICONO_NEUTRO = "bi-chevron-expand";
const ICONO_ASCENDENTE = "bi-chevron-up";
const ICONO_DESCENDENTE = "bi-chevron-down";

/*
 * Ordena en el navegador las tablas que se traen todos sus registros de una vez
 * (usuarios, áreas, departamentos, ubicaciones, bitácoras...). Las que paginan en la API
 * no usan esto: ahí el orden lo aplica la base antes de cortar la página.
 *
 * Recibe el mismo formato que los encabezados: "campo,direccion".
 */
export function ordenarLista(lista, orden) {
    if (!Array.isArray(lista) || !orden) return lista;

    const [campo, direccion] = orden.split(",");
    const factor = direccion?.trim().toLowerCase() === "asc" ? 1 : -1;
    const ruta = campo.trim().split(".");
    const valorDe = (fila) => ruta.reduce((valor, clave) => (valor == null ? valor : valor[clave]), fila);

    // Se copia el arreglo: sort() modifica el original y estas listas se reutilizan entre recargas
    return [...lista].sort((a, b) => {
        const x = valorDe(a);
        const y = valorDe(b);

        // Los vacíos siempre al final, sin importar la dirección
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;

        if (typeof x === "number" && typeof y === "number") return (x - y) * factor;
        if (typeof x === "boolean" && typeof y === "boolean") return (Number(x) - Number(y)) * factor;

        // numeric:true hace que "Sala 2" quede antes que "Sala 10"
        return String(x).localeCompare(String(y), "es", { numeric: true, sensitivity: "base" }) * factor;
    });
}

export function inicializarOrdenamientoTabla(tabla, alOrdenar, ordenInicial = "") {
    if (!tabla || typeof alOrdenar !== "function") return null;

    const encabezados = [...tabla.querySelectorAll("th[data-orden]")];
    if (encabezados.length === 0) return null;

    const marco = tabla.closest(".table-responsive") || tabla.parentElement || tabla;
    let campoActual = "";
    let direccionActual = "";
    let ocupado = false;

    encabezados.forEach((encabezado) => prepararEncabezado(encabezado));

    if (ordenInicial) {
        const [campo, direccion] = ordenInicial.split(",");
        campoActual = campo?.trim() || "";
        direccionActual = direccion?.trim().toLowerCase() === "asc" ? "asc" : "desc";
    }
    pintarEstado();

    function prepararEncabezado(encabezado) {
        encabezado.classList.add("columna-ordenable");
        encabezado.setAttribute("role", "button");
        encabezado.setAttribute("tabindex", "0");

        const icono = document.createElement("i");
        icono.className = `bi ${ICONO_NEUTRO} icono-orden`;
        icono.setAttribute("aria-hidden", "true");
        encabezado.appendChild(icono);

        encabezado.addEventListener("click", () => alternar(encabezado));
        encabezado.addEventListener("keydown", (evento) => {
            if (evento.key !== "Enter" && evento.key !== " ") return;
            evento.preventDefault();
            alternar(encabezado);
        });
    }

    /* Cada columna recorre tres estados: ascendente, descendente y sin orden.
       El tercer clic devuelve la flecha doble y el listado a su orden por defecto. */
    async function alternar(encabezado) {
        if (ocupado) return;

        const campo = encabezado.dataset.orden;
        if (campo !== campoActual) {
            campoActual = campo;
            direccionActual = "asc";
        } else if (direccionActual === "asc") {
            direccionActual = "desc";
        } else {
            campoActual = "";
            direccionActual = "";
        }
        pintarEstado();

        ocupado = true;
        marco.classList.add("tabla-cargando");
        try {
            await alOrdenar(campoActual ? `${campoActual},${direccionActual}` : "");
        } finally {
            marco.classList.remove("tabla-cargando");
            animarFilas();
            ocupado = false;
        }
    }

    function pintarEstado() {
        encabezados.forEach((encabezado) => {
            const activo = encabezado.dataset.orden === campoActual;
            const icono = encabezado.querySelector(".icono-orden");

            encabezado.classList.toggle("orden-activo", activo);
            encabezado.setAttribute("aria-sort", activo ? (direccionActual === "asc" ? "ascending" : "descending") : "none");

            if (!icono) return;
            /* Activa siempre se dibuja con la flecha hacia arriba: el descendente se logra
               girándola 180° desde el CSS, y así el cambio de sentido se ve como un giro. */
            icono.className = "bi icono-orden";
            icono.classList.add(activo ? ICONO_ASCENDENTE : ICONO_NEUTRO);
            icono.dataset.direccion = activo ? direccionActual : "";
        });
    }

    // Entrada escalonada de las filas nuevas, para que el reordenamiento se note
    function animarFilas() {
        const cuerpo = tabla.querySelector("tbody");
        if (!cuerpo) return;
        cuerpo.classList.remove("filas-reordenadas");
        void cuerpo.offsetWidth; // reinicia la animación aunque se ordene dos veces seguidas
        cuerpo.classList.add("filas-reordenadas");
    }

    return {
        obtenerOrden: () => (campoActual ? `${campoActual},${direccionActual}` : ""),
    };
}

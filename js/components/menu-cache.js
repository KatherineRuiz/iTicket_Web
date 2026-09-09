/* Aqui se carga el css antes de que se muestre el contenido para que no haya flashasos */

const MENU_CACHE_KEY_PREVIO = "iticket_menu_v5";
window.__menuCacheHTML = sessionStorage.getItem(MENU_CACHE_KEY_PREVIO) || null;

try {
    document.documentElement.classList.toggle(
        "tema-oscuro",
        localStorage.getItem("iticket_tema") === "oscuro",
    );
} catch (error) {
    console.warn("[iTicket] No se pudo aplicar el tema guardado.", error);
}

document.documentElement.classList.add("iticket-preparando");

window.addEventListener("pageshow", function () {
    document.documentElement.classList.remove("iticket-navegando", "iticket-preparando");
    document.documentElement.classList.add("iticket-listo");
});

// Al cargar o cambiar de interfaz, se da un destello (dependiendo del modo) para que se vea una transicion suave
const estiloCarga = document.createElement("style");
estiloCarga.id = "iticket-estilo-carga";
estiloCarga.textContent = `
    html { background: #e8e9eb; }
    html.tema-oscuro { background: #070b14; }
    body { transition: opacity 230ms ease; }
    html.iticket-preparando body { opacity: 0; }
    html.iticket-listo body { opacity: 1; }
    html.iticket-navegando body { opacity: 0.12; transition-duration: 170ms; }
    @media (prefers-reduced-motion: reduce) {
        body { transition-duration: 80ms; }
    }
`;
document.head.appendChild(estiloCarga);

let resolverLayout;
window.__layoutCssReady = new Promise((resolver) => { resolverLayout = resolver; });
const enlaceLayout = document.createElement("link");
enlaceLayout.rel = "stylesheet";
enlaceLayout.href = "css/layout-global.css";
enlaceLayout.dataset.iticketLayout = "true";
enlaceLayout.addEventListener("load", resolverLayout, { once: true });
enlaceLayout.addEventListener("error", resolverLayout, { once: true });
document.head.appendChild(enlaceLayout);
window.setTimeout(resolverLayout, 1200);

// Salvaguarda: aunque ocurra un error imprevisto en el controlador principal, se asegura que la página se muestre después de un tiempo prudente.
window.setTimeout(() => {
    document.documentElement.classList.remove("iticket-preparando");
    document.documentElement.classList.add("iticket-listo");
}, 1600);

    import { mostrarError, mostrarExitoRedireccion } from "../components/sweetAlerts.js";

    document.addEventListener("DOMContentLoaded", function () {
    const digitos = document.querySelectorAll(".digito-codigo");
    const botonAceptar = document.querySelector("#btnAceptarCodigo");
    const linkReenviar = document.querySelector("#linkReenviar");

    if (linkReenviar) {
        let enEspera = false;
        let tiempoInicio = 0;

        linkReenviar.addEventListener("click", function (evento) {
        evento.preventDefault();

        if (enEspera) {
            let tiempoRestante = 35000 - (Date.now() - tiempoInicio);
            mostrarAlertaEspera(tiempoRestante);
            return;
        }

        enEspera = true;
        linkReenviar.classList.add("text-muted");
        tiempoInicio = Date.now();

        // Usando tu cascarón para el éxito simple sin redirección inmediata
        mostrarExitoSimple(
            "Código Reenviado",
            "Revisa tu bandeja de entrada o spam.",
        );

        setTimeout(function () {
            enEspera = false;
            linkReenviar.classList.remove("text-muted");
        }, 35000);
        });
    }

    if (digitos.length > 0) {
        // Lógica de navegación interna de los inputs ("puntitos")
        digitos.forEach(function (entrada, indice) {
        entrada.addEventListener("input", function () {
            if (this.value.length > 1) this.value = this.value.slice(-1);
            if (this.value && indice < digitos.length - 1)
            digitos[indice + 1].focus();
        });

        entrada.addEventListener("keydown", function (evento) {
            if (evento.key === "Backspace" && !this.value && indice > 0) {
            digitos[indice - 1].focus();
            digitos[indice - 1].value = "";
            }
            if (
            !evento.key.match(/^[a-zA-Z0-9]$/) &&
            !["Backspace", "Tab", "ArrowLeft", "ArrowRight"].includes(evento.key)
            ) {
            evento.preventDefault();
            }
        });

        entrada.addEventListener("click", function () {
            this.select();
        });

        entrada.addEventListener("paste", function (evento) {
            evento.preventDefault();
            const textoPegado = (evento.clipboardData || window.clipboardData)
            .getData("text")
            .replace(/\s/g, "")
            .slice(0, digitos.length);

            textoPegado.split("").forEach((caracter, i) => {
            if (digitos[indice + i]) digitos[indice + i].value = caracter;
            });
            const ultimoLleno = Math.min(
            indice + textoPegado.length - 1,
            digitos.length - 1,
            );
            digitos[ultimoLleno].focus();
        });
        });

        // Lógica del botón validar
        if (botonAceptar) {
        botonAceptar.addEventListener("click", function (evento) {
            evento.preventDefault();
            const codigoCompleto = Array.from(digitos)
            .map((d) => d.value)
            .join("");

            if (codigoCompleto.length < digitos.length) {
            mostrarError(
                "Por favor, completa todos los campos del código.",
                false,
            );
            return;
            }

            // Llamada optimizada usando tu cascarón con redirección
            mostrarExitoRedireccion("Código Correcto", "", "nuevaContrasena.html");
        });
        }
    }
    });

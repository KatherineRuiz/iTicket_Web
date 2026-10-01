import { mostrarError, mostrarExitoRedireccion, mostrarAlertaEspera, mostrarExitoSimple } from "../components/sweetAlerts.js";
import { API_BASE_URL, apiFetch } from "../services/apiConfig.js";

document.addEventListener("DOMContentLoaded", function () {

    if (false) {
        window.location.replace("index.html");
        return;
    }

    const digitos = document.querySelectorAll(".digito-codigo");
    const botonAceptar = document.querySelector("#btnAceptarCodigo");
    const linkReenviar = document.querySelector("#linkReenviar");

    if (linkReenviar) {
        let enEspera = false;
        let tiempoInicio = 0;

        linkReenviar.addEventListener("click", async function (evento) {
            evento.preventDefault();

            if (enEspera) {
                let tiempoRestante = 35000 - (Date.now() - tiempoInicio);
                mostrarAlertaEspera(tiempoRestante);
                return;
            }

            enEspera = true;
            linkReenviar.classList.add("text-muted");
            tiempoInicio = Date.now();

            try {
                const response = await apiFetch(`${API_BASE_URL}/auth/reenviar-codigo`, {
                    method: 'POST'
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'No se pudo reenviar el codigo');
                }

                mostrarExitoSimple("Codigo Reenviado", "Revisa tu bandeja de entrada o spam.");
            } catch (e) {
                mostrarError(e.message || "No se pudo reenviar el codigo");
            }

            setTimeout(function () {
                enEspera = false;
                linkReenviar.classList.remove("text-muted");
            }, 35000);
        });
    }

    if (digitos.length > 0) {
        digitos.forEach(function (entrada, indice) {
            entrada.addEventListener("input", function () {
                if (this.value.length > 1) this.value = this.value.slice(-1);
                if (this.value && indice < digitos.length - 1) digitos[indice + 1].focus();
            });

            entrada.addEventListener("keydown", function (evento) {
                if (evento.key === "Backspace" && !this.value && indice > 0) {
                    digitos[indice - 1].focus();
                    digitos[indice - 1].value = "";
                }
                if (!evento.key.match(/^[a-zA-Z0-9]$/) && !["Backspace", "Tab", "ArrowLeft", "ArrowRight"].includes(evento.key)) {
                    evento.preventDefault();
                }
            });

            entrada.addEventListener("click", function () {
                this.select();
            });

            entrada.addEventListener("paste", function (evento) {
                evento.preventDefault();
                const textoPegado = (evento.clipboardData || window.clipboardData).getData("text").replace(/\s/g, "").slice(0, digitos.length);
                textoPegado.split("").forEach((caracter, i) => {
                    if (digitos[indice + i]) digitos[indice + i].value = caracter;
                });
                const ultimoLleno = Math.min(indice + textoPegado.length - 1, digitos.length - 1);
                digitos[ultimoLleno].focus();
            });
        });

        if (botonAceptar) {
            botonAceptar.addEventListener("click", async function (evento) {
                evento.preventDefault();
                const codigoCompleto = Array.from(digitos).map((d) => d.value).join("");

                if (codigoCompleto.length < digitos.length) {
                    mostrarError("Por favor, completa todos los campos del codigo.", false);
                    return;
                }

                botonAceptar.disabled = true;
                botonAceptar.innerHTML = 'Validando...';

                try {
                    const response = await apiFetch(`${API_BASE_URL}/auth/validar-codigo`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ codigo: codigoCompleto })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Codigo invalido o expirado');
                    }

                    mostrarExitoRedireccion("Codigo Correcto", "Ya puedes establecer tu nueva contrasena.", "nuevaContrasena.html");
                } catch (error) {
                    mostrarError(error.message, false);
                } finally {
                    botonAceptar.disabled = false;
                    botonAceptar.innerHTML = 'Validar';
                }
            });
        }
    }
});
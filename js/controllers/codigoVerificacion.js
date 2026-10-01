import { mostrarError, mostrarExitoRedireccion, mostrarAlertaEspera, mostrarExitoSimple } from "../components/sweetAlerts.js";
import { API_BASE_URL } from "../services/apiConfig.js";

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
                                // Reenviar codigo llamando a la nueva API segura que extrae el correo de la Cookie
                const respuesta = await fetch(`${API_BASE_URL}/auth/reenviar-codigo`, {
                    method: 'POST',
                    credentials: 'include'
                });
                
                if (!respuesta.ok) throw new Error("No se pudo reenviar");
                mostrarExitoSimple("Codigo Reenviado", "Revisa tu bandeja de entrada o spam.");
            } catch(e) {
                mostrarError("No se pudo reenviar el cÃ³digo");
            }

            setTimeout(function () {
                enEspera = false;
                linkReenviar.classList.remove("text-muted");
            }, 35000);
        });
    }

    if (digitos.length > 0) {
        // Logica de navegaciÃ³n interna de los inputs ("puntitos")
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
                    mostrarError("Por favor, completa todos los campos del cÃ³digo.", false);
                    return;
                }

                botonAceptar.disabled = true;
                botonAceptar.innerHTML = 'Validando...';

                try {
                    const response = await fetch(`${API_BASE_URL}/auth/validar-codigo`, {
                        method: 'POST', credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ codigo: codigoCompleto })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'CÃ³digo invÃ¡lido o expirado');
                    }

                    // Guardamos el token temporal que nos da la API para cambiar la contraseÃ±a
                    
                    mostrarExitoRedireccion("CÃ³digo Correcto", "Ya puedes establecer tu nueva contraseÃ±a.", "nuevaContrasena.html");
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



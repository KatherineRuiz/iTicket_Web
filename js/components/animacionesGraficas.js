/* ============================================================
   ANIMACIONES DE LAS GRAFICAS (Chart.js)

   Este archivo se carga justo despues de Chart.js en las paginas que tienen
   graficas y ajusta COMO se animan, para todas a la vez. No toca los datos,
   los colores ni la forma de ninguna: eso sigue definido en cada controlador.
   Si se quita este archivo, las graficas vuelven a animarse como antes.

   Funciona cambiando los valores por defecto de Chart.js. Cada controlador ya
   define su duracion y su curva (por ejemplo 1000 ms con easeOutQuart) y eso
   se respeta: Chart.js mezcla las opciones clave por clave, asi que lo de aqui
   solo rellena lo que el controlador no dijo.

   Son tres mejoras:

   1. ENTRADA ESCALONADA
      Antes las siete barras subian todas juntas. Ahora sube una detras de
      otra, de izquierda a derecha, y en la grafica de lineas los puntos se
      levantan como una ola. Solo pasa en la entrada: cuando despues cambian
      los datos, todo se mueve a la vez, que es lo que se espera ahi.

   2. LAS CIRCULARES CRECEN DESDE EL CENTRO
      Las de dona y de pastel ya giraban al aparecer. Ahora ademas se abren
      desde el centro mientras giran.

   3. LA ANIMACION ESPERA A QUE LA GRAFICA SE VEA
      Chart.js anima en cuanto crea la grafica, aunque este mas abajo en la
      pagina. En celular, o en Estadisticas, eso significaba que al bajar la
      grafica ya estaba quieta y la animacion nunca se veia. Ahora, si la
      grafica nace fuera de pantalla, la entrada se repite la primera vez que
      aparece.

   Accesibilidad: si la persona pidio menos movimiento en su sistema, las
   graficas se dibujan directamente, sin ninguna animacion.
   ============================================================ */
(function () {
    "use strict";

    if (typeof Chart === "undefined") return;

    var RETRASO_ENTRE_BARRAS = 90;   // ms entre una barra y la siguiente
    var RETRASO_ENTRE_PUNTOS = 60;   // ms entre un punto y el siguiente (lineas)
    var RETRASO_ENTRE_SERIES = 120;  // ms extra por cada serie de datos
    var PARTE_VISIBLE_PARA_ANIMAR = 0.25; // cuanto de la grafica debe verse para animarla

    function esCircular(tipo) {
        return tipo === "doughnut" || tipo === "pie" || tipo === "polarArea";
    }

    // ---------- Accesibilidad: sin animaciones si el sistema lo pide ----------
    var reducirMovimiento = window.matchMedia
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducirMovimiento) {
        Chart.register({
            id: "iticketSinAnimacion",
            beforeInit: function (chart) {
                chart.options.animation = false;
            }
        });
        return;
    }

    // ---------- 1. Entrada escalonada ----------
    // Chart.js llama a esta funcion por cada barra o punto para saber cuanto
    // debe esperar antes de empezar a moverse.
    Chart.defaults.animation.delay = function (contexto) {
        // Solo los datos (no los ejes ni la leyenda) y solo en el dibujo normal
        // (no al pasar el mouse ni al cambiar el tamano de la ventana).
        if (contexto.type !== "data" || contexto.mode !== "default") return 0;

        var grafica = contexto.chart;
        if (grafica.$entradaTerminada || esCircular(grafica.config.type)) return 0;

        var porElemento = grafica.config.type === "line" ? RETRASO_ENTRE_PUNTOS : RETRASO_ENTRE_BARRAS;
        return contexto.dataIndex * porElemento + contexto.datasetIndex * RETRASO_ENTRE_SERIES;
    };

    // Cuando termina la primera animacion se anota, para que las siguientes
    // actualizaciones de datos ya no vayan escalonadas.
    Chart.defaults.animation.onComplete = function (evento) {
        evento.chart.$entradaTerminada = true;
    };

    // ---------- 2. Circulares: crecen desde el centro ----------
    ["doughnut", "pie"].forEach(function (tipo) {
        var porTipo = Chart.defaults.datasets && Chart.defaults.datasets[tipo];
        if (!porTipo) return;
        porTipo.animation = Object.assign({}, porTipo.animation, {
            animateRotate: true,
            animateScale: true
        });
    });

    // ---------- 3. Animar cuando la grafica entra en pantalla ----------
    if ("IntersectionObserver" in window) {
        Chart.register({
            id: "iticketEntradaAlVerse",

            afterInit: function (grafica) {
                var primeraLectura = true;

                var observador = new IntersectionObserver(function (entradas) {
                    var visible = entradas.some(function (entrada) { return entrada.isIntersecting; });

                    // La primera lectura solo dice como nacio la grafica. Si ya
                    // estaba a la vista, su animacion normal se vio y no hay
                    // nada que repetir.
                    if (primeraLectura) {
                        primeraLectura = false;
                        if (visible) observador.disconnect();
                        return;
                    }

                    if (!visible) return;
                    observador.disconnect();

                    // Pudo haberse destruido mientras estaba fuera de pantalla
                    // (los dashboards recrean su grafica al recargar datos).
                    if (!grafica.ctx || !grafica.canvas) return;

                    grafica.$entradaTerminada = false;
                    grafica.reset();
                    grafica.update();
                }, { threshold: PARTE_VISIBLE_PARA_ANIMAR });

                observador.observe(grafica.canvas);
                grafica.$observadorEntrada = observador;
            },

            afterDestroy: function (grafica) {
                if (grafica.$observadorEntrada) grafica.$observadorEntrada.disconnect();
            }
        });
    }
})();

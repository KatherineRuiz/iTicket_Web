const graficoResolucion = document.getElementById('graficoResolucion');
const graficoCalificacion = document.getElementById('graficoCalificacion');
const botonesResumen = document.querySelectorAll('.btn-resumen');

Promise.all([
    new Promise(resolve => window.addEventListener('load', resolve)),
    document.fonts.ready
]).then(function () {

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            crearGraficos();
        });
    });

});

function crearGraficos() {
    
    //Grafico de calificacion porcentuales de los tickets evaluados
    if (graficoCalificacion) {
        const grfCalificacion = graficoCalificacion.getContext('2d');
        const graficoCalificaciones = new Chart(grfCalificacion, {
            type: 'doughnut',
            data: {
                labels: ['5 Estrellas', '4 Estrellas', '3 Estrellas', '2 Estrellas', '1 Estrella'],
                datasets: [{
                    label: 'Porcentaje de calificaciones',
                    data: [45, 30, 15, 7, 3],
                    backgroundColor: [
                        '#184E8C',
                        '#539ECD',
                        '#ffe173',
                        '#ffbc66',
                        '#ff8484'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                resizeDelay: 200,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                let value = context.raw || 0;
                                return `${label}: ${value}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    //Grafico de tiempos promedio de resolucion
    if (graficoResolucion) {
        const grfResolucion = graficoResolucion.getContext('2d');
        const graficoTiempo = new Chart(grfResolucion, {
            type: 'bar',
            data: {
                labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Sábado', 'Domingo'],
                datasets: [{
                    label: 'Horas promedio',
                    data: [12, 19, 3, 5, 2, 3],
                    backgroundColor: [
                        '#539ECD',
                        '#90BFDB',
                        '#184E8C',
                        '#539ECD',
                        '#90BFDB',
                        '#184E8C'
                    ],
                    borderWidth: 0,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                resizeDelay: 200,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#EAEAEA'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    //Para controlar los botones de la seccion "Mi resumen"
    botonesResumen.forEach(boton => {
        boton.addEventListener('click', function () {
            botonesResumen.forEach(b => b.classList.remove('activo'));
            this.classList.add('activo');
        });
    });

};

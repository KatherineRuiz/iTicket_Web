
document.addEventListener("DOMContentLoaded", function () {
    const graficoTickets = document.getElementById('graficoTickets');
    const graficoEvaluacion = document.getElementById('graficoEvaluacion');


    //Grafico de prioridades de tickets
    if (graficoTickets) {
        const grfTickets = graficoTickets.getContext('2d');
        const graficTickets = new Chart(grfTickets, {
            type: 'bar',
            data: {
                labels: ['No asignada', 'Baja', 'Media', 'Alta', 'Crítica'],
                datasets: [{
                    label: 'Cantidad',
                    data: [15, 5, 3, 8, 7],
                    backgroundColor: [
                        '#90BFDB',
                        '#D4FFCA',
                        '#ffe173',
                        '#ffbc66',
                        '#ff8484'
                    ],
                    borderWidth: 0,
                    borderRadius: 8,
                    maxBarThickness: 45
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

    if (graficoEvaluacion) {
        const grfEvaluacion = graficoEvaluacion.getContext('2d');
        const graficoEvaluaciones = new Chart(grfEvaluacion, {
            type: 'doughnut',
            data: {
                labels: ['5 Estrellas', '4 Estrellas', '3 Estrellas', '2 Estrellas', '1 Estrella'],
                datasets: [{
                    label: 'Porcentaje de evaluaciones',
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
});

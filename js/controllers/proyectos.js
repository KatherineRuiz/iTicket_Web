const graficoTipoProyecto = document.getElementById('graficoTipoProyecto');
const modalCrearProyecto = new bootstrap.Modal(document.getElementById('modalCrearProyecto'));
const modalFasesProyecto = new bootstrap.Modal(document.getElementById('modalFasesProyecto'));
const modalDetalleFase = new bootstrap.Modal(document.getElementById('modalDetalleFase'));


if (graficoTipoProyecto) {
        const grfTipoProyecto = graficoTipoProyecto.getContext('2d');
        const graficoProyectos = new Chart(grfTipoProyecto, {
            type: 'doughnut',
            data: {
                labels: ['Construcción', 'Remodelación', 'Ampliación', 'Mantenimiento'],
                datasets: [{
                    label: 'Número de proyectos',
                    data: [45, 30, 15, 7],
                    backgroundColor: [
                        '#184E8C',
                        '#539ECD',
                        '#ffe173',
                        '#ffbc66',
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
                    }
                }
            }
        });
    }


//Crear Proyecto, abre Fases
document.getElementById('formCrearProyecto').addEventListener('submit', (e) => {
    e.preventDefault();
    modalCrearProyecto.hide();
    modalFasesProyecto.show();
});

//Agregar Fase evita el reload de la página
document.getElementById('formAgregarFase').addEventListener('submit', (e) => {
    e.preventDefault();
});

//Agregar Detalle
document.getElementById('formAgregarDetalle').addEventListener('submit', (e) => {
    e.preventDefault();
});

//Al cerrar el modal de Detalles, regresa al de Fases
document.getElementById('modalDetalleFase').addEventListener('hidden.bs.modal', () => {
    modalFasesProyecto.show();
});

//Finalizar
document.getElementById('btnFinalizarCreacionProyecto').addEventListener('click', () => {
    modalFasesProyecto.hide();
});
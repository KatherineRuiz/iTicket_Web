
const graficoResolucion = document.getElementById('graficoResolucion');
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
                        '#539ECD', '#90BFDB', '#184E8C',
                        '#539ECD', '#90BFDB', '#184E8C'
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
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#EAEAEA' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

botonesResumen.forEach(boton => {
        boton.addEventListener('click', function () {
            botonesResumen.forEach(b => b.classList.remove('activo'));
            this.classList.add('activo');
        });
    });
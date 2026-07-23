
const graficoResolucion = document.getElementById('graficoResolucion');
const botonesResumen = document.querySelectorAll('.btn-resumen');
const btnCrear = document.getElementById('btnCrear');


// Aqui se crea ese evento click que envia de la interfaz del Dashboard a Mis tickets, como ya se habia diseñado el button mejor solo agregar el link con el eventListener
btnCrear.addEventListener('click', function () {
    window.location.href = 'misTickets.html';
})

// Con esto se espera que dos funciones asincronicas se cumplan simultaneamente 
Promise.all([
    // Estas dos
    new Promise(resolve => window.addEventListener('load', resolve)),
    document.fonts.ready
]).then(function () {

    // Esto es conocido como Double-rAF, básicamente sirve para que al primer refresco de pantalla se calcule el espacio que se ocupara y al segundo se ocupe ese espacio
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            crearGraficos();
        });
    });

});

// Crea los gráficos de Chart js con los datos que elegimos mostrar
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
    boton.addEventListener('click', function (e) {
        console.log('Botón clickeado:', e.currentTarget); // ¿Sale en la consola F12?
        botonesResumen.forEach(b => b.classList.remove('activo'));
        this.classList.add('activo');
    });
});
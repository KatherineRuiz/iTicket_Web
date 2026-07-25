const Meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre', 'Diciembre'];
const Tecnicos = ['Pedro', 'Hallan', 'Julio', 'Douglas', 'Orlando', 'Samuel', 'Katherine', 'Agotin', 'Sepito', 'Octavio', 'Nova', 'Diecel'];
//esto se cambiaria al conectar la api 

/* LÓGICA DE VANILLA CALENDAR PRO
========================================================================== */
function inicializarCalendarioPro(idBoton, idContenedor, idTexto) {
    const boton = document.getElementById(idBoton);
    const contenedor = document.getElementById(idContenedor);
    const texto = document.getElementById(idTexto);

    if (!boton || !contenedor || !texto) return;

    // Abrir/Cerrar menú flotante
    boton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        contenedor.classList.toggle('d-none');
    });

    // Cerrar automáticamente si hacen clic afuera
    document.addEventListener('click', (e) => {
        if (!contenedor.contains(e.target) && e.target !== boton) {
            contenedor.classList.add('d-none');
        }
    });

    if (typeof VanillaCalendar !== 'undefined') {
        try {
            const calendar = new VanillaCalendar(`#${idContenedor}`, {
                settings: {
                    visibility: {
                        theme: 'light', 
                        weekNumbers: true 
                    },
                    selection: {
                        day: 'single', 
                    }
                },
                actions: {
                    // El segundo parámetro es la instancia 'self' de la librería
                    clickDay(event, self) {
                        // Accedemos a las  fechas seleccionadas de la librería
                        const dates = self.selectedDates; 
                        
                        if (dates && dates.length > 0) {
                            const [year, month, day] = dates[0].split('-');
                            const fechaFormateada = `${day}/${month}/${year.slice(2)}`;
                            
                            texto.innerText = fechaFormateada;
                            contenedor.classList.add('d-none');
                        }
                    },
                    clickWeekNumber(event, number, days, year) {
                        texto.innerText = `Semana ${number} (${year})`;
                        contenedor.classList.add('d-none');
                    },
                    clickMonth(event, self) {
                        // Extrae el mes seleccionado 
                        const m = typeof self === 'number' ? self : self.selectedMonth;
                        texto.innerText = `${Meses[m]}`;
                        contenedor.classList.add('d-none');
                    },
                    clickYear(event, self) {
                        // Extrae el año 
                        const y = typeof self === 'number' ? self : self.selectedYear;
                        texto.innerText = `${y}`;
                        contenedor.classList.add('d-none');
                    }
                }
            });
            calendar.init();
        } catch (error) {
            console.error("Error al crear el calendario:", error);
        }
    } else {
        console.error("VanillaCalendar no se cargó correctamente.");
    }
}

// Inicialización de componentes al cargar el DOM
document.addEventListener('DOMContentLoaded', function () {
    inicializarCalendarioPro('btnFiltroFecha', 'calendarioPrincipal', 'textoFiltroFecha');
    inicializarCalendarioPro('btnFiltroFechaEquipos', 'calendarioEquipos', 'textoFiltroFechaEquipos');
});

/*ESTABILIZADOR DE RENDERIZADO: Gráficas de Chart.js
========================================================================== */
Promise.all([
    new Promise(resolve => window.addEventListener('load', resolve)),
    document.fonts.ready
]).then(function () {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            crearGraficas();
        });
    });
});

function crearGraficas() {

    /* 1. barras Horizontales-satisfaccion */
    /* 1. Barras Horizontales - Satisfacción */
    if (document.getElementById('grafica_satisfaccion')) {
        new Chart(document.getElementById('grafica_satisfaccion'), {
            type: 'bar',
            data: {
                labels: Tecnicos,
                datasets: [{
                    label: 'Nivel de Satisfacción',
                    data: [4, 5, 4, 3, 2.1, 3.5, 4.5, 4.9, 3.2, 1, 2, 3],
                    backgroundColor: (ctx) => ctx.dataIndex % 2 === 0 ? 'rgba(3, 4, 94, 0.8)' : 'rgba(67, 161, 255, 0.8)',
                    borderColor: (ctx) => ctx.dataIndex % 2 === 0 ? 'rgb(3, 4, 94)' : 'rgb(67, 161, 255)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                animation: { duration: 2000, easing: 'easeOutQuart' },
                indexAxis: 'y',
                responsive: true,
                resizeDelay: 200,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, max: 5 },
                    y: { reverse: true }
                }
            }
        });
    }

    /* 2. Grafica de pie o pastel-Estrelas*/
    if (document.getElementById('grafica_estrellas')) {
        new Chart(document.getElementById('grafica_estrellas'), {
            type: 'pie', // Tipo pastel
            data: {
                labels: ['5 Estrellas', '4 Estrellas', '3 Estrellas', '1-2 Estrellas'],
                datasets: [{
                    data: [300, 150, 100, 50],
                    backgroundColor: ['#43a1ff', '#b2f5b2', '#ffe173', '#ff8484'],
                    // Propiedades de espaciado copiadas exactamente de la dona:
                    borderWidth: 5,
                    borderColor: '#F5F7FA',
                    borderRadius: 5,
                    hoverOffset: 10,
                    radius: '105%'
                }]
            },
            options: {
                animation: { animateRotate: true, animateScale: true, duration: 2000, easing: 'easeOutCirc' },
                responsive: true,
                resizeDelay: 200,
                maintainAspectRatio: false,
                layout: { padding: 10 },
                plugins: {
                    legend: { position: 'left' }, /*aqui le cambias la posicion a  las rallitas para quitarle las lineas solo pon lengen:false  */
                    tooltip: { usePointStyle: true, boxPadding: 6 }
                }
            }
        });
    }

    /* 3. Grafica de dona-Tickets-Prioridades */
    if (document.getElementById('grafica_prioridades')) {
        new Chart(document.getElementById('grafica_prioridades'), {
            type: 'doughnut',
            data: {
                labels: ['Crítica', 'Alta', 'Media', 'Baja'],
                datasets: [{
                    data: [20, 40, 60, 80],
                    backgroundColor: ['#ff8484', '#ffbc66', '#ffe173', '#b2f5b2'],
                    borderWidth: 5,
                    borderColor: '#F5F7FA',
                    borderRadius: 5,
                    hoverOffset: 15,
                    radius: '90%'
                }]
            },
            options: {
                animation: { animateRotate: true, animateScale: true, duration: 2000, easing: 'easeOutCirc' },
                cutout: '60%',
                responsive: true,
                resizeDelay: 200,
                maintainAspectRatio: false,
                layout: { padding: 10 },
                plugins: {
                    legend: { position: 'right' },
                    tooltip: { usePointStyle: true, boxPadding: 6 }
                }
            }
        });
    }

    /* 4. Graficaa de lineas multiples-Tickets-Vencidos-Creados*/
    if (document.getElementById('grafica_historico')) {
        new Chart(document.getElementById('grafica_historico'), {
            type: 'line',
            data: {
                labels: Meses,
                datasets: [
                    {
                        label: 'Vencidos',
                        data: [12, 19, 15, 25, 22, 30, 25, 35, 28, 40, 32, 45],
                        borderColor: '#FBBABA',
                        fill: true,
                        tension: 0.4,
                        backgroundColor: (context) => {
                            const {ctx, chartArea} = context.chart;
                            if (!chartArea) return null;
                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            gradient.addColorStop(0, 'rgba(251, 186, 186, 0.6)');  
                            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
                            return gradient;
                        }
                    },
                    {
                        label: 'Creados',
                        data: [18, 12, 28, 20, 15, 26, 30, 22, 38, 29, 41, 35],
                        borderColor: '#CAEBFF',
                        fill: true,
                        tension: 0.4,
                        backgroundColor: (context) => {
                            const {ctx, chartArea} = context.chart;
                            if (!chartArea) return null;
                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            gradient.addColorStop(0, 'rgba(202, 235, 255, 0.6)');
                            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
                            return gradient;
                        }
                    },
                    {
                        label: 'Resueltos',
                        data: [25, 28, 22, 32, 27, 18, 23, 29, 31, 22, 35, 39],
                        borderColor: '#D4FFCA',
                        fill: true,
                        tension: 0.4,
                        backgroundColor: (context) => {
                            const {ctx, chartArea} = context.chart;
                            if (!chartArea) return null;
                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            gradient.addColorStop(0, 'rgba(212, 255, 202, 0.6)');
                            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
                            return gradient;
                        }
                    }
                ]
            },
            options: {
                animation: { duration: 2000, easing: 'easeOutQuart' },
                responsive: true,
                resizeDelay: 200,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'top' } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: 'rgba(0, 0, 0, 0.05)' } }
                }
            }   
        });
    }

    
        new Chart(document.getElementById('grafica_frecuentes'), {
            type: 'bar',
            data: {
                labels: ['Equipos averiados', 'Conexión', 'Fallos de sistema', 'Pupitres arruinados', 'Vidrios', 'Pantallas no imagen','Cañon no enciende','Fuga de agua','Oasis fuera de servicio'],
                datasets: [{
                    label: 'Reportes',
                    data: [65, 30, 45, 35, 56, 80,30,50,48,90],
                    backgroundColor: (ctx) => ctx.dataIndex % 2 === 0 ? 'rgba(3, 4, 94, 0.8)' : 'rgba(67, 161, 255, 0.8)',
                    borderColor: (ctx) => ctx.dataIndex % 2 === 0 ? 'rgb(3, 4, 94)' : 'rgb(67, 161, 255)',
                    borderWidth: 1,
                    borderRadius: 10
                }]
            },
            options: {
                animation: { duration: 2000, easing: 'easeOutQuart' },
                responsive: true,
                resizeDelay: 200,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true }
                }
            }
        });
    
}
document.addEventListener('DOMContentLoaded', () => {

  // ===== Datos de ejemplo (mientras no haya conexión al backend) =====
  const proyecto = {
    nombre: 'Reconstrucción del SUM',
    ubicacion: 'Salón de usos múltiples',
    tipo: 'Remodelación',
    coordinador: 'josue_guinea@ricaldone.edu.sv',
    supervisor: 'ricardo_paz@ricaldone.edu.sv',
    presupuesto: 3600.0,
    total: 4000.0,
    estado: 'Finalizado'
  };

  let fases = [];
  let idFaseContador = 1;
  let idDetalleContador = 1;
  let faseSeleccionadaId = null;
  let faseEnEdicionId = null;

  // ===== Referencias del DOM =====
  const selectFase = document.getElementById('selectFase');
  const tarjetaFase = document.getElementById('tarjetaFaseSeleccionada');
  const listaDetalleVista = document.getElementById('listaDetalleFaseVista');

  const formAgregarFase = document.getElementById('formAgregarFase');
  const formAgregarDetalle = document.getElementById('formAgregarDetalle');
  const txtBotonGuardarFase = document.getElementById('txtBotonGuardarFase');

  const modoVistaProyecto = document.getElementById('modoVistaProyecto');
  const modoEdicionProyecto = document.getElementById('modoEdicionProyecto');
  const btnEditarProyecto = document.getElementById('btnEditarProyecto');
  const btnCancelarEdicionProyecto = document.getElementById('btnCancelarEdicionProyecto');

  const btnCrearFase = document.getElementById('btnCrearFase');
  const btnEditarFase = document.getElementById('btnEditarFase');
  const btnAgregarDetalle = document.getElementById('btnAgregarDetalle');
  const btnEditarDetalle = document.getElementById('btnEditarDetalle');

  const modalFasesProyecto = document.getElementById('modalFasesProyecto');
  const modalDetalleFase = document.getElementById('modalDetalleFase');

  // ===== Utilidades =====
  function obtenerFasePorId(id) {
    return fases.find((f) => f.id === id);
  }

  function pintarDatosProyecto() {
    document.getElementById('txtNombreProyecto').textContent = proyecto.nombre;
    document.getElementById('txtUbicacionProyecto').textContent = proyecto.ubicacion;
    document.getElementById('txtTipoProyecto').textContent = proyecto.tipo;
    document.getElementById('txtCoordinadorProyecto').textContent = proyecto.coordinador;
    document.getElementById('txtSupervisorProyecto').textContent = proyecto.supervisor;
    document.getElementById('txtPresupuestoProyecto').textContent = Number(proyecto.presupuesto).toFixed(2);
    document.getElementById('txtTotalProyecto').textContent = Number(proyecto.total).toFixed(2);
    document.getElementById('txtEstadoProyecto').textContent = proyecto.estado;
  }

  function renderSelectFases() {
    selectFase.innerHTML = '<option value="">Selecciona una fase</option>';
    fases.forEach((f) => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.nombre;
      if (f.id === faseSeleccionadaId) opt.selected = true;
      selectFase.appendChild(opt);
    });
  }

  function renderTarjetaFase() {
    const fase = obtenerFasePorId(faseSeleccionadaId);
    if (!fase) {
      tarjetaFase.innerHTML =
        '<p class="text-muted mb-0">Selecciona o crea una fase para ver su información.</p>';
      return;
    }
    tarjetaFase.innerHTML = `
      <h6 class="text-navy fw-bold mb-3">${fase.nombre}</h6>
      <p class="meta-proyecto mb-1"><b>Departamento encargado:</b> ${fase.departamento}</p>
      <p class="meta-proyecto mb-1"><b>Descripción:</b> ${fase.descripcion}</p>
      <p class="meta-proyecto mb-1"><b>Inicio estimado:</b> ${fase.fechaInicio || '—'}</p>
      <p class="meta-proyecto mb-1"><b>Final estimado:</b> ${fase.fechaFin || '—'}</p>
      <p class="meta-proyecto mb-1"><b>Proveedor:</b> ${fase.proveedor || 'N/A'}</p>
      <p class="meta-proyecto mb-0"><b>Presupuesto estimado:</b> $${Number(fase.presupuesto).toFixed(2)}</p>
    `;
  }

  function renderListaDetalles() {
    const fase = obtenerFasePorId(faseSeleccionadaId);
    listaDetalleVista.innerHTML = '';
    listaDetalleVista.classList.remove('modo-edicion');

    if (!fase) {
      listaDetalleVista.innerHTML =
        '<li class="text-muted">Selecciona una fase para ver sus detalles.</li>';
      return;
    }
    if (fase.detalles.length === 0) {
      listaDetalleVista.innerHTML =
        '<li class="text-muted">Esta fase aún no tiene detalles.</li>';
      return;
    }

    fase.detalles.forEach((d) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <input type="checkbox" class="form-check-input" data-id-detalle="${d.id}" ${d.completado ? 'checked' : ''}>
        <span class="${d.completado ? 'text-decoration-line-through text-muted' : ''}">${d.texto}</span>
        <i class="bi bi-trash btn-eliminar-detalle" data-id-detalle="${d.id}" title="Eliminar"></i>
      `;
      listaDetalleVista.appendChild(li);
    });
  }

  function seleccionarFase(id) {
    faseSeleccionadaId = id ? Number(id) : null;
    renderTarjetaFase();
    renderListaDetalles();
  }

  function cargarFormularioProyecto() {
    document.getElementById('txtNombreProyectoEdicion').value = proyecto.nombre;
    document.getElementById('txtUbicacionProyectoEdicion').value = proyecto.ubicacion;
    document.getElementById('txtTipoProyectoEdicion').value = proyecto.tipo;
    document.getElementById('selectEstadoProyectoEdicion').value = proyecto.estado;
    document.getElementById('txtCoordinadorProyectoEdicion').value = proyecto.coordinador;
    document.getElementById('txtSupervisorProyectoEdicion').value = proyecto.supervisor;
    document.getElementById('numPresupuestoProyectoEdicion').value = proyecto.presupuesto;
    document.getElementById('numTotalProyectoEdicion').value = proyecto.total;
  }

  function activarModoEdicionProyecto(editando) {
    if (editando) {
      cargarFormularioProyecto();
      modoVistaProyecto.classList.add('d-none');
      modoEdicionProyecto.classList.remove('d-none');
    } else {
      modoEdicionProyecto.classList.add('d-none');
      modoVistaProyecto.classList.remove('d-none');
    }
  }

  btnEditarProyecto.addEventListener('click', () => activarModoEdicionProyecto(true));
  btnCancelarEdicionProyecto.addEventListener('click', () => activarModoEdicionProyecto(false));

  modoEdicionProyecto.addEventListener('submit', (e) => {
    e.preventDefault();
    proyecto.nombre = document.getElementById('txtNombreProyectoEdicion').value.trim();
    proyecto.ubicacion = document.getElementById('txtUbicacionProyectoEdicion').value.trim();
    proyecto.tipo = document.getElementById('txtTipoProyectoEdicion').value.trim();
    proyecto.estado = document.getElementById('selectEstadoProyectoEdicion').value;
    proyecto.coordinador = document.getElementById('txtCoordinadorProyectoEdicion').value.trim();
    proyecto.supervisor = document.getElementById('txtSupervisorProyectoEdicion').value.trim();
    proyecto.presupuesto = Number(document.getElementById('numPresupuestoProyectoEdicion').value);
    proyecto.total = Number(document.getElementById('numTotalProyectoEdicion').value);

    pintarDatosProyecto();
    activarModoEdicionProyecto(false);
  });

  // ===== Eventos: selección de fase =====
  selectFase.addEventListener('change', (e) => seleccionarFase(e.target.value));

  // ===== Crear fase =====
  btnCrearFase.addEventListener('click', () => {
    faseEnEdicionId = null;
    formAgregarFase.reset();
    txtBotonGuardarFase.textContent = 'Agregar fase';
  });

  // ===== Editar fase seleccionada =====
  btnEditarFase.addEventListener('click', () => {
    const fase = obtenerFasePorId(faseSeleccionadaId);
    if (!fase) {
      alert('Selecciona una fase para editar.');
      return;
    }
    faseEnEdicionId = fase.id;
    document.getElementById('txtNombreFase').value = fase.nombre;
    document.getElementById('txtDepartamentoEncargado').value = fase.departamento;
    document.getElementById('txtDesxripxionFase').value = fase.descripcion;
    document.getElementById('txtFechaInicioEstimada').value = fase.fechaInicio;
    document.getElementById('txtFechaFinalEstimada').value = fase.fechaFin;
    document.getElementById('txtProveedor').value = fase.proveedor;
    document.getElementById('numPresupuesto').value = fase.presupuesto;
    txtBotonGuardarFase.textContent = 'Guardar cambios';
    new bootstrap.Modal(modalFasesProyecto).show();
  });

  formAgregarFase.addEventListener('submit', (e) => {
    e.preventDefault();
    const datos = {
      nombre: document.getElementById('txtNombreFase').value.trim(),
      departamento: document.getElementById('txtDepartamentoEncargado').value.trim(),
      descripcion: document.getElementById('txtDesxripxionFase').value.trim(),
      fechaInicio: document.getElementById('txtFechaInicioEstimada').value,
      fechaFin: document.getElementById('txtFechaFinalEstimada').value,
      proveedor: document.getElementById('txtProveedor').value.trim(),
      presupuesto: document.getElementById('numPresupuesto').value
    };

    if (faseEnEdicionId) {
      const fase = obtenerFasePorId(faseEnEdicionId);
      Object.assign(fase, datos);
    } else {
      const nuevaFase = { id: idFaseContador++, detalles: [], ...datos };
      fases.push(nuevaFase);
      faseSeleccionadaId = nuevaFase.id;
    }

    renderSelectFases();
    renderTarjetaFase();
    renderListaDetalles();
    formAgregarFase.reset();
    faseEnEdicionId = null;

    const instancia = bootstrap.Modal.getInstance(modalFasesProyecto);
    if (instancia) instancia.hide();
  });

  // ===== Agregar detalle a la fase seleccionada =====
  btnAgregarDetalle.addEventListener('click', () => {
    if (!faseSeleccionadaId) {
      alert('Selecciona una fase antes de agregar un detalle.');
      return;
    }
    document.getElementById('idFaseActual').value = faseSeleccionadaId;
  });

  formAgregarDetalle.addEventListener('submit', (e) => {
    e.preventDefault();
    const idFase = Number(document.getElementById('idFaseActual').value);
    const fase = obtenerFasePorId(idFase);
    const texto = document.getElementById('txtDetalleFase').value.trim();
    if (!fase || !texto) return;

    fase.detalles.push({ id: idDetalleContador++, texto, completado: false });
    renderListaDetalles();
    formAgregarDetalle.reset();
  });

  // ===== Modo edición de la lista de detalles (marcar / eliminar) =====
  btnEditarDetalle.addEventListener('click', () => {
    listaDetalleVista.classList.toggle('modo-edicion');
  });

  listaDetalleVista.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-eliminar-detalle')) {
      const idDetalle = Number(e.target.dataset.idDetalle);
      const fase = obtenerFasePorId(faseSeleccionadaId);
      if (!fase) return;
      fase.detalles = fase.detalles.filter((d) => d.id !== idDetalle);
      renderListaDetalles();
      listaDetalleVista.classList.add('modo-edicion');
    }
  });

  listaDetalleVista.addEventListener('change', (e) => {
    if (e.target.matches('input[type="checkbox"]')) {
      const idDetalle = Number(e.target.dataset.idDetalle);
      const fase = obtenerFasePorId(faseSeleccionadaId);
      if (!fase) return;
      const detalle = fase.detalles.find((d) => d.id === idDetalle);
      detalle.completado = e.target.checked;
      renderListaDetalles();
    }
  });

  // ===== Datos de ejemplo iniciales =====
  fases.push({
    id: idFaseContador++,
    nombre: 'Demolición y limpieza',
    departamento: 'Mantenimiento',
    descripcion: 'Retiro de mobiliario dañado y limpieza general del salón.',
    fechaInicio: '2026-01-10',
    fechaFin: '2026-01-20',
    proveedor: '',
    presupuesto: 800,
    detalles: [
      { id: idDetalleContador++, texto: 'Retirar sillas y mesas dañadas', completado: true },
      { id: idDetalleContador++, texto: 'Limpieza de piso y paredes', completado: false }
    ]
  });

  pintarDatosProyecto();
  renderSelectFases();
  seleccionarFase(fases[0].id);
});
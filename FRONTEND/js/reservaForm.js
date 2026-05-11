/* ================================================================
   reservaForm.js — lógica del formulario reserva-form.html
================================================================ */

window.habitacionesParaReserva = [];

/* ── helpers ── */
const rfEl    = id  => document.getElementById(id);
const rfFmt   = v   => '$' + Number(v || 0).toLocaleString('es-CO');
const imgBase = ()  => {
  const api = (typeof CONFIG !== 'undefined' ? CONFIG.API_URL : 'http://localhost:3000/api');
  return api.replace('/api', '/img');
};
const imgUrl  = src => src ? `${imgBase()}/${encodeURIComponent(src)}` : null;

/* ── Carga selects (habitaciones, paquetes, servicios) ── */
async function cargarSelectsReserva(selectedPaqIds = [], selectedSvcIds = []) {

  /* Habitaciones */
  try {
    const habs = await requestJson('/habitaciones');
    window.habitacionesParaReserva = Array.isArray(habs) ? habs.filter(h => h.Estado == 1) : [];
    const sel = rfEl('reserva-admin-habitacion');
    if (sel) {
      sel.innerHTML = '<option value="">— Selecciona habitación —</option>' +
        window.habitacionesParaReserva.map(h =>
          `<option value="${h.IDHabitacion}">${h.NombreHabitacion} — ${rfFmt(h.Costo)}/noche</option>`
        ).join('');
      sel.addEventListener('change', recalcularPrecio);
    }
  } catch (e) { console.warn('Habitaciones:', e.message); }

  /* Paquetes */
  try {
    const paquetes = await requestJson('/paquetes');
    const activos  = (Array.isArray(paquetes) ? paquetes : []).filter(p => p.Estado == 1);
    const grid     = rfEl('reserva-admin-paquetes-grid');
    if (grid) {
      if (!activos.length) {
        grid.innerHTML = '<p style="color:#64748b;font-size:.82rem">No hay paquetes activos</p>';
      } else {
        grid.innerHTML = activos.map(p => {
          const sel  = selectedPaqIds.includes(String(p.IDPaquete));
          const foto = imgUrl(p.ImagenPaquete);
          return `
            <div class="paquete-card${sel ? ' seleccionado' : ''}"
                 data-id="${p.IDPaquete}" data-precio="${p.Precio || 0}"
                 onclick="togglePaquete(this)">
              <div class="paquete-img-wrap">
                ${foto
                  ? `<img src="${foto}" alt="${p.NombrePaquete}" loading="lazy"
                          onerror="this.parentElement.style.background='#e2e8f0';this.remove()">`
                  : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8"><i class="fa-solid fa-image" style="font-size:2rem"></i></div>'
                }
                ${sel ? '<div class="paquete-badge-sel"><i class="fa-solid fa-check"></i></div>' : ''}
              </div>
              <div class="paquete-body">
                <div class="paquete-nombre">${p.NombrePaquete}</div>
                <div class="paquete-precio">${rfFmt(p.Precio)}</div>
                <div class="paquete-desc${sel ? ' visible' : ''}">${p.Descripcion || ''}</div>
              </div>
            </div>`;
        }).join('');
      }
    }
  } catch (e) { console.warn('Paquetes:', e.message); }

  /* Servicios */
  try {
    const servicios = await requestJson('/servicios');
    const activos   = (Array.isArray(servicios) ? servicios : []).filter(s => s.Estado == 1);
    const grid      = rfEl('reserva-admin-servicios-grid');
    if (grid) {
      if (!activos.length) {
        grid.innerHTML = '<p style="color:#64748b;font-size:.82rem">No hay servicios activos</p>';
      } else {
        grid.innerHTML = activos.map(s => {
          const sel = selectedSvcIds.includes(String(s.IDServicio));
          return `<button type="button"
                          class="servicio-toggle-btn${sel ? ' seleccionado' : ''}"
                          data-id="${s.IDServicio}" data-costo="${s.Costo || 0}"
                          onclick="toggleServicio(this)"
                          style="padding:.45rem .9rem;border-radius:999px;cursor:pointer;font-size:.82rem;
                                 border:1.5px solid ${sel ? '#1b4332' : '#e2e8f0'};
                                 background:${sel ? '#f0fdf4' : '#f8fafc'};
                                 color:${sel ? '#14532d' : '#334155'};
                                 font-weight:600;transition:all .2s;font-family:inherit">
                    ${s.NombreServicio} — ${rfFmt(s.Costo)}
                  </button>`;
        }).join('');
      }
    }
  } catch (e) { console.warn('Servicios:', e.message); }

  /* Listeners de fechas */
  ['reserva-admin-fecha-inicio', 'reserva-admin-fecha-fin'].forEach(id => {
    rfEl(id)?.addEventListener('change', recalcularPrecio);
  });
  rfEl('reserva-admin-descuento')?.addEventListener('input', recalcularPrecio);

  recalcularPrecio();
}

/* ── Toggle paquete ── */
function togglePaquete(el) {
  el.classList.toggle('seleccionado');
  const sel = el.classList.contains('seleccionado');

  /* badge check */
  const wrap = el.querySelector('.paquete-img-wrap');
  let badge  = el.querySelector('.paquete-badge-sel');
  if (sel && !badge && wrap) {
    badge = document.createElement('div');
    badge.className = 'paquete-badge-sel';
    badge.innerHTML = '<i class="fa-solid fa-check"></i>';
    wrap.appendChild(badge);
  } else if (!sel && badge) {
    badge.remove();
  }

  /* descripción */
  const desc = el.querySelector('.paquete-desc');
  if (desc) desc.classList.toggle('visible', sel);

  recalcularPrecio();
}

/* ── Toggle servicio ── */
function toggleServicio(el) {
  el.classList.toggle('seleccionado');
  const s = el.classList.contains('seleccionado');
  el.style.borderColor = s ? '#1b4332' : '#e2e8f0';
  el.style.background  = s ? '#f0fdf4' : '#f8fafc';
  el.style.color       = s ? '#14532d' : '#334155';
  recalcularPrecio();
}

/* ── Recalcular precios ── */
function recalcularPrecio() {
  const fi     = rfEl('reserva-admin-fecha-inicio')?.value;
  const ff     = rfEl('reserva-admin-fecha-fin')?.value;
  const habSel = rfEl('reserva-admin-habitacion');

  const noches = (fi && ff) ? Math.max(0, Math.ceil((new Date(ff) - new Date(fi)) / 86400000)) : 0;
  const costoHab = (() => {
    if (!habSel?.value || noches === 0) return 0;
    const h = window.habitacionesParaReserva.find(h => String(h.IDHabitacion) === String(habSel.value));
    return Number(h?.Costo || 0) * noches;
  })();

  const costoPaq = [...document.querySelectorAll('#reserva-admin-paquetes-grid .paquete-card.seleccionado')]
                     .reduce((s, e) => s + Number(e.dataset.precio || 0), 0);
  const costoSvc = [...document.querySelectorAll('#reserva-admin-servicios-grid .servicio-toggle-btn.seleccionado')]
                     .reduce((s, e) => s + Number(e.dataset.costo || 0), 0);

  const desc  = parseFloat(rfEl('reserva-admin-descuento')?.value) || 0;
  const sub   = costoHab + costoPaq + costoSvc;
  const iva   = sub * 0.19;
  const total = Math.max(0, sub - desc + iva);

  if (rfEl('reserva-admin-subtotal')) rfEl('reserva-admin-subtotal').value = sub.toFixed(2);
  if (rfEl('reserva-admin-iva'))      rfEl('reserva-admin-iva').value      = iva.toFixed(2);
  if (rfEl('reserva-admin-total'))    rfEl('reserva-admin-total').value    = total.toFixed(2);

  if (typeof actualizarSidebar === 'function') actualizarSidebar();
}

/* ── Autocomplete de cliente ── */
function configurarBuscadorCliente() {
  const input  = rfEl('reserva-admin-cliente-buscar');
  const lista  = rfEl('reserva-admin-cliente-lista');
  const hidden = rfEl('reserva-admin-cliente-id');
  if (!input || !lista) return;

  let clientes = [];
  requestJson('/clientes').then(d => { clientes = Array.isArray(d) ? d : []; }).catch(() => {});

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    if (q.length < 2) { lista.classList.add('hidden'); return; }
    const found = clientes.filter(c =>
      (c.NroDocumento || '').toLowerCase().includes(q) ||
      (c.Nombre || '').toLowerCase().includes(q) ||
      (c.Apellido || '').toLowerCase().includes(q)
    ).slice(0, 8);
    if (!found.length) { lista.classList.add('hidden'); return; }
    lista.innerHTML = found.map(c =>
      `<li data-doc="${c.NroDocumento}" data-nombre="${c.Nombre} ${c.Apellido}">
        ${c.Nombre} ${c.Apellido} — <strong>${c.NroDocumento}</strong>
       </li>`
    ).join('');
    lista.classList.remove('hidden');
  });

  lista.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    input.value = `${li.dataset.nombre} — ${li.dataset.doc}`;
    input.dataset.documentoSeleccionado = li.dataset.doc;
    if (hidden) hidden.value = li.dataset.doc;
    lista.classList.add('hidden');
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !lista.contains(e.target))
      lista.classList.add('hidden');
  });
}

/* ── Guardar reserva ── */
async function guardarReservaAdmin(e) {
  e.preventDefault();

  const nroDoc = rfEl('reserva-admin-cliente-id')?.value
              || rfEl('reserva-admin-cliente-buscar')?.dataset?.documentoSeleccionado;
  if (!nroDoc) {
    mostrarMensajeReservaAdmin('Selecciona un cliente válido del listado.', 'error');
    return;
  }
  const fi = rfEl('reserva-admin-fecha-inicio')?.value;
  const ff = rfEl('reserva-admin-fecha-fin')?.value;
  if (!fi || !ff) {
    mostrarMensajeReservaAdmin('Completa las fechas de inicio y finalización.', 'error');
    return;
  }

  const paquetesIds  = [...document.querySelectorAll('#reserva-admin-paquetes-grid .paquete-card.seleccionado')]
                         .map(e => Number(e.dataset.id));
  const serviciosIds = [...document.querySelectorAll('#reserva-admin-servicios-grid .servicio-toggle-btn.seleccionado')]
                         .map(e => Number(e.dataset.id));

  const body = {
    NroDocumentoCliente: nroDoc,
    FechaInicio:         fi,
    FechaFinalizacion:   ff,
    MetodoPago:          Number(rfEl('reserva-admin-metodo-pago')?.value || 1),
    IdEstadoReserva:     Number(rfEl('reserva-admin-estado')?.value || 1),
    SubTotal:            Number(rfEl('reserva-admin-subtotal')?.value || 0),
    Descuento:           Number(rfEl('reserva-admin-descuento')?.value || 0),
    IVA:                 Number(rfEl('reserva-admin-iva')?.value || 0),
    MontoTotal:          Number(rfEl('reserva-admin-total')?.value || 0),
    paquetesIds,
    serviciosIds,
  };

  const id  = rfEl('reserva-admin-id')?.value;
  const btn = rfEl('btn-reserva-admin-guardar');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'; }

  try {
    let reservaId = id;
    if (id) {
      await requestJson(`/reservas/${id}`, { method: 'PUT', body });
    } else {
      const resp = await requestJson('/reservas', { method: 'POST', body });
      reservaId = resp.reservaId || '';
    }
    mostrarAlertaExito(reservaId);
  } catch (err) {
    mostrarMensajeReservaAdmin('Error al guardar la reserva. Intenta de nuevo.', 'error');
    console.error('guardarReservaAdmin:', err);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> ' + (id ? 'Guardar cambios' : 'Guardar reserva'); }
  }
}

/* ── Mensaje inline ── */
function mostrarMensajeReservaAdmin(texto, tipo) {
  const el = rfEl('mensaje-reserva-admin-modal');
  if (!el) return;
  el.textContent = texto;
  el.className = 'crud-reservas-mensaje ' + (tipo || '');
}

/* ── Limpiar formulario ── */
function limpiarFormularioReservaAdmin() {
  ['reserva-admin-id','reserva-admin-cliente-id'].forEach(id => { const e = rfEl(id); if (e) e.value = ''; });
  const buscar = rfEl('reserva-admin-cliente-buscar');
  if (buscar) { buscar.value = ''; buscar.dataset.documentoSeleccionado = ''; }
  ['reserva-admin-habitacion','reserva-admin-fecha-inicio','reserva-admin-fecha-fin',
   'reserva-admin-descuento'].forEach(id => { const e = rfEl(id); if (e) e.value = id.includes('descuento') ? '0' : ''; });
  if (rfEl('reserva-admin-metodo-pago')) rfEl('reserva-admin-metodo-pago').value = '1';
  if (rfEl('reserva-admin-estado'))      rfEl('reserva-admin-estado').value      = '1';

  document.querySelectorAll('#reserva-admin-paquetes-grid .paquete-card.seleccionado').forEach(c => {
    c.classList.remove('seleccionado');
    c.style.cssText = 'border:2px solid #e2e8f0;border-radius:10px;padding:.75rem;cursor:pointer;background:#fff;font-size:.82rem;transition:all .2s;text-align:center';
  });
  document.querySelectorAll('#reserva-admin-servicios-grid .servicio-toggle-btn.seleccionado').forEach(b => {
    b.classList.remove('seleccionado');
    b.style.borderColor = '#e2e8f0'; b.style.background = '#f8fafc'; b.style.color = '#334155';
  });
  recalcularPrecio();
}

/* ── Soft alert de éxito ── */
function mostrarAlertaExito(reservaId) {
  const overlay = document.getElementById('rf-success-overlay');
  const idEl    = document.getElementById('rf-success-id');
  const btn     = document.getElementById('rf-success-btn-ir');
  if (!overlay) {
    window.location.href = 'pages/reservas.html';
    return;
  }
  if (idEl) idEl.textContent = reservaId ? `Reserva #${reservaId}` : 'Guardado';
  overlay.classList.add('show');
  if (btn) {
    btn.onclick = () => { window.location.href = 'pages/reservas.html'; };
  }
  /* Cierra al hacer clic fuera de la tarjeta */
  overlay.addEventListener('click', e => {
    if (e.target === overlay) window.location.href = 'pages/reservas.html';
  }, { once: true });
}

/* ── Confirmación (Promise) ── */
function confirmarAccion(mensaje, titulo) {
  return Promise.resolve(window.confirm(titulo ? `${titulo}\n\n${mensaje}` : mensaje));
}

import React, { useState, useMemo } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtPrecio = (v) => '$' + Number(v || 0).toLocaleString('es-CO');

const capitalizar = (str = '') =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

const ICONO_MAP = [
  ['tour',        'fa-map-location-dot'],
  ['guiado',      'fa-map-location-dot'],
  ['transporte',  'fa-van-shuttle'],
  ['lavander',    'fa-soap'],
  ['desayuno',    'fa-mug-hot'],
  ['almuerzo',    'fa-utensils'],
  ['cena',        'fa-utensils'],
  ['spa',         'fa-spa'],
  ['masaje',      'fa-hand-dots'],
  ['piscina',     'fa-person-swimming'],
  ['gym',         'fa-dumbbell'],
  ['gimnasio',    'fa-dumbbell'],
  ['wifi',        'fa-wifi'],
  ['parking',     'fa-square-parking'],
  ['foto',        'fa-camera'],
  ['bar',         'fa-martini-glass'],
  ['bebida',      'fa-martini-glass'],
];

function iconoServicio(nombre = '') {
  const n = nombre.toLowerCase();
  const match = ICONO_MAP.find(([k]) => n.includes(k));
  return match ? match[1] : 'fa-concierge-bell';
}

// ── Componente principal ───────────────────────────────────────────────────

/**
 * ServiciosSelector
 *
 * Props:
 *   servicios  — array del backend: [{ IDServicio, NombreServicio, Costo, Estado }]
 *   value      — IDs seleccionados desde el padre (modo controlado, opcional)
 *   onChange   — callback(ids: number[]) para exponer la selección hacia arriba
 */
export default function ServiciosSelector({ servicios = [], value, onChange }) {
  const [localIds, setLocalIds] = useState([]);

  // Modo controlado si el padre pasa `value`, sino modo local
  const selectedIds = value !== undefined ? value : localIds;

  const activos = useMemo(
    () => (Array.isArray(servicios) ? servicios : []).filter((s) => s.Estado == 1),
    [servicios]
  );

  const selectedItems = useMemo(
    () => activos.filter((s) => selectedIds.includes(Number(s.IDServicio))),
    [activos, selectedIds]
  );

  const totalAcumulado = useMemo(
    () => selectedItems.reduce((sum, s) => sum + Number(s.Costo || 0), 0),
    [selectedItems]
  );

  const setIds = (next) => {
    if (value === undefined) setLocalIds(next);
    onChange?.(next);
  };

  const toggle = (id) => {
    const numId = Number(id);
    setIds(
      selectedIds.includes(numId)
        ? selectedIds.filter((x) => x !== numId)
        : [...selectedIds, numId]
    );
  };

  const remove = (id) => setIds(selectedIds.filter((x) => x !== Number(id)));

  return (
    <div>
      {/* ── Resumen: chips removibles + total acumulado ── */}
      <div className="flex flex-wrap gap-2 items-center min-h-[2.6rem] bg-[#f8fafc] border-[1.5px] border-[#e2e8f0] rounded-lg px-3 py-2 mb-3">
        {selectedItems.length === 0 ? (
          <span className="text-slate-400 text-xs">Ningún servicio seleccionado</span>
        ) : (
          <>
            {selectedItems.map((s) => (
              <span
                key={s.IDServicio}
                className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md px-2.5 py-1 text-xs font-semibold"
              >
                {capitalizar(s.NombreServicio)}
                <button
                  type="button"
                  onClick={() => remove(s.IDServicio)}
                  className="ml-0.5 text-amber-400 hover:text-red-500 transition-colors leading-none"
                  title="Quitar servicio"
                  aria-label={`Quitar ${s.NombreServicio}`}
                >
                  <i className="fa-solid fa-xmark" style={{ fontSize: '9px' }} />
                </button>
              </span>
            ))}
            <span className="ml-auto text-xs font-bold text-[#e07020] whitespace-nowrap pl-2">
              Total: {fmtPrecio(totalAcumulado)}
            </span>
          </>
        )}
      </div>

      {/* ── Lista con scroll ── */}
      <div
        className="max-h-[280px] overflow-y-auto border-[1.5px] border-[#e2e8f0] rounded-lg divide-y divide-slate-100"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}
      >
        {activos.length === 0 ? (
          <p className="text-center text-slate-400 text-xs py-6 px-4">
            No hay servicios activos disponibles.
          </p>
        ) : (
          activos.map((s) => {
            const id       = Number(s.IDServicio);
            const selected = selectedIds.includes(id);
            const icono    = iconoServicio(s.NombreServicio);

            return (
              <label
                key={id}
                htmlFor={`svc-${id}`}
                className={[
                  'flex items-center justify-between px-4 py-3 gap-3',
                  'min-h-[44px] cursor-pointer transition-colors select-none',
                  'border-l-2',
                  selected
                    ? 'bg-amber-50/60 border-l-[#e07020]'
                    : 'hover:bg-slate-50 border-l-transparent',
                ].join(' ')}
              >
                {/* Izquierda: checkbox + ícono + nombre */}
                <span className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    id={`svc-${id}`}
                    checked={selected}
                    onChange={() => toggle(id)}
                    className="w-4 h-4 flex-shrink-0 cursor-pointer accent-[#e07020]"
                  />
                  <span
                    className={`w-4 text-center flex-shrink-0 transition-colors ${
                      selected ? 'text-[#e07020]' : 'text-slate-300'
                    }`}
                  >
                    <i className={`fa-solid ${icono} text-sm`} />
                  </span>
                  <span className="font-medium text-slate-700 text-sm leading-snug truncate">
                    {capitalizar(s.NombreServicio)}
                  </span>
                </span>

                {/* Derecha: badge precio */}
                <span
                  className={[
                    'text-xs font-semibold whitespace-nowrap rounded-full px-2.5 py-0.5 transition-colors flex-shrink-0',
                    selected
                      ? 'bg-amber-100 text-[#c77c10]'
                      : 'bg-slate-100 text-slate-500',
                  ].join(' ')}
                >
                  +{fmtPrecio(s.Costo)}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Ejemplo de uso ─────────────────────────────────────────────────────────
//
// const SERVICIOS_DEMO = [
//   { IDServicio: 1, NombreServicio: 'Tour guiado',    Costo: 20000, Estado: 1 },
//   { IDServicio: 2, NombreServicio: 'Lavandería',     Costo: 35000, Estado: 1 },
//   { IDServicio: 3, NombreServicio: 'Transporte',     Costo: 50000, Estado: 1 },
//   { IDServicio: 4, NombreServicio: 'Desayuno',       Costo: 18000, Estado: 1 },
//   { IDServicio: 5, NombreServicio: 'Spa y masajes',  Costo: 80000, Estado: 1 },
//   { IDServicio: 6, NombreServicio: 'Parking',        Costo: 0,     Estado: 1 },
// ];
//
// Modo no controlado (maneja su propio estado):
// <ServiciosSelector servicios={SERVICIOS_DEMO} onChange={(ids) => console.log(ids)} />
//
// Modo controlado (el padre controla la selección):
// const [ids, setIds] = useState([]);
// <ServiciosSelector servicios={SERVICIOS_DEMO} value={ids} onChange={setIds} />

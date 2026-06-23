const db = require("../config/db");

let reservaColsPromise = null;
let detalleServicioColsPromise = null;

async function getReservaCols() {
  if (!reservaColsPromise) {
    reservaColsPromise = db
      .query("SHOW COLUMNS FROM `reserva`")
      .then(([rows]) => new Set(rows.map((r) => r.Field)));
  }
  return reservaColsPromise;
}

async function getDetalleServicioCols() {
  if (!detalleServicioColsPromise) {
    detalleServicioColsPromise = db
      .query("SHOW COLUMNS FROM `detallereservaservicio`")
      .then(([rows]) => new Set(rows.map((r) => r.Field)));
  }
  return detalleServicioColsPromise;
}

const ReservasService = {

  obtener: async (options = {}) => {
    const { role, userId, numeroDocumento, forceCliente = false } = options;
    const isAdmin = Number(role) === 1 && !forceCliente;
    const params = [];
    let whereClause = "";

    if (!isAdmin) {
      const filters = [];
      if (userId) {
        filters.push("r.id_usuario = ?");
        params.push(userId);
      }
      if (numeroDocumento) {
        filters.push("r.NroDocumentoCliente = ?");
        params.push(numeroDocumento);
      }

      if (!filters.length) {
        return [];
      }

      whereClause = `WHERE (${filters.join(" OR ")})`;
    }

    // Incluir columnas Comprobante* solo si ya existen (migración puede no haber corrido aún)
    const rCols = await getReservaCols();
    const compFields = rCols.has('ComprobantePago')
      ? `,\n        r.ComprobantePago, r.ComprobanteEstado, r.ComprobanteFecha, r.ComprobanteNota`
      : '';

    const [rows] = await db.query(`
      SELECT
        r.IdReserva          AS IDReserva,
        r.NroDocumentoCliente,
        r.FechaReserva,
        r.FechaInicio,
        r.FechaFinalizacion,
        r.Sub_Total          AS SubTotal,
        r.Descuento,
        r.IVA,
        r.Monto_Total        AS MontoTotal,
        r.MetodoPago,
        r.IdEstadoReserva,
        r.id_usuario
        ${compFields},
        ANY_VALUE(COALESCE(
          c.Nombre,
          u.NombreUsuario,
          (SELECT u2.NombreUsuario FROM usuarios u2
           WHERE CAST(u2.NumeroDocumento AS CHAR) = CAST(r.NroDocumentoCliente AS CHAR)
             AND (r.id_usuario IS NULL OR u2.IDUsuario != r.id_usuario)
           LIMIT 1)
        )) AS Nombre,
        ANY_VALUE(COALESCE(
          c.Apellido,
          u.Apellido,
          (SELECT u2.Apellido FROM usuarios u2
           WHERE CAST(u2.NumeroDocumento AS CHAR) = CAST(r.NroDocumentoCliente AS CHAR)
             AND (r.id_usuario IS NULL OR u2.IDUsuario != r.id_usuario)
           LIMIT 1),
          ''
        )) AS Apellido,
        ANY_VALUE(c.NroDocumento) AS NroDocumento,
        ANY_VALUE(e.NombreEstadoReserva) AS NombreEstadoReserva,
        GROUP_CONCAT(DISTINCT p.NombrePaquete  SEPARATOR ', ') AS Paquetes,
        GROUP_CONCAT(DISTINCT p.IDPaquete      SEPARATOR ',')  AS PaquetesIds,
        GROUP_CONCAT(DISTINCT s.NombreServicio SEPARATOR ', ') AS Servicios,
        GROUP_CONCAT(DISTINCT s.IDServicio     SEPARATOR ',')  AS ServiciosIds,
        MAX(CASE WHEN drs.EsAdicional = 1 THEN 1 ELSE 0 END)  AS TieneCargosAdicionales,
        ANY_VALUE(r.EstadoCargosAdicionales)                   AS EstadoCargosAdicionales
      FROM reserva r
      LEFT JOIN clientes          c   ON CAST(r.NroDocumentoCliente AS CHAR) = CAST(c.NroDocumento AS CHAR)
      LEFT JOIN usuarios          u   ON r.id_usuario = u.IDUsuario
      LEFT JOIN estadosreserva    e   ON r.IdEstadoReserva     = e.IdEstadoReserva
      LEFT JOIN detallereservapaquetes drp ON r.IdReserva      = drp.IDReserva
      LEFT JOIN paquetes          p   ON drp.IDPaquete         = p.IDPaquete
      LEFT JOIN detallereservaservicio drs ON r.IdReserva      = drs.IDReserva
      LEFT JOIN servicio          s   ON drs.IDServicio        = s.IDServicio
      ${whereClause}
      GROUP BY r.IdReserva
      ORDER BY r.IdReserva DESC
    `, params);
    return rows;
  },

  obtenerPorId: async (id) => {
    const rCols2 = await getReservaCols();
    const compFields2 = rCols2.has('ComprobantePago')
      ? ', r.ComprobantePago, r.ComprobanteEstado, r.ComprobanteFecha, r.ComprobanteNota'
      : '';
    const habCol2 = rCols2.has('IDHabitacion') ? 'IDHabitacion' : (rCols2.has('IdHabitacion') ? 'IdHabitacion' : null);
    const habJoin   = habCol2 ? `LEFT JOIN habitacion h ON r.${habCol2} = h.IDHabitacion` : '';
    const habSelect = habCol2 ? `, r.${habCol2} AS IDHabitacion, h.NombreHabitacion` : '';
    const [[reserva]] = await db.query(
      `SELECT r.IdReserva AS IDReserva, r.NroDocumentoCliente, r.id_usuario,
              r.FechaReserva, r.FechaInicio, r.FechaFinalizacion,
              r.Sub_Total AS SubTotal, r.Descuento, r.IVA, r.Monto_Total AS MontoTotal,
              r.MetodoPago, r.IdEstadoReserva
              ${compFields2},
              c.Nombre, c.Apellido, e.NombreEstadoReserva
              ${habSelect}
       FROM reserva r
       LEFT JOIN clientes c ON CAST(r.NroDocumentoCliente AS CHAR) = CAST(c.NroDocumento AS CHAR)
       LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
       ${habJoin}
       WHERE r.IdReserva = ?`,
      [id]
    );
    if (!reserva) return null;

    console.log('[obtenerPorId] JOIN resultado:', {
      IDReserva: reserva.IDReserva,
      NroDocumentoCliente: reserva.NroDocumentoCliente,
      id_usuario: reserva.id_usuario,
      NombreDesdeJoin: reserva.Nombre || null,
      ApellidoDesdeJoin: reserva.Apellido || null,
    });

    // Fallback 1: buscar en usuarios por NumeroDocumento
    // Nota: usuarios usa NombreUsuario (no Nombre) — se excluye Nombre del SELECT para evitar error si la columna no existe
    if (!reserva.Nombre && reserva.NroDocumentoCliente) {
      try {
        const [[u]] = await db.query(
          'SELECT IDUsuario, NombreUsuario, Apellido, IDRol FROM usuarios WHERE NumeroDocumento = ? LIMIT 1',
          [String(reserva.NroDocumentoCliente).trim()]
        );
        if (u) {
          reserva.Nombre   = u.NombreUsuario || '';
          reserva.Apellido = u.Apellido || '';
        }
        console.log('[obtenerPorId] Fallback1 (por doc):', u ? { IDUsuario: u.IDUsuario, nombre: reserva.Nombre || 'VACÍO' } : 'NO ENCONTRADO');
      } catch (e) {
        console.error('[obtenerPorId] Fallback1 error:', e.message);
      }
    }
    // Fallback 2: por id_usuario + coincidencia de documento
    if (!reserva.Nombre && reserva.id_usuario && reserva.NroDocumentoCliente) {
      try {
        const [[u]] = await db.query(
          'SELECT IDUsuario, NombreUsuario, Apellido FROM usuarios WHERE IDUsuario = ? AND NumeroDocumento = ? LIMIT 1',
          [reserva.id_usuario, String(reserva.NroDocumentoCliente).trim()]
        );
        if (u) {
          reserva.Nombre   = u.NombreUsuario || '';
          reserva.Apellido = u.Apellido || '';
        }
        console.log('[obtenerPorId] Fallback2 (por id+doc):', u ? { nombre: reserva.Nombre || 'VACÍO' } : 'NO ENCONTRADO');
      } catch (e) {
        console.error('[obtenerPorId] Fallback2 error:', e.message);
      }
    }
    // Fallback 3: por id_usuario cuando el usuario NO es admin (IDRol != 1)
    if (!reserva.Nombre && reserva.id_usuario) {
      try {
        const [[u]] = await db.query(
          'SELECT IDUsuario, NombreUsuario, Apellido, IDRol FROM usuarios WHERE IDUsuario = ? LIMIT 1',
          [reserva.id_usuario]
        );
        if (u && Number(u.IDRol) !== 1) {
          reserva.Nombre   = u.NombreUsuario || '';
          reserva.Apellido = u.Apellido || '';
        }
        console.log('[obtenerPorId] Fallback3 (por id_usuario):', u ? { IDRol: u.IDRol, nombre: reserva.Nombre || 'VACÍO' } : 'NO ENCONTRADO');
      } catch (e) {
        console.error('[obtenerPorId] Fallback3 error:', e.message);
      }
    }
    // Fallback 4: buscar en clientes directamente por documento (cast a CHAR para evitar mismatch de tipos)
    if (!reserva.Nombre && reserva.NroDocumentoCliente) {
      try {
        const [[c]] = await db.query(
          'SELECT Nombre, Apellido FROM clientes WHERE CAST(NroDocumento AS CHAR) = CAST(? AS CHAR) LIMIT 1',
          [String(reserva.NroDocumentoCliente).trim()]
        );
        if (c && c.Nombre) {
          reserva.Nombre   = c.Nombre;
          reserva.Apellido = c.Apellido || '';
        }
        console.log('[obtenerPorId] Fallback4 (clientes directo):', c ? { nombre: c.Nombre || 'VACÍO' } : 'NO ENCONTRADO');
      } catch (e) {
        console.error('[obtenerPorId] Fallback4 error:', e.message);
      }
    }

    const [paquetes] = await db.query(
      `SELECT p.IDPaquete, p.NombrePaquete, drp.Precio, h.NombreHabitacion
       FROM detallereservapaquetes drp
       JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
       LEFT JOIN habitacion h ON p.IDHabitacion = h.IDHabitacion
       WHERE drp.IDReserva = ?`,
      [id]
    );

    // Si no hay NombreHabitacion desde el JOIN directo, intentar sacarlo de los paquetes
    if (!reserva.NombreHabitacion && paquetes.length > 0 && paquetes[0].NombreHabitacion) {
      reserva.NombreHabitacion = paquetes[0].NombreHabitacion;
    }

    // Si aún no hay nombre, buscar desde IDHabitacion de la reserva
    if (!reserva.NombreHabitacion && reserva.IDHabitacion) {
      const [[hab]] = await db.query(
        'SELECT NombreHabitacion FROM habitacion WHERE IDHabitacion = ? LIMIT 1',
        [reserva.IDHabitacion]
      );
      if (hab) reserva.NombreHabitacion = hab.NombreHabitacion;
    }

    const svcCols = await getDetalleServicioCols();
    const horaField       = svcCols.has('HoraServicio') ? ', drs.HoraServicio' : '';
    const cantField       = svcCols.has('Cantidad')     ? ', drs.Cantidad'     : '';
    const esAdicionalField= svcCols.has('EsAdicional')  ? ', drs.EsAdicional'  : '';
    const [servicios] = await db.query(
      `SELECT s.IDServicio, s.NombreServicio, drs.Precio${horaField}${cantField}${esAdicionalField}
       FROM detallereservaservicio drs
       JOIN servicio s ON drs.IDServicio = s.IDServicio
       WHERE drs.IDReserva = ?`,
      [id]
    );

    return { ...reserva, paquetes, servicios };
  },

  cancelar: async (idReserva) => {
    const [result] = await db.query(
      `UPDATE reserva SET IdEstadoReserva = 3 WHERE IdReserva = ?`,
      [idReserva]
    );
    return result.affectedRows > 0;
  },

  eliminar: async (id) => {
    await db.query(`DELETE FROM detallereservapaquetes       WHERE IDReserva = ?`, [id]);
    await db.query(`DELETE FROM detallereservaservicio       WHERE IDReserva = ?`, [id]);
    await db.query(`DELETE FROM detallereservahabitaciones   WHERE IDReserva = ?`, [id]);
    const [result] = await db.query(`DELETE FROM reserva WHERE IdReserva = ?`, [id]);
    return result.affectedRows > 0;
  },

  create: async (reserva) => {
    const {
      NroDocumentoCliente,
      IDHabitacion,
      FechaInicio,
      FechaFinalizacion,
      SubTotal,
      Descuento,
      IVA,
      MontoTotal,
      MetodoPago,
      IdEstadoReserva,
      id_usuario,
      paquetesIds,
      serviciosIds,
      serviciosConHorarios,
    } = reserva;

    // habitacionesIds: array de IDs para multi-room; si no llega, construir desde IDHabitacion
    let habitacionesIds = Array.isArray(reserva.habitacionesIds) && reserva.habitacionesIds.length > 0
      ? reserva.habitacionesIds.map(Number)
      : (IDHabitacion ? [Number(IDHabitacion)] : []);

    if (!NroDocumentoCliente) throw new Error("Falta NroDocumentoCliente.");
    if (!FechaInicio || !FechaFinalizacion) throw new Error("Faltan fechas.");

    const cols = await getReservaCols();
    const habitacionCol = cols.has("IDHabitacion")
      ? "IDHabitacion"
      : (cols.has("IdHabitacion") ? "IdHabitacion" : null);

    // habitacionId para la columna legacy en reserva (primera habitación)
    let habitacionId = habitacionesIds[0] ?? null;
    if (!habitacionId && Array.isArray(paquetesIds) && paquetesIds.length > 0) {
      const [[paq]] = await db.query(
        "SELECT IDHabitacion FROM paquetes WHERE IDPaquete = ? LIMIT 1",
        [paquetesIds[0]]
      );
      habitacionId = paq?.IDHabitacion ?? null;
    }

    // Validar disponibilidad para cada habitación seleccionada
    if (habitacionCol && habitacionesIds.length > 0) {
      for (const hId of habitacionesIds) {
        const [[{ conflictos }]] = await db.query(
          `SELECT COUNT(*) AS conflictos
           FROM reserva
           WHERE ${habitacionCol} = ?
             AND IdEstadoReserva NOT IN (3, 4)
             AND FechaInicio    <= ?
             AND FechaFinalizacion >= ?`,
          [hId, FechaFinalizacion, FechaInicio]
        );
        if (conflictos > 0) {
          const [[hab]] = await db.query("SELECT NombreHabitacion FROM habitacion WHERE IDHabitacion = ? LIMIT 1", [hId]);
          throw new Error(`La habitación "${hab?.NombreHabitacion || hId}" ya tiene una reserva en las fechas seleccionadas. Por favor elige otras fechas.`);
        }
      }
    }

    // H3: Validar que las habitaciones de los paquetes seleccionados estén activas
    if (Array.isArray(paquetesIds) && paquetesIds.length > 0) {
      for (const pid of paquetesIds) {
        const [[paq]] = await db.query(
          `SELECT p.IDPaquete, h.Estado AS estadoHabitacion
           FROM paquetes p
           JOIN habitacion h ON p.IDHabitacion = h.IDHabitacion
           WHERE p.IDPaquete = ?`,
          [pid]
        );
        if (!paq) throw new Error("Paquete no encontrado.");
        if (!paq.estadoHabitacion) {
          throw new Error("Esta habitación no está disponible para reservas.");
        }
      }
    }

    // S4: Validar que los servicios adicionales seleccionados estén activos
    if (Array.isArray(serviciosIds) && serviciosIds.length > 0) {
      for (const sid of serviciosIds) {
        const [[svc]] = await db.query(
          `SELECT Estado FROM servicio WHERE IDServicio = ?`,
          [sid]
        );
        if (!svc) throw new Error("Servicio no encontrado.");
        if (!svc.Estado) {
          throw new Error("Uno de los servicios seleccionados no está disponible.");
        }
      }
    }

    // ── B5: Recalcular precios desde BD — el cliente no es fuente de verdad ──
    const noches = Math.max(1, Math.ceil(
      (new Date(FechaFinalizacion) - new Date(FechaInicio)) / 86400000
    ));

    let precioBase = 0;

    // Precio habitaciones directas (sin paquetes): suma de todas × noches
    if (habitacionesIds.length > 0 && (!Array.isArray(paquetesIds) || !paquetesIds.length)) {
      for (const hId of habitacionesIds) {
        const [[hab]] = await db.query(
          "SELECT Costo FROM habitacion WHERE IDHabitacion = ? LIMIT 1", [hId]
        );
        precioBase += Number(hab?.Costo || 0) * noches;
      }
    }

    // Precio paquetes (tarifa plana)
    for (const pid of (paquetesIds || [])) {
      const [[paq]] = await db.query(
        "SELECT Precio FROM paquetes WHERE IDPaquete = ? LIMIT 1", [pid]
      );
      precioBase += Number(paq?.Precio || 0);
    }

    // Precio servicios
    const svcList2 = Array.isArray(serviciosConHorarios) && serviciosConHorarios.length
      ? serviciosConHorarios.map(s => s.id ?? s)
      : (serviciosIds || []);
    let precioSvc = 0;
    for (const sid of svcList2) {
      const [[svc]] = await db.query(
        "SELECT Costo FROM servicio WHERE IDServicio = ? LIMIT 1", [sid]
      );
      precioSvc += Number(svc?.Costo || 0);
    }

    // IVA INCLUIDO (19%)
    const descSaneado   = Math.max(0, Math.min(Number(Descuento || 0), precioBase + precioSvc));
    const totalConIva   = Math.max(0, precioBase + precioSvc - descSaneado);
    const baseGravable  = totalConIva / 1.19;
    const ivaDesglose   = totalConIva - baseGravable;
    // ── Fin recálculo ────────────────────────────────────────────────────────

    const insertCols = ["NroDocumentoCliente"];
    const insertVals = ["?"];
    const params = [NroDocumentoCliente];

    if (habitacionCol) {
      insertCols.push(habitacionCol);
      insertVals.push("?");
      params.push(habitacionId);
    }

    insertCols.push(
      "FechaReserva",
      "FechaInicio",
      "FechaFinalizacion",
      "Sub_Total",
      "Descuento",
      "IVA",
      "Monto_Total",
      "MetodoPago",
      "IdEstadoReserva",
      "id_usuario"
    );
    insertVals.push(
      "NOW()",
      "?",
      "?",
      "?",
      "?",
      "?",
      "?",
      "?",
      "?",
      "?"
    );

    params.push(
      FechaInicio,
      FechaFinalizacion,
      baseGravable,       // Sub_Total = base sin IVA
      descSaneado,        // Descuento saneado
      ivaDesglose,        // IVA extraído (incluido en precio)
      totalConIva,        // Monto_Total = lo que paga el cliente
      MetodoPago   ?? 1,
      IdEstadoReserva ?? 1,
      id_usuario   ?? 1
    );

    const [result] = await db.query(
      `INSERT INTO reserva (${insertCols.join(", ")}) VALUES (${insertVals.join(", ")})`,
      params
    );

    const idReserva = result.insertId;

    // Pago con tarjeta → plazo de 5 minutos para subir comprobante
    if (Number(MetodoPago) === 2) {
      await db.query(
        `UPDATE reserva SET FechaLimiteComprobante = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE IdReserva = ?`,
        [idReserva]
      );
    }

    if (Array.isArray(paquetesIds) && paquetesIds.length > 0) {
      for (const pid of paquetesIds) {
        await db.query(
          `INSERT INTO detallereservapaquetes (IDReserva, IDPaquete, Cantidad, Precio, Estado)
           SELECT ?, ?, 1, Precio, 1 FROM paquetes WHERE IDPaquete = ?`,
          [idReserva, pid, pid]
        );
      }
    }

    // Registrar cada habitación en detallereservahabitaciones (multi-room)
    if (habitacionesIds.length > 0 && (!Array.isArray(paquetesIds) || !paquetesIds.length)) {
      for (const hId of habitacionesIds) {
        const [[hab]] = await db.query(
          "SELECT Costo FROM habitacion WHERE IDHabitacion = ? LIMIT 1", [hId]
        );
        await db.query(
          `INSERT INTO detallereservahabitaciones (IDReserva, IDHabitacion, Precio, Noches, Estado) VALUES (?, ?, ?, ?, 1)`,
          [idReserva, hId, Number(hab?.Costo || 0), noches]
        );
      }
    }

    const svcList = Array.isArray(serviciosConHorarios) && serviciosConHorarios.length > 0
      ? serviciosConHorarios
      : (Array.isArray(serviciosIds) ? serviciosIds.map(id => ({ id, hora: null })) : []);

    const detalleCols = await getDetalleServicioCols();
    const hasHoraServicio  = detalleCols.has("HoraServicio");
    const hasEsAdicional   = detalleCols.has("EsAdicional");

    for (const { id: sid, hora } of svcList) {
      const columns = ["IDReserva", "IDServicio", "Cantidad", "Precio", "Estado"];
      const selectExpr = ["?", "?", "1", "Costo", "1"];
      const params = [idReserva, sid];

      if (hasHoraServicio) {
        columns.push("HoraServicio");
        selectExpr.push("?");
        params.push(hora || null);
      }
      if (hasEsAdicional) {
        columns.push("EsAdicional");
        selectExpr.push("0"); // 0 = incluido en la reserva original
      }

      params.push(sid);

      await db.query(
        `INSERT INTO detallereservaservicio (${columns.join(", ")})
         SELECT ${selectExpr.join(", ")} FROM servicio WHERE IDServicio = ?`,
        params
      );
    }

    return { insertId: idReserva };
  },

  actualizar: async (id, data) => {
    const {
      NroDocumentoCliente,
      IDHabitacion,
      FechaInicio,
      FechaFinalizacion,
      SubTotal,
      Descuento,
      IVA,
      MontoTotal,
      MetodoPago,
      IdEstadoReserva,
      paquetesIds,
      serviciosIds,
      serviciosConHorarios,
    } = data;

    // habitacionesIds: array para multi-room
    const habitacionesIds = Array.isArray(data.habitacionesIds) && data.habitacionesIds.length > 0
      ? data.habitacionesIds.map(Number)
      : (IDHabitacion ? [Number(IDHabitacion)] : []);

    const cols = await getReservaCols();
    const habitacionCol = cols.has("IDHabitacion")
      ? "IDHabitacion"
      : (cols.has("IdHabitacion") ? "IdHabitacion" : null);

    const fields = [
      "NroDocumentoCliente = ?",
      "FechaInicio = ?",
      "FechaFinalizacion = ?",
      "Sub_Total = ?",
      "Descuento = ?",
      "IVA = ?",
      "Monto_Total = ?",
      "MetodoPago = ?",
      "IdEstadoReserva = ?",
    ];
    const params = [
      NroDocumentoCliente,
      FechaInicio,
      FechaFinalizacion,
      SubTotal  ?? 0,
      Descuento ?? 0,
      IVA       ?? 0,
      MontoTotal ?? 0,
      MetodoPago ?? 1,
      IdEstadoReserva ?? 1,
    ];

    if (habitacionCol) {
      fields.splice(1, 0, `${habitacionCol} = ?`);
      params.splice(1, 0, IDHabitacion);
    }

    params.push(id);

    const [result] = await db.query(
      `UPDATE reserva SET ${fields.join(", ")} WHERE IdReserva = ?`,
      params
    );

    if (Array.isArray(paquetesIds)) {
      await db.query(`DELETE FROM detallereservapaquetes WHERE IDReserva = ?`, [id]);
      for (const pid of paquetesIds) {
        await db.query(
          `INSERT INTO detallereservapaquetes (IDReserva, IDPaquete, Cantidad, Precio, Estado)
           SELECT ?, ?, 1, Precio, 1 FROM paquetes WHERE IDPaquete = ?`,
          [id, pid, pid]
        );
      }
    }

    // Sync detallereservahabitaciones para multi-room
    if (habitacionesIds.length > 0 && (!Array.isArray(paquetesIds) || !paquetesIds.length)) {
      await db.query(`DELETE FROM detallereservahabitaciones WHERE IDReserva = ?`, [id]);
      const noches = FechaInicio && FechaFinalizacion
        ? Math.max(1, Math.ceil((new Date(FechaFinalizacion) - new Date(FechaInicio)) / 86400000))
        : 1;
      for (const hId of habitacionesIds) {
        const [[hab]] = await db.query("SELECT Costo FROM habitacion WHERE IDHabitacion = ? LIMIT 1", [hId]);
        await db.query(
          `INSERT INTO detallereservahabitaciones (IDReserva, IDHabitacion, Precio, Noches, Estado) VALUES (?, ?, ?, ?, 1)`,
          [id, hId, Number(hab?.Costo || 0), noches]
        );
      }
    }

    const hasSvcData = Array.isArray(serviciosConHorarios) || Array.isArray(serviciosIds);
    if (hasSvcData) {
      await db.query(`DELETE FROM detallereservaservicio WHERE IDReserva = ?`, [id]);
      const svcList = Array.isArray(serviciosConHorarios) && serviciosConHorarios.length > 0
        ? serviciosConHorarios
        : (Array.isArray(serviciosIds) ? serviciosIds.map(sid => ({ id: sid, hora: null })) : []);
      const detalleCols = await getDetalleServicioCols();
      const hasHoraServicio = detalleCols.has("HoraServicio");
      const hasEsAdicional  = detalleCols.has("EsAdicional");

      for (const { id: sid, hora } of svcList) {
        const columns = ["IDReserva", "IDServicio", "Cantidad", "Precio", "Estado"];
        const selectExpr = ["?", "?", "1", "Costo", "1"];
        const params = [id, sid];

        if (hasHoraServicio) {
          columns.push("HoraServicio");
          selectExpr.push("?");
          params.push(hora || null);
        }
        if (hasEsAdicional) {
          columns.push("EsAdicional");
          selectExpr.push("0"); // 0 = incluido en la reserva original
        }

        params.push(sid);

        await db.query(
          `INSERT INTO detallereservaservicio (${columns.join(", ")})
           SELECT ${selectExpr.join(", ")} FROM servicio WHERE IDServicio = ?`,
          params
        );
      }
    }

    return result.affectedRows > 0;
  },

  guardarComprobante: async (reservaId, comprobanteUrl) => {
    // Si el comprobante era rechazado, volver a estado 5 (pendiente verificación)
    const [result] = await db.query(
      `UPDATE reserva
       SET ComprobantePago    = ?,
           ComprobanteFecha   = NOW(),
           ComprobanteEstado  = 'pendiente',
           ComprobanteNota    = NULL,
           IdEstadoReserva    = IF(ComprobanteEstado = 'rechazado', 5, IdEstadoReserva)
       WHERE IdReserva = ?`,
      [comprobanteUrl, reservaId]
    );
    return result.affectedRows > 0;
  },

  verificarComprobante: async (reservaId, accion, nota) => {
    if (accion === 'aprobar') {
      const [result] = await db.query(
        `UPDATE reserva
         SET ComprobanteEstado = 'aprobado',
             IdEstadoReserva   = 2,
             ComprobanteNota   = NULL
         WHERE IdReserva = ?`,
        [reservaId]
      );
      return result.affectedRows > 0 ? 'aprobado' : null;
    }
    if (accion === 'rechazar') {
      const [result] = await db.query(
        `UPDATE reserva
         SET ComprobanteEstado = 'rechazado',
             ComprobanteNota   = ?,
             IdEstadoReserva   = 5
         WHERE IdReserva = ?`,
        [nota || null, reservaId]
      );
      return result.affectedRows > 0 ? 'rechazado' : null;
    }
    throw new Error("Acción inválida. Use 'aprobar' o 'rechazar'.");
  },

  syncEstados: async () => {
    // Normalizar nombres de estados para que coincidan con la lógica del sistema
    await db.query(
      `INSERT INTO estadosreserva (IdEstadoReserva, NombreEstadoReserva) VALUES
         (1, 'Pendiente'),
         (2, 'Confirmada'),
         (3, 'Cancelada'),
         (4, 'Completada'),
         (5, 'Pendiente Verificación Pago'),
         (6, 'En Curso')
       ON DUPLICATE KEY UPDATE NombreEstadoReserva = VALUES(NombreEstadoReserva)`
    );
    // Confirmadas (2) cuya fecha de inicio ya llegó → En Curso (6)
    await db.query(
      `UPDATE reserva SET IdEstadoReserva = 6
       WHERE IdEstadoReserva = 2
         AND FechaInicio <= CURDATE()
         AND FechaFinalizacion >= CURDATE()`
    );
    // En Curso (6) cuya fecha de fin ya pasó → Completada (4)
    await db.query(
      `UPDATE reserva SET IdEstadoReserva = 4
       WHERE IdEstadoReserva = 6
         AND FechaFinalizacion < CURDATE()`
    );
    // Confirmadas (2) que ya pasaron completamente → Completada (4)
    await db.query(
      `UPDATE reserva SET IdEstadoReserva = 4
       WHERE IdEstadoReserva = 2
         AND FechaFinalizacion < CURDATE()`
    );
    // Reservas con tarjeta (estado 5) que superaron los 5 min sin comprobante → Cancelada (3)
    const rCols = await getReservaCols();
    if (rCols.has('FechaLimiteComprobante')) {
      await db.query(
        `UPDATE reserva SET IdEstadoReserva = 3
         WHERE IdEstadoReserva = 5
           AND FechaLimiteComprobante IS NOT NULL
           AND FechaLimiteComprobante < NOW()
           AND (ComprobantePago IS NULL OR ComprobantePago = '')`
      );
    }
  },

  getDisponibilidad: async ({ IDHabitacion, IDPaquete } = {}) => {
    let habitacionId = IDHabitacion ? Number(IDHabitacion) : null;
    if (!habitacionId && IDPaquete) {
      const [[paq]] = await db.query(
        `SELECT IDHabitacion FROM paquetes WHERE IDPaquete = ? LIMIT 1`,
        [Number(IDPaquete)]
      );
      habitacionId = paq?.IDHabitacion ?? null;
    }
    if (!habitacionId) return [];

    const rCols = await getReservaCols();
    const habitacionCol = rCols.has('IDHabitacion')
      ? 'IDHabitacion'
      : (rCols.has('IdHabitacion') ? 'IdHabitacion' : null);
    if (!habitacionCol) return [];

    const [rows] = await db.query(
      `SELECT DATE_FORMAT(FechaInicio, '%Y-%m-%d')       AS FechaInicio,
              DATE_FORMAT(FechaFinalizacion, '%Y-%m-%d') AS FechaFinalizacion
       FROM reserva
       WHERE ${habitacionCol} = ?
         AND IdEstadoReserva NOT IN (3, 4)
         AND FechaFinalizacion >= CURDATE()`,
      [habitacionId]
    );
    return rows;
  },

  agregarServicios: async (reservaId, servicios) => {
    const detalleCols = await getDetalleServicioCols();
    const hasHoraServicio = detalleCols.has("HoraServicio");
    const hasEsAdicional  = detalleCols.has("EsAdicional");

    let costoAdicional = 0;

    for (const item of servicios) {
      const sid = typeof item === "object" ? item.IDServicio : item;
      const qty = typeof item === "object" ? Math.max(1, Number(item.Cantidad) || 1) : 1;

      const [[svc]] = await db.query("SELECT Costo FROM servicio WHERE IDServicio = ?", [sid]);
      if (!svc) continue;

      const cols = ["IDReserva", "IDServicio", "Cantidad", "Precio", "Estado"];
      const vals = [reservaId, sid, qty, svc.Costo, 1];
      if (hasHoraServicio) { cols.push("HoraServicio"); vals.push(null); }
      if (hasEsAdicional)  { cols.push("EsAdicional");  vals.push(1); } // 1 = cargo adicional post-reserva

      await db.query(
        `INSERT IGNORE INTO detallereservaservicio (${cols.join(", ")}) VALUES (${cols.map(() => '?').join(", ")})`,
        vals
      );
      costoAdicional += svc.Costo * qty;
    }

    if (costoAdicional > 0) {
      await db.query(
        "UPDATE reserva SET Monto_Total = Monto_Total + ? WHERE IdReserva = ?",
        [costoAdicional, reservaId]
      );
    }
  },

  extenderDias: async (reservaId, nuevaFechaFin) => {
    const reservaCols = await getReservaCols();
    const habCol = reservaCols.has("IDHabitacion")
      ? "IDHabitacion"
      : reservaCols.has("IdHabitacion") ? "IdHabitacion" : null;

    const selectHab = habCol ? `, r.${habCol} AS IDHabitacion` : "";
    const [[reserva]] = await db.query(
      `SELECT r.IdReserva, r.FechaFinalizacion, r.Monto_Total${selectHab}
       FROM reserva r WHERE r.IdReserva = ?`,
      [reservaId]
    );
    if (!reserva) return { ok: false, error: "Reserva no encontrada" };
    if (!reserva.IDHabitacion) return { ok: false, error: "Solo se pueden extender reservas de habitación individual" };

    const fechaActualFin = new Date(reserva.FechaFinalizacion);
    const fechaNuevaFin  = new Date(nuevaFechaFin + "T12:00:00");

    if (fechaNuevaFin <= fechaActualFin) {
      return { ok: false, error: "La nueva fecha debe ser posterior a la fecha de finalización actual" };
    }

    // Verificar disponibilidad para el período de extensión
    const habitacionCol = habCol || "IDHabitacion";
    const [[conflict]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM reserva
       WHERE ${habitacionCol} = ?
         AND IdEstadoReserva NOT IN (3, 4)
         AND IdReserva != ?
         AND FechaInicio < ?
         AND FechaFinalizacion > ?`,
      [reserva.IDHabitacion, reservaId, nuevaFechaFin, reserva.FechaFinalizacion]
    );
    if (conflict.cnt > 0) {
      return { ok: false, error: "La habitación no está disponible para las fechas de extensión solicitadas" };
    }

    // Precio por noche de la habitación
    const [[hab]] = await db.query(
      "SELECT Costo FROM habitacion WHERE IDHabitacion = ? LIMIT 1",
      [reserva.IDHabitacion]
    );
    if (!hab) return { ok: false, error: "Habitación no encontrada" };

    const nightsExtra = Math.ceil((fechaNuevaFin - fechaActualFin) / 86400000);
    const costoExtra  = Number(hab.Costo) * nightsExtra;

    await db.query(
      "UPDATE reserva SET FechaFinalizacion = ?, Monto_Total = Monto_Total + ? WHERE IdReserva = ?",
      [nuevaFechaFin, costoExtra, reservaId]
    );

    return { ok: true, nightsExtra, costoExtra };
  },
};

// Invalidar cache de columnas tras migraciones en caliente
ReservasService._resetColsCache = () => {
  reservaColsPromise          = null;
  detalleServicioColsPromise  = null;
};

module.exports = ReservasService;

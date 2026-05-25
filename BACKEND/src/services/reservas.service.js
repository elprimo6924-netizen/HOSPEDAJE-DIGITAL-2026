const db = require("../config/db");

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
        r.id_usuario,
        c.Nombre,
        c.Apellido,
        c.NroDocumento,
        e.NombreEstadoReserva,
        GROUP_CONCAT(DISTINCT p.NombrePaquete  SEPARATOR ', ') AS Paquetes,
        GROUP_CONCAT(DISTINCT p.IDPaquete      SEPARATOR ',')  AS PaquetesIds,
        GROUP_CONCAT(DISTINCT s.NombreServicio SEPARATOR ', ') AS Servicios,
        GROUP_CONCAT(DISTINCT s.IDServicio     SEPARATOR ',')  AS ServiciosIds
      FROM reserva r
      LEFT JOIN clientes          c   ON r.NroDocumentoCliente = c.NroDocumento
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
    const [[reserva]] = await db.query(
      `SELECT r.IdReserva AS IDReserva, r.NroDocumentoCliente,
              r.FechaReserva, r.FechaInicio, r.FechaFinalizacion,
              r.Sub_Total AS SubTotal, r.Descuento, r.IVA, r.Monto_Total AS MontoTotal,
              r.MetodoPago, r.IdEstadoReserva,
              c.Nombre, c.Apellido, e.NombreEstadoReserva
       FROM reserva r
       LEFT JOIN clientes c ON r.NroDocumentoCliente = c.NroDocumento
       LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
       WHERE r.IdReserva = ?`,
      [id]
    );
    if (!reserva) return null;

    const [paquetes] = await db.query(
      `SELECT p.IDPaquete, p.NombrePaquete, drp.Precio
       FROM detallereservapaquetes drp
       JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
       WHERE drp.IDReserva = ?`,
      [id]
    );

    const [servicios] = await db.query(
      `SELECT s.IDServicio, s.NombreServicio, drs.Precio, drs.HoraServicio
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
    await db.query(`DELETE FROM detallereservapaquetes  WHERE IDReserva = ?`, [id]);
    await db.query(`DELETE FROM detallereservaservicio  WHERE IDReserva = ?`, [id]);
    const [result] = await db.query(`DELETE FROM reserva WHERE IdReserva = ?`, [id]);
    return result.affectedRows > 0;
  },

  create: async (reserva) => {
    const {
      NroDocumentoCliente,
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

    if (!NroDocumentoCliente) throw new Error("Falta NroDocumentoCliente.");
    if (!FechaInicio || !FechaFinalizacion) throw new Error("Faltan fechas.");

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

    const [result] = await db.query(
      `INSERT INTO reserva
         (NroDocumentoCliente, FechaReserva, FechaInicio, FechaFinalizacion,
          Sub_Total, Descuento, IVA, Monto_Total, MetodoPago, IdEstadoReserva, id_usuario)
       VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        NroDocumentoCliente,
        FechaInicio,
        FechaFinalizacion,
        SubTotal     ?? 0,
        Descuento    ?? 0,
        IVA          ?? 0,
        MontoTotal   ?? 0,
        MetodoPago   ?? 1,
        IdEstadoReserva ?? 1,
        id_usuario   ?? 1,
      ]
    );

    const idReserva = result.insertId;

    if (Array.isArray(paquetesIds) && paquetesIds.length > 0) {
      for (const pid of paquetesIds) {
        await db.query(
          `INSERT INTO detallereservapaquetes (IDReserva, IDPaquete, Cantidad, Precio, Estado)
           SELECT ?, ?, 1, Precio, 1 FROM paquetes WHERE IDPaquete = ?`,
          [idReserva, pid, pid]
        );
      }
    }

    const svcList = Array.isArray(serviciosConHorarios) && serviciosConHorarios.length > 0
      ? serviciosConHorarios
      : (Array.isArray(serviciosIds) ? serviciosIds.map(id => ({ id, hora: null })) : []);

    for (const { id: sid, hora } of svcList) {
      await db.query(
        `INSERT INTO detallereservaservicio (IDReserva, IDServicio, Cantidad, Precio, Estado, HoraServicio)
         SELECT ?, ?, 1, Costo, 1, ? FROM servicio WHERE IDServicio = ?`,
        [idReserva, sid, hora || null, sid]
      );
    }

    return { insertId: idReserva };
  },

  actualizar: async (id, data) => {
    const {
      NroDocumentoCliente,
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

    const [result] = await db.query(
      `UPDATE reserva
       SET NroDocumentoCliente = ?, FechaInicio = ?, FechaFinalizacion = ?,
           Sub_Total = ?, Descuento = ?, IVA = ?, Monto_Total = ?,
           MetodoPago = ?, IdEstadoReserva = ?
       WHERE IdReserva = ?`,
      [
        NroDocumentoCliente,
        FechaInicio,
        FechaFinalizacion,
        SubTotal  ?? 0,
        Descuento ?? 0,
        IVA       ?? 0,
        MontoTotal ?? 0,
        MetodoPago ?? 1,
        IdEstadoReserva ?? 1,
        id,
      ]
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

    const hasSvcData = Array.isArray(serviciosConHorarios) || Array.isArray(serviciosIds);
    if (hasSvcData) {
      await db.query(`DELETE FROM detallereservaservicio WHERE IDReserva = ?`, [id]);
      const svcList = Array.isArray(serviciosConHorarios) && serviciosConHorarios.length > 0
        ? serviciosConHorarios
        : (Array.isArray(serviciosIds) ? serviciosIds.map(sid => ({ id: sid, hora: null })) : []);
      for (const { id: sid, hora } of svcList) {
        await db.query(
          `INSERT INTO detallereservaservicio (IDReserva, IDServicio, Cantidad, Precio, Estado, HoraServicio)
           SELECT ?, ?, 1, Costo, 1, ? FROM servicio WHERE IDServicio = ?`,
          [id, sid, hora || null, sid]
        );
      }
    }

    return result.affectedRows > 0;
  },
};

module.exports = ReservasService;

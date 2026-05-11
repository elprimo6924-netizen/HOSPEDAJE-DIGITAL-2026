const db = require("../config/db");

const ReservasService = {

  obtener: async () => {
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
      GROUP BY r.IdReserva
      ORDER BY r.IdReserva DESC
    `);
    return rows;
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
    } = reserva;

    if (!NroDocumentoCliente) throw new Error("Falta NroDocumentoCliente.");
    if (!FechaInicio || !FechaFinalizacion) throw new Error("Faltan fechas.");

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

    if (Array.isArray(serviciosIds) && serviciosIds.length > 0) {
      for (const sid of serviciosIds) {
        await db.query(
          `INSERT INTO detallereservaservicio (IDReserva, IDServicio, Cantidad, Precio, Estado)
           SELECT ?, ?, 1, Costo, 1 FROM servicio WHERE IDServicio = ?`,
          [idReserva, sid, sid]
        );
      }
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

    if (Array.isArray(serviciosIds)) {
      await db.query(`DELETE FROM detallereservaservicio WHERE IDReserva = ?`, [id]);
      for (const sid of serviciosIds) {
        await db.query(
          `INSERT INTO detallereservaservicio (IDReserva, IDServicio, Cantidad, Precio, Estado)
           SELECT ?, ?, 1, Costo, 1 FROM servicio WHERE IDServicio = ?`,
          [id, sid, sid]
        );
      }
    }

    return result.affectedRows > 0;
  },
};

module.exports = ReservasService;

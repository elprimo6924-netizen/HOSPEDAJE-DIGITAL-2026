const ReservasService = require("../services/reservas.service");
const EmailService = require("../services/email.service");
const WhatsappService = require("../services/whatsapp.service");
const db = require("../config/db");
const {
  ADMIN_ROLE_ID,
  CLIENTE_ROLE_ID,
  logUnauthorizedAccess,
} = require("../middlewares/authorization.middleware");

const getNumeroDocumentoByUserId = async (userId) => {
  if (!userId) return null;
  const [[row]] = await db.query(
    "SELECT NumeroDocumento FROM usuarios WHERE IDUsuario = ? LIMIT 1",
    [userId]
  );
  return row?.NumeroDocumento || null;
};

const sanitizarReservaParaCliente = (reserva) => {
  if (!reserva || typeof reserva !== "object") return reserva;
  const clean = { ...reserva };
  delete clean.NroDocumentoCliente;
  delete clean.NroDocumento;
  delete clean.id_usuario;
  return clean;
};

const crear = async (req, res) => {
  try {
    const role = Number(req.user?.rol ?? req.usuario?.rol);
    const userId = req.user?.id ?? req.usuario?.id;
    const payload = { ...req.body };

    if (role === CLIENTE_ROLE_ID) {
      const numeroDocumento = await getNumeroDocumentoByUserId(userId);
      if (!numeroDocumento) {
        logUnauthorizedAccess(req, "Cliente sin numero de documento valido");
        return res.status(403).json({ message: "Forbidden" });
      }

      if (
        payload.NroDocumentoCliente &&
        String(payload.NroDocumentoCliente) !== String(numeroDocumento)
      ) {
        logUnauthorizedAccess(req, "Intento de registrar reserva con documento ajeno");
        return res.status(403).json({ message: "Forbidden" });
      }

      payload.NroDocumentoCliente = numeroDocumento;
      payload.id_usuario = userId;
    } else {
      payload.id_usuario = payload.id_usuario ?? userId;
    }

    const result = await ReservasService.create(payload);
    const idReserva = result.insertId;

    // Notificaciones en segundo plano — no bloquean la respuesta
    db.query(
      `SELECT c.Nombre, c.Apellido, c.Email, c.Telefono,
              GROUP_CONCAT(DISTINCT COALESCE(h.NombreHabitacion,'') SEPARATOR ', ') AS habitacion,
              GROUP_CONCAT(DISTINCT p.NombrePaquete  ORDER BY p.NombrePaquete SEPARATOR '|') AS paquetes_str,
              GROUP_CONCAT(DISTINCT s.NombreServicio ORDER BY s.NombreServicio SEPARATOR '|') AS servicios_str
       FROM reserva r
       LEFT JOIN cliente c   ON r.NroDocumentoCliente = c.NroDocumento
       LEFT JOIN detallereservapaquetes drp ON r.IdReserva = drp.IDReserva
       LEFT JOIN paquetes p  ON drp.IDPaquete = p.IDPaquete
       LEFT JOIN habitacion h ON p.IDHabitacion = h.IDHabitacion
       LEFT JOIN detallereservaservicio drs ON r.IdReserva = drs.IDReserva
       LEFT JOIN servicio s  ON drs.IDServicio = s.IDServicio
       WHERE r.IdReserva = ? LIMIT 1`,
      [idReserva]
    ).then(([rows]) => {
      if (!rows.length) return;
      const c = rows[0];
      const payload = {
        clienteNombre: `${c.Nombre ?? ""} ${c.Apellido ?? ""}`.trim(),
        reservaId: idReserva,
        habitacion: c.habitacion || 'Reserva confirmada',
        fechaInicio: req.body.FechaInicio,
        fechaFin: req.body.FechaFinalizacion,
        montoTotal: req.body.MontoTotal,
        paquetes: c.paquetes_str ? c.paquetes_str.split('|').filter(Boolean) : [],
        servicios: c.servicios_str ? c.servicios_str.split('|').filter(Boolean) : [],
      };
      Promise.allSettled([
        EmailService.enviarConfirmacionReserva({ ...payload, clienteEmail: c.Email }),
        WhatsappService.enviarConfirmacionReserva({ ...payload, clienteTelefono: c.Telefono }),
      ]);
    }).catch((err) => console.error("Error al despachar notificaciones de reserva:", err.message));

    return res.status(201).json({ mensaje: "Reserva creada", reservaId: idReserva });
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error creando la reserva", detalle: error.message });
  }
};

const obtener = async (req, res) => {
  try {
    const role = Number(req.user?.rol ?? req.usuario?.rol);
    const userId = req.user?.id ?? req.usuario?.id;
    const numeroDocumento = await getNumeroDocumentoByUserId(userId);

    if (role === CLIENTE_ROLE_ID && !numeroDocumento) {
      logUnauthorizedAccess(req, "Cliente sin documento asociado");
      return res.status(403).json({ message: "Forbidden" });
    }

    const reservas = await ReservasService.obtener({
      role,
      userId,
      numeroDocumento,
    });

    if (role === CLIENTE_ROLE_ID) {
      return res.status(200).json(reservas.map(sanitizarReservaParaCliente));
    }

    return res.status(200).json(reservas);
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error obteniendo reservas", detalle: error.message });
  }
};

const obtenerMisReservas = async (req, res) => {
  try {
    const role = Number(req.user?.rol ?? req.usuario?.rol);
    const userId = req.user?.id ?? req.usuario?.id;
    const numeroDocumento = await getNumeroDocumentoByUserId(userId);

    if (role === CLIENTE_ROLE_ID && !numeroDocumento) {
      logUnauthorizedAccess(req, "Cliente sin documento asociado");
      return res.status(403).json({ message: "Forbidden" });
    }

    const reservas = await ReservasService.obtener({
      role,
      userId,
      numeroDocumento,
      forceCliente: true,
    });

    return res.status(200).json(reservas.map(sanitizarReservaParaCliente));
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error obteniendo reservas", detalle: error.message });
  }
};

const cancelar = async (req, res) => {
  try {
    const id = req.params.id; // ✅ viene de /:id/cancelar
    const ok = await ReservasService.cancelar(id);

    if (!ok) return res.status(404).json({ error: "Reserva no encontrada" });
    return res.status(200).json({ mensaje: "Reserva cancelada" });
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error al cancelar", detalle: error.message });
  }
};

const actualizar = async (req, res) => {
  try {
    const id = req.params.id;
    const ok = await ReservasService.actualizar(id, req.body);
    if (!ok) return res.status(404).json({ error: "Reserva no encontrada" });
    return res.status(200).json({ mensaje: "Reserva actualizada" });
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error al actualizar", detalle: error.message });
  }
};

const eliminar = async (req, res) => {
  try {
    const id = req.params.id;
    const ok = await ReservasService.eliminar(id);
    if (!ok) return res.status(404).json({ error: "Reserva no encontrada" });
    return res.status(200).json({ mensaje: "Reserva eliminada" });
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error al eliminar", detalle: error.message });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const role = Number(req.user?.rol ?? req.usuario?.rol);
    const { id } = req.params;
    const reserva = await ReservasService.obtenerPorId(id);
    if (!reserva) return res.status(404).json({ error: "Reserva no encontrada" });
    if (role === CLIENTE_ROLE_ID) {
      return res.status(200).json(sanitizarReservaParaCliente(reserva));
    }
    return res.status(200).json(reserva);
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error obteniendo reserva", detalle: error.message });
  }
};

module.exports = {
  crear,
  obtener,
  obtenerMisReservas,
  obtenerPorId,
  cancelar,
  actualizar,
  eliminar,
};

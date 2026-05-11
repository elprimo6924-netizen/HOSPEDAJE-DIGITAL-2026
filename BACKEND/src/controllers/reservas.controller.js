const ReservasService = require("../services/reservas.service");
const EmailService = require("../services/email.service");
const WhatsappService = require("../services/whatsapp.service");
const db = require("../config/db");

const crear = async (req, res) => {
  try {
    const result = await ReservasService.create(req.body);
    const idReserva = result.insertId;

    // Notificaciones en segundo plano — no bloquean la respuesta
    db.query(
      `SELECT c.Nombre, c.Apellido, c.Email, c.Telefono,
              COALESCE(h.NombreHabitacion, 'Paquete reservado') AS habitacion
       FROM reserva r
       LEFT JOIN cliente c ON r.NroDocumentoCliente = c.NroDocumento
       LEFT JOIN detallereservapaquetes drp ON r.IdReserva = drp.IDReserva
       LEFT JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
       LEFT JOIN habitacion h ON p.IDHabitacion = h.IDHabitacion
       WHERE r.IdReserva = ? LIMIT 1`,
      [idReserva]
    ).then(([rows]) => {
      if (!rows.length) return;
      const c = rows[0];
      const payload = {
        clienteNombre: `${c.Nombre ?? ""} ${c.Apellido ?? ""}`.trim(),
        reservaId: idReserva,
        habitacion: c.habitacion,
        fechaInicio: req.body.FechaInicio,
        fechaFin: req.body.FechaFinalizacion,
        montoTotal: req.body.MontoTotal,
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
    const reservas = await ReservasService.obtener();
    return res.status(200).json(reservas);
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

module.exports = { crear, obtener, cancelar, actualizar, eliminar };

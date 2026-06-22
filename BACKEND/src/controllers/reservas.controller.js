const ReservasService = require("../services/reservas.service");
const EmailService = require("../services/email.service");
const WhatsappService = require("../services/whatsapp.service");
const db = require("../config/db");
const {
  ADMIN_ROLE_ID,
  CLIENTE_ROLE_ID,
  logUnauthorizedAccess,
} = require("../middlewares/authorization.middleware");

let usuariosColsPromise = null;

const getUsuariosCols = async () => {
  if (!usuariosColsPromise) {
    usuariosColsPromise = db
      .query("SHOW COLUMNS FROM `usuarios`")
      .then(([rows]) => new Set(rows.map((r) => r.Field)));
  }
  return usuariosColsPromise;
};

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
      if (!payload.id_usuario && payload.NroDocumentoCliente) {
        // Intentar asociar el usuario registrado con ese documento para que el email de notificación llegue al cliente
        const [[clienteUser]] = await db.query(
          "SELECT IDUsuario FROM usuarios WHERE CAST(NumeroDocumento AS CHAR) = CAST(? AS CHAR) AND IDRol = ? LIMIT 1",
          [payload.NroDocumentoCliente, CLIENTE_ROLE_ID]
        );
        payload.id_usuario = clienteUser?.IDUsuario ?? userId;
      } else {
        payload.id_usuario = payload.id_usuario ?? userId;
      }
    }

    // Estado automático basado en método de pago (aplica a todos los roles)
    // Efectivo (1) → Confirmada (2) | Tarjeta (2) → Pendiente Verificación Pago (5)
    const metodoPago = Number(payload.MetodoPago || 1);
    payload.IdEstadoReserva = metodoPago === 1 ? 2 : 5;

    const result = await ReservasService.create(payload);
    const idReserva = result.insertId;

    const usuarioCols = await getUsuariosCols();
    const userNombreParts = [];
    if (usuarioCols.has("Nombre")) userNombreParts.push("u.Nombre");
    if (usuarioCols.has("NombreUsuario")) userNombreParts.push("u.NombreUsuario");

    const userNombreExpr   = userNombreParts.length ? `MAX(COALESCE(${userNombreParts.join(", ")}))` : "NULL";
    const userApellidoExpr = usuarioCols.has("Apellido") ? "MAX(u.Apellido)" : "NULL";
    const userEmailExpr    = usuarioCols.has("Email")    ? "MAX(u.Email)"    : "NULL";
    const userTelefonoExpr = usuarioCols.has("Telefono") ? "MAX(u.Telefono)" : "NULL";

    // Notificaciones en segundo plano — no bloquean la respuesta
    db.query(
      `SELECT
              COALESCE(MAX(c.Nombre), ${userNombreExpr}, '') AS Nombre,
              COALESCE(MAX(c.Apellido), ${userApellidoExpr}, '') AS Apellido,
              COALESCE(MAX(c.Email), ${userEmailExpr}) AS Email,
              COALESCE(MAX(c.Telefono), ${userTelefonoExpr}) AS Telefono,
              COALESCE(
                NULLIF(GROUP_CONCAT(DISTINCT COALESCE(hp.NombreHabitacion,'') SEPARATOR ', '),''),
                MAX(hd.NombreHabitacion)
              ) AS habitacion,
              GROUP_CONCAT(DISTINCT p.NombrePaquete  ORDER BY p.NombrePaquete SEPARATOR '|') AS paquetes_str,
              GROUP_CONCAT(DISTINCT s.NombreServicio ORDER BY s.NombreServicio SEPARATOR '|') AS servicios_str
      FROM reserva r
      LEFT JOIN clientes c   ON r.NroDocumentoCliente = c.NroDocumento
      LEFT JOIN usuarios u   ON r.id_usuario = u.IDUsuario
      LEFT JOIN habitacion hd ON r.IDHabitacion = hd.IDHabitacion
      LEFT JOIN detallereservapaquetes drp ON r.IdReserva = drp.IDReserva
      LEFT JOIN paquetes p   ON drp.IDPaquete = p.IDPaquete
      LEFT JOIN habitacion hp ON p.IDHabitacion = hp.IDHabitacion
      LEFT JOIN detallereservaservicio drs ON r.IdReserva = drs.IDReserva
      LEFT JOIN servicio s   ON drs.IDServicio = s.IDServicio
      WHERE r.IdReserva = ? LIMIT 1`,
      [idReserva]
    ).then(([rows]) => {
      if (!rows.length) {
        console.warn(`[Notif] No se encontraron datos para reserva #${idReserva}`);
        return;
      }
      const c = rows[0];
      console.log(`[Notif] Reserva #${idReserva} | Cliente: ${c.Nombre} ${c.Apellido} | Email: ${c.Email || 'NULL'} | MetodoPago: ${metodoPago}`);

      if (!c.Email) {
        console.warn(`[Notif] Email nulo para reserva #${idReserva} — no se enviará correo al cliente`);
      }

      const notifPayload = {
        clienteNombre: `${c.Nombre ?? ""} ${c.Apellido ?? ""}`.trim(),
        clienteEmail:  c.Email || null,
        reservaId:     idReserva,
        habitacion:    c.habitacion || 'Reserva confirmada',
        fechaInicio:   req.body.FechaInicio,
        fechaFin:      req.body.FechaFinalizacion,
        montoTotal:    req.body.MontoTotal,
        paquetes:      c.paquetes_str ? c.paquetes_str.split('|').filter(Boolean) : [],
        servicios:     c.servicios_str ? c.servicios_str.split('|').filter(Boolean) : [],
      };

      // Notificación al admin siempre
      EmailService.notificarAdminNuevaReserva(notifPayload)
        .then(ok => console.log(`[Notif] notificarAdminNuevaReserva → ${ok ? 'OK' : 'FALLÓ'}`))
        .catch(err => console.error(`[Notif] Error notificarAdminNuevaReserva:`, err.message));

      if (!c.Email) return;

      if (metodoPago === 2) {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const linkSubir = `${appUrl}/pages/reservas.html?comprobante=${idReserva}`;
        EmailService.enviarPendienteComprobante({ ...notifPayload, linkSubir })
          .then(ok => console.log(`[Notif] enviarPendienteComprobante → ${ok ? 'OK' : 'FALLÓ'}`))
          .catch(err => console.error(`[Notif] Error enviarPendienteComprobante:`, err.message));
      } else {
        EmailService.enviarConfirmacionReserva(notifPayload)
          .then(ok => console.log(`[Notif] enviarConfirmacionReserva → ${ok ? 'OK' : 'FALLÓ'}`))
          .catch(err => console.error(`[Notif] Error enviarConfirmacionReserva:`, err.message));
        WhatsappService.enviarConfirmacionReserva({ ...notifPayload, clienteTelefono: c.Telefono })
          .catch(() => {});
      }
    }).catch((err) => console.error("[Notif] Error al despachar notificaciones:", err.message));

    return res.status(201).json({ mensaje: "Reserva creada", reservaId: idReserva, metodoPago });
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
    const id = req.params.id;

    // Obtener datos antes de cancelar para el email
    const usuarioCols = await getUsuariosCols();
    const userNombreParts = [];
    if (usuarioCols.has("Nombre")) userNombreParts.push("u.Nombre");
    if (usuarioCols.has("NombreUsuario")) userNombreParts.push("u.NombreUsuario");
    const userNombreExpr   = userNombreParts.length ? `COALESCE(${userNombreParts.join(", ")})` : "NULL";
    const userApellidoExpr = usuarioCols.has("Apellido") ? "u.Apellido" : "NULL";
    const userEmailExpr    = usuarioCols.has("Email")    ? "u.Email"    : "NULL";

    const [[reservaData]] = await db.query(
      `SELECT
        COALESCE(c.Nombre, ${userNombreExpr}, '') AS Nombre,
        COALESCE(c.Apellido, ${userApellidoExpr}, '') AS Apellido,
        COALESCE(c.Email, ${userEmailExpr}) AS Email,
        COALESCE(hd.NombreHabitacion, hp.NombreHabitacion, 'Reserva') AS habitacion,
        r.FechaInicio, r.FechaFinalizacion, r.MontoTotal
      FROM reserva r
      LEFT JOIN clientes c  ON r.NroDocumentoCliente = c.NroDocumento
      LEFT JOIN usuarios u  ON r.id_usuario = u.IDUsuario
      LEFT JOIN habitacion hd ON r.IDHabitacion = hd.IDHabitacion
      LEFT JOIN detallereservapaquetes drp ON r.IdReserva = drp.IDReserva
      LEFT JOIN paquetes p  ON drp.IDPaquete = p.IDPaquete
      LEFT JOIN habitacion hp ON p.IDHabitacion = hp.IDHabitacion
      WHERE r.IdReserva = ? LIMIT 1`,
      [id]
    );

    const ok = await ReservasService.cancelar(id);
    if (!ok) return res.status(404).json({ error: "Reserva no encontrada" });

    // Notificar al cliente en segundo plano
    if (reservaData?.Email) {
      EmailService.enviarCancelacionReserva({
        clienteNombre:     `${reservaData.Nombre} ${reservaData.Apellido}`.trim(),
        clienteEmail:      reservaData.Email,
        reservaId:         id,
        habitacion:        reservaData.habitacion,
        fechaInicio:       reservaData.FechaInicio,
        fechaFin:          reservaData.FechaFinalizacion,
        montoTotal:        reservaData.MontoTotal,
        motivoCancelacion: req.body?.motivo || "",
      }).then(ok => console.log(`[Notif] enviarCancelacionReserva #${id} → ${ok ? 'OK' : 'FALLÓ'}`))
        .catch(err => console.error(`[Notif] Error cancelación:`, err.message));
    }

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

const path = require("path");
const fs   = require("fs");

const cotizar = async (req, res) => {
  try {
    const {
      IDHabitacion, paquetesIds: paqRaw, serviciosIds: svcRaw,
      FechaInicio, FechaFinalizacion, Descuento,
    } = req.query;

    if (!FechaInicio || !FechaFinalizacion) {
      return res.status(400).json({ error: "FechaInicio y FechaFinalizacion son obligatorios." });
    }

    const noches = Math.max(1, Math.ceil(
      (new Date(FechaFinalizacion) - new Date(FechaInicio)) / 86400000
    ));
    const paqIds = paqRaw ? String(paqRaw).split(',').map(Number).filter(Boolean) : [];
    const svcIds = svcRaw ? String(svcRaw).split(',').map(Number).filter(Boolean) : [];

    let precioBase = 0;
    if (IDHabitacion && !paqIds.length) {
      const [[h]] = await db.query("SELECT Costo FROM habitacion WHERE IDHabitacion = ? LIMIT 1", [IDHabitacion]);
      precioBase = Number(h?.Costo || 0) * noches;
    }
    for (const pid of paqIds) {
      const [[p]] = await db.query("SELECT Precio FROM paquetes WHERE IDPaquete = ? LIMIT 1", [pid]);
      precioBase += Number(p?.Precio || 0);
    }
    let precioSvc = 0;
    for (const sid of svcIds) {
      const [[s]] = await db.query("SELECT Costo FROM servicio WHERE IDServicio = ? LIMIT 1", [sid]);
      precioSvc += Number(s?.Costo || 0);
    }

    const descSaneado  = Math.max(0, Math.min(Number(Descuento || 0), precioBase + precioSvc));
    const totalConIva  = Math.max(0, precioBase + precioSvc - descSaneado);
    const baseGravable = totalConIva / 1.19;
    const ivaDesglose  = totalConIva - baseGravable;

    return res.status(200).json({
      noches,
      precioBase,
      precioServicios: precioSvc,
      descuento: descSaneado,
      baseGravable: Math.round(baseGravable * 100) / 100,
      ivaDesglose:  Math.round(ivaDesglose  * 100) / 100,
      totalConIva,
    });
  } catch (error) {
    console.error("[Reservas] cotizar:", error);
    return res.status(500).json({ error: "Error al cotizar.", detalle: error.message });
  }
};

const subirComprobante = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ningún archivo." });
    }
    const { id } = req.params;

    // Borrar archivo anterior si existe
    try {
      const [[prev]] = await db.query(
        "SELECT ComprobantePago FROM reserva WHERE IdReserva = ? LIMIT 1", [id]
      );
      if (prev?.ComprobantePago) {
        const oldPath = path.join(__dirname, "../public", prev.ComprobantePago);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    } catch (_) { /* no crítico */ }

    const comprobanteUrl = `/uploads/comprobantes/${req.file.filename}`;
    const ok = await ReservasService.guardarComprobante(id, comprobanteUrl);
    if (!ok) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: "Reserva no encontrada." });
    }
    return res.status(200).json({ ok: true, comprobanteUrl, estado: "pendiente" });
  } catch (error) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    console.error("[Reservas] Error subirComprobante:", error);
    return res.status(500).json({ error: "Error al guardar comprobante.", detalle: error.message });
  }
};

const verificarComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    const { accion, nota } = req.body;
    if (!["aprobar", "rechazar"].includes(accion)) {
      return res.status(400).json({ error: "Acción inválida. Use 'aprobar' o 'rechazar'." });
    }
    const nuevoEstado = await ReservasService.verificarComprobante(id, accion, nota);
    if (!nuevoEstado) return res.status(404).json({ error: "Reserva no encontrada." });

    // Notificación al aprobar (background, no bloquea la respuesta)
    if (accion === "aprobar") {
      db.query(
        `SELECT COALESCE(c.Email, u.Email) AS Email, COALESCE(c.Nombre, u.NombreUsuario) AS Nombre,
                r.IdReserva AS reservaId, r.FechaInicio, r.Monto_Total AS MontoTotal
         FROM reserva r
         LEFT JOIN clientes c ON r.NroDocumentoCliente = c.NroDocumento
         LEFT JOIN usuarios u ON r.id_usuario = u.IDUsuario
         WHERE r.IdReserva = ? LIMIT 1`,
        [id]
      ).then(([rows]) => {
        if (!rows.length) return;
        const c = rows[0];
        if (c.Email) {
          Promise.allSettled([
            EmailService.enviarConfirmacionReserva({
              clienteNombre: c.Nombre || "Cliente",
              clienteEmail:  c.Email,
              reservaId:     c.reservaId,
              fechaInicio:   c.FechaInicio,
              montoTotal:    c.MontoTotal,
            }),
          ]).catch(() => {});
        }
      }).catch(() => {});
    }

    return res.status(200).json({ ok: true, nuevoEstado });
  } catch (error) {
    console.error("[Reservas] Error verificarComprobante:", error);
    return res.status(500).json({ error: error.message, detalle: error.message });
  }
};

const agregarServicios = async (req, res) => {
  try {
    const { id } = req.params;
    const { servicios, serviciosIds, metodoPago } = req.body;
    const esCliente = Number(req.usuario?.rol) !== 1;
    const esTransferencia = Number(metodoPago) === 2;

    let lista;
    if (Array.isArray(servicios) && servicios.length > 0) {
      lista = servicios;
    } else if (Array.isArray(serviciosIds) && serviciosIds.length > 0) {
      lista = serviciosIds.map(sid => ({ IDServicio: sid, Cantidad: 1 }));
    } else {
      return res.status(400).json({ error: "Selecciona al menos un servicio" });
    }

    await ReservasService.agregarServicios(id, lista);

    if (metodoPago !== undefined && metodoPago !== null) {
      await db.query("UPDATE reserva SET MetodoPago = ? WHERE IdReserva = ?", [metodoPago, id]);
    }

    // Solo cambia a Pendiente Verificación Pago (5) si el cliente pagó por transferencia
    if (esCliente && esTransferencia) {
      await db.query(
        "UPDATE reserva SET IdEstadoReserva = 5 WHERE IdReserva = ? AND IdEstadoReserva NOT IN (3, 4)",
        [id]
      );
    }

    // Notificaciones por email cuando es cliente
    if (esCliente) {
      setImmediate(async () => {
        try {
          const idsServicios = lista.map(s => s.IDServicio);
          const cantidades   = Object.fromEntries(lista.map(s => [s.IDServicio, s.Cantidad || 1]));

          const [svcRows] = await db.query(
            `SELECT IDServicio, NombreServicio, PrecioServicio FROM servicio WHERE IDServicio IN (?)`,
            [idsServicios]
          );

          const serviciosAgregados = svcRows.map(s => {
            const cant = cantidades[s.IDServicio] || 1;
            return cant > 1
              ? `${s.NombreServicio} x${cant}`
              : s.NombreServicio;
          });

          const costoAdicional = svcRows.reduce((sum, s) => {
            return sum + (Number(s.PrecioServicio) || 0) * (cantidades[s.IDServicio] || 1);
          }, 0);

          const [[reserva]] = await db.query(
            `SELECT r.IdReserva,
                    COALESCE(c.Nombre, u.NombreUsuario, '') AS Nombre,
                    COALESCE(c.Apellido, u.Apellido, '')    AS Apellido,
                    COALESCE(c.Email, u.Email, '')          AS Email
             FROM reserva r
             LEFT JOIN clientes c  ON r.NroDocumentoCliente = c.NroDocumento
             LEFT JOIN usuarios  u ON r.id_usuario = u.IDUsuario
             WHERE r.IdReserva = ? LIMIT 1`,
            [id]
          );

          if (!reserva?.Email) {
            console.warn(`[Notif] Sin email para reserva #${id} — se omiten notificaciones`);
            return;
          }

          const clienteNombre = `${reserva.Nombre} ${reserva.Apellido}`.trim() || 'cliente';
          const appUrl  = process.env.APP_URL || 'http://localhost:3000';
          const linkSubir = `${appUrl}/pages/reservas.html?comprobante=${id}`;

          await EmailService.enviarServiciosAgregados({
            clienteNombre,
            clienteEmail: reserva.Email,
            reservaId: id,
            serviciosAgregados,
            costoAdicional,
            metodoPago,
            linkSubir,
          });

          if (esTransferencia) {
            await EmailService.notificarAdminServiciosAgregados({
              clienteNombre,
              clienteEmail: reserva.Email,
              reservaId: id,
              serviciosAgregados,
              costoAdicional,
            });
          }
        } catch (err) {
          console.error("[Notif] Error al enviar email servicios:", err.message);
        }
      });
    }

    return res.status(200).json({ mensaje: "Servicios agregados correctamente" });
  } catch (error) {
    console.error("[Reservas] Error al agregar servicios:", error);
    return res.status(500).json({ error: "Error al agregar servicios", detalle: error.message });
  }
};

const getReservasPendientesPago = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.IdReserva,
              r.FechaReserva,
              r.Monto_Total,
              e.NombreEstadoReserva AS estado,
              COALESCE(c.Nombre, u.NombreUsuario, '') AS Nombre,
              COALESCE(c.Apellido, u.Apellido, '')    AS Apellido
       FROM reserva r
       LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
       LEFT JOIN clientes c ON r.NroDocumentoCliente = c.NroDocumento
       LEFT JOIN usuarios  u ON r.id_usuario = u.IDUsuario
       WHERE r.IdEstadoReserva IN (1, 5)
       ORDER BY r.FechaReserva DESC
       LIMIT 20`
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error("[Reservas] getReservasPendientesPago:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

const getComprobantesPendientes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.IdReserva, r.ComprobanteFecha,
              COALESCE(c.Nombre, u.NombreUsuario, u.Nombre, '') AS Nombre,
              COALESCE(c.Apellido, u.Apellido, '') AS Apellido
       FROM reserva r
       LEFT JOIN clientes c ON r.NroDocumentoCliente = c.NroDocumento
       LEFT JOIN usuarios u ON r.id_usuario = u.IDUsuario
       WHERE r.ComprobantePago IS NOT NULL
         AND r.ComprobantePago != ''
         AND r.ComprobanteEstado = 'pendiente'
       ORDER BY r.ComprobanteFecha DESC`
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error("[Reservas] getComprobantesPendientes:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

const syncEstados = async (req, res) => {
  try {
    await ReservasService.syncEstados();
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[Reservas] Error syncEstados:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getDisponibilidad = async (req, res) => {
  try {
    const { IDHabitacion, IDPaquete } = req.query;
    const fechas = await ReservasService.getDisponibilidad({ IDHabitacion, IDPaquete });
    return res.status(200).json(fechas);
  } catch (error) {
    console.error("[Reservas] Error getDisponibilidad:", error);
    return res.status(500).json({ error: error.message });
  }
};

const extenderDias = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaFechaFin } = req.body;
    if (!nuevaFechaFin) return res.status(400).json({ error: "Indica la nueva fecha de finalización" });

    const result = await ReservasService.extenderDias(id, nuevaFechaFin);
    if (!result.ok) return res.status(400).json({ error: result.error });

    // Si quien extiende es un cliente, volver a Pendiente Verificación Pago (5)
    if (Number(req.usuario?.rol) !== 1) {
      await db.query(
        "UPDATE reserva SET IdEstadoReserva = 5 WHERE IdReserva = ? AND IdEstadoReserva NOT IN (3, 4)",
        [id]
      );
    }

    return res.status(200).json({
      mensaje: `Reserva extendida ${result.nightsExtra} noche${result.nightsExtra !== 1 ? "s" : ""} adicional${result.nightsExtra !== 1 ? "es" : ""}. Costo adicional: $${Number(result.costoExtra).toLocaleString("es-CO")}`,
      ...result,
    });
  } catch (error) {
    console.error("[Reservas] Error al extender días:", error);
    return res.status(500).json({ error: "Error al extender la reserva", detalle: error.message });
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
  agregarServicios,
  extenderDias,
  getReservasPendientesPago,
  subirComprobante,
  verificarComprobante,
  cotizar,
  syncEstados,
  getDisponibilidad,
  getComprobantesPendientes,
};

const db = require("../config/db");

const ADMIN_ROLE_ID = 1;
const CLIENTE_ROLE_ID = 2;

const logUnauthorizedAccess = (req, reason = "Acceso no autorizado") => {
  const userId = req.user?.id ?? req.usuario?.id ?? "anon";
  const role = req.user?.rol ?? req.usuario?.rol ?? "n/a";
  const path = req.originalUrl || req.url;
  console.warn(`[AUTHZ] ${reason} | user=${userId} role=${role} path=${path}`);
};

const requireAdmin = (req, res, next) => {
  const role = Number(req.user?.rol ?? req.usuario?.rol);
  if (role === ADMIN_ROLE_ID) return next();
  logUnauthorizedAccess(req, "Rol sin privilegios de administrador");
  return res.status(403).json({ message: "Forbidden" });
};

const requireReservaOwnerOrAdmin = async (req, res, next) => {
  try {
    const role = Number(req.user?.rol ?? req.usuario?.rol);
    if (role === ADMIN_ROLE_ID) return next();

    const reservaId = Number(req.params.id);
    if (!Number.isFinite(reservaId)) {
      return res.status(400).json({ error: "Id de reserva invalido" });
    }

    const [[reserva]] = await db.query(
      "SELECT id_usuario, NroDocumentoCliente FROM reserva WHERE IdReserva = ? LIMIT 1",
      [reservaId]
    );

    if (!reserva) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    if (reserva.id_usuario && Number(reserva.id_usuario) === Number(req.user?.id ?? req.usuario?.id)) {
      return next();
    }

    const [[usuario]] = await db.query(
      "SELECT NumeroDocumento FROM usuarios WHERE IDUsuario = ? LIMIT 1",
      [req.user?.id ?? req.usuario?.id]
    );

    if (usuario?.NumeroDocumento && String(usuario.NumeroDocumento) === String(reserva.NroDocumentoCliente)) {
      return next();
    }

    logUnauthorizedAccess(req, "Intento de acceder a reserva ajena");
    return res.status(403).json({ message: "Forbidden" });
  } catch (error) {
    return res.status(500).json({ error: "Error verificando acceso", detalle: error.message });
  }
};

module.exports = {
  ADMIN_ROLE_ID,
  CLIENTE_ROLE_ID,
  logUnauthorizedAccess,
  requireAdmin,
  requireReservaOwnerOrAdmin,
};

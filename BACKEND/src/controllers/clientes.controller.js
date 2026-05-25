const db = require("../config/db");
const bcrypt = require("bcryptjs");
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

/* ================= LISTAR CLIENTES ================= */
exports.getAll = async (req, res) => {
  try {
    const role = Number(req.user?.rol ?? req.usuario?.rol);
    const userId = req.user?.id ?? req.usuario?.id;
    const { documento } = req.query;

    if (role === CLIENTE_ROLE_ID) {
      const numeroDocumento = await getNumeroDocumentoByUserId(userId);
      if (!numeroDocumento) {
        logUnauthorizedAccess(req, "Cliente sin documento asociado");
        return res.status(403).json({ message: "Forbidden" });
      }

      const [rows] = await db.query(
        "SELECT * FROM cliente WHERE NroDocumento = ?",
        [numeroDocumento]
      );
      return res.json(rows);
    }

    let sql = "SELECT * FROM cliente";
    let params = [];

    if (documento) {
      sql += " WHERE NroDocumento = ?";
      params = [documento];
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo clientes", detalle: error.message });
  }
};

/* ================= LISTAR CLIENTES ACTIVOS (para selector de reservas C6) ================= */
exports.getActivos = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM cliente WHERE Estado = 1 ORDER BY Nombre ASC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo clientes activos", detalle: error.message });
  }
};

/* ================= BUSCAR CLIENTE POR DOCUMENTO ================= */
exports.buscarPorDocumento = async (req, res) => {
  try {
    const role = Number(req.user?.rol ?? req.usuario?.rol);
    const userId = req.user?.id ?? req.usuario?.id;
    const { documento } = req.query;

    if (role === CLIENTE_ROLE_ID) {
      const numeroDocumento = await getNumeroDocumentoByUserId(userId);
      if (!numeroDocumento) {
        logUnauthorizedAccess(req, "Cliente sin documento asociado");
        return res.status(403).json({ message: "Forbidden" });
      }

      if (documento && String(documento) !== String(numeroDocumento)) {
        logUnauthorizedAccess(req, "Intento de buscar cliente ajeno por documento");
        return res.status(403).json({ message: "Forbidden" });
      }

      const [rows] = await db.query(
        "SELECT * FROM cliente WHERE NroDocumento = ?",
        [numeroDocumento]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }
      return res.json(rows[0]);
    }

    if (!documento) {
      return res.status(400).json({ error: "Documento requerido" });
    }

    const [rows] = await db.query(
      "SELECT * FROM cliente WHERE NroDocumento = ?",
      [documento]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error buscando cliente", detalle: error.message });
  }
};

/* ================= OBTENER CLIENTE POR DOCUMENTO (ID) ================= */
exports.obtenerPorId = async (req, res) => {
  try {
    const role = Number(req.user?.rol ?? req.usuario?.rol);
    const userId = req.user?.id ?? req.usuario?.id;
    const id = req.params.id; // aquí id es el NroDocumento según frontend

    if (role === CLIENTE_ROLE_ID) {
      const numeroDocumento = await getNumeroDocumentoByUserId(userId);
      if (!numeroDocumento) {
        logUnauthorizedAccess(req, "Cliente sin documento asociado");
        return res.status(403).json({ message: "Forbidden" });
      }
      if (String(id) !== String(numeroDocumento)) {
        logUnauthorizedAccess(req, "Intento de acceder a cliente ajeno por id");
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const [rows] = await db.query(
      "SELECT * FROM cliente WHERE NroDocumento = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo cliente", detalle: error.message });
  }
};

/* ================= CREAR CLIENTE ================= */
exports.create = async (req, res) => {
  try {
    const { NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol, Password } = req.body;

    if (!NroDocumento || !Nombre || !Email) {
      return res.status(400).json({ error: "NroDocumento, Nombre y Email son obligatorios." });
    }

    const [result] = await db.query(
      `INSERT INTO cliente (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [NroDocumento, Nombre, Apellido, Direccion || null, Email, Telefono || null, Estado || 1, IDRol || 3]
    );

    /* C4: Crear usuario asociado con rol Cliente si se proporcionó contraseña */
    if (Password && Password.length >= 8) {
      const hashPass = await bcrypt.hash(Password, 10);
      await db.query(
        `INSERT INTO usuarios (Nombre, Apellido, Email, Contrasena, IDRol, IsActive, requiereCambioPassword)
         VALUES (?, ?, ?, ?, 3, 1, 1)
         ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre)`,
        [Nombre, Apellido || '', Email, hashPass]
      );
    }

    res.status(201).json({ mensaje: "Cliente creado", data: result });
  } catch (error) {
    const esDuplicado = error.code === 'ER_DUP_ENTRY';
    const esFKFaltante = error.code === 'ER_NO_REFERENCED_ROW_2';
    let mensaje = "Error creando cliente";
    if (esDuplicado) mensaje = "Ya existe un cliente con ese número de documento.";
    else if (esFKFaltante) mensaje = "El rol especificado no existe en el sistema.";
    res.status(esDuplicado || esFKFaltante ? 409 : 500).json({ error: mensaje, detalle: error.message });
  }
};

/* ================= EDITAR CLIENTE ================= */
exports.update = async (req, res) => {
  try {
    const id = req.params.id; // NroDocumento
    const { Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol } = req.body;

    await db.query(
      `UPDATE cliente
       SET Nombre = ?, Apellido = ?, Direccion = ?, Email = ?, Telefono = ?, Estado = ?, IDRol = ?
       WHERE NroDocumento = ?`,
      [Nombre, Apellido, Direccion || null, Email, Telefono || null, Estado || 1, IDRol || 3, id]
    );

    res.json({ mensaje: "Cliente actualizado" });
  } catch (error) {
    res.status(500).json({ error: "Error actualizando cliente", detalle: error.message });
  }
};

/* ================= ELIMINAR CLIENTE ================= */
exports.remove = async (req, res) => {
  try {
    const id = req.params.id; // NroDocumento

    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM reserva WHERE NroDocumentoCliente = ?",
      [id]
    );
    if (total > 0) {
      return res.status(409).json({
        error: "No se puede eliminar este cliente porque tiene reservas registradas."
      });
    }

    await db.query("DELETE FROM cliente WHERE NroDocumento = ?", [id]);
    res.json({ mensaje: "Cliente eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando cliente", detalle: error.message });
  }
};

/* ================= TOGGLE ESTADO CLIENTE ================= */
exports.toggleEstado = async (req, res) => {
  try {
    const id = req.params.id;
    const { Estado } = req.body;

    if (Estado === undefined || Estado === null) {
      return res.status(400).json({ error: "Campo Estado es requerido" });
    }

    await db.query("UPDATE cliente SET Estado = ? WHERE NroDocumento = ?", [Estado, id]);
    res.json({ mensaje: "Estado del cliente actualizado", Estado });
  } catch (error) {
    res.status(500).json({ error: "Error actualizando estado del cliente", detalle: error.message });
  }
};

/* ================= BUSCAR CLIENTES ================= */
exports.search = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.status(400).json({ error: "El término de búsqueda es obligatorio" });
    }

    const like = `%${q}%`;
    const [rows] = await db.query(
      `SELECT * FROM cliente
       WHERE NroDocumento LIKE ? OR Nombre LIKE ? OR Apellido LIKE ? OR Email LIKE ?
       ORDER BY Nombre ASC`,
      [like, like, like, like]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error buscando clientes", detalle: error.message });
  }
};

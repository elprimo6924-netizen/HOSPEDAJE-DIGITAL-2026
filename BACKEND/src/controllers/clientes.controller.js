const db = require("../config/db");
const bcrypt = require("bcryptjs");
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

const resolveNombreUsuarioCol = (cols) => {
  if (cols.has("NombreUsuario")) return "NombreUsuario";
  if (cols.has("Nombre")) return "Nombre";
  return null;
};

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
        "SELECT * FROM clientes WHERE NroDocumento = ?",
        [numeroDocumento]
      );
      return res.json(rows);
    }

    let sql = "SELECT * FROM clientes";
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
    const [rows] = await db.query("SELECT * FROM clientes WHERE Estado = 1 ORDER BY Nombre ASC");
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
        "SELECT * FROM clientes WHERE NroDocumento = ?",
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
      "SELECT * FROM clientes WHERE NroDocumento = ?",
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
      "SELECT * FROM clientes WHERE NroDocumento = ?",
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
      `INSERT INTO clientes (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [NroDocumento, Nombre, Apellido, Direccion || null, Email, Telefono || null, Estado || 1, IDRol || 3]
    );

    /* C4: Crear usuario asociado con rol Cliente si se proporcionó contraseña */
    if (Password && Password.length >= 8) {
      const hashPass = await bcrypt.hash(Password, 10);
      const cols = await getUsuariosCols();
      const nombreCol = resolveNombreUsuarioCol(cols);

      const [[existingUser]] = await db.query(
        "SELECT IDUsuario FROM usuarios WHERE Email = ? OR NumeroDocumento = ? LIMIT 1",
        [Email, NroDocumento]
      );

      if (existingUser?.IDUsuario) {
        const updates = [];
        const values = [];

        if (nombreCol) {
          updates.push(`${nombreCol} = ?`);
          values.push(Nombre);
        }
        if (cols.has("Apellido")) {
          updates.push("Apellido = ?");
          values.push(Apellido || "");
        }
        if (cols.has("Email")) {
          updates.push("Email = ?");
          values.push(Email);
        }
        if (cols.has("NumeroDocumento")) {
          updates.push("NumeroDocumento = ?");
          values.push(NroDocumento);
        }
        if (cols.has("Contrasena")) {
          updates.push("Contrasena = ?");
          values.push(hashPass);
        }
        if (cols.has("IDRol")) {
          updates.push("IDRol = 3");
        }
        if (cols.has("IsActive")) {
          updates.push("IsActive = 1");
        }
        if (cols.has("requiereCambioPassword")) {
          updates.push("requiereCambioPassword = 1");
        }

        if (updates.length) {
          values.push(existingUser.IDUsuario);
          await db.query(
            `UPDATE usuarios SET ${updates.join(", ")} WHERE IDUsuario = ?`,
            values
          );
        }
      } else {
        const insertCols = [];
        const insertVals = [];
        const params = [];

        if (nombreCol) {
          insertCols.push(nombreCol);
          insertVals.push("?");
          params.push(Nombre);
        }
        if (cols.has("Apellido")) {
          insertCols.push("Apellido");
          insertVals.push("?");
          params.push(Apellido || "");
        }
        if (cols.has("Email")) {
          insertCols.push("Email");
          insertVals.push("?");
          params.push(Email);
        }
        if (cols.has("Contrasena")) {
          insertCols.push("Contrasena");
          insertVals.push("?");
          params.push(hashPass);
        }
        if (cols.has("NumeroDocumento")) {
          insertCols.push("NumeroDocumento");
          insertVals.push("?");
          params.push(NroDocumento);
        }
        if (cols.has("IDRol")) {
          insertCols.push("IDRol");
          insertVals.push("3");
        }
        if (cols.has("IsActive")) {
          insertCols.push("IsActive");
          insertVals.push("1");
        }
        if (cols.has("requiereCambioPassword")) {
          insertCols.push("requiereCambioPassword");
          insertVals.push("1");
        }

        if (insertCols.length) {
          await db.query(
            `INSERT INTO usuarios (${insertCols.join(", ")}) VALUES (${insertVals.join(", ")})`,
            params
          );
        }
      }
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
      `UPDATE clientes
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

    await db.query("DELETE FROM clientes WHERE NroDocumento = ?", [id]);
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

    await db.query("UPDATE clientes SET Estado = ? WHERE NroDocumento = ?", [Estado, id]);
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

    // Fuente 1: usuarios registrados con rol Cliente (o IDRol=3)
    const usuarioCols = await getUsuariosCols();
    let deUsuarios = [];

    if (usuarioCols.has("NumeroDocumento")) {
      const nombreSelect = usuarioCols.has("Nombre") && usuarioCols.has("NombreUsuario")
        ? "COALESCE(u.Nombre, u.NombreUsuario) AS Nombre"
        : (usuarioCols.has("Nombre") ? "u.Nombre AS Nombre" : "u.NombreUsuario AS Nombre");
      const apellidoSelect = usuarioCols.has("Apellido") ? "u.Apellido AS Apellido" : "'' AS Apellido";
      const emailSelect = usuarioCols.has("Email") ? "u.Email AS Email" : "'' AS Email";
      const tipoDocSelect = usuarioCols.has("TipoDocumento")
        ? "u.TipoDocumento AS TipoDocumento"
        : "'CC' AS TipoDocumento";

      const joins = usuarioCols.has("IDRol")
        ? "LEFT JOIN roles r ON u.IDRol = r.IDRol"
        : "";

      const filtrosRol = usuarioCols.has("IDRol")
        ? "(u.IDRol = 3 OR r.Nombre = 'Cliente')"
        : "1=1";

      const filtrosLike = [];
      const params = [];

      if (usuarioCols.has("Nombre")) {
        filtrosLike.push("u.Nombre LIKE ?");
        params.push(like);
      }
      if (usuarioCols.has("NombreUsuario")) {
        filtrosLike.push("u.NombreUsuario LIKE ?");
        params.push(like);
      }
      if (usuarioCols.has("Apellido")) {
        filtrosLike.push("u.Apellido LIKE ?");
        params.push(like);
      }
      if (usuarioCols.has("Email")) {
        filtrosLike.push("u.Email LIKE ?");
        params.push(like);
      }

      filtrosLike.push("u.NumeroDocumento LIKE ?");
      params.push(like);

      const [rowsUsuarios] = await db.query(
        `SELECT u.NumeroDocumento AS documento,
                ${nombreSelect},
                ${apellidoSelect},
                ${emailSelect},
                ${tipoDocSelect},
                'usuario' AS fuente
         FROM usuarios u
         ${joins}
         WHERE ${filtrosRol}
           AND u.NumeroDocumento IS NOT NULL
           AND (${filtrosLike.join(" OR ")})`,
        params
      );

      deUsuarios = rowsUsuarios;
    }

    // Fuente 2: tabla cliente (datos legacy / creados desde admin)
    const [deCliente] = await db.query(
            `SELECT NroDocumento AS documento, Nombre, Apellido, Email,
              'CC' AS TipoDocumento, 'cliente' AS fuente
             FROM clientes
             WHERE Nombre LIKE ? OR Apellido LIKE ? OR Email LIKE ? OR NroDocumento LIKE ?`,
      [like, like, like, like]
    );

    // Combinar sin duplicar (prioridad: usuario registrado)
    const vistos = new Set(deUsuarios.map(r => r.documento));
    const deClienteNoDup = deCliente.filter(r => !vistos.has(r.documento));
    const rows = [...deUsuarios, ...deClienteNoDup].slice(0, 10);

    console.log(`[Clientes.search] q="${q}" → ${rows.length} resultados`);
    res.json(rows);
  } catch (error) {
    console.error("[Clientes.search] Error:", error.message);
    res.status(500).json({ error: "Error buscando clientes", detalle: error.message });
  }
};

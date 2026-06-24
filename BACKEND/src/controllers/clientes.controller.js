const db = require("../config/db");
const bcrypt = require("bcryptjs");
const EmailService = require("../services/email.service");
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

    if (documento) {
      const [rows] = await db.query("SELECT * FROM clientes WHERE NroDocumento = ?", [documento]);
      return res.json(rows);
    }

    // Incluir también usuarios con IDRol=2 que no tienen registro en clientes
    const [rows] = await db.query(`
      SELECT CAST(NroDocumento AS CHAR) AS NroDocumento, Nombre, Apellido,
             Email, Telefono, Direccion, Estado, IDRol
      FROM clientes

      UNION

      SELECT CAST(u.NumeroDocumento AS CHAR), u.NombreUsuario, u.Apellido,
             u.Email, u.Telefono, u.Direccion, u.IsActive, u.IDRol
      FROM usuarios u
      WHERE u.IDRol = 2
        AND u.NumeroDocumento IS NOT NULL
        AND u.IsActive = 1
        AND NOT EXISTS (
          SELECT 1 FROM clientes c
          WHERE CAST(c.NroDocumento AS CHAR) = CAST(u.NumeroDocumento AS CHAR)
        )
        AND NOT EXISTS (
          SELECT 1 FROM clientes c
          WHERE c.Email = u.Email
        )

      ORDER BY Nombre ASC
    `);

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

    if (!Telefono || !String(Telefono).trim()) {
      return res.status(400).json({ error: "El teléfono es obligatorio." });
    }

    if (!Direccion || !String(Direccion).trim()) {
      return res.status(400).json({ error: "La dirección es obligatoria." });
    }

    const [result] = await db.query(
      `INSERT INTO clientes (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [NroDocumento, Nombre, Apellido, Direccion || null, Email, Telefono || null, Estado || 1, IDRol || 2]
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

    // Enviar email de bienvenida en segundo plano
    if (Email) {
      EmailService.enviarBienvenida({ usuarioNombre: Nombre, usuarioEmail: Email })
        .catch(err => console.error("[Email] Error bienvenida cliente:", err.message));
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

    if (Number(Estado) === 0) {
      const [[{ total }]] = await db.query(
        "SELECT COUNT(*) AS total FROM reserva WHERE NroDocumentoCliente = ? AND IdEstadoReserva IN (1,2,5,6)",
        [id]
      );
      if (total > 0) {
        return res.status(409).json({
          error: "No se puede desactivar este cliente porque tiene reservas activas o pendientes."
        });
      }
    }

    const estadoFinal = Estado !== undefined ? Estado : 1;

    await db.query(
      `UPDATE clientes
       SET Nombre = ?, Apellido = ?, Direccion = ?, Email = ?, Telefono = ?, Estado = ?, IDRol = ?
       WHERE NroDocumento = ?`,
      [Nombre, Apellido, Direccion || null, Email, Telefono || null, estadoFinal, IDRol || 2, id]
    );

    // Sincronizar IsActive en usuarios
    await db.query(
      "UPDATE usuarios SET IsActive = ? WHERE CAST(NumeroDocumento AS CHAR) = CAST(? AS CHAR) AND IDRol IN (2, 3)",
      [estadoFinal, id]
    ).catch(() => {});

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
    // Desactivar también el usuario vinculado para que no reaparezca en el UNION del listado
    await db.query(
      "UPDATE usuarios SET IsActive = 0 WHERE CAST(NumeroDocumento AS CHAR) = CAST(? AS CHAR) AND IDRol = 2",
      [id]
    );
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

    if (Number(Estado) === 0) {
      const [[{ total }]] = await db.query(
        "SELECT COUNT(*) AS total FROM reserva WHERE NroDocumentoCliente = ? AND IdEstadoReserva IN (1,2,5,6)",
        [id]
      );
      if (total > 0) {
        return res.status(409).json({
          error: "No se puede desactivar este cliente porque tiene reservas activas o pendientes."
        });
      }
    }

    await db.query("UPDATE clientes SET Estado = ? WHERE NroDocumento = ?", [Estado, id]);

    // Sincronizar IsActive en usuarios para que el buscador de reservas también lo refleje
    await db.query(
      "UPDATE usuarios SET IsActive = ? WHERE CAST(NumeroDocumento AS CHAR) = CAST(? AS CHAR) AND IDRol IN (2, 3)",
      [Estado, id]
    ).catch(() => {});

    res.json({ mensaje: "Estado del cliente actualizado", Estado });
  } catch (error) {
    res.status(500).json({ error: "Error actualizando estado del cliente", detalle: error.message });
  }
};

/* ================= BUSCAR CLIENTES (fuente combinada: clientes + usuarios sin registro en clientes) ================= */
exports.search = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ error: "El término de búsqueda es obligatorio" });
    }

    const like = `%${q}%`;

    // Parte 1: clientes registrados en tabla clientes (Estado=1)
    // Parte 2: usuarios con IDRol=2/3 que NO tienen registro en clientes (mismo criterio que getAll)
    // Esto garantiza que el autocomplete de reservas muestra lo mismo que el módulo Clientes.
    const [rows] = await db.query(
      `SELECT
         CAST(c.NroDocumento AS CHAR)       AS documento,
         c.Nombre,
         c.Apellido,
         c.Email,
         COALESCE(u.TipoDocumento, 'CC')    AS TipoDocumento
       FROM clientes c
       LEFT JOIN usuarios u
         ON CAST(u.NumeroDocumento AS CHAR) = CAST(c.NroDocumento AS CHAR)
         AND u.IDRol IN (2, 3)
       WHERE c.Estado = 1
         AND COALESCE(u.IsActive, 1) = 1
         AND (
           c.Nombre      LIKE ? OR
           c.Apellido    LIKE ? OR
           c.Email       LIKE ? OR
           CAST(c.NroDocumento AS CHAR) LIKE ?
         )

       UNION

       SELECT
         CAST(u.NumeroDocumento AS CHAR)    AS documento,
         u.NombreUsuario                    AS Nombre,
         u.Apellido,
         u.Email,
         COALESCE(u.TipoDocumento, 'CC')    AS TipoDocumento
       FROM usuarios u
       WHERE u.IDRol IN (2, 3)
         AND u.IsActive = 1
         AND u.NumeroDocumento IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM clientes c
           WHERE CAST(c.NroDocumento AS CHAR) = CAST(u.NumeroDocumento AS CHAR)
         )
         AND NOT EXISTS (
           SELECT 1 FROM clientes c
           WHERE c.Email = u.Email
         )
         AND (
           u.NombreUsuario                      LIKE ? OR
           u.Apellido                           LIKE ? OR
           u.Email                              LIKE ? OR
           CAST(u.NumeroDocumento AS CHAR)      LIKE ?
         )

       ORDER BY Nombre ASC
       LIMIT 10`,
      [like, like, like, like, like, like, like, like]
    );

    console.log(`[Clientes.search] q="${q}" → ${rows.length} resultados`);
    res.json(rows);
  } catch (error) {
    console.error("[Clientes.search] Error:", error.message);
    res.status(500).json({ error: "Error buscando clientes", detalle: error.message });
  }
};

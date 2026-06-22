const db = require("../config/db");
const bcrypt = require("bcryptjs");
const EmailService = require("../services/email.service");

let usuariosColsPromise = null;

const getUsuariosCols = async () => {
    if (!usuariosColsPromise) {
        usuariosColsPromise = db
            .query("SHOW COLUMNS FROM `usuarios`")
            .then(([rows]) => new Set(rows.map((r) => r.Field)));
    }
    return usuariosColsPromise;
};

const getFechaRegistroExpr = (cols) => {
    const candidates = [
        "FechaRegistro",
        "FechaCreacion",
        "FechaAlta",
        "createdAt",
        "created_at",
        "CreatedAt",
    ];
    for (const col of candidates) {
        if (cols.has(col)) return `u.${col}`;
    }
    return "NULL";
};

const mapUsuario = (usuario) => {
    if (!usuario) return null;

    return {
        ...usuario,
        rol: usuario.IDRol ? {
            id: usuario.IDRol,
            nombre: usuario.NombreRol || null,
            estado: usuario.EstadoRol || null,
            activo: usuario.RolActivo ?? null,
        } : null,
    };
};

const obtenerUsuarioBase = async (id) => {
    const [rows] = await db.query(
        `SELECT u.*, r.Nombre AS NombreRol, r.Estado AS EstadoRol, r.IsActive AS RolActivo
         FROM usuarios u
         LEFT JOIN roles r ON r.IDRol = u.IDRol
         WHERE u.IDUsuario = ?
         LIMIT 1`,
        [id]
    );

    return rows[0] || null;
};

const construirFiltroBusqueda = (q) => `%${String(q || "").trim()}%`;

exports.list = async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();

        const cols = await getUsuariosCols();
        const fechaRegistroExpr = getFechaRegistroExpr(cols);

        let sql = `
            SELECT u.*, ${fechaRegistroExpr} AS fecha_registro,
                   r.Nombre AS NombreRol, r.Estado AS EstadoRol, r.IsActive AS RolActivo
            FROM usuarios u
            LEFT JOIN roles r ON r.IDRol = u.IDRol
        `;
        const params = [];

        if (q) {
            sql += `
                WHERE u.NombreUsuario LIKE ?
                   OR u.Apellido LIKE ?
                   OR u.Email LIKE ?
                   OR u.NumeroDocumento LIKE ?
            `;
            const like = construirFiltroBusqueda(q);
            params.push(like, like, like, like);
        }

        sql += " ORDER BY u.IDUsuario DESC";

        const [rows] = await db.query(sql, params);
        const usuariosMapeados = rows.map(u => ({ ...mapUsuario(u), _fuente: 'usuario' }));

        // Incluir clientes que no tienen cuenta de usuario (por email o documento)
        const [clientesRows] = await db.query(`
            SELECT c.NroDocumento, c.Nombre, c.Apellido, c.Email, c.Telefono, c.Direccion, c.Estado
            FROM clientes c
            WHERE NOT EXISTS (
                SELECT 1 FROM usuarios u
                WHERE u.Email = c.Email
                   OR (u.NumeroDocumento IS NOT NULL
                       AND CAST(u.NumeroDocumento AS CHAR) = CAST(c.NroDocumento AS CHAR))
            )
        `);

        let clientesMapeados = clientesRows.map(c => ({
            IDUsuario:              null,
            NombreUsuario:          c.Nombre || '',
            Apellido:               c.Apellido || '',
            Email:                  c.Email || '',
            TipoDocumento:          'CC',
            NumeroDocumento:        String(c.NroDocumento || ''),
            Telefono:               c.Telefono || null,
            Pais:                   null,
            Direccion:              c.Direccion || null,
            IDRol:                  2,
            IsActive:               c.Estado,
            requiereCambioPassword: 0,
            fecha_registro:         null,
            rol:                    { id: 2, nombre: 'Cliente', estado: 'Activo', activo: 1 },
            NombreRol:              'Cliente',
            EstadoRol:              'Activo',
            RolActivo:              1,
            _fuente:                'cliente',
            _clienteDoc:            String(c.NroDocumento || ''),
        }));

        if (q) {
            const like = q.toLowerCase();
            clientesMapeados = clientesMapeados.filter(c =>
                (c.NombreUsuario || '').toLowerCase().includes(like) ||
                (c.Apellido || '').toLowerCase().includes(like) ||
                (c.Email || '').toLowerCase().includes(like) ||
                String(c.NumeroDocumento || '').toLowerCase().includes(like)
            );
        }

        res.json([...usuariosMapeados, ...clientesMapeados]);
    } catch (error) {
        res.status(500).json({ error: "Error al listar usuarios", detalle: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const usuario = await obtenerUsuarioBase(req.params.id);

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(mapUsuario(usuario));
    } catch (error) {
        res.status(500).json({ error: "Error al obtener usuario", detalle: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const {
            NombreUsuario,
            Apellido,
            Email,
            Contrasena,
            TipoDocumento,
            NumeroDocumento,
            Telefono,
            Pais,
            Direccion,
            IDRol,
            IsActive,
        } = req.body;

        if (!NombreUsuario || !Email || !Contrasena) {
            return res.status(400).json({ error: "NombreUsuario, Email y Contrasena son obligatorios" });
        }

        if (Contrasena.length < 8) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
        }

        const [[dupEmail]] = await db.query(
            "SELECT IDUsuario FROM usuarios WHERE Email = ? LIMIT 1",
            [Email]
        );
        if (dupEmail) {
            return res.status(409).json({ error: `Ya existe un usuario con el correo "${Email}". Usa un correo diferente.` });
        }

        if (NumeroDocumento) {
            const [[dupDoc]] = await db.query(
                "SELECT IDUsuario FROM usuarios WHERE NumeroDocumento = ? LIMIT 1",
                [NumeroDocumento]
            );
            if (dupDoc) {
                return res.status(409).json({ error: `Ya existe un usuario con el número de documento "${NumeroDocumento}". Verifica los datos.` });
            }
        }

        const hashPass = await bcrypt.hash(Contrasena, 10);
        const rolFinal = IDRol || 2;
        const activoFinal = IsActive === false ? 0 : 1;

        const [result] = await db.query(
            `INSERT INTO usuarios
                (NombreUsuario, Apellido, Email, Contrasena, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol, IsActive, requiereCambioPassword)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                NombreUsuario,
                Apellido || null,
                Email,
                hashPass,
                TipoDocumento || null,
                NumeroDocumento || null,
                Telefono || null,
                Pais || null,
                Direccion || null,
                rolFinal,
                activoFinal,
            ]
        );

        // Enviar email de bienvenida en segundo plano
        if (Email) {
            EmailService.enviarBienvenida({ usuarioNombre: NombreUsuario, usuarioEmail: Email })
                .catch(err => console.error("[Email] Error enviando bienvenida al crear usuario:", err.message));
        }

        // U1: Si el rol es Cliente (IDRol=2) y tiene NumeroDocumento, sincronizar con tabla clientes
        if (Number(rolFinal) === 2 && NumeroDocumento) {
            await db.query(
                `INSERT INTO clientes (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 2)
                 ON DUPLICATE KEY UPDATE
                   Nombre = VALUES(Nombre),
                   Apellido = VALUES(Apellido),
                   Direccion = VALUES(Direccion),
                   Email = VALUES(Email),
                   Telefono = VALUES(Telefono),
                   Estado = VALUES(Estado)`,
                [NumeroDocumento, NombreUsuario, Apellido || '', Direccion || null, Email, Telefono || null, activoFinal]
            );
        }

        const usuario = await obtenerUsuarioBase(result.insertId);
        res.status(201).json({ mensaje: "Usuario creado", usuario: mapUsuario(usuario) });
    } catch (error) {
        res.status(500).json({ error: "Error al crear usuario", detalle: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const usuarioId = Number(req.params.id);

        if (usuarioId === 1) {
            return res.status(403).json({ error: "No se puede modificar al Super Usuario" });
        }

        const camposPermitidos = [
            "NombreUsuario",
            "Apellido",
            "Email",
            "Contrasena",
            "TipoDocumento",
            "NumeroDocumento",
            "Telefono",
            "Pais",
            "Direccion",
            "IDRol",
            "IsActive",
        ];

        if (req.body.Email) {
            const [[dupEmail]] = await db.query(
                "SELECT IDUsuario FROM usuarios WHERE Email = ? AND IDUsuario != ? LIMIT 1",
                [req.body.Email, usuarioId]
            );
            if (dupEmail) {
                return res.status(409).json({ error: `Ya existe otro usuario con el correo "${req.body.Email}". Usa un correo diferente.` });
            }
        }

        if (req.body.NumeroDocumento) {
            const [[dupDoc]] = await db.query(
                "SELECT IDUsuario FROM usuarios WHERE NumeroDocumento = ? AND IDUsuario != ? LIMIT 1",
                [req.body.NumeroDocumento, usuarioId]
            );
            if (dupDoc) {
                return res.status(409).json({ error: `Ya existe otro usuario con el número de documento "${req.body.NumeroDocumento}".` });
            }
        }

        const asignaciones = [];
        const valores = [];

        for (const campo of camposPermitidos) {
            if (req.body[campo] !== undefined && req.body[campo] !== null && req.body[campo] !== "") {
                let valor = req.body[campo];
                if (campo === "Contrasena") {
                    if (String(valor).length < 8) {
                        return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
                    }
                    valor = await bcrypt.hash(String(valor), 10);
                    // Al actualizar contraseña manualmente, limpiar el flag
                    asignaciones.push("requiereCambioPassword = 0");
                }
                asignaciones.push(`${campo} = ?`);
                valores.push(valor);
            }
        }

        if (!asignaciones.length) {
            return res.status(400).json({ error: "No hay datos para actualizar" });
        }

        valores.push(usuarioId);
        await db.query(`UPDATE usuarios SET ${asignaciones.join(", ")} WHERE IDUsuario = ?`, valores);

        const usuario = await obtenerUsuarioBase(usuarioId);
        res.json({ mensaje: "Usuario actualizado", usuario: mapUsuario(usuario) });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar usuario", detalle: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const usuarioId = Number(req.params.id);

        if (usuarioId === 1) {
            return res.status(403).json({ error: "No se puede eliminar al Super Usuario" });
        }

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM reserva r
             INNER JOIN usuarios u ON CAST(u.NumeroDocumento AS CHAR) = CAST(r.NroDocumentoCliente AS CHAR)
             WHERE u.IDUsuario = ?`,
            [usuarioId]
        );
        if (total > 0) {
            return res.status(409).json({
                error: "No se puede eliminar este usuario porque tiene reservas registradas en el sistema."
            });
        }

        await db.query("DELETE FROM usuarios WHERE IDUsuario = ?", [usuarioId]);
        res.json({ mensaje: "Usuario eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar usuario", detalle: error.message });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const usuarioId = Number(req.params.id);
        const { isActive } = req.body;

        if (usuarioId === 1) {
            return res.status(403).json({ error: "No se puede cambiar el estado del Super Usuario" });
        }

        if (typeof isActive !== "boolean") {
            return res.status(400).json({ error: "El campo isActive debe ser booleano" });
        }

        if (!isActive) {
            const [[{ total }]] = await db.query(
                `SELECT COUNT(*) AS total FROM reserva r
                 INNER JOIN usuarios u ON CAST(u.NumeroDocumento AS CHAR) = CAST(r.NroDocumentoCliente AS CHAR)
                 WHERE u.IDUsuario = ? AND r.IdEstadoReserva IN (1,2,5,6)`,
                [usuarioId]
            );
            if (total > 0) {
                return res.status(409).json({
                    error: "No se puede desactivar este usuario porque tiene reservas activas o pendientes."
                });
            }
        }

        await db.query("UPDATE usuarios SET IsActive = ? WHERE IDUsuario = ?", [isActive ? 1 : 0, usuarioId]);
        const usuario = await obtenerUsuarioBase(usuarioId);
        res.json({ mensaje: "Estado actualizado", usuario: mapUsuario(usuario) });
    } catch (error) {
        res.status(500).json({ error: "Error al cambiar estado del usuario", detalle: error.message });
    }
};

exports.search = async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();

        if (!q) {
            return res.status(400).json({ error: "El término de búsqueda es obligatorio" });
        }

        const like = construirFiltroBusqueda(q);
        const cols = await getUsuariosCols();
        const fechaRegistroExpr = getFechaRegistroExpr(cols);
        const [rows] = await db.query(
            `SELECT u.*, ${fechaRegistroExpr} AS fecha_registro,
                    r.Nombre AS NombreRol, r.Estado AS EstadoRol, r.IsActive AS RolActivo
             FROM usuarios u
             LEFT JOIN roles r ON r.IDRol = u.IDRol
             WHERE u.NombreUsuario LIKE ?
                OR u.Apellido LIKE ?
                OR u.Email LIKE ?
                OR u.NumeroDocumento LIKE ?
             ORDER BY u.IDUsuario DESC`,
            [like, like, like, like]
        );

        res.json(rows.map(mapUsuario));
    } catch (error) {
        res.status(500).json({ error: "Error al buscar usuarios", detalle: error.message });
    }
};
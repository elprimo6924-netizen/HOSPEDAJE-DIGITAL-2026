const db = require("../config/db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const EmailService = require("../services/email.service");

exports.login = async (req, res) => {

    try {

        const { Email, Contrasena } = req.body;

        const [usuarios] = await db.query(
            "SELECT * FROM Usuarios WHERE Email = ?",
            [Email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                error: "Usuario no encontrado"
            });
        }

        const usuario = usuarios[0];

        // Comparación directa (sin bcrypt)
        if (usuario.Contrasena !== Contrasena) {
            return res.status(401).json({
                error: "Contraseña incorrecta"
            });
        }

        const token = jwt.sign(
            {
                id: usuario.IDUsuario,
                rol: usuario.IDRol
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            mensaje: "Login exitoso",
            token,
            usuario: {
                id: usuario.IDUsuario,
                nombre: usuario.NombreUsuario,
                rol: usuario.IDRol
            }
        });

    } catch (error) {

        res.status(500).json({
            error: "Error en login",
            detalle: error.message
        });

    }

};

exports.perfil = async (req, res) => {

    try {

        const { id } = req.usuario;

        const [usuarios] = await db.query(
            `SELECT
                u.IDUsuario,
                u.NombreUsuario,
                u.Apellido,
                u.Email,
                u.TipoDocumento,
                u.NumeroDocumento,
                u.Telefono,
                u.Pais,
                u.Direccion,
                u.IDRol,
                r.Nombre AS NombreRol,
                r.Estado AS EstadoRol
             FROM usuarios u
             LEFT JOIN roles r ON r.IDRol = u.IDRol
             WHERE u.IDUsuario = ?
             LIMIT 1`,
            [id]
        );

        if (!usuarios.length) {
            return res.status(404).json({
                error: "Usuario no encontrado"
            });
        }

        const usuario = usuarios[0];

        const [permisos] = await db.query(
            `SELECT
                p.IDPermiso,
                p.NombrePermisos,
                p.EstadoPermisos,
                p.Descripcion
             FROM rolespermisos rp
             INNER JOIN permisos p ON p.IDPermiso = rp.IDPermiso
             WHERE rp.IDRol = ?
             ORDER BY p.NombrePermisos ASC`,
            [usuario.IDRol]
        );

        res.json({
            usuario: {
                id: usuario.IDUsuario,
                nombre: usuario.NombreUsuario,
                apellido: usuario.Apellido,
                email: usuario.Email,
                tipoDocumento: usuario.TipoDocumento,
                numeroDocumento: usuario.NumeroDocumento,
                telefono: usuario.Telefono,
                pais: usuario.Pais,
                direccion: usuario.Direccion,
                rol: {
                    id: usuario.IDRol,
                    nombre: usuario.NombreRol,
                    estado: usuario.EstadoRol
                },
                permisos: permisos.map((permiso) => ({
                    id: permiso.IDPermiso,
                    nombre: permiso.NombrePermisos,
                    estado: permiso.EstadoPermisos,
                    descripcion: permiso.Descripcion
                }))
            }
        });

    } catch (error) {

        res.status(500).json({
            error: "Error obteniendo perfil",
            detalle: error.message
        });

    }

};

exports.actualizarPerfil = async (req, res) => {

    try {

        const { id } = req.usuario;
        const {
            NombreUsuario,
            Apellido,
            Email,
            TipoDocumento,
            NumeroDocumento,
            Telefono,
            Pais,
            Direccion
        } = req.body;

        await db.query(
            `UPDATE usuarios
             SET NombreUsuario = ?, Apellido = ?, Email = ?, TipoDocumento = ?, NumeroDocumento = ?, Telefono = ?, Pais = ?, Direccion = ?
             WHERE IDUsuario = ?`,
            [
                NombreUsuario,
                Apellido,
                Email,
                TipoDocumento,
                NumeroDocumento,
                Telefono,
                Pais,
                Direccion,
                id
            ]
        );

        const [usuarios] = await db.query(
            `SELECT
                u.IDUsuario,
                u.NombreUsuario,
                u.Apellido,
                u.Email,
                u.TipoDocumento,
                u.NumeroDocumento,
                u.Telefono,
                u.Pais,
                u.Direccion,
                u.IDRol,
                r.Nombre AS NombreRol,
                r.Estado AS EstadoRol
             FROM usuarios u
             LEFT JOIN roles r ON r.IDRol = u.IDRol
             WHERE u.IDUsuario = ?
             LIMIT 1`,
            [id]
        );

        const usuario = usuarios[0];

        const [permisos] = await db.query(
            `SELECT
                p.IDPermiso,
                p.NombrePermisos,
                p.EstadoPermisos,
                p.Descripcion
             FROM rolespermisos rp
             INNER JOIN permisos p ON p.IDPermiso = rp.IDPermiso
             WHERE rp.IDRol = ?
             ORDER BY p.NombrePermisos ASC`,
            [usuario.IDRol]
        );

        res.json({
            mensaje: "Perfil actualizado correctamente",
            usuario: {
                id: usuario.IDUsuario,
                nombre: usuario.NombreUsuario,
                apellido: usuario.Apellido,
                email: usuario.Email,
                tipoDocumento: usuario.TipoDocumento,
                numeroDocumento: usuario.NumeroDocumento,
                telefono: usuario.Telefono,
                pais: usuario.Pais,
                direccion: usuario.Direccion,
                rol: {
                    id: usuario.IDRol,
                    nombre: usuario.NombreRol,
                    estado: usuario.EstadoRol
                },
                permisos: permisos.map((permiso) => ({
                    id: permiso.IDPermiso,
                    nombre: permiso.NombrePermisos,
                    estado: permiso.EstadoPermisos,
                    descripcion: permiso.Descripcion
                }))
            }
        });

    } catch (error) {

        res.status(500).json({
            error: "Error actualizando perfil",
            detalle: error.message
        });

    }

};

exports.register = async (req, res) => {
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
        } = req.body;

        if (!NombreUsuario || !Email || !Contrasena) {
            return res.status(400).json({ error: 'NombreUsuario, Email y Contrasena son obligatorios' });
        }

        // Verificar si ya existe un usuario con el mismo email o número de documento
        const [existing] = await db.query(
            'SELECT IDUsuario FROM usuarios WHERE Email = ? OR NumeroDocumento = ? LIMIT 1',
            [Email, NumeroDocumento]
        );

        if (existing && existing.length) {
            return res.status(409).json({ error: 'Ya existe un usuario con ese correo o documento' });
        }

        const [result] = await db.query(
            `INSERT INTO usuarios
                (NombreUsuario, Apellido, Email, Contrasena, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol, IsActive)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                NombreUsuario,
                Apellido || null,
                Email,
                Contrasena,
                TipoDocumento || null,
                NumeroDocumento || null,
                Telefono || null,
                Pais || null,
                Direccion || null,
                IDRol || 2,
                1,
            ]
        );

        res.status(201).json({ 
            success: true,
            mensaje: 'Usuario registrado exitosamente',
            usuario: {
                id: result.insertId,
                nombre: NombreUsuario,
                email: Email,
                rol: IDRol || 2
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al registrar usuario', detalle: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { Email } = req.body;

        if (!Email) {
            return res.status(400).json({ error: "Email es obligatorio" });
        }

        const [usuarios] = await db.query(
            "SELECT IDUsuario, NombreUsuario, Email FROM usuarios WHERE Email = ? LIMIT 1",
            [Email]
        );

        if (!usuarios.length) {
            return res.json({
                success: true,
                mensaje: "Si el correo está registrado, recibirás una contraseña temporal en tu bandeja de entrada."
            });
        }

        const usuario = usuarios[0];
        const nuevaContrasena = crypto.randomBytes(4).toString("hex");

        await db.query(
            "UPDATE usuarios SET Contrasena = ? WHERE IDUsuario = ?",
            [nuevaContrasena, usuario.IDUsuario]
        );

        const correoEnviado = await EmailService.enviarRecuperacionContrasena({
            usuarioNombre: usuario.NombreUsuario,
            usuarioEmail: usuario.Email,
            nuevaContrasena
        });

        if (!correoEnviado) {
            return res.status(500).json({
                success: false,
                error: "No se pudo enviar el correo de recuperación"
            });
        }

        return res.json({
            success: true,
            mensaje: "Se envió una contraseña temporal al correo registrado."
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Error al recuperar la contraseña",
            detalle: error.message
        });
    }
};
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const EmailService = require("../services/email.service");
const { login: loginService } = require("../services/auth.services");

exports.login = async (req, res) => {

    try {

        const { Email, Contrasena } = req.body;
        const result = await loginService(Email, Contrasena);

        if (result.error) {
            return res.status(401).json({ error: result.error });
        }

        res.json({
            mensaje: "Login exitoso",
            token: result.token,
            usuario: result.usuario
        });

    } catch (error) {
        console.error("CRITICAL LOGIN ERROR:", error);
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
        const NombreUsuario = req.body.NombreUsuario || req.body.Nombre;

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

        const hashPass = await bcrypt.hash(Contrasena, 10);

        const [result] = await db.query(
            `INSERT INTO usuarios
                (NombreUsuario, Apellido, Email, Contrasena, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol, IsActive, requiereCambioPassword)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
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
                IDRol || 2,
                1,
            ]
        );

        // REG1: Send welcome email in background
        EmailService.enviarBienvenida({ usuarioNombre: NombreUsuario, usuarioEmail: Email })
            .catch(err => console.error("Error enviando bienvenida:", err.message));

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
        console.error('[REGISTER ERROR]', error.code, error.message);
        const esDuplicado = error.code === 'ER_DUP_ENTRY';
        const esFKFaltante = error.code === 'ER_NO_REFERENCED_ROW_2';
        const esColumnaInvalida = error.code === 'ER_BAD_FIELD_ERROR';
        let mensaje = 'Error al registrar usuario';
        if (esDuplicado) mensaje = 'Ya existe un usuario con ese correo o documento.';
        else if (esFKFaltante) mensaje = 'El rol especificado no existe. Contacte al administrador.';
        else if (esColumnaInvalida) mensaje = 'Error de configuración en base de datos: ' + error.message;
        res.status(esDuplicado || esFKFaltante ? 409 : 500).json({ success: false, error: mensaje, detalle: error.message });
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
        const hashTemp = await bcrypt.hash(nuevaContrasena, 10);

        await db.query(
            "UPDATE usuarios SET Contrasena = ?, requiereCambioPassword = 1 WHERE IDUsuario = ?",
            [hashTemp, usuario.IDUsuario]
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
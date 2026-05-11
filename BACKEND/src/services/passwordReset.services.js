/**
 * Servicio para manejar la lógica de recuperación de contraseña
 */

const database = require("../database/connection");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("./email.services");

/**
 * Genera un código de 6 dígitos aleatorio
 */
const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Genera un token único
 */
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Step 1: Usuario solicita recuperar contraseña (envía email)
 * @param {string} email - Email del usuario
 */
const requestPasswordReset = async (email) => {
    try {
        // 1. Verificar que el email existe
        const [users] = await database.query(
            "SELECT IDUsuario FROM Usuarios WHERE Email = ?",
            [email]
        );

        if (users.length === 0) {
            // Por seguridad, no revelar si el email existe o no
            return { success: true, message: "Si el email existe, recibirá un código de recuperación" };
        }

        // 2. Generar código de 6 dígitos
        const code = generateCode();

        // 3. Calcular expiración (30 minutos)
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        // 4. Guardar en BD (limpiar códigos previos expirados)
        await database.query(
            "DELETE FROM PasswordResets WHERE Email = ? AND ExpiresAt < NOW()",
            [email]
        );

        await database.query(
            "INSERT INTO PasswordResets (Email, Code, ExpiresAt) VALUES (?, ?, ?)",
            [email, code, expiresAt]
        );

        // 5. Enviar email con código
        await sendPasswordResetEmail(email, code);

        return { 
            success: true, 
            message: "Si el email existe, recibirá un código de recuperación",
            expiresAt
        };
    } catch (error) {
        console.error("Error en requestPasswordReset:", error);
        throw error;
    }
};

/**
 * Step 2: Usuario verifica el código de 6 dígitos
 * @param {string} email - Email del usuario
 * @param {string} code - Código de 6 dígitos
 */
const verifyCode = async (email, code) => {
    try {
        // 1. Buscar el código válido (no expirado, no usado)
        const [reset] = await database.query(
            "SELECT IDReset FROM PasswordResets WHERE Email = ? AND Code = ? AND ExpiresAt > NOW() AND UsedAt IS NULL LIMIT 1",
            [email, code]
        );

        if (reset.length === 0) {
            return { 
                success: false, 
                error: "Código inválido o expirado" 
            };
        }

        // 2. Generar token temporal único
        const token = generateToken();

        // 3. Guardar token en BD (válido por 15 minutos más)
        const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await database.query(
            "UPDATE PasswordResets SET Token = ?, ExpiresAt = ? WHERE IDReset = ?",
            [token, tokenExpiresAt, reset[0].IDReset]
        );

        return { 
            success: true, 
            token,
            message: "Código verificado. Usa el token para cambiar tu contraseña"
        };
    } catch (error) {
        console.error("Error en verifyCode:", error);
        throw error;
    }
};

/**
 * Step 3: Usuario cambia su contraseña
 * @param {string} token - Token generado en el paso 2
 * @param {string} newPassword - Nueva contraseña
 */
const resetPassword = async (token, newPassword) => {
    try {
        // 1. Buscar el token válido
        const [reset] = await database.query(
            "SELECT IDReset, Email FROM PasswordResets WHERE Token = ? AND ExpiresAt > NOW() AND UsedAt IS NULL LIMIT 1",
            [token]
        );

        if (reset.length === 0) {
            return { 
                success: false, 
                error: "Token inválido o expirado" 
            };
        }

        const { IDReset, Email } = reset[0];

        // 2. Actualizar contraseña del usuario
        await database.query(
            "UPDATE Usuarios SET Contrasena = ? WHERE Email = ?",
            [newPassword, Email]
        );

        // 3. Marcar token como usado
        await database.query(
            "UPDATE PasswordResets SET UsedAt = NOW() WHERE IDReset = ?",
            [IDReset]
        );

        return { 
            success: true, 
            message: "Contraseña cambiada exitosamente. Ya puedes iniciar sesión" 
        };
    } catch (error) {
        console.error("Error en resetPassword:", error);
        throw error;
    }
};

module.exports = {
    requestPasswordReset,
    verifyCode,
    resetPassword
};

/**
 * Servicio para manejar la lógica de recuperación de contraseña
 */

const database = require("../database/connection");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { sendPasswordResetEmail } = require("./email.services");

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Formatea un JS Date como string MySQL en UTC, independiente de la timezone del proceso.
 * Evita el problema de que mysql2 (sin opción timezone) serializa fechas en hora local,
 * mientras que NOW() usa la timezone del servidor MySQL — diferencia que hace que
 * ExpiresAt > NOW() falle siempre aunque el código sea correcto.
 */
const toUTCDatetime = (d) =>
    d.toISOString().slice(0, 19).replace('T', ' ');

/**
 * Step 1: Usuario solicita recuperar contraseña (envía email)
 * @param {string} email - Email del usuario
 */
const requestPasswordReset = async (email) => {
    try {
        const emailNorm = email.trim();

        const [users] = await database.query(
            "SELECT IDUsuario FROM usuarios WHERE Email = ?",
            [emailNorm]
        );

        if (users.length === 0) {
            return { success: false, error: "No existe ninguna cuenta asociada a ese correo electrónico." };
        }

        const code = generateCode();
        const expiresAt = toUTCDatetime(new Date(Date.now() + 30 * 60 * 1000));

        console.log(`[PwdReset] Código generado para ${emailNorm}: ${code} | expira UTC: ${expiresAt}`);

        // Eliminar TODOS los códigos previos del email (no solo los expirados)
        // para evitar que un código viejo bloquee la validación del nuevo
        await database.query(
            "DELETE FROM passwordresets WHERE Email = ?",
            [emailNorm]
        );

        await database.query(
            "INSERT INTO passwordresets (Email, Code, ExpiresAt) VALUES (?, ?, ?)",
            [emailNorm, code, expiresAt]
        );

        console.log(`[PwdReset] Código insertado en BD. Enviando email...`);

        await sendPasswordResetEmail(emailNorm, code);

        return {
            success: true,
            message: "Si el email existe, recibirá un código de recuperación",
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
        const emailNorm = email.trim();
        const codeNorm  = code.toString().trim();

        console.log(`[PwdReset] Verificando código para ${emailNorm}: "${codeNorm}" (longitud=${codeNorm.length})`);

        // Usar UTC_TIMESTAMP() para comparar contra las fechas UTC almacenadas
        // ORDER BY IDReset DESC garantiza que si hay varios registros, se evalúa el más reciente
        const [reset] = await database.query(
            `SELECT IDReset FROM passwordresets
             WHERE Email = ? AND Code = ? AND ExpiresAt > UTC_TIMESTAMP() AND UsedAt IS NULL
             ORDER BY IDReset DESC LIMIT 1`,
            [emailNorm, codeNorm]
        );

        console.log(`[PwdReset] Filas encontradas: ${reset.length}`);

        if (reset.length === 0) {
            // Log de depuración: muestra qué hay en la BD para este email
            const [debug] = await database.query(
                `SELECT IDReset, Code, ExpiresAt, UTC_TIMESTAMP() AS utcAhora, UsedAt
                 FROM passwordresets WHERE Email = ? ORDER BY IDReset DESC LIMIT 3`,
                [emailNorm]
            );
            console.log(`[PwdReset] DEBUG - registros en BD:`, JSON.stringify(debug));

            return { success: false, error: "Código inválido o expirado" };
        }

        const token = generateToken();
        const tokenExpiresAt = toUTCDatetime(new Date(Date.now() + 15 * 60 * 1000));

        await database.query(
            "UPDATE passwordresets SET Token = ?, ExpiresAt = ? WHERE IDReset = ?",
            [token, tokenExpiresAt, reset[0].IDReset]
        );

        console.log(`[PwdReset] Código válido. Token generado para ${emailNorm}`);

        return {
            success: true,
            token,
            message: "Código verificado. Usa el token para cambiar tu contraseña",
        };
    } catch (error) {
        console.error("Error en verifyCode:", error);
        throw error;
    }
};

/**
 * Step 3: Usuario cambia su contraseña
 * @param {string} token - Token generado en el paso 2
 * @param {string} newPassword - Nueva contraseña en texto plano
 */
const resetPassword = async (token, newPassword) => {
    try {
        const [reset] = await database.query(
            `SELECT IDReset, Email FROM passwordresets
             WHERE Token = ? AND ExpiresAt > UTC_TIMESTAMP() AND UsedAt IS NULL LIMIT 1`,
            [token]
        );

        if (reset.length === 0) {
            return { success: false, error: "Token inválido o expirado" };
        }

        const { IDReset, Email } = reset[0];

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await database.query(
            "UPDATE usuarios SET Contrasena = ? WHERE Email = ?",
            [hashedPassword, Email]
        );

        await database.query(
            "UPDATE passwordresets SET UsedAt = UTC_TIMESTAMP() WHERE IDReset = ?",
            [IDReset]
        );

        console.log(`[PwdReset] Contraseña restablecida exitosamente para ${Email}`);

        return {
            success: true,
            message: "Contraseña cambiada exitosamente. Ya puedes iniciar sesión",
        };
    } catch (error) {
        console.error("Error en resetPassword:", error);
        throw error;
    }
};

module.exports = {
    requestPasswordReset,
    verifyCode,
    resetPassword,
};

/**
 * Controlador para recuperación de contraseña
 */

const {
    requestPasswordReset,
    verifyCode,
    resetPassword
} = require("../services/passwordReset.services");

/**
 * POST /api/auth/forgot-password
 * Paso 1: Usuario solicita recuperar contraseña
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Validar email
        if (!email || email.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "El email es requerido"
            });
        }

        const result = await requestPasswordReset(email);
        
        res.status(200).json(result);
    } catch (error) {
        console.error("Error en forgotPassword:", error);
        res.status(500).json({
            success: false,
            error: "Error al procesar la solicitud de recuperación"
        });
    }
};

/**
 * POST /api/auth/verify-code
 * Paso 2: Usuario verifica el código de 6 dígitos
 */
const verifyPasswordCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        // Validar entrada
        if (!email || email.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "El email es requerido"
            });
        }

        if (!code || code.toString().trim() === "") {
            return res.status(400).json({
                success: false,
                error: "El código es requerido"
            });
        }

        if (code.toString().length !== 6) {
            return res.status(400).json({
                success: false,
                error: "El código debe tener 6 dígitos"
            });
        }

        const result = await verifyCode(email, code);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error en verifyPasswordCode:", error);
        res.status(500).json({
            success: false,
            error: "Error al verificar el código"
        });
    }
};

/**
 * POST /api/auth/reset-password
 * Paso 3: Usuario cambia su contraseña
 */
const changePassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Validar entrada
        if (!token || token.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "El token es requerido"
            });
        }

        if (!newPassword || newPassword.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "La nueva contraseña es requerida"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: "La contraseña debe tener al menos 6 caracteres"
            });
        }

        const result = await resetPassword(token, newPassword);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error en changePassword:", error);
        res.status(500).json({
            success: false,
            error: "Error al cambiar la contraseña"
        });
    }
};

module.exports = {
    forgotPassword,
    verifyPasswordCode,
    changePassword
};

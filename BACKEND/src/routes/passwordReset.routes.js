/**
 * Rutas para recuperación de contraseña
 */

const express = require("express");
const router = express.Router();

const {
    forgotPassword,
    verifyPasswordCode,
    changePassword
} = require("../controllers/passwordReset.controller");

/**
 * POST /api/password-reset/forgot-password
 * Solicitar código de recuperación
 */
router.post("/forgot-password", forgotPassword);

/**
 * POST /api/password-reset/verify-code
 * Verificar código y obtener token
 */
router.post("/verify-code", verifyPasswordCode);

/**
 * POST /api/password-reset/reset-password
 * Cambiar contraseña con token
 */
router.post("/reset-password", changePassword);

module.exports = router;

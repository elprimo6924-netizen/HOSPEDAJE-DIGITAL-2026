const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const verificarToken = require("../middlewares/auth.middleware");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/forgot-password", authController.forgotPassword);
router.get("/me", verificarToken, authController.perfil);
router.put("/me", verificarToken, authController.actualizarPerfil);

module.exports = router;
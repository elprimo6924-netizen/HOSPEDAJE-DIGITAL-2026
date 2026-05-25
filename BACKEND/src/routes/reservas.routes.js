const express = require("express");
const router = express.Router();

const reservasController = require("../controllers/reservas.controller");
const {
	requireAdmin,
	requireReservaOwnerOrAdmin,
} = require("../middlewares/authorization.middleware");

router.get("/", reservasController.obtener);
router.get("/mis-reservas", reservasController.obtenerMisReservas);
router.get("/:id", requireReservaOwnerOrAdmin, reservasController.obtenerPorId);
router.post("/", reservasController.crear);

// ✅ Ruta que tu frontend está llamando
router.put("/:id/cancelar", requireReservaOwnerOrAdmin, reservasController.cancelar);

// (Opcional) por si luego usas editar
router.put("/:id", requireAdmin, reservasController.actualizar);

// Eliminar reserva (borra el registro de la BD)
router.delete("/:id", requireAdmin, reservasController.eliminar);

module.exports = router;
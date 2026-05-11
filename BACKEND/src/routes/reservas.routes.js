const express = require("express");
const router = express.Router();

const reservasController = require("../controllers/reservas.controller");

router.get("/", reservasController.obtener);
router.post("/", reservasController.crear);

// ✅ Ruta que tu frontend está llamando
router.put("/:id/cancelar", reservasController.cancelar);

// (Opcional) por si luego usas editar
router.put("/:id", reservasController.actualizar);

// Eliminar reserva (borra el registro de la BD)
router.delete("/:id", reservasController.eliminar);

module.exports = router;
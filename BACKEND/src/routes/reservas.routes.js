const express = require("express");
const router = express.Router();

const reservasController          = require("../controllers/reservas.controller");
const uploadComprobante           = require("../middlewares/uploadComprobante.middleware");
const {
	requireAdmin,
	requireReservaOwnerOrAdmin,
} = require("../middlewares/authorization.middleware");

router.get("/",              reservasController.obtener);
router.get("/cotizar",       reservasController.cotizar);
router.get("/mis-reservas",  reservasController.obtenerMisReservas);
router.get("/disponibilidad",           reservasController.getDisponibilidad);
router.get("/comprobantes-pendientes", requireAdmin, reservasController.getComprobantesPendientes);
router.post("/sync-estados",           requireAdmin, reservasController.syncEstados);
router.get("/:id", requireReservaOwnerOrAdmin, reservasController.obtenerPorId);
router.post("/", reservasController.crear);

// ✅ Ruta que tu frontend está llamando
router.put("/:id/cancelar", requireReservaOwnerOrAdmin, reservasController.cancelar);

// (Opcional) por si luego usas editar
router.put("/:id", requireAdmin, reservasController.actualizar);

// Comprobante de pago
router.post("/:id/comprobante",           requireReservaOwnerOrAdmin, uploadComprobante, reservasController.subirComprobante);
router.put("/:id/comprobante/verificar",  requireAdmin,               reservasController.verificarComprobante);

// Agregar servicios adicionales a una reserva existente (admin o dueño)
router.post("/:id/servicios", requireReservaOwnerOrAdmin, reservasController.agregarServicios);

// Extender días de una reserva de habitación (admin o dueño)
router.put("/:id/extender-dias", requireReservaOwnerOrAdmin, reservasController.extenderDias);

// Eliminar reserva (borra el registro de la BD)
router.delete("/:id", requireAdmin, reservasController.eliminar);

module.exports = router;
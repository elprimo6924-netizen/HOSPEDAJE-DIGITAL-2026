const express = require("express");
const router = express.Router();
const habitacionesController = require("../controllers/habitaciones.controller");
const { requireAdmin } = require("../middlewares/authorization.middleware");

router.get("/", habitacionesController.getAll);
router.get("/disponibles", habitacionesController.disponibles);
router.get("/buscar", habitacionesController.buscar);
router.post("/", requireAdmin, habitacionesController.create);
router.put("/:id", requireAdmin, habitacionesController.update);
router.delete("/:id", requireAdmin, habitacionesController.remove);
router.patch("/:id/estado", requireAdmin, habitacionesController.toggleEstado);

module.exports = router;

const express = require("express");
const router = express.Router();
const habitacionesController = require("../controllers/habitaciones.controller");

router.get("/", habitacionesController.getAll);
router.get("/disponibles", habitacionesController.disponibles);
router.get("/buscar", habitacionesController.buscar);
router.post("/", habitacionesController.create);
router.put("/:id", habitacionesController.update);
router.delete("/:id", habitacionesController.remove);
router.patch("/:id/estado", habitacionesController.toggleEstado);

module.exports = router;

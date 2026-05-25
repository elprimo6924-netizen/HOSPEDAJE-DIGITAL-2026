const express = require("express");

const router = express.Router();

const ServiciosController = require("../controllers/servicios.controller");
const { requireAdmin } = require("../middlewares/authorization.middleware");

router.get("/", ServiciosController.listar);
router.get("/activos", ServiciosController.listarActivos);

router.get("/:id", ServiciosController.obtener);

router.post("/", requireAdmin, ServiciosController.crear);

router.put("/:id", requireAdmin, ServiciosController.actualizar);

router.delete("/:id", requireAdmin, ServiciosController.eliminar);

router.patch("/:id/estado", requireAdmin, ServiciosController.toggleEstado);

module.exports = router;
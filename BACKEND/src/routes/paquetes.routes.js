const express = require("express");

const router = express.Router();

const PaquetesController = require("../controllers/paquetes.controller");
const { requireAdmin } = require("../middlewares/authorization.middleware");

router.get("/", PaquetesController.listar);
router.get("/activos", PaquetesController.listarActivos);

router.get("/:id", PaquetesController.obtener);

router.post("/", requireAdmin, PaquetesController.crear);

router.put("/:id", requireAdmin, PaquetesController.actualizar);

router.delete("/:id", requireAdmin, PaquetesController.eliminar);

module.exports = router;
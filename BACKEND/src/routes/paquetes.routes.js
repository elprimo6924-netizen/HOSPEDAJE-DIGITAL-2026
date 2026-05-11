const express = require("express");

const router = express.Router();

const PaquetesController = require("../controllers/paquetes.controller");

router.get("/", PaquetesController.listar);

router.get("/:id", PaquetesController.obtener);

router.post("/", PaquetesController.crear);

router.put("/:id", PaquetesController.actualizar);

router.delete("/:id", PaquetesController.eliminar);

module.exports = router;
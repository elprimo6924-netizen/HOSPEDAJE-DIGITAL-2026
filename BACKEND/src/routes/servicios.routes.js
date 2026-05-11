const express = require("express");

const router = express.Router();

const ServiciosController = require("../controllers/servicios.controller");

router.get("/", ServiciosController.listar);

router.get("/:id", ServiciosController.obtener);

router.post("/", ServiciosController.crear);

router.put("/:id", ServiciosController.actualizar);

router.delete("/:id", ServiciosController.eliminar);

router.patch("/:id/estado", ServiciosController.toggleEstado);

module.exports = router;
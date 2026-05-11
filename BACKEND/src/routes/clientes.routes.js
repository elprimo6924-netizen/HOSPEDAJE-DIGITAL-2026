const express = require("express");
const router = express.Router();
const clientesController = require("../controllers/clientes.controller");

router.get("/", clientesController.getAll);
router.get("/search", clientesController.search);
router.get("/buscar", clientesController.buscarPorDocumento);
router.get("/:id", clientesController.obtenerPorId);
router.post("/", clientesController.create);
router.put("/:id", clientesController.update);
router.delete("/:id", clientesController.remove);
router.patch("/:id/estado", clientesController.toggleEstado);

module.exports = router;

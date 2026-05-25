const express = require("express");
const router = express.Router();
const clientesController = require("../controllers/clientes.controller");
const { requireAdmin } = require("../middlewares/authorization.middleware");

router.get("/", clientesController.getAll);
router.get("/activos", requireAdmin, clientesController.getActivos);
router.get("/search", requireAdmin, clientesController.search);
router.get("/buscar", clientesController.buscarPorDocumento);
router.get("/:id", clientesController.obtenerPorId);
router.post("/", requireAdmin, clientesController.create);
router.put("/:id", requireAdmin, clientesController.update);
router.delete("/:id", requireAdmin, clientesController.remove);
router.patch("/:id/estado", requireAdmin, clientesController.toggleEstado);

module.exports = router;

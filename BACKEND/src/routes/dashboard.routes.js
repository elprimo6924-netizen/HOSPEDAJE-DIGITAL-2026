const express = require("express");
const router  = express.Router();

const dashboardController = require("../controllers/dashboard.controller");
const verifyToken         = require("../middlewares/auth.middleware");
const { requireAdmin }    = require("../middlewares/authorization.middleware");

router.get("/estadisticas",   dashboardController.estadisticas);
router.get("/exportar-excel", verifyToken, requireAdmin, dashboardController.exportarExcel);

module.exports = router;
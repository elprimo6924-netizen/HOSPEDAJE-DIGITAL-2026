const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");

router.get("/estadisticas", dashboardController.estadisticas);

module.exports = router;
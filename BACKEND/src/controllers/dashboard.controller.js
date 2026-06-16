const DashboardService  = require("../services/dashboard.service");
const { generarReporteExcel } = require("../services/reporteExcel");

const estadisticas = async (req, res) => {

    try {

        const data = await DashboardService.estadisticas();

        res.json(data);

    } catch (error) {

        res.status(500).json({
            error: "Error obteniendo estadísticas",
            detalle: error.message
        });

    }

};

const exportarExcel = async (req, res) => {
    try {
        await generarReporteExcel(res);
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ error: "Error generando reporte Excel", detalle: error.message });
        }
    }
};

module.exports = {
    estadisticas,
    exportarExcel,
};
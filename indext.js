/**
 * Servidor principal de la aplicación HOSPEDAJE_DIGITAL
 * API REST con Express
 */

require('dotenv').config();

const app = require('./src/app');
const db = require('./src/database/connection');
const port = process.env.PORT || 3000;

let server;

const shutdown = (signal) => {
    console.log(`\n${signal} recibido. Cerrando servidor...`);

    if (!server) {
        process.exit(0);
        return;
    }

    server.close((error) => {
        if (error) {
            console.error('Error al cerrar el servidor:', error.message);
            process.exit(1);
            return;
        }

        console.log('Servidor detenido correctamente.');
        process.exit(0);
    });
};

const startServer = async () => {
    try {
        await db.query('SELECT 1');
        console.log('Conexión a base de datos verificada.');

        server = app.listen(port, () => {
            console.log(`Servidor corriendo en http://localhost:${port}`);
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`No se pudo iniciar: el puerto ${port} ya está en uso.`);
            } else {
                console.error('Error del servidor:', error.message);
            }
            process.exit(1);
        });
    } catch (error) {
        const detail = error && (error.message || error.code) ? (error.message || error.code) : String(error);
        console.error('No se pudo iniciar el backend:', detail);
        process.exit(1);
    }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
    console.error('Excepción no controlada:', error.message);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    console.error('Promesa rechazada no controlada:', message);
    process.exit(1);
});

startServer();

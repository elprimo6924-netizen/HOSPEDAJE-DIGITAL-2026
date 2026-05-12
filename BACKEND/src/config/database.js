/**
 * Configuración de la base de datos
 * Este archivo centraliza la configuración de la base de datos
 * Lee las variables de entorno y proporciona valores por defecto para desarrollo
 */

// Cargar variables de entorno desde .env
require('dotenv').config({ override: true });

const config = {
    // Configuración de la base de datos
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hospedaje',
        stringsAsIdentifiers: true
    },

    // Otras configuraciones de la aplicación
    app: {
        port: process.env.PORT || 3306,
        nodeEnv: process.env.NODE_ENV || 'development'
    }
};

module.exports = config;
// Cargar variables de entorno desde .env
require('dotenv').config();

const mysql = require('mysql2/promise'); // usar mysql2/promise para promesas

// Obtenemos las variables de entorno con valores por defecto para desarrollo
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospedaje',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Crear un pool de conexiones
const pool = mysql.createPool(dbConfig);

// exportar el pool para que pueda ser usado en toda la aplicación
module.exports = pool; 
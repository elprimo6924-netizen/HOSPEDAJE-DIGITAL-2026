const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospedaje_digital'
  });

  const [rows] = await connection.execute('DESCRIBE reserva');
  console.log('Estructura de tabla reserva:');
  console.table(rows);

  const [constraints] = await connection.execute('SELECT * FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = "reserva" AND TABLE_SCHEMA = "hospedaje_digital"');
  console.log('Constraints de la tabla reserva:');
  console.table(constraints);

  await connection.end();
}

checkTable().catch(console.error);
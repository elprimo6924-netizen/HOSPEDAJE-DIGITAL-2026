const db = require('./src/database/connection');

(async () => {
  try {
    const [rows] = await db.query('SELECT * FROM habitacion WHERE NombreHabitacion = ?', ['Habitacion Carrusel Prueba']);
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();

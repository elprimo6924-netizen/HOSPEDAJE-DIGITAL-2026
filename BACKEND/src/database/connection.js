const db = require('../config/db');

// Exportamos el mismo pool para mantener consistencia en toda la app
module.exports = db;
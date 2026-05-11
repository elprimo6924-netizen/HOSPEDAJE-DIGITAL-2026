require('dotenv').config();
const app = require('./src/app');
const port = process.env.PORT || 3306;

console.log('Iniciando servidor...');
console.log('Puerto:', port);
console.log('Directorio actual:', process.cwd());

const server = app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});

server.on('error', (error) => {
  console.error('Error al iniciar servidor:', error);
});

process.on('SIGINT', () => {
  console.log('Cerrando servidor...');
  server.close();
});
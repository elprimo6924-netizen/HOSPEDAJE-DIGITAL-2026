require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Simular la configuración básica del servidor
const app = express();
app.use(cors());
app.use(express.json());

// Importar rutas
const reservasRoutes = require('./src/routes/reservas.routes');
app.use('/api/reservas', reservasRoutes);

// Simular una petición DELETE
const testRequest = async () => {
  console.log('Iniciando servidor de prueba...');

  const server = app.listen(3001, () => {
    console.log('Servidor de prueba corriendo en puerto 3001');

    // Hacer una petición HTTP simulada
    const http = require('http');

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/reservas/13',
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);

      res.on('data', (chunk) => {
        console.log('Response body:', chunk.toString());
      });

      res.on('end', () => {
        console.log('Petición completada');
        server.close();
      });
    });

    req.on('error', (e) => {
      console.error(`Error en petición: ${e.message}`);
      server.close();
    });

    req.end();
  });
};

testRequest();
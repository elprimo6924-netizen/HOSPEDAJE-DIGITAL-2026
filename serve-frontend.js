const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'FRONTEND')));

app.listen(8080, '0.0.0.0', () => {
  console.log('Frontend disponible en:');
  console.log('  Local:   http://localhost:8080');
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  Red:     http://${net.address}:8080`);
      }
    }
  }
});

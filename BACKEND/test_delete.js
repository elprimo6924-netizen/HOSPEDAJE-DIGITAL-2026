require('dotenv').config();
const reservaModel = require('./src/models/reserva');

async function testDelete() {
  try {
    console.log('Probando eliminación de reserva ID 13...');
    const result = await reservaModel.delete(13);
    console.log('Resultado:', result);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDelete();
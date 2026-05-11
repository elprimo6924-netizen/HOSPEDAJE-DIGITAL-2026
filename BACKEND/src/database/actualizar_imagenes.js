// Script simple para actualizar las imágenes de las habitaciones
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospedaje'
});

connection.connect((err) => {
    if (err) {
        console.error('Error de conexión:', err.message);
        return;
    }
    console.log('Conectado a la base de datos');
    
    // Actualizar las imágenes de las habitaciones
    const sql = `
        UPDATE habitacion SET 
        ImagenHabitacion = CASE IDHabitacion
            WHEN 1 THEN 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop'
            WHEN 2 THEN 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop'
            WHEN 3 THEN 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop'
            WHEN 4 THEN 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop'
            WHEN 5 THEN 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop'
            WHEN 6 THEN 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop'
            WHEN 7 THEN 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=400&h=300&fit=crop'
            WHEN 8 THEN 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop'
        END
        WHERE IDHabitacion BETWEEN 1 AND 8
    `;
    
    connection.query(sql, (err, result) => {
        if (err) {
            console.error('Error al actualizar:', err.message);
        } else {
            console.log('✅ Imágenes actualizadas correctamente');
            console.log(`Se actualizaron ${result.affectedRows} habitaciones`);
        }
        
        // Verificar las habitaciones
        connection.query('SELECT IDHabitacion, NombreHabitacion, ImagenHabitacion FROM habitacion', (err, rows) => {
            if (err) {
                console.error('Error al verificar:', err.message);
            } else {
                console.log('\n📋 Habitaciones actualizadas:');
                rows.forEach(h => {
                    console.log(`  ${h.IDHabitacion}. ${h.NombreHabitacion}`);
                    console.log(`     Imagen: ${h.ImagenHabitacion ? '✅ Configurada' : '❌ Sin imagen'}`);
                });
            }
            connection.end();
        });
    });
});

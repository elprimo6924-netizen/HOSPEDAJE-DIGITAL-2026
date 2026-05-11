/**
 * Script para corregir servicios duplicados en la BD
 * Uso: node src/scripts/fixDuplicateServicios.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const NUEVOS_SERVICIOS = [
    {
        // Reemplaza el segundo "Spa" duplicado
        buscarNombre: 'Spa',
        indice: 1,          // 0 = primero, 1 = segundo (el duplicado)
        datos: {
            NombreServicio: 'Sala de Masajes',
            Descripcion:    'Masajes con aceites y tecnicas especializadas',
            Duracion:        '60 min',
            CantidadMaximaPersonas: 2,
            Costo:           90000,
            Estado:          1
        }
    },
    {
        // Reemplaza el segundo "Desayuno" duplicado
        buscarNombre: 'Desayuno',
        indice: 1,
        datos: {
            NombreServicio: 'Cena Gourmet',
            Descripcion:    'Cena romantica con menu de 3 tiempos',
            Duracion:        '2 horas',
            CantidadMaximaPersonas: 4,
            Costo:           65000,
            Estado:          1
        }
    }
];

async function main() {
    const conn = await mysql.createConnection({
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT || '3306'),
        user:     process.env.DB_USER     || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME     || 'hospedaje'
    });

    try {
        const [todos] = await conn.execute('SELECT IDServicio, NombreServicio, Costo FROM servicios ORDER BY IDServicio ASC');
        console.log('\n── Servicios actuales ──────────────────────────');
        todos.forEach(s => console.log(`  [${s.IDServicio}] ${s.NombreServicio} – $${Number(s.Costo).toLocaleString('es-CO')}`));

        for (const regla of NUEVOS_SERVICIOS) {
            const coincidencias = todos.filter(s =>
                s.NombreServicio.toLowerCase().includes(regla.buscarNombre.toLowerCase())
            );

            if (coincidencias.length <= regla.indice) {
                console.log(`\n⚠  No se encontró un duplicado de "${regla.buscarNombre}" (índice ${regla.indice}) — se omite.`);
                continue;
            }

            const objetivo = coincidencias[regla.indice];
            const { NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado } = regla.datos;

            await conn.execute(
                `UPDATE servicios
                 SET NombreServicio = ?, Descripcion = ?, Duracion = ?, CantidadMaximaPersonas = ?, Costo = ?, Estado = ?
                 WHERE IDServicio = ?`,
                [NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado, objetivo.IDServicio]
            );

            console.log(`\n✓  [${objetivo.IDServicio}] "${objetivo.NombreServicio}" → "${NombreServicio}" ($${Costo.toLocaleString('es-CO')})`);
        }

        const [actualizados] = await conn.execute('SELECT IDServicio, NombreServicio, Costo FROM servicios ORDER BY IDServicio ASC');
        console.log('\n── Servicios después del fix ────────────────────');
        actualizados.forEach(s => console.log(`  [${s.IDServicio}] ${s.NombreServicio} – $${Number(s.Costo).toLocaleString('es-CO')}`));
        console.log('\n✅  Listo.\n');
    } finally {
        await conn.end();
    }
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });

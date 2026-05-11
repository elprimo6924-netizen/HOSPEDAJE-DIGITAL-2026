const connection = require('./src/database/connection');

async function main() {
    try {
        console.log('Conectando a la base de datos...');
        await connection.connect();
        console.log('Conexión establecida correctamente.\n');

        const [tables] = await connection.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'hospedaje'
            ORDER BY TABLE_NAME
        `);

        console.log('Tablas en la base de datos:');
        tables.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}`);
        });

    } catch (error) {
        console.error('Error general:', error.message);
    } finally {
        await connection.end();
    }
}

main();

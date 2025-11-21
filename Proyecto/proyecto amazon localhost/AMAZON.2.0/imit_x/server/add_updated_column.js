const pool = require('./db.js');

async function addUpdatedColumn() {
  try {
    // Intentar agregar la columna (si ya existe, MySQL lo ignorará con IF NOT EXISTS)
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
    console.log('✅ Columna updated_at agregada exitosamente');
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log('✅ La columna updated_at ya existe');
    } else {
      console.error('❌ Error:', err.message);
    }
  }
  
  // Verificar estructura de la tabla
  try {
    const [rows] = await pool.query('DESCRIBE products');
    console.log('\n📋 Estructura de la tabla products:');
    rows.forEach(r => {
      console.log(`  - ${r.Field}: ${r.Type} ${r.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${r.Default ? 'DEFAULT ' + r.Default : ''}`);
    });
  } catch (err) {
    console.error('Error describiendo tabla:', err.message);
  }
  
  await pool.end();
}

addUpdatedColumn();

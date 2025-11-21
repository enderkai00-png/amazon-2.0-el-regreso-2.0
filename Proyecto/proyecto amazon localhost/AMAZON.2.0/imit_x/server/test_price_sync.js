const pool = require('./db.js');

async function testPriceSync() {
  try {
    console.log('🧪 Iniciando prueba de sincronización de precios\n');
    
    // 1. Obtener un producto de la base de datos
    const [products] = await pool.query('SELECT id, title, price FROM products LIMIT 1');
    
    if (products.length === 0) {
      console.log('❌ No hay productos en la base de datos');
      await pool.end();
      return;
    }
    
    const producto = products[0];
    console.log(`📦 Producto seleccionado: "${producto.title}"`);
    console.log(`💰 Precio actual en DB: $${producto.price}\n`);
    
    // 2. Simular un nuevo precio (aumentar 10%)
    const precioAnterior = parseFloat(producto.price);
    const precioNuevo = (precioAnterior * 1.1).toFixed(2);
    
    console.log(`🔄 Actualizando precio: $${precioAnterior} → $${precioNuevo}\n`);
    
    // 3. Actualizar el precio en la base de datos
    const [result] = await pool.query(
      'UPDATE products SET price = ?, updated_at = NOW() WHERE id = ?',
      [precioNuevo, producto.id]
    );
    
    if (result.affectedRows > 0) {
      console.log(`✅ Precio actualizado en la base de datos (${result.affectedRows} fila afectada)\n`);
      
      // 4. Verificar que el cambio se guardó
      const [updated] = await pool.query(
        'SELECT id, title, price, updated_at FROM products WHERE id = ?',
        [producto.id]
      );
      
      if (updated.length > 0) {
        console.log('📊 Verificación del cambio:');
        console.log(`  - Título: ${updated[0].title}`);
        console.log(`  - Precio anterior: $${precioAnterior}`);
        console.log(`  - Precio nuevo: $${updated[0].price}`);
        console.log(`  - Actualizado: ${updated[0].updated_at}`);
        console.log(`  - ✅ Cambio confirmado: ${parseFloat(updated[0].price) === parseFloat(precioNuevo) ? 'SÍ' : 'NO'}\n`);
      }
      
      // 5. Revertir el cambio (opcional)
      console.log('🔙 Revirtiendo cambio...');
      await pool.query(
        'UPDATE products SET price = ? WHERE id = ?',
        [precioAnterior, producto.id]
      );
      console.log('✅ Precio restaurado al valor original\n');
    } else {
      console.log('❌ No se pudo actualizar el precio\n');
    }
    
    console.log('✅ Prueba completada exitosamente');
    
  } catch (err) {
    console.error('❌ Error durante la prueba:', err.message);
  } finally {
    await pool.end();
  }
}

testPriceSync();

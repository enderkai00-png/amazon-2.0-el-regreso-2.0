const pool = require('./db.js');

async function testSellerPriceUpdate() {
  try {
    console.log('🏪 Simulando actualización de precio desde el dashboard del vendedor\n');
    
    // 1. Obtener productos de seller_products (como lo hace el dashboard)
    const [sellerProducts] = await pool.query(
      'SELECT id, title, price FROM seller_products WHERE title LIKE "%Samsung%" OR title LIKE "%Nike%" LIMIT 3'
    );
    
    console.log(`📦 Productos del vendedor (${sellerProducts.length}):`);
    sellerProducts.forEach(p => {
      console.log(`  - ${p.title}: $${p.price}`);
    });
    console.log('');
    
    if (sellerProducts.length === 0) {
      console.log('⚠️ No hay productos en seller_products, creando uno de prueba...\n');
      
      await pool.query(`
        INSERT INTO seller_products (id, title, price, site_enabled, created_at)
        VALUES ('test-001', 'Producto de Prueba', 99.99, '{"DE":true,"ES":true,"IT":true}', NOW())
      `);
      
      console.log('✅ Producto de prueba creado\n');
      return testSellerPriceUpdate(); // Reintentar
    }
    
    // 2. Simular cambio de precio del vendedor (aumentar 15% al primer producto)
    const productoACambiar = sellerProducts[0];
    const precioAnterior = parseFloat(productoACambiar.price);
    const precioNuevo = (precioAnterior * 1.15).toFixed(2);
    
    console.log(`🔄 VENDEDOR cambia precio de "${productoACambiar.title}":`);
    console.log(`   $${precioAnterior} → $${precioNuevo}\n`);
    
    // 3. Actualizar en seller_products (esto lo hace el POST /api/seller/products)
    await pool.query(
      'UPDATE seller_products SET price = ? WHERE id = ?',
      [precioNuevo, productoACambiar.id]
    );
    console.log('✅ Actualizado en seller_products\n');
    
    // 4. SINCRONIZAR con la tabla products (esto debería hacerse automáticamente)
    console.log('🔄 Sincronizando con tabla products...');
    
    const [existingInProducts] = await pool.query(
      'SELECT id, price FROM products WHERE title = ?',
      [productoACambiar.title]
    );
    
    if (existingInProducts.length > 0) {
      const precioActualEnProducts = parseFloat(existingInProducts[0].price);
      
      await pool.query(
        'UPDATE products SET price = ?, updated_at = NOW() WHERE id = ?',
        [precioNuevo, existingInProducts[0].id]
      );
      
      console.log(`✅ Sincronizado en products:`);
      console.log(`   Precio anterior en products: $${precioActualEnProducts}`);
      console.log(`   Precio nuevo en products: $${precioNuevo}\n`);
      
      // 5. Verificar que el cliente verá el nuevo precio
      const [productoParaCliente] = await pool.query(
        'SELECT id, title, price, updated_at FROM products WHERE id = ?',
        [existingInProducts[0].id]
      );
      
      if (productoParaCliente.length > 0) {
        console.log('👤 LO QUE VERÁ EL CLIENTE:');
        console.log(`   - Producto: ${productoParaCliente[0].title}`);
        console.log(`   - Precio: $${productoParaCliente[0].price}`);
        console.log(`   - Última actualización: ${productoParaCliente[0].updated_at}`);
        console.log(`   - ✅ Precio sincronizado: ${parseFloat(productoParaCliente[0].price) === parseFloat(precioNuevo) ? 'SÍ ✅' : 'NO ❌'}\n`);
      }
      
      // 6. Revertir cambios
      console.log('🔙 Revirtiendo cambios para mantener datos originales...');
      await pool.query('UPDATE seller_products SET price = ? WHERE id = ?', [precioAnterior, productoACambiar.id]);
      await pool.query('UPDATE products SET price = ? WHERE id = ?', [precioAnterior, existingInProducts[0].id]);
      console.log('✅ Cambios revertidos\n');
    } else {
      console.log(`⚠️ El producto "${productoACambiar.title}" no existe en la tabla products`);
      console.log('   Esto significa que es un producto nuevo que debe ser insertado\n');
    }
    
    console.log('✅ Prueba de flujo completo finalizada');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

testSellerPriceUpdate();

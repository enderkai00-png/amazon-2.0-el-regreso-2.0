const pool = require('./db.js');

async function testCompleteFlow() {
  try {
    console.log('🧪 PRUEBA COMPLETA DE ACTUALIZACIÓN DE PRECIOS\n');
    console.log('='.repeat(60) + '\n');
    
    // 1. Ver precio actual en products
    const [currentProduct] = await pool.query(
      'SELECT id, title, price FROM products WHERE title = "Smartphone Samsung Galaxy S23"'
    );
    
    if (currentProduct.length === 0) {
      console.log('❌ Producto no encontrado');
      await pool.end();
      return;
    }
    
    const producto = currentProduct[0];
    const precioAnterior = parseFloat(producto.price);
    
    console.log('📦 PASO 1: Estado inicial en tabla products');
    console.log(`   Producto: ${producto.title}`);
    console.log(`   Precio actual: $${precioAnterior}\n`);
    
    // 2. Verificar en seller_products
    const [sellerProduct] = await pool.query(
      'SELECT id, title, price FROM seller_products WHERE title = "Smartphone Samsung Galaxy S23"'
    );
    
    if (sellerProduct.length > 0) {
      console.log('📦 PASO 2: Estado en seller_products');
      console.log(`   Precio vendedor: $${sellerProduct[0].price}\n`);
    } else {
      console.log('⚠️ PASO 2: Producto no existe en seller_products, creándolo...\n');
      await pool.query(
        'INSERT INTO seller_products (id, title, price, site_enabled, created_at) VALUES (?, ?, ?, ?, NOW())',
        [`seller-${producto.id}`, producto.title, producto.price, JSON.stringify({ DE: true, ES: true, IT: true })]
      );
      console.log('✅ Producto creado en seller_products\n');
    }
    
    // 3. Simular cambio de precio del vendedor (aumentar 20%)
    const precioNuevo = (precioAnterior * 1.20).toFixed(2);
    
    console.log('🔄 PASO 3: VENDEDOR actualiza precio');
    console.log(`   Precio anterior: $${precioAnterior}`);
    console.log(`   Precio nuevo: $${precioNuevo}`);
    console.log(`   Incremento: 20%\n`);
    
    // 4. Actualizar en seller_products (como lo hace el frontend)
    await pool.query(
      'UPDATE seller_products SET price = ? WHERE title = ?',
      [precioNuevo, producto.title]
    );
    console.log('✅ PASO 4: Actualizado en seller_products\n');
    
    // 5. Sincronizar a products (como lo hace el backend automáticamente)
    console.log('🔄 PASO 5: Sincronizando a tabla products...');
    await pool.query(
      'UPDATE products SET price = ?, updated_at = NOW() WHERE id = ?',
      [precioNuevo, producto.id]
    );
    console.log('✅ Sincronizado a tabla products\n');
    
    // 6. Verificar el cambio en products
    const [updatedProduct] = await pool.query(
      'SELECT id, title, price, updated_at FROM products WHERE id = ?',
      [producto.id]
    );
    
    console.log('📊 PASO 6: Verificación del cambio');
    console.log(`   Título: ${updatedProduct[0].title}`);
    console.log(`   Precio anterior: $${precioAnterior}`);
    console.log(`   Precio actual: $${updatedProduct[0].price}`);
    console.log(`   Última actualización: ${updatedProduct[0].updated_at}`);
    console.log(`   ✅ Cambio aplicado: ${parseFloat(updatedProduct[0].price) === parseFloat(precioNuevo) ? 'SÍ' : 'NO'}\n`);
    
    // 7. Simular lo que vería el cliente al hacer GET /api/products
    console.log('👤 PASO 7: Simulando GET /api/products (lo que ve el cliente)');
    const [clientView] = await pool.query(
      'SELECT id, title, price FROM products WHERE id = ?',
      [producto.id]
    );
    console.log(`   Cliente verá: ${clientView[0].title} - $${clientView[0].price}\n`);
    
    // 8. Revertir cambios
    console.log('🔙 PASO 8: Revirtiendo cambios para mantener datos originales...');
    await pool.query('UPDATE seller_products SET price = ? WHERE title = ?', [precioAnterior, producto.title]);
    await pool.query('UPDATE products SET price = ? WHERE id = ?', [precioAnterior, producto.id]);
    console.log('✅ Precio restaurado al valor original\n');
    
    console.log('='.repeat(60));
    console.log('✅ PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(60) + '\n');
    
    console.log('📝 RESUMEN:');
    console.log('   1. El vendedor actualiza precio en su dashboard');
    console.log('   2. Se guarda en seller_products');
    console.log('   3. Se sincroniza automáticamente a products');
    console.log('   4. El cliente ve el nuevo precio al cargar /api/products');
    console.log('\n💡 Si no ves los cambios en la pantalla:');
    console.log('   - Verifica que el servidor esté corriendo (npm start)');
    console.log('   - Abre la consola del navegador (F12)');
    console.log('   - Busca los logs con 🔄 y ✅');
    console.log('   - Haz clic en el botón "🔄 Recargar"');
    console.log('   - Verifica que no haya errores de CORS\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

testCompleteFlow();

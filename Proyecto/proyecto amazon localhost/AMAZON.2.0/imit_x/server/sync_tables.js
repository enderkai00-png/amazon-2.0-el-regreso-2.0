const pool = require('./db.js');

async function syncTables() {
  try {
    console.log('🔄 Sincronizando tablas seller_products y products\n');
    
    // 1. Obtener productos de la tabla products
    const [products] = await pool.query(
      'SELECT id, title, price FROM products LIMIT 5'
    );
    
    console.log(`📦 Productos en la tabla products (${products.length}):`);
    products.forEach(p => {
      console.log(`  - ${p.title}: $${p.price}`);
    });
    console.log('');
    
    // 2. Insertar estos productos en seller_products si no existen
    console.log('🔄 Insertando productos en seller_products...\n');
    
    for (const product of products) {
      // Verificar si ya existe
      const [existing] = await pool.query(
        'SELECT id FROM seller_products WHERE title = ?',
        [product.title]
      );
      
      if (existing.length === 0) {
        await pool.query(
          'INSERT INTO seller_products (id, title, price, site_enabled, created_at) VALUES (?, ?, ?, ?, NOW())',
          [
            `seller-${product.id}`,
            product.title,
            product.price,
            JSON.stringify({ DE: true, ES: true, IT: true })
          ]
        );
        console.log(`✅ Insertado: ${product.title}`);
      } else {
        console.log(`⏭️ Ya existe: ${product.title}`);
      }
    }
    
    console.log('\n✅ Sincronización completada');
    
    // 3. Mostrar resumen
    const [sellerCount] = await pool.query('SELECT COUNT(*) as count FROM seller_products');
    const [productCount] = await pool.query('SELECT COUNT(*) as count FROM products');
    
    console.log('\n📊 Resumen:');
    console.log(`  - Productos en seller_products: ${sellerCount[0].count}`);
    console.log(`  - Productos en products: ${productCount[0].count}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

syncTables();

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const dotenv = require('dotenv');

dotenv.config();

const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Simple health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Auth: signup (role = client|seller)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
    if (role === 'client') {
      const [r] = await pool.query('INSERT INTO clients (name,email,password) VALUES (?,?,?)', [name, email, password]);
      return res.json({ id: r.insertId, name, email, role: 'client' });
    } else {
      const [r] = await pool.query('INSERT INTO sellers (name,email,password) VALUES (?,?,?)', [name, email, password]);
      return res.json({ id: r.insertId, name, email, role: 'seller' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Auth: login - intenta primero como cliente, luego como vendedor
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    
    // Intentar primero como cliente
    const [clientRows] = await pool.query('SELECT id,name,email FROM clients WHERE email = ? AND password = ? LIMIT 1', [email, password]);
    if (clientRows && clientRows.length > 0) {
      return res.json({ success: true, user: clientRows[0], userType: 'client', role: 'client' });
    }
    
    // Si no es cliente, intentar como vendedor
    const [sellerRows] = await pool.query('SELECT id,name,email FROM sellers WHERE email = ? AND password = ? LIMIT 1', [email, password]);
    if (sellerRows && sellerRows.length > 0) {
      return res.json({ success: true, user: sellerRows[0], userType: 'seller', role: 'seller' });
    }
    
    // Si no se encuentra en ninguna tabla
    return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// Products listing with search and filters
app.get('/api/products', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    if (q) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (minPrice) {
      sql += ' AND price >= ?';
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      sql += ' AND price <= ?';
      params.push(Number(maxPrice));
    }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Product detail
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Cart endpoints
app.post('/api/cart', async (req, res) => {
  const { client_id, product_id, quantity, title, price, image } = req.body;
  console.log('POST /api/cart - Recibido:', { client_id, product_id, quantity, title, price, image });
  
  if (!client_id || !product_id) {
    console.log('ERROR: Missing fields');
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Try DB insert first with all fields; on failure, fallback to file storage
  try {
    const [r] = await pool.query(
      'INSERT INTO carts (client_id, product_id, quantity, title, price, image) VALUES (?,?,?,?,?,?)', 
      [client_id, product_id, quantity || 1, title || null, price || null, image || null]
    );
    console.log('✅ Cart item saved to DB with id:', r.insertId);
    return res.json({ id: r.insertId, source: 'db' });
  } catch (dbErr) {
    console.warn('⚠️ DB insert for cart failed, falling back to file:', dbErr.message || dbErr);
    try {
      const filePath = path.join(__dirname, 'cart.json');
      let arr = [];
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8') || '[]';
        try { arr = JSON.parse(raw); } catch (e) { arr = []; }
      }
      const id = Date.now();
      // Use provided product info from request, or try to get from products.json
      let finalTitle = title || null;
      let finalPrice = price || null;
      let finalImage = image || null;
      
      if (!finalTitle || !finalPrice) {
        try {
          const prodPath = path.join(__dirname, 'products.json');
          if (fs.existsSync(prodPath)) {
            const prods = JSON.parse(fs.readFileSync(prodPath, 'utf8') || '[]');
            const p = prods.find(x => String(x.id) === String(product_id));
            if (p) { 
              finalTitle = finalTitle || p.title || p.nombre || null; 
              finalPrice = finalPrice || p.price || p.precio || null; 
              finalImage = finalImage || p.image || p.imagen || null; 
            }
          }
        } catch (e) {}
      }
      
      const record = { 
        id, 
        client_id, 
        product_id, 
        quantity: quantity || 1, 
        title: finalTitle, 
        price: finalPrice, 
        image: finalImage, 
        created_at: new Date().toISOString() 
      };
      arr.push(record);
      fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
      return res.json({ id, source: 'file' });
    } catch (fileErr) {
      console.error('File fallback for cart failed:', fileErr.message || fileErr);
      return res.status(500).json({ error: 'Server error' });
    }
  }
});

app.get('/api/cart/:clientId', async (req, res) => {
  const clientId = req.params.clientId;
  console.log('GET /api/cart/:clientId - Buscando carrito para cliente:', clientId);
  
  let dbRows = [];
  let useFileAsFallback = false;
  
  try {
    const [rows] = await pool.query(
      'SELECT id, client_id, product_id, quantity, title, price, image FROM carts WHERE client_id = ?',
      [clientId]
    );
    dbRows = rows;
    console.log('DB cart items found:', dbRows.length);
    
    // Si la BD no tiene items, intentar con archivo
    if (dbRows.length === 0) {
      useFileAsFallback = true;
    }
  } catch (dbErr) {
    console.warn('DB read for cart failed, falling back to file:', dbErr.message || dbErr);
    useFileAsFallback = true;
  }
  
  // Si necesitamos usar el archivo como fallback
  if (useFileAsFallback) {
    try {
      const filePath = path.join(__dirname, 'cart.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8') || '[]';
        const arr = JSON.parse(raw);
        console.log('Total items in cart.json:', arr.length);
        const filtered = arr.filter(r => String(r.client_id) === String(clientId));
        console.log('Filtered items for client', clientId, ':', filtered.length);
        return res.json(filtered);
      }
      console.log('cart.json does not exist');
      return res.json([]);
    } catch (fileErr) {
      console.error('Error reading cart file:', fileErr.message || fileErr);
      return res.status(500).json({ error: 'Server error' });
    }
  }
  
  // Retornar items de la BD si los hay
  return res.json(dbRows);
});

// Remove cart item
app.delete('/api/cart/:id', async (req, res) => {
  const { id } = req.params;
  console.log('DELETE /api/cart/:id - Eliminando item:', id);
  
  let usedDB = false;
  let dbSuccess = false;
  
  try {
    const [r] = await pool.query('DELETE FROM carts WHERE id = ?', [id]);
    console.log('DB delete executed, rows affected:', r.affectedRows);
    
    if (r.affectedRows > 0) {
      usedDB = true;
      dbSuccess = true;
      return res.json({ ok: true, source: 'db', deleted: r.affectedRows });
    } else {
      console.log('No rows deleted from DB, item might be in file');
    }
  } catch (dbErr) {
    console.warn('DB delete failed:', dbErr.message || dbErr);
  }
  
  // Si la BD no eliminó nada o falló, intentar con archivo
  if (!dbSuccess) {
    try {
      const filePath = path.join(__dirname, 'cart.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8') || '[]';
        let arr = JSON.parse(raw);
        const initialLength = arr.length;
        
        // Filtrar el item a eliminar
        arr = arr.filter(item => String(item.id) !== String(id));
        const deletedCount = initialLength - arr.length;
        
        if (deletedCount > 0) {
          fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
          console.log('File delete successful, items deleted:', deletedCount);
          return res.json({ ok: true, source: 'file', deleted: deletedCount });
        } else {
          console.log('Item not found in cart.json');
          return res.status(404).json({ error: 'Item not found' });
        }
      } else {
        console.log('cart.json does not exist');
        return res.status(404).json({ error: 'Cart file not found' });
      }
    } catch (fileErr) {
      console.error('File delete failed:', fileErr.message || fileErr);
      return res.status(500).json({ error: 'Server error' });
    }
  }
});

// Guardar dirección de entrega
app.post('/api/addresses', async (req, res) => {
  const { client_id, nombre, apellido, direccion, direccion2, ciudad, estado, pais, codigo_postal, telefono } = req.body;
  if (!nombre || !apellido || !direccion || !ciudad || !pais || !codigo_postal) return res.status(400).json({ error: 'Missing fields' });

  // Try DB insert first; if DB unavailable, fallback to a local JSON file for simple testing
  try {
    const [r] = await pool.query(
      'INSERT INTO addresses (client_id,nombre,apellido,direccion,direccion2,ciudad,estado,pais,codigo_postal,telefono) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [client_id || null, nombre, apellido, direccion, direccion2 || null, ciudad, estado || null, pais, codigo_postal, telefono || null]
    );
    return res.json({ id: r.insertId, source: 'db' });
  } catch (err) {
    console.error('DB insert failed, falling back to file store:', err.message || err);
    try {
      const filePath = path.join(__dirname, 'addresses.json');
      let arr = [];
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8') || '[]';
        try { arr = JSON.parse(raw); } catch (e) { arr = []; }
      }
      const id = Date.now();
      const record = {
        id,
        client_id: client_id || null,
        nombre, apellido, direccion, direccion2: direccion2 || null,
        ciudad, estado: estado || null, pais, codigo_postal, telefono: telefono || null,
        created_at: new Date().toISOString()
      };
      arr.push(record);
      fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
      return res.json({ id, source: 'file' });
    } catch (fileErr) {
      console.error('File fallback failed:', fileErr.message || fileErr);
      return res.status(500).json({ error: 'Server error' });
    }
  }
});

// Seller products: get and save (file-backed simple storage)
app.get('/api/seller/products', async (req, res) => {
  // Try DB first
  try {
    const [rows] = await pool.query('SELECT id, title, price, description, category, stock, site_enabled FROM seller_products');
    if (rows && rows.length > 0) {
      // parse JSON column if present
      const out = rows.map(r => ({ 
        id: r.id, 
        title: r.title, 
        price: Number(r.price), 
        description: r.description || '',
        category: r.category || 'Electrónica',
        stock: r.stock || 0,
        siteEnabled: r.site_enabled ? JSON.parse(r.site_enabled) : { DE: true, ES: true, IT: true } 
      }));
      return res.json(out);
    }
  } catch (dbErr) {
    console.warn('DB read for seller products failed, falling back to file:', dbErr.message || dbErr);
  }
  
  // Fallback to file
  try {
    const filePath = path.join(__dirname, 'products.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8') || '[]';
      const arr = JSON.parse(raw);
      return res.json(arr);
    }
    return res.json([]);
  } catch (err) {
    console.error('Error reading products file:', err.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/seller/products', async (req, res) => {
  const { products } = req.body;
  if (!products || !Array.isArray(products)) return res.status(400).json({ error: 'Invalid payload' });

  // Try DB persist: simple approach - upsert each product
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const insertSql = 'REPLACE INTO seller_products (id,title,price,description,category,stock,site_enabled,created_at) VALUES (?,?,?,?,?,?,?,NOW())';
      for (const p of products) {
        const siteJson = JSON.stringify(p.siteEnabled || {});
        await conn.query(insertSql, [
          p.id, 
          p.title, 
          Number(p.price || 0), 
          p.description || '',
          p.category || 'Electrónica',
          Number(p.stock || 0),
          siteJson
        ]);
      }
      await conn.commit();
      conn.release();
      
      // Sincronizar automáticamente con la tabla products después de guardar
      await syncSellerProductsToMain(products);
      
      return res.json({ ok: true, source: 'db' });
    } catch (inner) {
      await conn.rollback();
      conn.release();
      throw inner;
    }
  } catch (dbErr) {
    console.warn('DB save for seller products failed, falling back to file:', dbErr.message || dbErr);
    try {
      const filePath = path.join(__dirname, 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
      return res.json({ ok: true, source: 'file' });
    } catch (fileErr) {
      console.error('Error saving products file:', fileErr.message || fileErr);
      return res.status(500).json({ error: 'Server error' });
    }
  }
});

// Función auxiliar para sincronizar productos del vendedor a la tabla principal
async function syncSellerProductsToMain(products) {
  let updated = 0;
  let inserted = 0;
  let errors = 0;
  
  try {
    for (const product of products) {
      try {
        const precio = Number(product.price || 0);
        console.log(`🔄 Sincronizando: ${product.title} - Precio: $${precio}`);
        
        // Buscar el producto por título (más confiable que ID)
        const [existing] = await pool.query(
          'SELECT id, price FROM products WHERE title = ? LIMIT 1',
          [product.title]
        );
        
        if (existing.length > 0) {
          // Actualizar producto existente
          const [result] = await pool.query(
            'UPDATE products SET price = ?, description = ?, category = ?, updated_at = NOW() WHERE id = ?',
            [
              precio,
              product.description || '',
              product.category || 'Electrónica',
              existing[0].id
            ]
          );
          
          if (result.affectedRows > 0) {
            updated++;
            console.log(`✅ ACTUALIZADO en DB: "${product.title}" - Precio anterior: $${existing[0].price} → Nuevo: $${precio}`);
          }
        } else {
          // Insertar nuevo producto
          const [result] = await pool.query(
            'INSERT INTO products (title, price, description, category, created_at) VALUES (?, ?, ?, ?, NOW())',
            [
              product.title,
              precio,
              product.description || '',
              product.category || 'Electrónica'
            ]
          );
          
          if (result.insertId) {
            inserted++;
            console.log(`✅ INSERTADO en DB: "${product.title}" - Precio: $${precio} (ID: ${result.insertId})`);
          }
        }
      } catch (innerErr) {
        errors++;
        console.error(`❌ Error con producto "${product.title}":`, innerErr.message);
      }
    }
    
    console.log(`\n📊 Resumen sincronización: ${updated} actualizados, ${inserted} insertados, ${errors} errores`);
  } catch (err) {
    console.error('❌ Error general sincronizando productos:', err.message || err);
  }
}

// Endpoint para sincronizar precios del vendedor con el catálogo principal
app.post('/api/sync-prices', async (req, res) => {
  const { products } = req.body;
  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  console.log(`\n🔄 Iniciando sincronización de ${products.length} productos...`);
  
  try {
    let updatedCount = 0;
    let details = [];
    
    for (const product of products) {
      const precio = Number(product.price || 0);
      
      // Buscar y actualizar por título
      const [existing] = await pool.query(
        'SELECT id, price FROM products WHERE title = ? LIMIT 1',
        [product.title]
      );
      
      if (existing.length > 0) {
        const [result] = await pool.query(
          'UPDATE products SET price = ?, updated_at = NOW() WHERE id = ?',
          [precio, existing[0].id]
        );
        
        if (result.affectedRows > 0) {
          updatedCount++;
          const detail = {
            title: product.title,
            oldPrice: Number(existing[0].price),
            newPrice: precio,
            changed: Number(existing[0].price) !== precio
          };
          details.push(detail);
          console.log(`✅ "${product.title}": $${existing[0].price} → $${precio}`);
        }
      } else {
        console.log(`⚠️ Producto no encontrado en products: "${product.title}"`);
      }
    }
    
    console.log(`\n📊 Sincronización completada: ${updatedCount} de ${products.length} actualizados\n`);
    return res.json({ 
      ok: true, 
      updated: updatedCount, 
      total: products.length,
      details 
    });
  } catch (err) {
    console.error('❌ Error sincronizando precios:', err.message || err);
    return res.status(500).json({ error: 'Error al sincronizar precios', details: err.message });
  }
});

// ============ RESEÑAS Y CALIFICACIONES ============

// Obtener todas las reseñas de un producto
app.get('/api/reviews/:productId', async (req, res) => {
  const { productId } = req.params;
  
  try {
    const [rows] = await pool.query(
      'SELECT id, client_id, client_name, product_id, rating, comment, created_at FROM reviews WHERE product_id = ? ORDER BY created_at DESC',
      [productId]
    );
    return res.json(rows);
  } catch (dbErr) {
    console.warn('DB read for reviews failed, returning empty:', dbErr.message || dbErr);
    // Fallback: intentar leer de archivo
    try {
      const filePath = path.join(__dirname, 'reviews.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8') || '[]';
        const arr = JSON.parse(raw);
        const filtered = arr.filter(r => String(r.product_id) === String(productId));
        return res.json(filtered);
      }
      return res.json([]);
    } catch (fileErr) {
      console.error('Error reading reviews file:', fileErr.message || fileErr);
      return res.json([]);
    }
  }
});

// Verificar si un cliente puede dejar reseña para un producto
app.get('/api/reviews/can-review/:productId/:clientId', async (req, res) => {
  const { productId, clientId } = req.params;
  
  try {
    // Verificar si ya existe una reseña de este cliente para este producto
    const [rows] = await pool.query(
      'SELECT id FROM reviews WHERE product_id = ? AND client_id = ? LIMIT 1',
      [productId, clientId]
    );
    
    const canReview = rows.length === 0;
    return res.json({ canReview });
  } catch (dbErr) {
    console.warn('DB check for can-review failed, allowing review:', dbErr.message || dbErr);
    // En caso de error, permitir la reseña
    return res.json({ canReview: true });
  }
});

// Crear una nueva reseña
app.post('/api/reviews', async (req, res) => {
  const { client_id, client_name, product_id, rating, comment } = req.body;
  
  if (!client_id || !product_id || !rating || !comment) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // Verificar si ya existe una reseña
    const [existing] = await pool.query(
      'SELECT id FROM reviews WHERE product_id = ? AND client_id = ? LIMIT 1',
      [product_id, client_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Ya has dejado una reseña para este producto' });
    }

    // Insertar nueva reseña
    const [result] = await pool.query(
      'INSERT INTO reviews (client_id, client_name, product_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [client_id, client_name || 'Usuario', product_id, rating, comment]
    );
    
    return res.json({ 
      id: result.insertId, 
      message: 'Reseña publicada exitosamente',
      source: 'db'
    });
  } catch (dbErr) {
    console.warn('DB insert for review failed, using file fallback:', dbErr.message || dbErr);
    
    // Fallback a archivo
    try {
      const filePath = path.join(__dirname, 'reviews.json');
      let arr = [];
      
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8') || '[]';
        try { arr = JSON.parse(raw); } catch (e) { arr = []; }
      }
      
      // Verificar si ya existe reseña en archivo
      const exists = arr.some(r => 
        String(r.product_id) === String(product_id) && 
        String(r.client_id) === String(client_id)
      );
      
      if (exists) {
        return res.status(400).json({ error: 'Ya has dejado una reseña para este producto' });
      }
      
      const id = Date.now();
      const record = {
        id,
        client_id,
        client_name: client_name || 'Usuario',
        product_id,
        rating,
        comment,
        created_at: new Date().toISOString()
      };
      
      arr.push(record);
      fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
      
      return res.json({ 
        id, 
        message: 'Reseña publicada exitosamente',
        source: 'file'
      });
    } catch (fileErr) {
      console.error('File fallback for review failed:', fileErr.message || fileErr);
      return res.status(500).json({ error: 'Error al guardar la reseña' });
    }
  }
});

// ============ CAMBIO DE CONTRASEÑA ============

// Cambiar contraseña del cliente
app.post('/api/change-password', async (req, res) => {
  const { client_id, seller_id, old_password, new_password, role } = req.body;
  
  if ((!client_id && !seller_id) || !old_password || !new_password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const table = role === 'seller' ? 'sellers' : 'clients';
    const id = role === 'seller' ? seller_id : client_id;
    
    // Verificar contraseña actual
    const [rows] = await pool.query(
      `SELECT id FROM ${table} WHERE id = ? AND password = ? LIMIT 1`,
      [id, old_password]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }
    
    // Actualizar contraseña
    await pool.query(
      `UPDATE ${table} SET password = ? WHERE id = ?`,
      [new_password, id]
    );
    
    return res.json({ 
      success: true, 
      message: 'Contraseña actualizada exitosamente' 
    });
  } catch (err) {
    console.error('Error cambiando contraseña:', err.message || err);
    return res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
});

// ============ ÓRDENES / PEDIDOS ============

// Crear nueva orden
app.post('/api/orders', async (req, res) => {
  const { client_id, items, total, shipping_address, payment_method } = req.body;
  
  if (!client_id || !items || !total) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Insertar orden
    const [result] = await pool.query(
      'INSERT INTO orders (client_id, total, status, shipping_address, payment_method, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [client_id, total, 'pending', shipping_address || '', payment_method || 'card']
    );
    
    const orderId = result.insertId;
    
    // Insertar items de la orden
    if (Array.isArray(items) && items.length > 0) {
      const itemsQuery = 'INSERT INTO order_items (order_id, product_id, title, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)';
      for (const item of items) {
        await pool.query(itemsQuery, [
          orderId,
          item.product_id,
          item.title,
          item.price,
          item.quantity,
          item.image || null
        ]);
      }
    }
    
    return res.json({ 
      success: true, 
      order_id: orderId,
      message: 'Orden creada exitosamente' 
    });
  } catch (dbErr) {
    console.warn('DB insert for order failed, using file fallback:', dbErr.message || dbErr);
    
    // Fallback a archivo
    try {
      const filePath = path.join(__dirname, 'orders.json');
      let arr = [];
      
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8') || '[]';
        try { arr = JSON.parse(raw); } catch (e) { arr = []; }
      }
      
      const orderId = `ORD-${Date.now()}`;
      const record = {
        id: orderId,
        client_id,
        items,
        total,
        status: 'pending',
        shipping_address: shipping_address || '',
        payment_method: payment_method || 'card',
        created_at: new Date().toISOString()
      };
      
      arr.push(record);
      fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
      
      return res.json({ 
        success: true, 
        order_id: orderId,
        message: 'Orden creada exitosamente',
        source: 'file'
      });
    } catch (fileErr) {
      console.error('File fallback for order failed:', fileErr.message || fileErr);
      return res.status(500).json({ error: 'Error al crear la orden' });
    }
  }
});

// Obtener órdenes de un cliente
app.get('/api/orders/:clientId', async (req, res) => {
  const { clientId } = req.params;
  
  try {
    const [orders] = await pool.query(
      'SELECT id, client_id, total, status, shipping_address, payment_method, created_at FROM orders WHERE client_id = ? ORDER BY created_at DESC',
      [clientId]
    );
    
    // Obtener items de cada orden
    for (const order of orders) {
      const [items] = await pool.query(
        'SELECT product_id, title, price, quantity, image FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items = items;
    }
    
    return res.json(orders);
  } catch (dbErr) {
    console.warn('DB read for orders failed, using file fallback:', dbErr.message || dbErr);
    
    // Fallback a archivo
    try {
      const filePath = path.join(__dirname, 'orders.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8') || '[]';
        const arr = JSON.parse(raw);
        const filtered = arr.filter(o => String(o.client_id) === String(clientId));
        return res.json(filtered);
      }
      return res.json([]);
    } catch (fileErr) {
      console.error('Error reading orders file:', fileErr.message || fileErr);
      return res.json([]);
    }
  }
});

// Obtener detalle de una orden específica
app.get('/api/orders/detail/:orderId', async (req, res) => {
  const { orderId } = req.params;
  
  try {
    const [orders] = await pool.query(
      'SELECT id, client_id, total, status, shipping_address, payment_method, created_at FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orders[0];
    
    // Obtener items
    const [items] = await pool.query(
      'SELECT product_id, title, price, quantity, image FROM order_items WHERE order_id = ?',
      [orderId]
    );
    order.items = items;
    
    return res.json(order);
  } catch (dbErr) {
    console.warn('DB read for order detail failed:', dbErr.message || dbErr);
    return res.status(500).json({ error: 'Error al obtener la orden' });
  }
});

// Actualizar estado de orden
app.put('/api/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  try {
    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    
    return res.json({ success: true, message: 'Estado actualizado' });
  } catch (err) {
    console.error('Error updating order status:', err.message || err);
    return res.status(500).json({ error: 'Error al actualizar el estado' });
  }
});

// Eliminar/cancelar múltiples items del carrito
app.post('/api/cart/remove-multiple', async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid ids array' });
  }
  
  try {
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.query(
      `DELETE FROM carts WHERE id IN (${placeholders})`,
      ids
    );
    
    return res.json({ 
      success: true, 
      deleted: result.affectedRows,
      source: 'db'
    });
  } catch (dbErr) {
    console.warn('DB delete multiple failed, using file fallback:', dbErr.message || dbErr);
    
    // Fallback a archivo
    try {
      const filePath = path.join(__dirname, 'cart.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8') || '[]';
        let arr = JSON.parse(raw);
        const initialLength = arr.length;
        
        arr = arr.filter(item => !ids.includes(String(item.id)));
        const deletedCount = initialLength - arr.length;
        
        fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
        
        return res.json({ 
          success: true, 
          deleted: deletedCount,
          source: 'file'
        });
      }
      return res.json({ success: true, deleted: 0 });
    } catch (fileErr) {
      console.error('File delete multiple failed:', fileErr.message || fileErr);
      return res.status(500).json({ error: 'Error al eliminar items' });
    }
  }
});

// ============ FAVORITOS ============

// Obtener favoritos de un cliente
app.get('/api/favorites/:clientId', async (req, res) => {
  const { clientId } = req.params;
  
  try {
    const [rows] = await pool.query(
      'SELECT id, client_id, product_id, created_at FROM favorites WHERE client_id = ? ORDER BY created_at DESC',
      [clientId]
    );
    return res.json(rows);
  } catch (dbErr) {
    console.warn('DB read for favorites failed, returning empty:', dbErr.message || dbErr);
    
    // Fallback a archivo
    try {
      const filePath = path.join(__dirname, 'favorites.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8') || '[]';
        const arr = JSON.parse(raw);
        const filtered = arr.filter(f => String(f.client_id) === String(clientId));
        return res.json(filtered);
      }
      return res.json([]);
    } catch (fileErr) {
      console.error('Error reading favorites file:', fileErr.message || fileErr);
      return res.json([]);
    }
  }
});

// Agregar producto a favoritos
app.post('/api/favorites', async (req, res) => {
  const { client_id, product_id } = req.body;
  
  if (!client_id || !product_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verificar si ya existe
    const [existing] = await pool.query(
      'SELECT id FROM favorites WHERE client_id = ? AND product_id = ? LIMIT 1',
      [client_id, product_id]
    );
    
    if (existing.length > 0) {
      return res.json({ message: 'Ya está en favoritos', id: existing[0].id });
    }

    // Insertar nuevo favorito
    const [result] = await pool.query(
      'INSERT INTO favorites (client_id, product_id, created_at) VALUES (?, ?, NOW())',
      [client_id, product_id]
    );
    
    return res.json({ 
      success: true,
      id: result.insertId,
      message: 'Agregado a favoritos',
      source: 'db'
    });
  } catch (dbErr) {
    console.warn('DB insert for favorite failed, using file fallback:', dbErr.message || dbErr);
    
    // Fallback a archivo
    try {
      const filePath = path.join(__dirname, 'favorites.json');
      let arr = [];
      
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8') || '[]';
        try { arr = JSON.parse(raw); } catch (e) { arr = []; }
      }
      
      // Verificar si ya existe
      const exists = arr.some(f => 
        String(f.client_id) === String(client_id) && 
        String(f.product_id) === String(product_id)
      );
      
      if (exists) {
        return res.json({ message: 'Ya está en favoritos' });
      }
      
      const id = Date.now();
      const record = {
        id,
        client_id,
        product_id,
        created_at: new Date().toISOString()
      };
      
      arr.push(record);
      fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
      
      return res.json({ 
        success: true,
        id,
        message: 'Agregado a favoritos',
        source: 'file'
      });
    } catch (fileErr) {
      console.error('File fallback for favorite failed:', fileErr.message || fileErr);
      return res.status(500).json({ error: 'Error al agregar a favoritos' });
    }
  }
});

// Eliminar producto de favoritos
app.delete('/api/favorites/:clientId/:productId', async (req, res) => {
  const { clientId, productId } = req.params;
  
  try {
    const [result] = await pool.query(
      'DELETE FROM favorites WHERE client_id = ? AND product_id = ?',
      [clientId, productId]
    );
    
    return res.json({ 
      success: true,
      deleted: result.affectedRows,
      source: 'db'
    });
  } catch (dbErr) {
    console.warn('DB delete for favorite failed, using file fallback:', dbErr.message || dbErr);
    
    // Fallback a archivo
    try {
      const filePath = path.join(__dirname, 'favorites.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8') || '[]';
        let arr = JSON.parse(raw);
        const initialLength = arr.length;
        
        arr = arr.filter(f => 
          !(String(f.client_id) === String(clientId) && String(f.product_id) === String(productId))
        );
        const deletedCount = initialLength - arr.length;
        
        fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
        
        return res.json({ 
          success: true,
          deleted: deletedCount,
          source: 'file'
        });
      }
      return res.json({ success: true, deleted: 0 });
    } catch (fileErr) {
      console.error('File delete for favorite failed:', fileErr.message || fileErr);
      return res.status(500).json({ error: 'Error al eliminar de favoritos' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

# 🔄 GUÍA: Cómo verificar que los precios se actualizan

## ✅ El sistema está funcionando correctamente

He probado el flujo completo y confirmo que:
- ✅ Base de datos actualizada con columna `updated_at`
- ✅ Sincronización automática funcionando
- ✅ Logs detallados implementados
- ✅ API devolviendo datos correctos

## 📋 Pasos para verificar la actualización de precios:

### 1️⃣ Asegúrate que el servidor backend esté corriendo
```bash
cd server
npm start
```
Deberías ver: "Server running on http://localhost:4000"

### 2️⃣ Abre el Dashboard del Vendedor
- Navega a la sección de vendedores
- Selecciona un producto (ej: "Smartphone Samsung Galaxy S23")
- Cambia el precio (ej: de $8999.99 a $9500.00)
- Haz clic en "Guardar Cambios"
- Verás el mensaje: "✓ Cambios guardados y precios sincronizados"

### 3️⃣ Abre la Consola del Navegador (F12)
En la consola deberías ver:
```
💾 Guardando cambios del vendedor...
✅ Guardado exitoso: {ok: true, source: 'db'}
🔄 Sincronizando precios...
✅ Sincronización completada: {ok: true, updated: 1}
```

### 4️⃣ Ve a la página de Productos (como cliente)
- Navega a /productos o /product-list
- **IMPORTANTE**: Haz clic en el botón "🔄 Recargar" (lo agregué en la esquina superior izquierda)
- Abre la consola (F12) y busca:
```
🔄 Cargando productos desde: http://localhost:4000/api/products
✅ Productos recibidos desde API: 10 productos
📊 Primeros precios: ['Smartphone Samsung Galaxy S23: $9500']
✅ Productos actualizados en el estado
```

### 5️⃣ Verifica el precio en pantalla
- Busca el producto que actualizaste
- El precio debería reflejar el nuevo valor ($9500.00)

## 🐛 Si NO ves los cambios:

### Problema 1: Servidor no está corriendo
```bash
# Verificar procesos Node
Get-Process node

# Si no hay procesos, iniciar servidor:
cd server
npm start
```

### Problema 2: Cache del navegador
1. Abre DevTools (F12)
2. Ve a Network tab
3. Marca "Disable cache"
4. Recarga la página (Ctrl + F5)
5. Haz clic en "🔄 Recargar"

### Problema 3: Datos mock en lugar de API
En la consola, si ves:
```
⚠️ API no disponible, usando datos mock
```
Significa que no se está conectando al backend. Verifica:
- Servidor corriendo en puerto 4000
- Sin errores de CORS
- URL correcta: http://localhost:4000

### Problema 4: Productos no sincronizados
Si el producto del vendedor no existe en la tabla `products`:
```bash
cd server
node sync_tables.js
```

## 🧪 Scripts de prueba disponibles:

### Test 1: Verificar base de datos
```bash
cd server
node test_price_sync.js
```

### Test 2: Probar flujo de vendedor
```bash
cd server
node test_seller_flow.js
```

### Test 3: Prueba completa
```bash
cd server
node test_price_update_complete.js
```

### Test 4: Sincronizar tablas
```bash
cd server
node sync_tables.js
```

## 📊 Verificación manual con curl (PowerShell):

```powershell
# Ver todos los productos y precios
Invoke-WebRequest -Uri "http://localhost:4000/api/products" | 
  Select-Object -ExpandProperty Content | 
  ConvertFrom-Json | 
  Select-Object title, price | 
  Format-Table

# Ver un producto específico
Invoke-WebRequest -Uri "http://localhost:4000/api/products/1" | 
  Select-Object -ExpandProperty Content | 
  ConvertFrom-Json
```

## 💡 Notas importantes:

1. **El botón "🔄 Recargar"** es tu mejor amigo - úsalo después de cambiar precios
2. **La consola del navegador** te dirá exactamente qué está pasando
3. **Los logs del servidor** también muestran qué está sucediendo en el backend
4. Los cambios son **instantáneos en la base de datos**, pero el frontend necesita recargar
5. El cache del navegador puede causar que veas datos antiguos - desactívalo en DevTools

## ✅ Confirmación visual:

Cuando todo funciona correctamente verás:
1. 💾 Mensaje en dashboard del vendedor: "Cambios guardados"
2. 🔄 Logs en consola del navegador mostrando carga desde API
3. 💰 Nuevo precio visible en la tarjeta del producto
4. 📊 Precio actualizado en la base de datos (verificable con scripts)

---

**¿Sigues teniendo problemas?**
- Revisa los logs en la consola del navegador
- Revisa los logs del servidor Node.js
- Ejecuta los scripts de prueba para confirmar que el backend funciona
- Asegúrate de hacer clic en "🔄 Recargar" después de cambiar precios

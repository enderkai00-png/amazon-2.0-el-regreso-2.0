import React, { useState, useEffect } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonGrid, 
  IonRow, 
  IonCol,
  IonLoading,
  IonSearchbar,
  IonButton,
  IonText,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonModal
} from '@ionic/react';
import { arrowBack, cart, star, filter } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import AmazonFilterComponent from '../components/AmazonFilterComponent';
import { useCart } from '../context/CartContext';

// Datos de productos
const mockProducts = [
  { id: '1', nombre: 'Smartphone Galaxy X', precio: 599.99, categoria: 'Electrónica', stock: 50, marca: 'Samsung', rating: 4.5 },
  { id: '2', nombre: 'Zapatillas Running Pro', precio: 89.99, categoria: 'Moda', stock: 75, marca: 'Nike', rating: 4.3 },
  { id: '3', nombre: 'Sartén Antiadherente', precio: 45.50, categoria: 'Hogar', stock: 200, marca: 'Tefal', rating: 4.6 },
  { id: '4', nombre: 'Auriculares Bluetooth', precio: 79.99, categoria: 'Electrónica', stock: 30, marca: 'Sony', rating: 4.2 },
  { id: '5', nombre: 'Libro de Cocina', precio: 25.99, categoria: 'Libros', stock: 100, marca: 'Editorial', rating: 4.7 },
  { id: '6', nombre: 'Balón de Fútbol', precio: 29.99, categoria: 'Deportes', stock: 150, marca: 'Adidas', rating: 4.4 },
  { id: '7', nombre: 'Laptop Gaming', precio: 1299.99, categoria: 'Electrónica', stock: 15, marca: 'ASUS', rating: 4.8 },
  { id: '8', nombre: 'Jeans Modernos', precio: 59.99, categoria: 'Moda', stock: 80, marca: 'Levi\'s', rating: 4.1 }
];

const Productos: React.FC = () => {
  const history = useHistory();
  const { addItem, itemCount } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const categories = ['all', 'Electrónica', 'Moda', 'Hogar', 'Deportes', 'Libros'];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      console.log('🔄 Cargando productos desde:', `${apiBase}/api/products`);
      
      const res = await fetch(`${apiBase}/api/products`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Productos recibidos desde API:', data.length, 'productos');
        console.log('📊 Primeros precios:', data.slice(0, 3).map((p: any) => `${p.title}: $${p.price}`));
        
        // Mapear los datos del backend al formato esperado
        const mappedProducts = data.map((p: any) => ({
          id: String(p.id),
          nombre: p.title || p.nombre,
          precio: Number(p.price || p.precio),
          categoria: p.category || p.categoria,
          stock: p.stock || 0,
          marca: p.marca || 'Generic',
          rating: p.rating || 4.0,
          imagen: p.image || p.imagen
        }));
        setProducts(mappedProducts);
        setFilteredProducts(mappedProducts);
        console.log('✅ Productos actualizados en el estado');
      } else {
        console.warn('⚠️ API no disponible, usando datos mock');
        // Fallback a mock data si falla la API
        console.warn('Failed to load products from API, using mock data');
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      // Fallback a mock data
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = products;
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.marca.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.categoria === selectedCategory);
    }
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setFilteredProducts(products);
  };

  const handleAdvancedFilterChange = (filteredProducts: any[]) => {
    setFilteredProducts(filteredProducts);
  };

  const addToCart = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se dispare el click del card
    try {
      await addItem(
        product.id || product.nombre,
        1,
        {
          title: product.nombre,
          price: product.precio,
          image: product.imagen || `https://via.placeholder.com/100?text=${encodeURIComponent(product.nombre)}`
        }
      );
      alert(`¡${product.nombre} agregado al carrito!`);
    } catch (err) {
      console.error('Error agregando al carrito', err);
      alert('No se pudo agregar al carrito');
    }
  };

  const viewProductDetail = (productId: string) => {
    history.push(`/producto/${productId}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.push('/')}>
              <IonIcon icon={arrowBack} slot="start" />
              Inicio
            </IonButton>
            <IonButton onClick={() => loadProducts()} color="primary">
              🔄 Recargar
            </IonButton>
          </IonButtons>
          <IonTitle>Productos</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/carrito')}>
              <div style={{ position: 'relative' }}>
                <IonIcon icon={cart} slot="start" />
                {itemCount > 0 && (
                  <IonBadge 
                    color="danger" 
                    style={{ 
                      position: 'absolute', 
                      top: '-8px', 
                      right: '-8px',
                      fontSize: '10px',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      padding: '2px 4px'
                    }}
                  >
                    {itemCount}
                  </IonBadge>
                )}
              </div>
              Carrito
            </IonButton>
            <IonButton onClick={() => setShowAdvancedFilters(true)}>
              <IonIcon icon={filter} slot="start" />
              Filtros
            </IonButton>
            <IonButton onClick={clearFilters}>
              Limpiar
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        {/* Filtros básicos */}
        <div style={{ padding: '16px', background: '#f8f9fa' }}>
          <IonSearchbar
            value={searchTerm}
            onIonInput={(e: any) => setSearchTerm(e.detail.value)}
            placeholder="Buscar productos..."
            style={{ marginBottom: '16px' }}
          />
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <IonSelect
              value={selectedCategory}
              placeholder="Todas las categorías"
              onIonChange={(e: any) => setSelectedCategory(e.detail.value)}
              style={{ flex: 1 }}
            >
              {categories.map(category => (
                <IonSelectOption key={category} value={category}>
                  {category === 'all' ? 'Todas las categorías' : category}
                </IonSelectOption>
              ))}
            </IonSelect>
            
            <IonButton 
              onClick={() => setShowAdvancedFilters(true)}
              fill="outline"
              size="default"
            >
              <IonIcon icon={filter} />
              Avanzado
            </IonButton>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Cargando productos..." />

        {/* Información de resultados */}
        {!loading && (
          <div style={{ padding: '12px 16px', background: 'white' }}>
            <IonText color="medium">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
              {selectedCategory !== 'all' && ` en ${selectedCategory}`}
              {searchTerm && ` para "${searchTerm}"`}
            </IonText>
          </div>
        )}

        {/* Grid de productos */}
        <IonGrid style={{ padding: '16px' }}>
          <IonRow>
            {filteredProducts.map(product => (
              <IonCol size="12" size-md="6" size-lg="4" key={product.id}>
                <IonCard 
                  style={{ margin: '0 0 16px 0', cursor: 'pointer' }}
                  onClick={() => viewProductDetail(product.id)}
                >
                  <IonCardHeader style={{ padding: '16px 16px 8px 16px' }}>
                    <IonCardTitle style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {product.nombre}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent style={{ padding: '0 16px 16px 16px' }}>
                    <div style={{ 
                      height: '120px', 
                      background: '#f5f5f5', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px'
                    }}>
                      <IonIcon icon={cart} size="large" color="medium" />
                    </div>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <IonBadge color="warning">
                        <IonIcon icon={star} style={{ marginRight: '4px' }} />
                        {product.rating}
                      </IonBadge>
                    </div>

                    <IonText color="primary" style={{ fontSize: '18px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                      ${product.precio}
                    </IonText>
                    
                    <IonText color="medium" style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                      {product.marca}
                    </IonText>
                    
                    <IonText color="medium" style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                      {product.categoria}
                    </IonText>
                    
                    <IonText color={product.stock > 0 ? 'success' : 'danger'} style={{ display: 'block', marginBottom: '12px', fontSize: '12px' }}>
                      {product.stock > 0 ? `Stock: ${product.stock}` : 'Agotado'}
                    </IonText>
                    
                    <IonButton 
                      expand="block" 
                      size="small"
                      onClick={(e) => addToCart(product, e)}
                      disabled={product.stock === 0}
                    >
                      <IonIcon icon={cart} slot="start" />
                      Agregar al Carrito
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        {filteredProducts.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
            <IonText>
              <h3>No se encontraron productos</h3>
              <p>Intenta con otros filtros o términos de búsqueda</p>
            </IonText>
            <IonButton fill="outline" onClick={clearFilters}>
              Limpiar filtros
            </IonButton>
          </div>
        )}

        {/* Modal de Filtros Avanzados */}
        <IonModal 
          isOpen={showAdvancedFilters} 
          onDidDismiss={() => setShowAdvancedFilters(false)}
        >
          <AmazonFilterComponent
            isOpen={showAdvancedFilters}
            onClose={() => setShowAdvancedFilters(false)}
            products={products}
            onFilterChange={handleAdvancedFilterChange}
          />
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Productos;
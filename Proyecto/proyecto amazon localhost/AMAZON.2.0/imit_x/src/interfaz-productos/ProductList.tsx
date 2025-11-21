import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonText,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonFab,
  IonFabButton,
  IonFabList
} from '@ionic/react';
import { cart, filter, arrowBack, star, heart, funnel } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Producto, FiltrosProducto } from './types';
import './ProductList.css';
import * as cartService from '../services/cart.service';

// Datos de ejemplo ampliados de la base de datos de Cristian
const MOCK_PRODUCTS: Producto[] = [
  {
    id: '1',
    nombre: 'Smartphone Galaxy X',
    precio: 599.99,
    categoria: 'Electrónica',
    vendedor_id: 'vendor_1',
    stock: 50,
    descripcion: 'Smartphone de última generación',
    marca: 'Samsung',
    rating: 4.7,
    reviews: 324,
    envio_gratis: true
  },
  {
    id: '2',
    nombre: 'Zapatillas Running Pro',
    precio: 89.99,
    categoria: 'Moda',
    vendedor_id: 'vendor_2',
    stock: 75,
    descripcion: 'Zapatillas deportivas profesionales',
    marca: 'Nike',
    rating: 4.5,
    reviews: 156,
    envio_gratis: true
  },
  {
    id: '3',
    nombre: 'Sartén Antiadherente',
    precio: 45.50,
    categoria: 'Hogar',
    vendedor_id: 'vendor_3',
    stock: 200,
    descripcion: 'Sartén de 32cm con revestimiento cerámico',
    marca: 'Tefal',
    rating: 4.6,
    reviews: 89,
    envio_gratis: true
  },
  {
    id: '4',
    nombre: 'Auriculares Bluetooth',
    precio: 79.99,
    categoria: 'Electrónica',
    vendedor_id: 'vendor_1',
    stock: 30,
    descripcion: 'Auriculares inalámbricos con cancelación de ruido',
    marca: 'Sony',
    rating: 4.4,
    reviews: 212,
    envio_gratis: false
  },
  {
    id: '5',
    nombre: 'Libro de Cocina',
    precio: 25.99,
    categoria: 'Libros',
    vendedor_id: 'vendor_4',
    stock: 100,
    descripcion: 'Recetas internacionales y técnicas culinarias',
    marca: 'Editorial Premium',
    rating: 4.8,
    reviews: 67,
    envio_gratis: true
  },
  {
    id: '6',
    nombre: 'Balón de Fútbol',
    precio: 29.99,
    categoria: 'Deportes',
    vendedor_id: 'vendor_5',
    stock: 150,
    descripcion: 'Balón oficial profesional',
    marca: 'Adidas',
    rating: 4.7,
    reviews: 143,
    envio_gratis: true
  },
  {
    id: '7',
    nombre: 'Laptop Gaming',
    precio: 1299.99,
    categoria: 'Electrónica',
    vendedor_id: 'vendor_1',
    stock: 15,
    descripcion: 'Laptop gaming de alto rendimiento',
    marca: 'ASUS',
    rating: 4.9,
    reviews: 298,
    envio_gratis: true
  },
  {
    id: '8',
    nombre: 'Jeans Modernos',
    precio: 59.99,
    categoria: 'Moda',
    vendedor_id: 'vendor_2',
    stock: 80,
    descripcion: 'Jeans ajustados estilo casual',
    marca: 'Levis',
    rating: 4.3,
    reviews: 176,
    envio_gratis: false
  }
];

const CATEGORIAS = ['Todos', 'Electrónica', 'Moda', 'Hogar', 'Deportes', 'Libros'];

const ProductList: React.FC = () => {
  const history = useHistory();
  const [products, setProducts] = useState<Producto[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayedProducts, setDisplayedProducts] = useState<Producto[]>([]);
  const [isInfiniteDisabled, setIsInfiniteDisabled] = useState(false);

  const [filtros, setFiltros] = useState<FiltrosProducto>({
    search: '',
    categoria: 'Todos',
    precioMin: 0,
    precioMax: 2000,
    ordenar: 'rating'
  });

  const [showFilters, setShowFilters] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());

  // Cargar productos desde el backend
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      console.log('🛒 ProductList - Cargando desde:', `${apiBase}/api/products`);
      
      const res = await fetch(`${apiBase}/api/products`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ ProductList - Productos recibidos:', data.length);
        console.log('💰 ProductList - Precios:', data.slice(0, 3).map((p: any) => `${p.title}: $${p.price}`));
        
        // Mapear los datos del backend al formato esperado
        const mappedProducts: Producto[] = data.map((p: any) => ({
          id: String(p.id),
          nombre: p.title || p.nombre,
          precio: Number(p.price || p.precio),
          categoria: p.category || p.categoria,
          stock: p.stock || 0,
          marca: p.marca || 'Generic',
          rating: p.rating || 4.0,
          reviews: p.reviews || 0,
          descripcion: p.description || p.descripcion,
          imagen: p.image || p.imagen,
          envio_gratis: p.envio_gratis !== undefined ? p.envio_gratis : true,
          vendedor_id: p.seller_id || p.vendedor_id,
          caracteristicas: p.caracteristicas || []
        }));
        setProducts(mappedProducts);
        setFilteredProducts(mappedProducts);
        setDisplayedProducts(mappedProducts.slice(0, 4));
        console.log('✅ ProductList - Estado actualizado');
      } else {
        console.warn('⚠️ ProductList - Failed to load from API, using mock data');
        setProducts(MOCK_PRODUCTS);
        setFilteredProducts(MOCK_PRODUCTS);
        setDisplayedProducts(MOCK_PRODUCTS.slice(0, 4));
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts(MOCK_PRODUCTS);
      setFilteredProducts(MOCK_PRODUCTS);
      setDisplayedProducts(MOCK_PRODUCTS.slice(0, 4));
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = products;

    // Filtro de búsqueda
    if (filtros.search) {
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(filtros.search.toLowerCase()) ||
        p.marca.toLowerCase().includes(filtros.search.toLowerCase())
      );
    }

    // Filtro de categoría
    if (filtros.categoria !== 'Todos') {
      filtered = filtered.filter(p => p.categoria === filtros.categoria);
    }

    // Filtro de precio
    filtered = filtered.filter(p =>
      p.precio >= filtros.precioMin && p.precio <= filtros.precioMax
    );

    // Ordenamiento
    const sortedFiltered = [...filtered].sort((a, b) => {
      switch (filtros.ordenar) {
        case 'precio_asc':
          return a.precio - b.precio;
        case 'precio_desc':
          return b.precio - a.precio;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'nuevo':
          return 0; // En real, ordenar por fecha
        default:
          return 0;
      }
    });

    setFilteredProducts(sortedFiltered);
    setDisplayedProducts(sortedFiltered.slice(0, 4));
    setIsInfiniteDisabled(false);
  }, [filtros, products]);

  const handleSearchChange = (e: any) => {
    setFiltros({ ...filtros, search: e.detail.value || '' });
  };

  const handleCategoryChange = (categoria: string) => {
    setFiltros({ ...filtros, categoria });
  };

  const handleOrderChange = (ordenar: any) => {
    setFiltros({ ...filtros, ordenar: ordenar.detail.value });
  };

  const handleInfiniteScroll = async (ev: any) => {
    const nextIndex = displayedProducts.length + 4;
    if (nextIndex >= filteredProducts.length) {
      setIsInfiniteDisabled(true);
      ev.target.complete();
      return;
    }
    setDisplayedProducts([...displayedProducts, ...filteredProducts.slice(displayedProducts.length, nextIndex)]);
    ev.target.complete();
  };

  const toggleFavorito = async (productId: string) => {
    const clientId = localStorage.getItem('client_id');
    if (!clientId) {
      alert('Debes iniciar sesión para agregar favoritos');
      return;
    }

    const isFavorite = favoritos.has(productId);
    const newFavoritos = new Set(favoritos);
    
    if (isFavorite) {
      newFavoritos.delete(productId);
    } else {
      newFavoritos.add(productId);
    }
    
    setFavoritos(newFavoritos);
    
    try {
      await favoritesService.toggleFavorite(clientId, productId, isFavorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revertir cambio en caso de error
      setFavoritos(favoritos);
    }
  };

  const handleAddToCart = async (product: Producto) => {
    try {
      await cartService.addToCart(product.id || product.nombre);
      alert(`¡${product.nombre} agregado al carrito!`);
    } catch (err) {
      console.error('Error agregando al carrito', err);
      alert('No se pudo agregar al carrito');
    }
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
          </IonButtons>
          <IonTitle>Productos</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={filtros.search}
            onIonChange={handleSearchChange}
            placeholder="Buscar productos..."
            animated={true}
          />
        </IonToolbar>
      </IonHeader>

      <IonContent className="product-list-content">
        {loading ? (
          <div className="loading-container">
            <IonSpinner />
            <p>Cargando productos...</p>
          </div>
        ) : (
          <>
            {/* Filtro de categoría */}
            <div className="category-filter">
              <IonSegment value={filtros.categoria} onIonChange={(e) => handleCategoryChange(e.detail.value as string)}>
                {CATEGORIAS.map(cat => (
                  <IonSegmentButton key={cat} value={cat}>
                    {cat}
                  </IonSegmentButton>
                ))}
              </IonSegment>
            </div>

            {/* Opciones de ordenamiento */}
            <div className="sort-container">
              <IonSelect
                value={filtros.ordenar}
                onIonChange={handleOrderChange}
                placeholder="Ordenar por"
                className="sort-select"
              >
                <IonSelectOption value="rating">Mayor rating</IonSelectOption>
                <IonSelectOption value="precio_asc">Precio: Menor a Mayor</IonSelectOption>
                <IonSelectOption value="precio_desc">Precio: Mayor a Menor</IonSelectOption>
                <IonSelectOption value="nuevo">Más Nuevo</IonSelectOption>
              </IonSelect>
            </div>

            {/* Grid de productos */}
            {displayedProducts.length > 0 ? (
              <IonGrid>
                <IonRow>
                  {displayedProducts.map(product => (
                    <IonCol key={product.id} sizeSm="12" sizeMd="6" sizeLg="4" className="product-col">
                      <IonCard className="product-card">
                        {/* Imagen placeholder */}
                        <div className="product-card-image">
                          <div className="image-placeholder">
                            <IonIcon icon={cart} size="large" color="medium" />
                          </div>
                          {product.envio_gratis && (
                            <IonBadge color="success" className="free-ship-badge">Envío Gratis</IonBadge>
                          )}
                          <IonButton
                            fill="clear"
                            className="favorite-button"
                            onClick={() => toggleFavorito(product.id)}
                          >
                            <IonIcon
                              icon={heart}
                              color={favoritos.has(product.id) ? 'danger' : 'medium'}
                              className={favoritos.has(product.id) ? 'liked' : ''}
                            />
                          </IonButton>
                        </div>

                        <IonCardHeader>
                          <IonCardTitle className="product-name">
                            {product.nombre}
                          </IonCardTitle>
                          <div className="product-brand-category">
                            <IonBadge color="medium">{product.marca}</IonBadge>
                            <IonBadge color="secondary">{product.categoria}</IonBadge>
                          </div>
                        </IonCardHeader>

                        <IonCardContent className="product-card-content">
                          {/* Rating */}
                          <div className="rating-container">
                            <IonIcon icon={star} color="warning" />
                            <span className="rating-value">{product.rating}</span>
                            <span className="reviews">({product.reviews} reseñas)</span>
                          </div>

                          {/* Precio */}
                          <div className="price-container">
                            <span className="price-amount">${product.precio.toFixed(2)}</span>
                          </div>

                          {/* Stock */}
                          <div className="stock-badge-container">
                            {product.stock > 0 ? (
                              <IonBadge color="success">
                                {product.stock} en stock
                              </IonBadge>
                            ) : (
                              <IonBadge color="danger">Agotado</IonBadge>
                            )}
                          </div>

                          {/* Botones */}
                          <div className="card-buttons">
                            <IonButton
                              expand="block"
                              size="small"
                              color="primary"
                              onClick={() => handleAddToCart(product)}
                              disabled={product.stock === 0}
                            >
                              <IonIcon icon={cart} slot="start" />
                              Agregar
                            </IonButton>
                            <IonButton
                              expand="block"
                              size="small"
                              fill="outline"
                              onClick={() => history.push(`/producto/${product.id}`)}
                            >
                              Ver detalle
                            </IonButton>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  ))}
                </IonRow>

                <IonInfiniteScroll
                  onIonInfinite={handleInfiniteScroll}
                  threshold="100px"
                  disabled={isInfiniteDisabled}
                >
                  <IonInfiniteScrollContent
                    loadingSpinner="bubbles"
                    loadingText="Cargando más productos..."
                  />
                </IonInfiniteScroll>
              </IonGrid>
            ) : (
              <div className="no-products">
                <IonText color="medium">
                  <p>No se encontraron productos</p>
                </IonText>
              </div>
            )}
          </>
        )}
      </IonContent>

      {/* Botón flotante para filtros avanzados */}
      <IonFab horizontal="end" vertical="bottom" slot="fixed">
        <IonFabButton onClick={() => setShowFilters(!showFilters)}>
          <IonIcon icon={funnel} />
        </IonFabButton>
        <IonFabList side="top">
          <IonFabButton color="secondary">
            <IonIcon icon={filter} />
          </IonFabButton>
        </IonFabList>
      </IonFab>
    </IonPage>
  );
};

export default ProductList;

import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonText,
  IonButtons,
  IonInput,
  IonSpinner,
  IonAlert
} from '@ionic/react';
import { arrowBack, cart, star, heart, share, shield } from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { Producto, Direccion } from './types';
import './ProductDetail.css';
import AddressForm from './formularios/AddressForm';
import { useCart } from '../context/CartContext';
import ReviewComponent from '../components/ReviewComponent';

interface ProductDetailProps {
  product?: Producto;
}

// Datos de productos (igual que en productos.tsx)
const MOCK_PRODUCTS = [
  { id: '1', nombre: 'Smartphone Galaxy X', precio: 599.99, categoria: 'Electrónica', stock: 50, marca: 'Samsung', rating: 4.5, 
    descripcion: 'Smartphone de última generación con pantalla AMOLED 6.7", procesador de 8 núcleos, cámara de 108MP y batería de 5000mAh.',
    caracteristicas: ['Pantalla AMOLED 6.7"', 'Procesador Snapdragon 8 Gen 2', '12GB RAM', '256GB Almacenamiento', 'Cámara Principal: 108MP', 'Batería: 5000mAh', '5G Compatible'],
    reviews: 324, envio_gratis: true, vendedor_id: 'vendor_1', imagen: 'https://via.placeholder.com/400x400?text=Galaxy+X' },
  { id: '2', nombre: 'Zapatillas Running Pro', precio: 89.99, categoria: 'Moda', stock: 75, marca: 'Nike', rating: 4.3,
    descripcion: 'Zapatillas deportivas profesionales con tecnología de amortiguación avanzada y diseño transpirable.',
    caracteristicas: ['Amortiguación React', 'Suela de goma duradera', 'Diseño transpirable', 'Soporte para el arco', 'Peso ligero'],
    reviews: 156, envio_gratis: true, vendedor_id: 'vendor_2', imagen: 'https://via.placeholder.com/400x400?text=Zapatillas' },
  { id: '3', nombre: 'Sartén Antiadherente', precio: 45.50, categoria: 'Hogar', stock: 200, marca: 'Tefal', rating: 4.6,
    descripcion: 'Sartén de 32cm con revestimiento cerámico antiadherente y mango ergonómico.',
    caracteristicas: ['Revestimiento cerámico', 'Diámetro 32cm', 'Apto para inducción', 'Mango ergonómico', 'Libre de PFOA'],
    reviews: 89, envio_gratis: true, vendedor_id: 'vendor_3', imagen: 'https://via.placeholder.com/400x400?text=Sarten' },
  { id: '4', nombre: 'Auriculares Bluetooth', precio: 79.99, categoria: 'Electrónica', stock: 30, marca: 'Sony', rating: 4.2,
    descripcion: 'Auriculares inalámbricos con cancelación de ruido activa y hasta 30 horas de batería.',
    caracteristicas: ['Cancelación de ruido activa', 'Bluetooth 5.0', '30 horas de batería', 'Carga rápida', 'Sonido HD'],
    reviews: 212, envio_gratis: false, vendedor_id: 'vendor_1', imagen: 'https://via.placeholder.com/400x400?text=Auriculares' },
  { id: '5', nombre: 'Libro de Cocina', precio: 25.99, categoria: 'Libros', stock: 100, marca: 'Editorial', rating: 4.7,
    descripcion: 'Libro con 500 recetas internacionales y técnicas culinarias profesionales.',
    caracteristicas: ['500 recetas', 'Fotos a color', 'Técnicas profesionales', 'Índice detallado', 'Tapa dura'],
    reviews: 67, envio_gratis: true, vendedor_id: 'vendor_4', imagen: 'https://via.placeholder.com/400x400?text=Libro+Cocina' },
  { id: '6', nombre: 'Balón de Fútbol', precio: 29.99, categoria: 'Deportes', stock: 150, marca: 'Adidas', rating: 4.4,
    descripcion: 'Balón oficial de fútbol profesional con tecnología de panel termosellado.',
    caracteristicas: ['Talla oficial 5', 'Paneles termosellados', 'Certificación FIFA', 'Cámara de látex', 'Resistente al agua'],
    reviews: 143, envio_gratis: true, vendedor_id: 'vendor_5', imagen: 'https://via.placeholder.com/400x400?text=Balon' },
  { id: '7', nombre: 'Laptop Gaming', precio: 1299.99, categoria: 'Electrónica', stock: 15, marca: 'ASUS', rating: 4.8,
    descripcion: 'Laptop gaming de alto rendimiento con procesador Intel i7 y tarjeta gráfica RTX 4060.',
    caracteristicas: ['Intel Core i7 13th Gen', 'RTX 4060 8GB', '16GB DDR5 RAM', '1TB SSD', 'Pantalla 144Hz', 'RGB Backlit Keyboard'],
    reviews: 298, envio_gratis: true, vendedor_id: 'vendor_1', imagen: 'https://via.placeholder.com/400x400?text=Laptop+Gaming' },
  { id: '8', nombre: 'Jeans Modernos', precio: 59.99, categoria: 'Moda', stock: 80, marca: 'Levi\'s', rating: 4.1,
    descripcion: 'Jeans ajustados de estilo casual con diseño moderno y tela elástica.',
    caracteristicas: ['Tela elástica', 'Corte ajustado', '98% algodón', 'Diseño moderno', 'Disponible en varios colores'],
    reviews: 176, envio_gratis: false, vendedor_id: 'vendor_2', imagen: 'https://via.placeholder.com/400x400?text=Jeans' }
];

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const { addItem, itemCount } = useCart();
  const [currentProduct, setCurrentProduct] = useState<Producto | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [lastSavedAddress, setLastSavedAddress] = useState<Direccion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar el producto desde la API primero, luego desde MOCK_PRODUCTS
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/products/${id}`);
      
      if (res.ok) {
        const data = await res.json();
        // Mapear el producto del backend al formato esperado
        const mappedProduct: Producto = {
          id: String(data.id),
          nombre: data.title || data.nombre,
          precio: Number(data.price || data.precio),
          categoria: data.category || data.categoria,
          stock: data.stock || 0,
          marca: data.marca || 'Generic',
          rating: data.rating || 4.0,
          reviews: data.reviews || 0,
          descripcion: data.description || data.descripcion,
          imagen: data.image || data.imagen || `https://via.placeholder.com/400x400?text=${encodeURIComponent(data.title || data.nombre)}`,
          envio_gratis: data.envio_gratis !== undefined ? data.envio_gratis : true,
          vendedor_id: data.seller_id || data.vendedor_id,
          caracteristicas: data.caracteristicas || []
        };
        setCurrentProduct(mappedProduct);
      } else {
        // Fallback a MOCK_PRODUCTS
        const foundProduct = MOCK_PRODUCTS.find(p => p.id === id);
        if (foundProduct) {
          setCurrentProduct(foundProduct as Producto);
        }
      }
    } catch (err) {
      console.error('Error loading product:', err);
      // Fallback a MOCK_PRODUCTS
      const foundProduct = MOCK_PRODUCTS.find(p => p.id === id);
      if (foundProduct) {
        setCurrentProduct(foundProduct as Producto);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-text-center ion-padding">
          <IonSpinner />
          <p>Cargando producto...</p>
        </IonContent>
      </IonPage>
    );
  }

  if (!currentProduct) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => history.push('/productos')}>
                <IonIcon icon={arrowBack} slot="start" />
                Volver
              </IonButton>
            </IonButtons>
            <IonTitle>Producto no encontrado</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-text-center ion-padding">
          <h2>Producto no encontrado</h2>
          <IonButton onClick={() => history.push('/productos')}>
            Ver todos los productos
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  const handleAddToCart = () => {
    if (quantity < 1) {
      setAlertMessage('La cantidad debe ser mayor a 0');
      setShowAlert(true);
      return;
    }
    if (quantity > currentProduct.stock) {
      setAlertMessage(`Stock máximo disponible: ${currentProduct.stock}`);
      setShowAlert(true);
      return;
    }
    // Abrir modal de dirección antes de confirmar compra
    setAddressModalOpen(true);
  };

  const saveAddressAndCheckout = async (address: Direccion) => {
    try {
      // POST a backend para guardar la dirección
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address)
      });
      if (!res.ok) throw new Error('Error guardando dirección');
      const data = await res.json();
      setLastSavedAddress({ ...address, id: data.id });
      // Add to cart after saving address
      try {
        await addItem(
          currentProduct.id || currentProduct.nombre, 
          quantity,
          {
            title: currentProduct.nombre,
            price: currentProduct.precio,
            image: currentProduct.imagen || `https://via.placeholder.com/100?text=${encodeURIComponent(currentProduct.nombre)}`
          }
        );
      } catch (e) {
        console.warn('No se pudo agregar al carrito tras guardar dirección:', e);
      }
      setAddressModalOpen(false);
      setAlertMessage(`¡${currentProduct.nombre} agregado al carrito! (x${quantity})`);
      setShowAlert(true);
      setTimeout(() => history.push('/productos'), 1500);
    } catch (err) {
      console.error(err);
      setAlertMessage('Error guardando la dirección. Intenta de nuevo.');
      setShowAlert(true);
    }
  };

  const handleQuantityChange = (value: string | number | null | undefined) => {
    const num = Number(value) || 0;
    setQuantity(Math.max(1, num));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.push('/productos')}>
              <IonIcon icon={arrowBack} slot="start" />
              Volver
            </IonButton>
          </IonButtons>
          <IonTitle>Detalle del Producto</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/carrito')}>
              <div style={{ position: 'relative' }}>
                <IonIcon icon={cart} />
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
            </IonButton>
            <IonButton onClick={() => setLiked(!liked)}>
              <IonIcon 
                icon={heart} 
                color={liked ? 'danger' : 'medium'}
                className={liked ? 'liked' : ''}
              />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="product-detail-content">
        {/* Imagen del producto */}
        <div className="product-image-container">
          <img 
            src={currentProduct.imagen} 
            alt={currentProduct.nombre}
            className="product-image"
          />
          {currentProduct.envio_gratis && (
            <IonBadge color="success" className="free-shipping-badge">
              ✈️ Envío Gratis
            </IonBadge>
          )}
        </div>

        <IonCard className="product-info-card">
          {/* Título y Rating */}
          <IonCardHeader>
            <IonCardTitle className="product-title">
              {currentProduct.nombre}
            </IonCardTitle>
            <div className="product-rating">
              <IonIcon icon={star} color="warning" />
              <span>{currentProduct.rating}</span>
              <span className="reviews-count">({currentProduct.reviews} reseñas)</span>
            </div>
          </IonCardHeader>

          <IonCardContent>
            {/* Marca y Categoría */}
            <div className="product-meta">
              <IonBadge color="medium">{currentProduct.marca}</IonBadge>
              <IonBadge color="secondary">{currentProduct.categoria}</IonBadge>
            </div>

            {/* Precio */}
            <div className="price-section">
              <span className="currency">$</span>
              <span className="price-main">{currentProduct.precio.toFixed(2)}</span>
              <IonBadge color="success" className="price-badge">
                Precio actual
              </IonBadge>
            </div>

            {/* Descripción */}
            <p className="product-description">
              {currentProduct.descripcion}
            </p>

            {/* Características */}
            <div className="features-section">
              <h3>Características principales:</h3>
              <ul className="features-list">
                {currentProduct.caracteristicas?.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            {/* Stock */}
            <div className="stock-section">
              {currentProduct.stock > 0 ? (
                <>
                  <IonBadge color="success">
                    {currentProduct.stock} en stock
                  </IonBadge>
                  <span className="stock-text">Disponible para envío</span>
                </>
              ) : (
                <IonBadge color="danger">Agotado</IonBadge>
              )}
            </div>

            {/* Cantidad */}
            {currentProduct.stock > 0 && (
              <div className="quantity-section">
                <label>Cantidad:</label>
                <IonInput
                  type="number"
                  min={1}
                  max={currentProduct.stock}
                  value={quantity}
                  onIonChange={(e) => handleQuantityChange(e.detail.value)}
                  className="quantity-input"
                />
                <span className="quantity-info">
                  (máx. {currentProduct.stock} disponibles)
                </span>
              </div>
            )}

            {/* Beneficios */}
            <div className="benefits-section">
              <div className="benefit-item">
                <span className="benefit-emoji">📦</span>
                <div>
                  <strong>Envío Rápido</strong>
                  <p>Entrega en 2-3 días hábiles</p>
                </div>
              </div>
              <div className="benefit-item">
                <IonIcon icon={shield} color="primary" />
                <div>
                  <strong>Compra Protegida</strong>
                  <p>Garantía de satisfacción</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-emoji">↩️</span>
                <div>
                  <strong>Devoluciones</strong>
                  <p>30 días para devolver</p>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="action-buttons">
              <IonButton
                expand="block"
                color="primary"
                size="large"
                onClick={handleAddToCart}
                disabled={currentProduct.stock === 0}
              >
                <IonIcon icon={cart} slot="start" />
                Agregar al Carrito
              </IonButton>
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => {
                  setAlertMessage('Producto compartido en redes sociales');
                  setShowAlert(true);
                }}
              >
                <IonIcon icon={share} slot="start" />
                Compartir
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Reseñas y Calificaciones */}
        <ReviewComponent 
          productId={currentProduct.id || currentProduct.nombre} 
          productName={currentProduct.nombre}
        />

        {/* Address modal */}
        <AddressForm
          isOpen={addressModalOpen}
          onClose={() => setAddressModalOpen(false)}
          onSave={saveAddressAndCheckout}
          defaultClientId={null}
        />

        {/* Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default ProductDetail;

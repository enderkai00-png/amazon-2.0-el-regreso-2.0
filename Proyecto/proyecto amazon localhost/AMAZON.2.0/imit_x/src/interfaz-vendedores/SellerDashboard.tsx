import React, { useState, useEffect } from 'react';
import './SellerDashboard.css';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonButton,
  IonIcon,
  IonList,
  IonSearchbar,
  IonBadge,
  IonText,
  IonAlert,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonModal
} from '@ionic/react';
import { save, add, trash, trendingUp, cube, cash, arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

interface SellerProduct {
  id: string;
  title: string;
  price: number;
  description?: string;
  category?: string;
  image?: string;
  stock?: number;
  siteEnabled: { [site: string]: boolean };
}

const initialProducts: SellerProduct[] = [
  { id: 'P3001', title: 'Smartphone Galaxy X', price: 599.0, description: 'Smartphone de última generación', category: 'Electrónica', stock: 50, siteEnabled: { DE: true, ES: true, IT: true } },
  { id: 'P3002', title: "Novela 'El Susurro'", price: 18.9, description: 'Novela bestseller', category: 'Libros', stock: 100, siteEnabled: { DE: false, ES: true, IT: true } },
  { id: 'P3003', title: 'Zapatillas Running Pro', price: 89.99, description: 'Zapatillas deportivas profesionales', category: 'Moda', stock: 75, siteEnabled: { DE: true, ES: true, IT: false } }
];

const SellerDashboard: React.FC = () => {
  const history = useHistory();
  const [products, setProducts] = useState<SellerProduct[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<SellerProduct[]>(initialProducts);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<SellerProduct>>({
    title: '',
    price: 0,
    description: '',
    category: 'Electrónica',
    stock: 0,
    siteEnabled: { DE: true, ES: true, IT: true }
  });

  console.log('SellerDashboard rendered, products:', products.length);

  useEffect(() => {
    // Try to load saved products from server; if none, keep initialProducts
    const load = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/seller/products');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          setFilteredProducts(data);
        }
      } catch (err) {
        // ignore, keep defaults
        console.warn('Could not load seller products:', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    // Filter products based on search term
    if (!searchTerm) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const updatePrice = (id: string, value: string | number | null) => {
    const price = Number(value) || 0;
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, price } : p)));
  };

  const updateField = (id: string, field: keyof SellerProduct, value: any) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const toggleSite = (id: string, site: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, siteEnabled: { ...p.siteEnabled, [site]: !p.siteEnabled[site] } };
    }));
  };

  const saveChanges = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      console.log('💾 Guardando cambios del vendedor...');
      console.log('📦 Productos a guardar:', products.length);
      
      // Guardar en seller_products (esto automáticamente sincroniza con products)
      const res = await fetch('http://localhost:4000/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });
      
      if (!res.ok) throw new Error('Save failed');
      
      const result = await res.json();
      console.log('✅ Guardado exitoso:', result);
      
      // Sincronización adicional explícita (redundante pero asegura compatibilidad)
      console.log('🔄 Sincronizando precios...');
      const syncRes = await fetch('http://localhost:4000/api/sync-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });
      
      if (syncRes.ok) {
        const syncResult = await syncRes.json();
        console.log('✅ Sincronización completada:', syncResult);
      }
      
      setStatusMessage('✓ Cambios guardados y precios sincronizados. Los clientes verán los nuevos precios al recargar.');
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.error('❌ Error saving products:', err);
      setStatusMessage('✗ Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const addProduct = async () => {
    if (!newProduct.title || !newProduct.price) {
      setStatusMessage('✗ Título y precio son requeridos');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    
    const productId = `P${Date.now()}`;
    const productToAdd = {
      id: productId,
      title: newProduct.title,
      price: Number(newProduct.price),
      description: newProduct.description || '',
      category: newProduct.category || 'Electrónica',
      stock: Number(newProduct.stock) || 0,
      siteEnabled: newProduct.siteEnabled || { DE: true, ES: true, IT: true }
    } as SellerProduct;
    
    setProducts(prev => [...prev, productToAdd]);
    setShowAddModal(false);
    setNewProduct({
      title: '',
      price: 0,
      description: '',
      category: 'Electrónica',
      stock: 0,
      siteEnabled: { DE: true, ES: true, IT: true }
    });
    setStatusMessage('✓ Producto agregado. No olvides guardar los cambios.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const deleteProduct = (id: string) => {
    setProductToDelete(id);
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      setProducts(prev => prev.filter(p => p.id !== productToDelete));
      setStatusMessage('✓ Producto eliminado. No olvides guardar los cambios.');
      setProductToDelete(null);
    }
  };

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (Number(p.price) * (p.stock || 1)), 0);
  const avgPrice = products.length > 0 ? totalValue / products.reduce((sum, p) => sum + (p.stock || 1), 0) : 0;

  return (
    <IonPage className="seller-dashboard-root">
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={() => history.push('/home-vend')}>
              <IonIcon icon={arrowBack} />
              Inicio
            </IonButton>
          </IonButtons>
          <IonTitle>Panel de Vendedor</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowAddModal(true)}>
              <IonIcon icon={add} slot="start" />
              Nuevo
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonGrid style={{ padding: 16, maxWidth: '1400px', margin: '0 auto' }}>
          {/* Estadísticas */}
          <IonRow style={{ marginBottom: 20 }}>
            <IonCol size="12" sizeMd="4">
              <IonCard className="stats-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <IonCardContent style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <IonText style={{ fontSize: '14px', opacity: 0.9 }}>Total Productos</IonText>
                      <h2 style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: 'bold' }}>{totalProducts}</h2>
                    </div>
                    <IonIcon icon={cube} style={{ fontSize: '48px', opacity: 0.7 }} />
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeMd="4">
              <IonCard className="stats-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <IonCardContent style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <IonText style={{ fontSize: '14px', opacity: 0.9 }}>Valor Inventario</IonText>
                      <h2 style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: 'bold' }}>${totalValue.toFixed(0)}</h2>
                    </div>
                    <IonIcon icon={cash} style={{ fontSize: '48px', opacity: 0.7 }} />
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeMd="4">
              <IonCard className="stats-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <IonCardContent style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <IonText style={{ fontSize: '14px', opacity: 0.9 }}>Precio Promedio</IonText>
                      <h2 style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: 'bold' }}>${avgPrice.toFixed(2)}</h2>
                    </div>
                    <IonIcon icon={trendingUp} style={{ fontSize: '48px', opacity: 0.7 }} />
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            {/* Panel de acciones */}
            <IonCol size="12" sizeMd="3">
              <IonCard className="seller-sidebar-card">
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '18px' }}>
                    <IonIcon icon={save} style={{ marginRight: 8 }} />
                    Acciones
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonSearchbar
                    value={searchTerm}
                    onIonInput={(e: any) => setSearchTerm(e.detail.value)}
                    placeholder="Buscar productos..."
                    style={{ marginBottom: 16, padding: 0 }}
                  />
                  
                  <IonButton 
                    expand="block" 
                    onClick={saveChanges} 
                    disabled={saving}
                    className="seller-action-btn"
                    style={{ marginBottom: 12 }}
                  >
                    <IonIcon icon={save} slot="start" /> 
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </IonButton>

                  <IonButton 
                    expand="block" 
                    onClick={() => setShowAddModal(true)}
                    color="success"
                    style={{ marginBottom: 12 }}
                  >
                    <IonIcon icon={add} slot="start" /> 
                    Agregar Producto
                  </IonButton>

                  {statusMessage && (
                    <IonCard style={{ margin: '12px 0', background: statusMessage.includes('✓') ? '#d4edda' : '#f8d7da' }}>
                      <IonCardContent style={{ padding: 12 }}>
                        <IonText style={{ fontSize: '13px', color: statusMessage.includes('✓') ? '#155724' : '#721c24' }}>
                          {statusMessage}
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  )}

                  <div style={{ marginTop: 20, padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
                    <IonText style={{ fontSize: '12px', color: '#666' }}>
                      <strong>Nota:</strong> Los cambios de precio se sincronizarán automáticamente con el catálogo de clientes.
                    </IonText>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Lista de productos */}
            <IonCol size="12" sizeMd="9">
              {filteredProducts.length === 0 ? (
                <IonCard>
                  <IonCardContent style={{ padding: 40, textAlign: 'center' }}>
                    <IonIcon icon={cube} style={{ fontSize: 64, color: '#ccc' }} />
                    <p style={{ color: '#666', marginTop: 16 }}>No se encontraron productos</p>
                  </IonCardContent>
                </IonCard>
              ) : (
                <IonList style={{ background: 'transparent' }}>
                  {filteredProducts.map(p => (
                    <IonCard key={p.id} className="product-card" style={{ marginBottom: 16 }}>
                      <IonCardHeader className="product-card-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <IonCardTitle className="product-title">{p.title}</IonCardTitle>
                          <IonButton fill="clear" color="danger" onClick={() => deleteProduct(p.id)}>
                            <IonIcon icon={trash} />
                          </IonButton>
                        </div>
                      </IonCardHeader>
                      <IonCardContent style={{ padding: 16 }}>
                        <IonGrid>
                          <IonRow>
                            <IonCol size="12" sizeMd="6">
                              <IonItem lines="none">
                                <IonLabel position="stacked" style={{ marginBottom: 8, fontWeight: 600 }}>ID Producto</IonLabel>
                                <IonBadge color="medium">{p.id}</IonBadge>
                              </IonItem>

                              <IonItem>
                                <IonLabel position="stacked">Precio ($)</IonLabel>
                                <IonInput
                                  value={p.price}
                                  type="number"
                                  className="price-input"
                                  onIonChange={(e: any) => updatePrice(p.id, e.detail.value)}
                                />
                              </IonItem>

                              <IonItem>
                                <IonLabel position="stacked">Stock</IonLabel>
                                <IonInput
                                  value={p.stock || 0}
                                  type="number"
                                  onIonChange={(e: any) => updateField(p.id, 'stock', Number(e.detail.value))}
                                />
                              </IonItem>

                              <IonItem>
                                <IonLabel position="stacked">Categoría</IonLabel>
                                <IonSelect
                                  value={p.category || 'Electrónica'}
                                  onIonChange={(e: any) => updateField(p.id, 'category', e.detail.value)}
                                >
                                  <IonSelectOption value="Electrónica">Electrónica</IonSelectOption>
                                  <IonSelectOption value="Moda">Moda</IonSelectOption>
                                  <IonSelectOption value="Hogar">Hogar</IonSelectOption>
                                  <IonSelectOption value="Deportes">Deportes</IonSelectOption>
                                  <IonSelectOption value="Libros">Libros</IonSelectOption>
                                  <IonSelectOption value="Juguetes">Juguetes</IonSelectOption>
                                </IonSelect>
                              </IonItem>
                            </IonCol>

                            <IonCol size="12" sizeMd="6">
                              <IonItem>
                                <IonLabel position="stacked">Descripción</IonLabel>
                                <IonTextarea
                                  value={p.description || ''}
                                  rows={3}
                                  onIonChange={(e: any) => updateField(p.id, 'description', e.detail.value)}
                                />
                              </IonItem>

                              <div style={{ marginTop: 16 }}>
                                <IonLabel style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                  Sitios Habilitados
                                </IonLabel>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                  {Object.keys(p.siteEnabled).map(site => (
                                    <IonItem key={site} className="site-toggle-item" lines="none" style={{ flex: '1 1 100px' }}>
                                      <IonLabel>{site}</IonLabel>
                                      <IonToggle 
                                        checked={p.siteEnabled[site]} 
                                        onIonChange={() => toggleSite(p.id, site)} 
                                      />
                                    </IonItem>
                                  ))}
                                </div>
                              </div>
                            </IonCol>
                          </IonRow>
                        </IonGrid>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </IonList>
              )}
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Modal para agregar producto */}
        <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Agregar Nuevo Producto</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowAddModal(false)}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: 16 }}>
              <IonItem>
                <IonLabel position="stacked">Nombre del Producto *</IonLabel>
                <IonInput
                  value={newProduct.title}
                  onIonChange={(e: any) => setNewProduct({ ...newProduct, title: e.detail.value })}
                  placeholder="Ej: Smartphone Galaxy X"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Precio ($) *</IonLabel>
                <IonInput
                  value={newProduct.price}
                  type="number"
                  onIonChange={(e: any) => setNewProduct({ ...newProduct, price: Number(e.detail.value) })}
                  placeholder="0.00"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Stock</IonLabel>
                <IonInput
                  value={newProduct.stock}
                  type="number"
                  onIonChange={(e: any) => setNewProduct({ ...newProduct, stock: Number(e.detail.value) })}
                  placeholder="0"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Categoría</IonLabel>
                <IonSelect
                  value={newProduct.category}
                  onIonChange={(e: any) => setNewProduct({ ...newProduct, category: e.detail.value })}
                >
                  <IonSelectOption value="Electrónica">Electrónica</IonSelectOption>
                  <IonSelectOption value="Moda">Moda</IonSelectOption>
                  <IonSelectOption value="Hogar">Hogar</IonSelectOption>
                  <IonSelectOption value="Deportes">Deportes</IonSelectOption>
                  <IonSelectOption value="Libros">Libros</IonSelectOption>
                  <IonSelectOption value="Juguetes">Juguetes</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Descripción</IonLabel>
                <IonTextarea
                  value={newProduct.description}
                  rows={4}
                  onIonChange={(e: any) => setNewProduct({ ...newProduct, description: e.detail.value })}
                  placeholder="Describe el producto..."
                />
              </IonItem>

              <div style={{ marginTop: 20 }}>
                <IonButton expand="block" onClick={addProduct} color="primary">
                  <IonIcon icon={add} slot="start" />
                  Agregar Producto
                </IonButton>
                <IonButton expand="block" onClick={() => setShowAddModal(false)} fill="outline" color="medium">
                  Cancelar
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert para confirmar eliminación */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirmar Eliminación"
          message="¿Estás seguro de que deseas eliminar este producto?"
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Eliminar', handler: confirmDelete, cssClass: 'alert-button-danger' }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default SellerDashboard;

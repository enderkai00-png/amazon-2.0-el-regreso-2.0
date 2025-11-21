import React, { useState } from 'react';
import { IonButton, IonContent, IonPage, IonItem, IonLabel, IonList, IonThumbnail, IonIcon, IonCheckbox, IonToolbar, IonButtons, IonHeader, IonTitle } from '@ionic/react';
import { arrowBack, trashBin, trashOutline } from 'ionicons/icons';
import './carrito.css';
import { useCart } from '../../context/CartContext';

const Carrito: React.FC = () => {
  const { items, removeItem, removeMultiple } = useCart();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const handleRemove = async (id: number) => {
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar este producto del carrito?');
    if (!confirmed) return;
    
    try {
      await removeItem(id);
      // Limpiar selección si el item eliminado estaba seleccionado
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err) {
      console.error('Error eliminando item', err);
      alert('No se pudo eliminar el producto del carrito');
    }
  };

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.size === 0) {
      alert('Por favor selecciona al menos un producto para eliminar');
      return;
    }

    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar ${selectedIds.size} producto(s) del carrito?`);
    if (!confirmed) return;

    try {
      await removeMultiple(Array.from(selectedIds));
      setSelectedIds(new Set()); // Limpiar la selección
    } catch (err) {
      console.error('Error eliminando items', err);
      alert('Error al eliminar algunos productos. Por favor intenta de nuevo.');
    }
  };

  const subtotal = items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton routerLink="/productos">
              <IonIcon icon={arrowBack} />
              Regresar
            </IonButton>
          </IonButtons>
          <IonTitle>Mi Carrito ({items.length})</IonTitle>
          {items.length > 0 && (
            <IonButtons slot="end">
              <IonButton 
                color="danger" 
                onClick={handleRemoveSelected}
                disabled={selectedIds.size === 0}
              >
                <IonIcon icon={trashOutline} slot="start" />
                Eliminar ({selectedIds.size})
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="cart-container">
          <div className="cart-content">
            {items.length > 0 && (
              <div style={{ padding: '12px 16px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                <IonCheckbox
                  checked={selectedIds.size === items.length && items.length > 0}
                  onIonChange={toggleSelectAll}
                  labelPlacement="end"
                >
                  Seleccionar todos
                </IonCheckbox>
              </div>
            )}
            
            <IonList className="product-list">
              {items.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <IonIcon icon={trashBin} style={{ fontSize: '64px', color: '#ccc' }} />
                  <p style={{ color: '#666', marginTop: '16px' }}>Tu carrito está vacío</p>
                  <IonButton routerLink="/productos" fill="outline" style={{ marginTop: '16px' }}>
                    Ver productos
                  </IonButton>
                </div>
              ) : (
                items.map(item => (
                  <IonItem className="product-item" key={item.id}>
                    <IonCheckbox
                      slot="start"
                      checked={selectedIds.has(item.id)}
                      onIonChange={() => toggleSelection(item.id)}
                    />
                    <IonThumbnail slot="start">
                      <img alt={item.title} src={item.image || 'https://via.placeholder.com/100'} className="product-image" />
                    </IonThumbnail>
                    <IonLabel>
                      <h2>{item.title}</h2>
                      <p>Precio: ${Number(item.price).toFixed(2)}</p>
                      <p>Cantidad: {item.quantity}</p>
                      <p style={{ fontWeight: 'bold' }}>Subtotal: ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</p>
                    </IonLabel>
                    <IonButton fill="clear" color="danger" onClick={() => handleRemove(item.id)}>
                      <IonIcon icon={trashBin} />
                    </IonButton>
                  </IonItem>
                ))
              )}
            </IonList>
          </div>

          {items.length > 0 && (
            <div className="cart-summary">
              <div className="total-section">
                <h2>Resumen de Compra</h2>
                <div className="price-details">
                  <p>Subtotal:</p>
                  <p>${subtotal.toFixed(2)}</p>
                </div>
                <div className="price-details">
                  <p>IVA (16%):</p>
                  <p>${iva.toFixed(2)}</p>
                </div>
                <div className="price-details total">
                  <h3>Total a Pagar:</h3>
                  <h3>${total.toFixed(2)}</h3>
                </div>
              </div>

              <IonButton 
                expand="block" 
                color="success" 
                className="checkout-button"
                routerLink="/checkout"
              >
                Proceder al Pago
              </IonButton>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Carrito;

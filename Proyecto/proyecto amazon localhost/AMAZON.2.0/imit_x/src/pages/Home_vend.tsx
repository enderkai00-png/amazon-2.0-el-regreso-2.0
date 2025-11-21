import React from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent, IonButton, IonGrid, IonRow, IonCol, IonIcon, IonCardHeader, IonCardTitle } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { cube, cart, analytics, settings, person, logOut } from 'ionicons/icons';
import './Home_vend.css';

const Home_vend: React.FC = () => {
  const history = useHistory();

  const handleLogout = () => {
    localStorage.clear();
    history.push('/crea-cuent');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Panel del Vendedor</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="home-vend-content">
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Encabezado de bienvenida */}
          <IonCard style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', marginBottom: '24px' }}>
            <IonCardContent style={{ padding: '32px' }}>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>¡Bienvenido, Vendedor!</h1>
              <p style={{ margin: '12px 0 0 0', fontSize: '16px', opacity: 0.9 }}>Gestiona tus productos y ventas desde aquí</p>
            </IonCardContent>
          </IonCard>

          {/* Opciones principales */}
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <IonCard className="action-card" button onClick={() => history.push('/vendedores')}>
                  <IonCardHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <IonIcon icon={cube} style={{ fontSize: '32px', color: '#667eea' }} />
                      <IonCardTitle>Panel de Productos</IonCardTitle>
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    <p>Gestiona tu inventario, actualiza precios y agrega nuevos productos</p>
                    <IonButton expand="block" style={{ marginTop: '16px' }}>
                      Ir al Panel
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6">
                <IonCard className="action-card" button onClick={() => history.push('/productos')}>
                  <IonCardHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <IonIcon icon={cart} style={{ fontSize: '32px', color: '#f093fb' }} />
                      <IonCardTitle>Ver Catálogo</IonCardTitle>
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    <p>Explora el catálogo completo de productos disponibles</p>
                    <IonButton expand="block" color="secondary" style={{ marginTop: '16px' }}>
                      Ver Productos
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6">
                <IonCard className="action-card">
                  <IonCardHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <IonIcon icon={analytics} style={{ fontSize: '32px', color: '#4facfe' }} />
                      <IonCardTitle>Estadísticas</IonCardTitle>
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    <p>Revisa tus ventas y el desempeño de tus productos</p>
                    <IonButton expand="block" color="tertiary" disabled style={{ marginTop: '16px' }}>
                      Próximamente
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6">
                <IonCard className="action-card">
                  <IonCardHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <IonIcon icon={settings} style={{ fontSize: '32px', color: '#fa709a' }} />
                      <IonCardTitle>Configuración</IonCardTitle>
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    <p>Administra tu perfil y preferencias de vendedor</p>
                    <IonButton expand="block" color="warning" disabled style={{ marginTop: '16px' }}>
                      Próximamente
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Botones de navegación adicional */}
          <IonCard style={{ marginTop: '24px' }}>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonButton 
                      expand="block" 
                      fill="outline"
                      onClick={() => history.push('/home')}
                    >
                      <IonIcon icon={person} slot="start" />
                      Ver como Cliente
                    </IonButton>
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonButton 
                      expand="block" 
                      color="danger"
                      fill="outline"
                      onClick={handleLogout}
                    >
                      <IonIcon icon={logOut} slot="start" />
                      Cerrar Sesión
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home_vend;
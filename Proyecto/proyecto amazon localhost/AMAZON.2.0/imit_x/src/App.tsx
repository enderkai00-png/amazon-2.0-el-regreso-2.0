import React from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route } from 'react-router-dom';

// Importaciones CSS
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

// Importa tus componentes reales
import Home from './pages/Home';
import Productos from './pages/productos';
import Vendedores from './interfaz-vendedores/Vendedores';
import SellerWelcome from './interfaz-vendedores/SellerWelcome';
import ProductDetail from './interfaz-productos/ProductDetail';
import ProductList from './interfaz-productos/ProductList';
import Carrito from './interfaz-productos/carrito/Carrito';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import OrderHistory from './pages/OrderHistory';
import Checkout from './pages/Checkout';
import ConfiguracionCuenta from './pages/ConfiguracionCuenta';
import Crea_cuent from './pages/Crea_cuent';
import Dat_ven from './pages/Dat_ven';
import Home_vend from './pages/Home_vend';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <CartProvider>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/" component={Home} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/register" component={Register} />
            <Route exact path="/mi-cuenta" component={Profile} />
            <Route exact path="/pedidos" component={OrderHistory} />
            <Route exact path="/productos" component={Productos} />
            <Route exact path="/vendedores" component={Vendedores} />
            <Route exact path="/vendedores/welcome" component={SellerWelcome} />
            <Route exact path="/producto/:id" component={ProductDetail} />
            <Route exact path="/lista-productos" component={ProductList} />
            <Route exact path="/carrito" component={Carrito} />
            <Route exact path="/checkout" component={Checkout} />
            <Route exact path="/configuracion" component={ConfiguracionCuenta} />
            <Route exact path="/crea-cuent" component={Crea_cuent} />
            <Route exact path="/dat-ven" component={Dat_ven} />
            <Route exact path="/home-vend" component={Home_vend} />
          </IonRouterOutlet>
        </IonReactRouter>
      </CartProvider>
    </AuthProvider>
  </IonApp>
);

export default App;
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLoading,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { home, play, share, person } from 'ionicons/icons';

// Main App Pages
import Home from './pages/Home';
import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Auth Guard Component
import AuthGuard from './components/AuthGuard';

// Auth Context Provider
import { AuthProvider, useAuth } from './contexts/AuthContext';

// location Context Provider
import { LocationProvider } from './contexts/LocationContext';

/* Capacitor plugins */
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';

// Initialize Ionic
setupIonicReact();

// Handle hardware back button
document.addEventListener('ionBackButton', (ev: any) => {
  ev.detail.register(10, () => {
    if (window.location.pathname === '/tabs/home' || window.location.pathname === '/') {
      // Ask the user if they want to quit the app
      CapApp.exitApp();
    }
  });
});

// Platform specific setup
if (Capacitor.isNativePlatform()) {
  // Capacitor platform
  StatusBar.setBackgroundColor({ color: '#3880ff' });
  StatusBar.setStyle({ style: Style.Dark });
  Keyboard.setAccessoryBarVisible({ isVisible: false });
}

const AppContent: React.FC = () => {
  const { loading } = useAuth();

  console.log('AppContent rendered, loading state:', loading);

  return (
    <IonReactRouter>
      {/* add loading indicator */}
      <IonLoading
        isOpen={loading}
        message="Loading..."
        duration={1000} // set duration to 1000ms
        spinner="circles"
      />
      {/* Auth routes outside of tabs */}
      <Route path="/login" component={Login} exact={true} />
      <Route path="/register" component={Register} exact={true} />
      <Route path="/forgot-password" component={ForgotPassword} exact={true} />
      
      {/* Protected tab routes */}
      <Route path="/tabs">
        <IonTabs>
          <IonRouterOutlet>
            <AuthGuard path="/tabs/home" component={Home} exact={true} />
            <AuthGuard path="/tabs/tab1" component={Tab1} exact={true} />
            <AuthGuard path="/tabs/tab2" component={Tab2} exact={true} />
            <AuthGuard path="/tabs/tab3" component={Tab3} exact={true} />
            <Route exact path="/tabs">
              <Redirect to="/tabs/home" />
            </Route>
          </IonRouterOutlet>
          
          {/* Updated Tab Bar for better mobile responsiveness */}
          <IonTabBar slot="bottom" className="bg-gray-100 w-full">
            <IonTabButton tab="home" href="/tabs/home" className="flex flex-col items-center">
              <IonIcon aria-hidden="true" icon={home} />
              <IonLabel className="text-xs truncate w-full text-center">Location</IonLabel>
            </IonTabButton>
            <IonTabButton tab="tab1" href="/tabs/tab1" className="flex flex-col items-center">
              <IonIcon aria-hidden="true" icon={play} />
              <IonLabel className="text-xs truncate w-full text-center">Trajectory</IonLabel>
            </IonTabButton>
            <IonTabButton tab="tab2" href="/tabs/tab2" className="flex flex-col items-center">
              <IonIcon aria-hidden="true" icon={share} />
              <IonLabel className="text-xs truncate w-full text-center">Sharing</IonLabel>
            </IonTabButton>
            <IonTabButton tab="tab3" href="/tabs/tab3" className="flex flex-col items-center">
              <IonIcon aria-hidden="true" icon={person} />
              <IonLabel className="text-xs truncate w-full text-center">Profile</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </Route>
      
      {/* Root redirect */}
      <Route exact path="/">
        <Redirect to="/login" />
      </Route>
      
      {/* Legacy routes redirects */}
      <Route path="/home">
        <Redirect to="/tabs/home" />
      </Route>
      <Route path="/tab1">
        <Redirect to="/tabs/tab1" />
      </Route>
      <Route path="/tab2">
        <Redirect to="/tabs/tab2" />
      </Route>
      <Route path="/tab3">
        <Redirect to="/tabs/tab3" />
      </Route>
    </IonReactRouter>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
        <LocationProvider>
            <AppContent />
        </LocationProvider>
    </AuthProvider>
  </IonApp>
);

export default App;
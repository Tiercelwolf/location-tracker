// import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Ionic core CSS
import '@ionic/react/css/core.css';

// Basic CSS for Ionic apps
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

// Optional CSS utilities for Ionic
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

// Theme variables
import './theme/variables.css';

// Tailwind CSS
import './index.css';

// Set up Capacitor plugins
// PWA Elements are no longer automatically imported in Capacitor 7
// Install it separately with: npm install @ionic/pwa-elements
import { defineCustomElements } from '@ionic/pwa-elements/loader';
defineCustomElements(window);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
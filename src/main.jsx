import React from 'react';
import { createRoot } from 'react-dom/client';
import CRMApp from './CRMApp.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CRMApp />
  </React.StrictMode>
);

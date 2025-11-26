import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './i18n'; // Initialize i18n
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/theme.css';
import './styles/dark-mode-enhancements.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Sandbox Guard: Securely override window.confirm/alert to prevent SecurityError in sandboxed iframe previews
try {
  const originalConfirm = window.confirm;
  window.confirm = function (message?: string) {
    try {
      return originalConfirm(message);
    } catch (e) {
      console.warn("window.confirm blocked or failed in sandbox iframe, defaulting to true to proceed safely:", e);
      return true;
    }
  };
} catch (e) {
  try {
    (window as any).confirm = () => true;
  } catch (err) {
    console.error("Could not securely override window.confirm:", err);
  }
}

try {
  const originalAlert = window.alert;
  window.alert = function (message?: any) {
    try {
      originalAlert(message);
    } catch (e) {
      console.warn("window.alert blocked or failed in sandbox iframe, silent fallback executed:", e);
    }
  };
} catch (e) {
  try {
    (window as any).alert = () => {};
  } catch (err) {
    console.error("Could not securely override window.alert:", err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


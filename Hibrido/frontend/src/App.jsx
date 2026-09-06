import { useState, useEffect } from 'react';
import DiffieHellmanView from './components/DiffieHellmanView';
import AesCipherView from './components/AesCipherView';
import './App.css';

function App() {
  const [activeScreen, setActiveScreen] = useState('dh'); // 'dh' | 'aes'
  const [sharedAesKey, setSharedAesKey] = useState('');
  const [backendOnline, setBackendOnline] = useState(null); // true | false | null

  // Comprobar estado de conexión con el backend de Spring Boot
  const checkBackendHealth = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/crypto/health', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch (e) {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-shell">
      {/* Barra de Navegación Principal */}
      <header className="app-navbar">
        <div className="navbar-brand">
          <div className="brand-logo-text">CRIPTO</div>
          <div className="brand-texts">
            <h1>Criptosistema Híbrido</h1>
            <span className="brand-sub">Diffie-Hellman · AES-CBC · RSA-4096</span>
          </div>
        </div>

        <nav className="nav-buttons">
          <button
            type="button"
            className={`nav-btn ${activeScreen === 'dh' ? 'active' : ''}`}
            onClick={() => setActiveScreen('dh')}
          >
            <span>1. Diffie-Hellman</span>
          </button>

          <button
            type="button"
            className={`nav-btn ${activeScreen === 'aes' ? 'active' : ''}`}
            onClick={() => setActiveScreen('aes')}
          >
            <span>2. Cifrador AES y Firma RSA</span>
            {sharedAesKey && <span className="badge-notification">Llave cargada</span>}
          </button>
        </nav>

        <div className="navbar-status">
          <span
            className={`status-pill ${
              backendOnline === true
                ? 'status-online'
                : backendOnline === false
                ? 'status-offline'
                : 'status-checking'
            }`}
            title="Estado del backend Java Spring Boot en http://localhost:8081"
          >
            <span className="status-dot"></span>
            {backendOnline === true
              ? 'Backend Conectado (8081)'
              : backendOnline === false
              ? 'Backend Desconectado'
              : 'Comprobando conexión...'}
          </span>
        </div>
      </header>

      {/* Contenido de la Pantalla Activa */}
      <main className="app-main">
        {activeScreen === 'dh' && (
          <DiffieHellmanView
            onSetAesKey={(key) => setSharedAesKey(key)}
            onNavigateToCipher={() => setActiveScreen('aes')}
          />
        )}

        {activeScreen === 'aes' && (
          <AesCipherView defaultAesKey={sharedAesKey} />
        )}
      </main>

      {/* Pie de página */}
      <footer className="app-footer">
        <p>
          Proyecto de Criptografía · Algoritmos: Diffie-Hellman (BigInt), AES-CBC PKCS5 (Spring Boot) y RSA-4096 / SHA-256 (Web Crypto)
        </p>
      </footer>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { fetchCurves, generateKey, calculateSharedKey } from './services/api';
import './App.css';

export default function App() {
  const [curves, setCurves] = useState([]);
  const [selectedCurve, setSelectedCurve] = useState('P-256');

  // Estado del Par de Claves Local
  const [myKeyPair, setMyKeyPair] = useState(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [loadingGen, setLoadingGen] = useState(false);

  // Estado del Cálculo Compartido
  const [peerPublicKey, setPeerPublicKey] = useState('');
  const [calculationResult, setCalculationResult] = useState(null);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [calcError, setCalcError] = useState(null);

  // Notificación de copiado
  const [copiedLabel, setCopiedLabel] = useState(null);

  useEffect(() => {
    fetchCurves()
      .then((data) => {
        setCurves(data);
        if (data && data.length > 0) {
          setSelectedCurve(data[0].id);
        }
      })
      .catch((err) => console.error('Error cargando curvas:', err));
  }, []);

  const handleGenerateKeys = async () => {
    setLoadingGen(true);
    setCalculationResult(null);
    setCalcError(null);
    try {
      const kp = await generateKey(selectedCurve, 'Usuario');
      setMyKeyPair(kp);
    } catch (err) {
      alert('Error generando claves: ' + err.message);
    } finally {
      setLoadingGen(false);
    }
  };

  const handleCalculateShared = async () => {
    if (!myKeyPair) {
      alert('Primero genera tu par de claves en el Paso 1.');
      return;
    }
    if (!peerPublicKey.trim()) {
      alert('Por favor ingresa la clave pública del otro participante.');
      return;
    }

    setLoadingCalc(true);
    setCalcError(null);
    setCalculationResult(null);
    try {
      const res = await calculateSharedKey(
        selectedCurve,
        myKeyPair.privateKeyHex,
        peerPublicKey.trim()
      );
      setCalculationResult(res);
    } catch (err) {
      setCalcError(err.message || 'Error al calcular la clave. Verifica que la clave pública sea válida para la curva seleccionada.');
    } finally {
      setLoadingCalc(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPeerPublicKey(text.trim());
    } catch (err) {
      alert('No se pudo acceder al portapapeles. Pégala manualmente con Ctrl + V.');
    }
  };

  // Cargar archivo JSON/TXT
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result.trim();
      try {
        const json = JSON.parse(content);
        if (json.publicKeyHex) {
          setPeerPublicKey(json.publicKeyHex);
        } else if (typeof json === 'string') {
          setPeerPublicKey(json);
        } else {
          setPeerPublicKey(content);
        }
      } catch (err) {
        setPeerPublicKey(content);
      }
    };
    reader.readAsText(file);
  };

  // Descargar mi clave pública
  const handleDownloadMyPublicKey = () => {
    if (!myKeyPair) return;
    const data = JSON.stringify({
      curva: selectedCurve,
      publicKeyHex: myKeyPair.publicKeyHex,
      pointX: myKeyPair.pointX,
      pointY: myKeyPair.pointY,
      pem: myKeyPair.pemFormat
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clave_publica_${selectedCurve}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentCurveObj = curves.find((c) => c.id === selectedCurve);

  return (
    <div className="calculator-layout">
      {/* Header Institucional Compacto */}
      <header className="calc-header">
        <div className="calc-header-brand">
          <div className="brand-badges">
            <span className="badge-ipn">IPN</span>
            <span className="badge-escom">ESCOM</span>
          </div>
          <div>
            <h1 className="calc-title">Calculadora Criptográfica ECDH</h1>
            <p className="calc-subtitle">
              Práctica 5: Diffie-Hellman con Curvas Elípticas • Dra. Nidia A. Cortez Duarte
            </p>
          </div>
        </div>

        {/* Selector de Curva */}
        <div className="calc-curve-select">
          <label>Curva Recomendada NIST:</label>
          <select
            value={selectedCurve}
            onChange={(e) => {
              setSelectedCurve(e.target.value);
              setMyKeyPair(null);
              setCalculationResult(null);
              setCalcError(null);
            }}
            className="calc-select"
          >
            {curves.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.securityBits} bits)
              </option>
            ))}
          </select>
          {currentCurveObj && (
            <span className="curve-badge">
              Seguridad: {currentCurveObj.securityBits} bits • Equivalente: {currentCurveObj.aesEquivalent}
            </span>
          )}
        </div>
      </header>

      {/* Contenido Principal de la Calculadora */}
      <main className="calc-main">
        {/* PANEL 1: Generación de Claves */}
        <div className="calc-card">
          <div className="card-top">
            <span className="step-badge">Paso 1</span>
            <h2>Generar Par de Claves</h2>
          </div>
          <p className="card-description">
            Genera un escalar privado secreto <code>d</code> y el punto público correspondiente <code>Q = d · G</code> usando la biblioteca Bouncy Castle sobre la curva {selectedCurve}.
          </p>

          <button
            className="btn-action-primary"
            onClick={handleGenerateKeys}
            disabled={loadingGen}
          >
            {loadingGen ? 'Generando...' : '🔑 Generar Mi Par de Claves'}
          </button>

          {myKeyPair && (
            <div className="calc-result-box">
              <div className="time-indicator">
                ⏱ <strong>Tiempo de generación:</strong> {myKeyPair.generationTimeMs} ms ({myKeyPair.generationTimeNanos.toLocaleString()} ns)
              </div>

              {/* Clave Privada */}
              <div className="key-row">
                <div className="key-row-header">
                  <span className="label-text">Mi Clave Privada (d):</span>
                  <button
                    className="btn-link"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? 'Ocultar' : '👁 Revelar'}
                  </button>
                </div>
                <div className="key-input-display">
                  <code className="mono-text">
                    {showPrivateKey ? myKeyPair.privateKeyHex : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                  </code>
                  {showPrivateKey && (
                    <button
                      className="btn-copy-mini"
                      onClick={() => copyToClipboard(myKeyPair.privateKeyHex, 'my_priv')}
                    >
                      {copiedLabel === 'my_priv' ? '✓' : 'Copiar'}
                    </button>
                  )}
                </div>
              </div>

              {/* Clave Pública */}
              <div className="key-row">
                <div className="key-row-header">
                  <span className="label-text">Mi Clave Pública (Punto Q = d · G):</span>
                  <button
                    className="btn-link"
                    onClick={handleDownloadMyPublicKey}
                  >
                    💾 Descargar Archivo (USB)
                  </button>
                </div>
                <div className="key-input-display">
                  <code className="mono-text pub-key-text">{myKeyPair.publicKeyHex}</code>
                  <button
                    className="btn-copy-mini"
                    onClick={() => copyToClipboard(myKeyPair.publicKeyHex, 'my_pub')}
                  >
                    {copiedLabel === 'my_pub' ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <div className="coord-grid">
                  <div>
                    <span className="sub-tag">Coord X:</span>
                    <code className="mini-coord">{myKeyPair.pointX}</code>
                  </div>
                  <div>
                    <span className="sub-tag">Coord Y:</span>
                    <code className="mini-coord">{myKeyPair.pointY}</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 2: Introducir Clave Pública y Calcular Clave Final */}
        <div className="calc-card">
          <div className="card-top">
            <span className="step-badge">Paso 2</span>
            <h2>Calcular Clave con la Clave Pública de Otro</h2>
          </div>
          <p className="card-description">
            Introduce la clave pública recibida del otro participante (o la clave intermedia para la segunda ronda de 3 personas) para calcular el secreto compartido <code>S = d · Q_otro</code>.
          </p>

          <div className="input-group">
            <div className="input-actions-bar">
              <label htmlFor="peerKeyInput">Clave Pública o Parcial Recibida:</label>
              <div className="input-bar-buttons">
                <button
                  type="button"
                  className="btn-mini-action"
                  onClick={handlePasteClipboard}
                >
                  📋 Pegar
                </button>
                <label className="btn-mini-action file-upload-btn">
                  📂 Cargar Archivo
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <textarea
              id="peerKeyInput"
              rows="3"
              className="calc-textarea"
              placeholder="Pega aquí la clave pública (formato hexadecimal 04... o coordenadas)"
              value={peerPublicKey}
              onChange={(e) => setPeerPublicKey(e.target.value)}
            />
          </div>

          <button
            className="btn-action-primary calculate-btn"
            onClick={handleCalculateShared}
            disabled={loadingCalc || !peerPublicKey.trim()}
          >
            {loadingCalc ? 'Calculando...' : '⚡ Calcular Clave Compartida'}
          </button>

          {calcError && (
            <div className="calc-error-box">
              ⚠️ {calcError}
            </div>
          )}

          {/* Resultado del Cálculo */}
          {calculationResult && (
            <div className="calc-result-box success-border">
              <div className="success-header">
                <span className="check-icon">✅</span>
                <h4>¡Cálculo Realizado Exitosamente!</h4>
              </div>

              {/* Muestra del Tiempo Requerida */}
              <div className="time-indicator highlight-time">
                ⏱ <strong>Tiempo de cómputo:</strong> {calculationResult.computationTimeMs} ms ({calculationResult.computationTimeNanos.toLocaleString()} ns)
              </div>

              {/* Punto Resultante en la Curva */}
              <div className="key-row">
                <span className="label-text">Punto Resultante en la Curva (S = d · Q_otro):</span>
                <div className="coord-grid">
                  <div>
                    <span className="sub-tag">Coord X:</span>
                    <code className="mini-coord">{calculationResult.pointX}</code>
                  </div>
                  <div>
                    <span className="sub-tag">Coord Y:</span>
                    <code className="mini-coord">{calculationResult.pointY}</code>
                  </div>
                </div>
              </div>

              {/* Clave Final Derivada */}
              <div className="key-row">
                <div className="key-row-header">
                  <span className="label-text">Clave Final Derivada (KDF SHA-256 de 256 bits):</span>
                </div>
                <div className="key-input-display final-secret-box">
                  <code className="mono-text final-secret-text">{calculationResult.derivedKeySha256Hex}</code>
                  <button
                    className="btn-copy-mini"
                    onClick={() => copyToClipboard(calculationResult.derivedKeySha256Hex, 'final_secret')}
                  >
                    {copiedLabel === 'final_secret' ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Mínimo */}
      <footer className="calc-footer">
        <span>ESCOM - IPN • Práctica 5: Diffie-Hellman con Curvas Elípticas (ECDH)</span>
        <span className="footer-doc-note">
          Nota: Los diagramas, tablas comparativas, análisis de complejidad y respuestas teóricas se encuentran documentados en el <code>README.md</code> para el reporte escrito.
        </span>
      </footer>
    </div>
  );
}

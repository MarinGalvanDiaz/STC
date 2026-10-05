import React, { useState, useEffect } from 'react';
import { fetchCurves, generateKey, calculateSharedKey } from './services/api';
import './App.css';

export default function App() {
  const [curves, setCurves] = useState([]);
  const [selectedCurve, setSelectedCurve] = useState('P-256');

  // Estado del Par de Claves Local (Paso 1)
  const [myKeyPair, setMyKeyPair] = useState(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [loadingGen, setLoadingGen] = useState(false);

  // Estado de la Clave Intermedia (Paso 2)
  const [peerPublicKey, setPeerPublicKey] = useState('');
  const [intermediateResult, setIntermediateResult] = useState(null);
  const [loadingIntermediate, setLoadingIntermediate] = useState(false);
  const [intermediateError, setIntermediateError] = useState(null);

  // Estado de la Clave Final (Paso 3)
  const [peerIntermediateKey, setPeerIntermediateKey] = useState('');
  const [finalResult, setFinalResult] = useState(null);
  const [loadingFinal, setLoadingFinal] = useState(false);
  const [finalError, setFinalError] = useState(null);

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

  // Generar Par de Claves
  const handleGenerateKeys = async () => {
    setLoadingGen(true);
    setIntermediateResult(null);
    setFinalResult(null);
    setIntermediateError(null);
    setFinalError(null);
    try {
      const kp = await generateKey(selectedCurve, 'Usuario');
      setMyKeyPair(kp);
    } catch (err) {
      alert('Error generando claves: ' + err.message);
    } finally {
      setLoadingGen(false);
    }
  };

  // Calcular Clave Intermedia
  const handleCalculateIntermediate = async () => {
    if (!myKeyPair) {
      alert('Primero genera tu par de claves en el Paso 1.');
      return;
    }
    if (!peerPublicKey.trim()) {
      alert('Por favor ingresa la clave pública recibida del participante previo.');
      return;
    }

    setLoadingIntermediate(true);
    setIntermediateError(null);
    setIntermediateResult(null);
    try {
      const res = await calculateSharedKey(
        selectedCurve,
        myKeyPair.privateKeyHex,
        peerPublicKey.trim()
      );
      setIntermediateResult(res);
    } catch (err) {
      setIntermediateError(err.message || 'Error al calcular clave intermedia. Verifica que la clave pública sea válida para la curva seleccionada.');
    } finally {
      setLoadingIntermediate(false);
    }
  };

  // Calcular Clave Final
  const handleCalculateFinal = async () => {
    if (!myKeyPair) {
      alert('Primero genera tu par de claves en el Paso 1.');
      return;
    }
    if (!peerIntermediateKey.trim()) {
      alert('Por favor ingresa la clave intermedia recibida del otro participante.');
      return;
    }

    setLoadingFinal(true);
    setFinalError(null);
    setFinalResult(null);
    try {
      const res = await calculateSharedKey(
        selectedCurve,
        myKeyPair.privateKeyHex,
        peerIntermediateKey.trim()
      );
      setFinalResult(res);
    } catch (err) {
      setFinalError(err.message || 'Error al calcular clave final. Verifica que la clave intermedia sea válida para la curva seleccionada.');
    } finally {
      setLoadingFinal(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const handlePasteClipboard = async (setter) => {
    try {
      const text = await navigator.clipboard.readText();
      setter(text.trim());
    } catch (err) {
      alert('No se pudo acceder al portapapeles. Pégala manualmente con Ctrl + V.');
    }
  };

  // Cargar archivo
  const handleFileUpload = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result.trim();
      try {
        const json = JSON.parse(content);
        if (json.uncompressedHex) {
          setter(json.uncompressedHex);
        } else if (json.publicKeyHex) {
          setter(json.publicKeyHex);
        } else if (typeof json === 'string') {
          setter(json);
        } else {
          setter(content);
        }
      } catch (err) {
        setter(content);
      }
    };
    reader.readAsText(file);
  };

  // Descargar archivo JSON
  const downloadJsonFile = (fileName, data) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
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
              setIntermediateResult(null);
              setFinalResult(null);
              setIntermediateError(null);
              setFinalError(null);
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
        {/* ======================================================== */}
        {/* SECCIÓN 1: Generación de Mi Par de Claves               */}
        {/* ======================================================== */}
        <div className="calc-card">
          <div className="card-top">
            <span className="step-badge">Paso 1</span>
            <h2>Generar Par de Claves</h2>
          </div>
          <p className="card-description">
            Genera tu escalar privado secreto <code>d</code> y tu punto público <code>Q = d · G</code> sobre la curva {selectedCurve}.
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
                    onClick={() => downloadJsonFile(`mi_clave_publica_${selectedCurve}.json`, {
                      curva: selectedCurve,
                      publicKeyHex: myKeyPair.publicKeyHex,
                      pointX: myKeyPair.pointX,
                      pointY: myKeyPair.pointY,
                      pem: myKeyPair.pemFormat
                    })}
                  >
                    💾 Guardar para USB (.json)
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

        {/* ======================================================== */}
        {/* SECCIÓN 2: Cálculo de Clave Intermedia (Ronda 2)        */}
        {/* ======================================================== */}
        <div className="calc-card">
          <div className="card-top">
            <span className="step-badge badge-intermediate">Paso 2</span>
            <h2>Calcular Clave Intermedia (Ronda 2)</h2>
          </div>
          <p className="card-description">
            Introduce la <strong>clave pública del participante previo</strong> para calcular la clave parcial intermedia: <code>Z = d · P_previo</code> (por ejemplo, Alice calcula <code>Z_AC = a · P_C = acG</code>).
          </p>

          <div className="input-group">
            <div className="input-actions-bar">
              <label htmlFor="peerKeyInput">Clave Pública del Participante Previo (P_previo):</label>
              <div className="input-bar-buttons">
                <button
                  type="button"
                  className="btn-mini-action"
                  onClick={() => handlePasteClipboard(setPeerPublicKey)}
                >
                  📋 Pegar
                </button>
                <label className="btn-mini-action file-upload-btn">
                  📂 Cargar de USB
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={(e) => handleFileUpload(e, setPeerPublicKey)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <textarea
              id="peerKeyInput"
              rows="3"
              className="calc-textarea"
              placeholder="Pega aquí la clave pública previa (ej. 04... o coordenadas)"
              value={peerPublicKey}
              onChange={(e) => setPeerPublicKey(e.target.value)}
            />
          </div>

          <button
            className="btn-action-primary calculate-intermediate-btn"
            onClick={handleCalculateIntermediate}
            disabled={loadingIntermediate || !peerPublicKey.trim()}
          >
            {loadingIntermediate ? 'Calculando Intermedia...' : '⚡ Calcular Clave Intermedia (Z = d · P_previo)'}
          </button>

          {intermediateError && (
            <div className="calc-error-box">
              ⚠️ {intermediateError}
            </div>
          )}

          {/* Resultado de la Clave Intermedia */}
          {intermediateResult && (
            <div className="calc-result-box intermediate-border">
              <div className="success-header">
                <span className="check-icon">🔹</span>
                <h4>¡Clave Intermedia Calculada con Éxito!</h4>
              </div>

              {/* Tiempo de Cómputo Intermedio */}
              <div className="time-indicator highlight-time-inter">
                ⏱ <strong>Tiempo de cómputo intermedio:</strong> {intermediateResult.computationTimeMs} ms ({intermediateResult.computationTimeNanos.toLocaleString()} ns)
              </div>

              {/* Punto Intermedio Z */}
              <div className="key-row">
                <div className="key-row-header">
                  <span className="label-text">Punto Intermedio Z (enviar al siguiente participante por USB):</span>
                  <button
                    className="btn-link"
                    onClick={() => downloadJsonFile(`clave_intermedia_${selectedCurve}.json`, {
                      curva: selectedCurve,
                      uncompressedHex: intermediateResult.uncompressedHex,
                      pointX: intermediateResult.pointX,
                      pointY: intermediateResult.pointY,
                    })}
                  >
                    💾 Guardar para USB (.json)
                  </button>
                </div>
                <div className="key-input-display">
                  <code className="mono-text inter-key-text">{intermediateResult.uncompressedHex}</code>
                  <button
                    className="btn-copy-mini"
                    onClick={() => copyToClipboard(intermediateResult.uncompressedHex, 'inter_point')}
                  >
                    {copiedLabel === 'inter_point' ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <div className="coord-grid">
                  <div>
                    <span className="sub-tag">Coord X (Punto Z):</span>
                    <code className="mini-coord">{intermediateResult.pointX}</code>
                  </div>
                  <div>
                    <span className="sub-tag">Coord Y (Punto Z):</span>
                    <code className="mini-coord">{intermediateResult.pointY}</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECCIÓN 3: Cálculo de Clave Final Compartida (Ronda 3)   */}
        {/* ======================================================== */}
        <div className="calc-card">
          <div className="card-top">
            <span className="step-badge badge-final">Paso 3</span>
            <h2>Calcular Clave Final Compartida (Ronda 3)</h2>
          </div>
          <p className="card-description">
            Introduce la <strong>clave intermedia recibida del otro participante</strong> para calcular el punto final común: <code>K = d · Z_recibido = (abc)G</code> y derivar la clave simétrica con <strong>KDF SHA-256</strong>.
          </p>

          <div className="input-group">
            <div className="input-actions-bar">
              <label htmlFor="peerIntermediateInput">Clave Intermedia Recibida (Z_recibido):</label>
              <div className="input-bar-buttons">
                <button
                  type="button"
                  className="btn-mini-action"
                  onClick={() => handlePasteClipboard(setPeerIntermediateKey)}
                >
                  📋 Pegar
                </button>
                <label className="btn-mini-action file-upload-btn">
                  📂 Cargar de USB
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={(e) => handleFileUpload(e, setPeerIntermediateKey)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <textarea
              id="peerIntermediateInput"
              rows="3"
              className="calc-textarea"
              placeholder="Pega aquí la clave intermedia recibida (ej. 04... o punto parcial Z)"
              value={peerIntermediateKey}
              onChange={(e) => setPeerIntermediateKey(e.target.value)}
            />
          </div>

          <button
            className="btn-action-primary calculate-final-btn"
            onClick={handleCalculateFinal}
            disabled={loadingFinal || !peerIntermediateKey.trim()}
          >
            {loadingFinal ? 'Calculando Clave Final...' : '🛡️ Calcular Clave Final Compartida (K = d · Z_recibido)'}
          </button>

          {finalError && (
            <div className="calc-error-box">
              ⚠️ {finalError}
            </div>
          )}

          {/* Resultado de la Clave Final */}
          {finalResult && (
            <div className="calc-result-box success-border">
              <div className="success-header">
                <span className="check-icon">✅</span>
                <h4>¡Clave Final Compartida Derivada Exitosamente!</h4>
              </div>

              {/* Tiempo de Cómputo Final */}
              <div className="time-indicator highlight-time">
                ⏱ <strong>Tiempo de cómputo final:</strong> {finalResult.computationTimeMs} ms ({finalResult.computationTimeNanos.toLocaleString()} ns)
              </div>

              {/* Punto Resultante en la Curva abcG */}
              <div className="key-row">
                <span className="label-text">Punto Común en la Curva (S = (abc) · G):</span>
                <div className="coord-grid">
                  <div>
                    <span className="sub-tag">Coord X (Punto Final):</span>
                    <code className="mini-coord">{finalResult.pointX}</code>
                  </div>
                  <div>
                    <span className="sub-tag">Coord Y (Punto Final):</span>
                    <code className="mini-coord">{finalResult.pointY}</code>
                  </div>
                </div>
              </div>

              {/* Clave Final Derivada SHA-256 */}
              <div className="key-row">
                <div className="key-row-header">
                  <span className="label-text">Clave Final Secreta Compartida (KDF SHA-256 de 256 bits):</span>
                </div>
                <div className="key-input-display final-secret-box">
                  <code className="mono-text final-secret-text">{finalResult.derivedKeySha256Hex}</code>
                  <button
                    className="btn-copy-mini"
                    onClick={() => copyToClipboard(finalResult.derivedKeySha256Hex, 'final_secret')}
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
        <span>ESCOM - IPN • Práctica 5: Diffie-Hellman con Curvas Elípticas (ECDH Tripartito)</span>
        <span className="footer-doc-note">
          Nota: Los diagramas, tablas comparativas, análisis de complejidad y respuestas teóricas se encuentran documentados en el <code>README.md</code> para el reporte escrito.
        </span>
      </footer>
    </div>
  );
}

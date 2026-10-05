import React, { useState, useEffect } from 'react';
import { runSimulation } from '../services/api';

export default function TestSuitesTab({ selectedCurve }) {
  const [tests, setTests] = useState([]);
  const [activeTestIndex, setActiveTestIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const runThreeTests = async () => {
    setLoading(true);
    try {
      const t1 = await runSimulation(selectedCurve);
      const t2 = await runSimulation(selectedCurve);
      const t3 = await runSimulation(selectedCurve);
      setTests([t1, t2, t3]);
      setActiveTestIndex(0);
    } catch (err) {
      console.error(err);
      alert('Error ejecutando las 3 pruebas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runThreeTests();
  }, [selectedCurve]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const current = tests[activeTestIndex];

  return (
    <div className="test-suites-container">
      <div className="tests-header-box">
        <div>
          <h3>Banco de Pruebas Requerido (Página 2 del Reporte)</h3>
          <p>
            Requerimiento: <em>"Captura de pantalla de al menos 3 pruebas diferentes. Especificando los valores de las claves parciales que intervinieron en el proceso para generar la clave compartida. Muestra que las tres entidades obtienen la misma clave final."</em>
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={runThreeTests}
          disabled={loading}
        >
          {loading ? 'Generando 3 Pruebas...' : '🔄 Generar 3 Pruebas Nuevas'}
        </button>
      </div>

      {/* Selector de Prueba */}
      <div className="test-tabs-selector">
        {[0, 1, 2].map((idx) => {
          const t = tests[idx];
          return (
            <button
              key={idx}
              className={`test-tab-btn ${activeTestIndex === idx ? 'active' : ''}`}
              onClick={() => setActiveTestIndex(idx)}
            >
              <span className="tab-title">Prueba #{idx + 1}</span>
              {t && (
                <span className="tab-status-tag">
                  {t.keysMatch ? '✓ Coinciden (Éxito)' : 'Error'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Ejecutando generación criptográfica y validación para las 3 pruebas...</p>
        </div>
      ) : current ? (
        <div className="test-detail-card" id="printable-test-card">
          <div className="test-badge-row">
            <span className="pill-primary">Prueba #{activeTestIndex + 1}</span>
            <span className="pill-curve">Curva: {current.curve.name} ({current.curve.securityBits} bits)</span>
            <span className={`pill-status ${current.keysMatch ? 'success' : 'error'}`}>
              {current.keysMatch ? '✓ VERIFICACIÓN: Las 3 Claves Coinciden' : 'Falló'}
            </span>
            <span className="pill-time">
              ⏱ Tiempo Total: {(current.totalTimeNanos / 1_000_000).toFixed(3)} ms
            </span>
          </div>

          {/* Tabla de Claves Parciales que intervinieron en el proceso */}
          <div className="test-section-block">
            <h4>1. Claves Parciales Intermedias (Ronda 2 de Intercambio)</h4>
            <p className="section-note">
              Valores intermedios calculados por cada entidad tras la primera ronda y transferidos por la memoria USB:
            </p>
            <div className="table-wrapper">
              <table className="crypto-table">
                <thead>
                  <tr>
                    <th>Entidad Creadora</th>
                    <th>Fórmula Parcial</th>
                    <th>Destinatario (USB)</th>
                    <th>Coordenada X (Punto Parcial)</th>
                    <th>Coordenada Y (Punto Parcial)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(current.intermediateKeys).map(([entity, inter]) => (
                    <tr key={entity}>
                      <td><strong>{entity}</strong></td>
                      <td><code>{inter.formula}</code></td>
                      <td><span className="badge-target">{inter.targetRecipient}</span></td>
                      <td><code className="code-snippet">{inter.pointX}</code></td>
                      <td><code className="code-snippet">{inter.pointY}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla de Pares de Claves Iniciales */}
          <div className="test-section-block">
            <h4>2. Claves Locales Iniciales (Ronda 1)</h4>
            <div className="table-wrapper">
              <table className="crypto-table">
                <thead>
                  <tr>
                    <th>Entidad</th>
                    <th>Clave Privada (d) [Escalar]</th>
                    <th>Clave Pública X (P = d·G)</th>
                    <th>Clave Pública Y (P = d·G)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(current.keyPairs).map(([entity, kp]) => (
                    <tr key={entity}>
                      <td><strong>{entity}</strong></td>
                      <td><code className="code-snippet-priv">{kp.privateKeyHex}</code></td>
                      <td><code className="code-snippet">{kp.pointX}</code></td>
                      <td><code className="code-snippet">{kp.pointY}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Derivación Final y Comprobación de Igualdad */}
          <div className="test-section-block">
            <h4>3. Derivación Final y Clave Secreta Compartida Común</h4>
            <div className="table-wrapper">
              <table className="crypto-table highlight-table">
                <thead>
                  <tr>
                    <th>Entidad</th>
                    <th>Fórmula Final</th>
                    <th>Punto Común (X)</th>
                    <th>Clave Derivada SHA-256 (256 bits)</th>
                    <th>Tiempo (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(current.finalKeys).map(([entity, fin]) => (
                    <tr key={entity}>
                      <td><strong>{entity}</strong></td>
                      <td><code>{fin.formula}</code></td>
                      <td><code className="code-snippet">{fin.finalPointX}</code></td>
                      <td><code className="code-snippet-secret">{fin.derivedKeyHex}</code></td>
                      <td>{(fin.computationTimeNanos / 1_000_000).toFixed(3)} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resultado de la Prueba para Captura */}
          <div className="proof-box">
            <div className="proof-header">
              <span className="proof-check">✅</span>
              <div>
                <h5>Resultado Comprobado: Clave Final Idéntica para las 3 Entidades</h5>
                <p>
                  K_Alice == K_Bob == K_Candy: <code>{current.sharedSecretHex}</code>
                </p>
              </div>
            </div>
            <button
              className="btn-outline-sm"
              onClick={() => copyToClipboard(JSON.stringify(current, null, 2), `test_${activeTestIndex}`)}
            >
              {copiedKey === `test_${activeTestIndex}` ? '✓ JSON Copiado' : '📋 Copiar Datos Completos de la Prueba (JSON)'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

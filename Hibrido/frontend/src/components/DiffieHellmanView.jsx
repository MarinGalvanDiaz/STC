import React, { useState, useEffect } from 'react';
import { modPow, DH_PRESETS, deriveAesKeyFromK } from '../utils/cryptoUtils';

export default function DiffieHellmanView({ onSetAesKey, onNavigateToCipher }) {
  // Preset seleccionado (-1 significa ninguno preseleccionado)
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(-1);

  // Parámetros públicos (inician vacíos, sin datos de prueba precargados)
  const [p, setP] = useState('');
  const [g, setG] = useState('');

  // Valores de Alice (Usuario)
  const [a, setA] = useState(''); // Clave privada de Alice
  const [calculatedA, setCalculatedA] = useState('');

  // Clave de contraparte (k o B recibida de Bob)
  const [peerKey, setPeerKey] = useState(''); // Clave pública de la contraparte

  // Clave compartida K calculada
  const [calculatedK, setCalculatedK] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [notification, setNotification] = useState('');

  // Modo simulación bilateral (Alice & Bob)
  const [showSimulator, setShowSimulator] = useState(false);
  const [bobPrivateKey, setBobPrivateKey] = useState('');
  const [bobPublicB, setBobPublicB] = useState('');
  const [bobCalculatedK, setBobCalculatedK] = useState('');

  // Manejar cambio de preset
  const handlePresetChange = (idx) => {
    setSelectedPresetIndex(idx);
    if (idx >= 0 && idx < DH_PRESETS.length) {
      setP(DH_PRESETS[idx].p);
      setG(DH_PRESETS[idx].g);
    }
  };

  // Calcular clave pública A = g^a mod p
  useEffect(() => {
    setErrorMsg('');
    if (!p || !g || !a) {
      setCalculatedA('');
      return;
    }
    try {
      const pNum = BigInt(p);
      const gNum = BigInt(g);
      const aNum = BigInt(a);

      if (pNum <= 1n) {
        setErrorMsg('El número primo p debe ser mayor que 1.');
        setCalculatedA('');
        return;
      }
      if (aNum < 1n) {
        setErrorMsg('La clave privada a debe ser mayor o igual a 1.');
        setCalculatedA('');
        return;
      }

      const resultA = modPow(gNum, aNum, pNum);
      setCalculatedA(resultA.toString());
    } catch (err) {
      setErrorMsg('Error en los valores ingresados: asegúrate de ingresar números enteros válidos.');
      setCalculatedA('');
    }
  }, [p, g, a]);

  // Calcular clave compartida K = (peerKey)^a mod p
  const handleCalculateK = () => {
    setErrorMsg('');
    if (!p || !a || !peerKey) {
      setErrorMsg('Debes ingresar el módulo p, tu clave privada a y la clave de la contraparte (k / B).');
      return;
    }
    try {
      const pNum = BigInt(p);
      const aNum = BigInt(a);
      const peerNum = BigInt(peerKey);

      const secretK = modPow(peerNum, aNum, pNum);
      setCalculatedK(secretK.toString());
      showToast('Clave compartida K calculada exitosamente.');
    } catch (err) {
      setErrorMsg('No se pudo calcular K: verifica que los números ingresados sean válidos.');
    }
  };

  // Simulación del lado de Bob
  useEffect(() => {
    if (!showSimulator || !p || !g || !bobPrivateKey) return;
    try {
      const pNum = BigInt(p);
      const gNum = BigInt(g);
      const bNum = BigInt(bobPrivateKey);

      const bPub = modPow(gNum, bNum, pNum);
      setBobPublicB(bPub.toString());

      if (calculatedA) {
        const bK = modPow(BigInt(calculatedA), bNum, pNum);
        setBobCalculatedK(bK.toString());
      }
    } catch (e) {
      // Ignorar errores transitorios en la simulación
    }
  }, [showSimulator, p, g, bobPrivateKey, calculatedA]);

  const generateRandomA = () => {
    if (!p) {
      setErrorMsg('Por favor ingresa primero el módulo primo p.');
      return;
    }
    try {
      const pNum = BigInt(p);
      let randA;
      if (pNum > 1000n) {
        randA = BigInt(Math.floor(Math.random() * 900) + 100);
      } else if (pNum > 5n) {
        randA = BigInt(Math.floor(Math.random() * Number(pNum - 3n)) + 2);
      } else {
        randA = 3n;
      }
      setA(randA.toString());
      showToast(`Clave privada 'a' generada: ${randA}`);
    } catch (e) {
      setA('7');
    }
  };

  const handleExportToAes = () => {
    if (!calculatedK) {
      setErrorMsg('Primero calcula la clave K para poder transferirla.');
      return;
    }
    // Generamos una clave AES de 16 caracteres derivada de K
    const aesKey = deriveAesKeyFromK(calculatedK, 16);
    if (onSetAesKey) {
      onSetAesKey(aesKey);
    }
    showToast(`Clave K exportada como Llave AES (${aesKey})`);
    if (onNavigateToCipher) {
      setTimeout(() => onNavigateToCipher(), 500);
    }
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="header-badge">Paso 1: Intercambio Criptográfico</div>
        <h2>Intercambio de Claves Diffie-Hellman</h2>
        <p className="subtitle">
          Establece un secreto compartido K a través de un canal inseguro sin revelar las claves privadas.
        </p>
      </div>

      {notification && (
        <div className="alert alert-success">
          <span>{notification}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Parámetros Públicos Globales */}
      <div className="card">
        <div className="card-header">
          <h3>Parámetros Públicos Globales (p y g)</h3>
          <span className="info-tag">Públicos / Conocidos por las partes</span>
        </div>
        
        <div className="preset-selector">
          <label>Cargar plantilla rápida (opcional):</label>
          <div className="preset-buttons">
            {DH_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className={`preset-btn ${selectedPresetIndex === idx ? 'active' : ''}`}
                onClick={() => handlePresetChange(idx)}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="dh-p">
              <strong>Módulo Primo (p):</strong>
              <small className="help-text">Número primo base para la aritmética modular</small>
            </label>
            <input
              id="dh-p"
              type="text"
              value={p}
              onChange={(e) => {
                setP(e.target.value);
                setSelectedPresetIndex(-1);
              }}
              placeholder="Ingresa el número primo p"
              className="code-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dh-g">
              <strong>Generador / Base (g):</strong>
              <small className="help-text">Raíz primitiva módulo p</small>
            </label>
            <input
              id="dh-g"
              type="text"
              value={g}
              onChange={(e) => {
                setG(e.target.value);
                setSelectedPresetIndex(-1);
              }}
              placeholder="Ingresa la base o generador g"
              className="code-input"
            />
          </div>
        </div>
      </div>

      {/* Panel Principal: Clave Privada y Cálculo de A y K */}
      <div className="grid-2">
        {/* Lado Local: Clave privada a y cálculo de A */}
        <div className="card">
          <div className="card-header">
            <h3>Clave Privada y Cálculo de A</h3>
            <span className="party-badge alice-badge">Participante Local (Alice)</span>
          </div>

          <div className="form-group">
            <div className="label-with-action">
              <label htmlFor="dh-a">
                <strong>Clave Privada (a):</strong>
                <small className="help-text">Tu secreto personal (no se transmite)</small>
              </label>
              <button
                type="button"
                className="btn-link"
                onClick={generateRandomA}
              >
                Generar aleatorio
              </button>
            </div>
            <input
              id="dh-a"
              type="text"
              value={a}
              onChange={(e) => setA(e.target.value)}
              placeholder="Ingresa tu clave privada a"
              className="code-input"
            />
          </div>

          <div className="formula-box">
            <div className="formula-title">Fórmula:</div>
            <div className="formula-content">
              <code>A = g^a mod p</code>
            </div>
          </div>

          <div className="form-group result-group">
            <label>
              <strong>Clave Pública Calculada (A):</strong>
              <small className="help-text">Este valor se comparte públicamente con la contraparte</small>
            </label>
            <div className="output-box code-display">
              {calculatedA || <span className="placeholder">Aún no calculada</span>}
            </div>
            {calculatedA && (
              <button
                type="button"
                className="btn-secondary btn-sm copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(calculatedA);
                  showToast('Clave pública A copiada al portapapeles.');
                }}
              >
                Copiar A
              </button>
            )}
          </div>
        </div>

        {/* Cálculo del Secreto Compartido K */}
        <div className="card">
          <div className="card-header">
            <h3>Cálculo del Secreto Compartido K</h3>
            <span className="party-badge shared-badge">Clave Final</span>
          </div>

          <div className="form-group">
            <div className="label-with-action">
              <label htmlFor="dh-peer-k">
                <strong>Clave Pública de la Contraparte (k / B):</strong>
                <small className="help-text">La clave pública recibida de la otra parte</small>
              </label>
              {showSimulator && bobPublicB && (
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => setPeerKey(bobPublicB)}
                >
                  Cargar B de la simulación ({bobPublicB})
                </button>
              )}
            </div>
            <input
              id="dh-peer-k"
              type="text"
              value={peerKey}
              onChange={(e) => setPeerKey(e.target.value)}
              placeholder="Ingresa la clave pública recibida (k o B)"
              className="code-input"
            />
          </div>

          <div className="formula-box">
            <div className="formula-title">Fórmula:</div>
            <div className="formula-content">
              <code>K = (k)^a mod p</code>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary full-width"
            onClick={handleCalculateK}
          >
            Calcular Clave Compartida K
          </button>

          <div className="form-group result-group">
            <label>
              <strong>Resultado de K:</strong>
              <small className="help-text">Secreto criptográfico acordado</small>
            </label>
            <div className="output-box code-display secret-display">
              {calculatedK ? (
                <strong>{calculatedK}</strong>
              ) : (
                <span className="placeholder">Presiona "Calcular Clave Compartida K"</span>
              )}
            </div>
          </div>

          {calculatedK && (
            <div className="action-buttons-row">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(calculatedK);
                  showToast('Clave K copiada al portapapeles.');
                }}
              >
                Copiar K
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={handleExportToAes}
              >
                Usar en Cifrador AES ➔
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simulador bilateral opcional */}
      <div className="card accordion-card">
        <div 
          className="accordion-header"
          onClick={() => setShowSimulator(!showSimulator)}
        >
          <div className="accordion-title">
            <strong>Simulador Bilateral (Alice y Bob)</strong>
          </div>
          <span className="accordion-toggle">{showSimulator ? '[Ocultar]' : '[Mostrar]'}</span>
        </div>

        {showSimulator && (
          <div className="accordion-content">
            <p className="text-muted">
              Demuestra cómo ambas partes con claves privadas independientes (a y b) obtienen la misma clave compartida K.
            </p>
            <div className="simulator-grid">
              <div className="sim-column alice-col">
                <h4>Alice (Local)</h4>
                <p>1. Clave Privada: <code>a = {a || '(vacía)'}</code></p>
                <p>2. Envía Pública: <code>A = {calculatedA || '(pendiente)'}</code></p>
                <p>3. Recibe Pública: <code>B = {peerKey || '(pendiente)'}</code></p>
                <div className="sim-result">
                  <strong>K calculada por Alice:</strong>
                  <div className="sim-k">{calculatedK || 'Pendiente'}</div>
                </div>
              </div>

              <div className="sim-center-arrow">
                <span>&lt;--- Canal Inseguro ---&gt;</span>
                <small>Intercambio de A y B</small>
              </div>

              <div className="sim-column bob-col">
                <h4>Bob (Contraparte)</h4>
                <div className="form-group">
                  <label><small>Clave Privada de Bob (b):</small></label>
                  <input
                    type="text"
                    value={bobPrivateKey}
                    placeholder="Ingresa b para Bob"
                    onChange={(e) => setBobPrivateKey(e.target.value)}
                    className="code-input"
                  />
                </div>
                <p>Envía Pública: <code>B = {bobPublicB || '(pendiente)'}</code></p>
                <p>Recibe Pública: <code>A = {calculatedA || '(pendiente)'}</code></p>
                <div className="sim-result">
                  <strong>K calculada por Bob:</strong>
                  <div className="sim-k">{bobCalculatedK || 'Pendiente'}</div>
                </div>
              </div>
            </div>

            {calculatedK && bobCalculatedK && (
              <div className={`match-badge ${calculatedK === bobCalculatedK ? 'match-success' : 'match-fail'}`}>
                {calculatedK === bobCalculatedK ? (
                  <span>Coincidencia verificada: Ambas partes obtienen K = {calculatedK}</span>
                ) : (
                  <span>Las claves no coinciden. Asegúrate de que el valor k recibido corresponda a B.</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

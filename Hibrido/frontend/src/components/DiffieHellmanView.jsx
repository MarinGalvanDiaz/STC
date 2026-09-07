import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  modPow,
  DH_PRESETS,
  deriveAesKeyFromK,
  isPrimeBigInt,
  calculateEulerPhi,
  findPrimitiveRoots,
  getBitLength
} from '../utils/cryptoUtils';

export default function DiffieHellmanView({ onSetAesKey, onNavigateToCipher }) {
  // Configuración de Presets
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(-1);

  // Parámetros Públicos
  const [n, setN] = useState(''); // Módulo primo n
  const [phiN, setPhiN] = useState(''); // Euler Phi
  const [primitiveRoots, setPrimitiveRoots] = useState([]); // Raíces primitivas encontradas
  const [g, setG] = useState(''); // Raíz primitiva elegida
  const [isNPrime, setIsNPrime] = useState(null); // Estado de primalidad
  const [nBitLen, setNBitLen] = useState(0);

  // Selección de Rol
  const [userRole, setUserRole] = useState('A'); // 'A' o 'B'

  // Claves Privadas e Intermedias
  const [privKey, setPrivKey] = useState(''); // a o b (Rango 1 a n-2)
  const [privKeyError, setPrivKeyError] = useState('');
  const [pubKeyCalculated, setPubKeyCalculated] = useState(''); // K_a o K_b calculada

  // Paso 2: Cálculo del Secreto Compartido Final K
  const [remotePubKey, setRemotePubKey] = useState(''); // K_b si soy A, o K_a si soy B
  const [finalK, setFinalK] = useState('');

  // Simulador Bilateral
  const [showSimulator, setShowSimulator] = useState(false);
  const [simBobPriv, setSimBobPriv] = useState('');
  const [simBobPub, setSimBobPub] = useState('');
  const [simBobFinalK, setSimBobFinalK] = useState('');

  // Notificaciones internas
  const [notification, setNotification] = useState('');

  // Helper para alertas de advertencia de SweetAlert
  const showAlertWarning = (message) => {
    Swal.fire({
      icon: 'warning',
      title: 'Campos incompletos',
      text: message,
      confirmButtonText: 'Entendido'
    });
  };

  // Cargar presets rápidos
  const handlePresetChange = (idx) => {
    setSelectedPresetIndex(idx);
    if (idx >= 0 && idx < DH_PRESETS.length) {
      const preset = DH_PRESETS[idx];
      setN(preset.p);
      setG(preset.g);
    }
  };

  // 1. Validar n, calcular bit length, phi(n) y raíces primitivas
  useEffect(() => {
    setPhiN('');
    setPrimitiveRoots([]);
    setIsNPrime(null);

    if (!n) {
      setNBitLen(0);
      return;
    }

    const bits = getBitLength(n);
    setNBitLen(bits);

    try {
      const nBig = BigInt(n);
      if (nBig <= 2n) {
        setIsNPrime(false);
        return;
      }

      if (bits <= 16) {
        const prime = isPrimeBigInt(nBig);
        setIsNPrime(prime);
        if (prime) {
          const phi = calculateEulerPhi(nBig);
          setPhiN(phi.toString());
          const roots = findPrimitiveRoots(nBig, 30);
          setPrimitiveRoots(roots);
          if (roots.length > 0 && !roots.includes(g)) {
            setG(roots[0]);
          }
        }
      } else {
        setIsNPrime(true);
        setPhiN((nBig - 1n).toString());
      }
    } catch (e) {
      setIsNPrime(false);
    }
  }, [n]);

  // 2. Validar que la clave privada (a o b) esté estrictamente en Rango [1, n - 2]
  useEffect(() => {
    setPrivKeyError('');
    setPubKeyCalculated('');
    if (!privKey || !n) return;

    try {
      const pVal = BigInt(privKey);
      const nVal = BigInt(n);
      const maxVal = nVal - 2n;

      if (pVal < 1n || pVal > maxVal) {
        setPrivKeyError(`El valor debe estar estrictamente entre 1 y n-2 (Máximo: ${maxVal.toString()})`);
      }
    } catch (e) {
      setPrivKeyError('Ingresa un número entero válido.');
    }
  }, [privKey, n]);

  // 3. Calcular K_a o K_b pública = g^(a o b) mod n
  const handleCalculatePublicExchangeKey = () => {
    if (!n) {
      showAlertWarning('Por favor, ingresa el módulo primo (n) antes de continuar.');
      return;
    }
    if (!g) {
      showAlertWarning('Por favor, selecciona o ingresa la raíz primitiva (g) antes de continuar.');
      return;
    }
    if (!privKey) {
      showAlertWarning(`Por favor, ingresa tu clave privada (${userRole.toLowerCase()}) antes de continuar.`);
      return;
    }
    if (privKeyError) {
      Swal.fire({
        icon: 'error',
        title: 'Error en la clave privada',
        text: 'Corrige los errores de la clave privada antes de continuar.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      const res = modPow(g, privKey, n);
      setPubKeyCalculated(res.toString());
      showToast(`Clave K_${userRole.toLowerCase()} pública calculada exitosamente.`);
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error de cálculo',
        text: 'Ocurrió un error en el cálculo modular.'
      });
    }
  };

  // 4. Calcular Secreto Compartido Final K = (K_remota)^(a o b) mod n
  const handleCalculateFinalK = () => {
    if (!n || !g || !privKey) {
      showAlertWarning('Debes completar el Paso 1 y Paso 2 (Módulo n, raíz g y clave privada) antes de calcular K.');
      return;
    }
    if (!pubKeyCalculated) {
      showAlertWarning(`Primero debes calcular tu clave pública K_${userRole.toLowerCase()} en el Paso 2.`);
      return;
    }
    if (!remotePubKey) {
      showAlertWarning(`Por favor, ingresa o sube la clave pública recibida (K_${userRole === 'A' ? 'b' : 'a'}) para continuar.`);
      return;
    }

    try {
      const resK = modPow(remotePubKey, privKey, n);
      setFinalK(resK.toString());
      showToast('Secreto compartido K derivado con éxito.');
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Error de cálculo',
        text: 'Ocurrió un error al calcular el secreto K.'
      });
    }
  };

  // Cargar archivo .txt para K_a o K_b recibida
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result.trim();
      setRemotePubKey(content);
      showToast('Clave cargada desde archivo .txt');
    };
    reader.readAsText(file);
  };

  // Descargar K_a o K_b
  const downloadKeyTxt = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Simulación de Bob
  useEffect(() => {
    if (!showSimulator || !n || !g || !simBobPriv) return;
    try {
      const bPub = modPow(g, simBobPriv, n);
      setSimBobPub(bPub.toString());

      if (pubKeyCalculated) {
        const bK = modPow(pubKeyCalculated, simBobPriv, n);
        setSimBobFinalK(bK.toString());
      }
    } catch (e) {}
  }, [showSimulator, n, g, simBobPriv, pubKeyCalculated]);

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
            Estándares RFC 3526 / RFC 7919 con validación de raíces primitivas y cálculo modular seguro.
          </p>
        </div>

        {notification && <div className="alert alert-success"><span>{notification}</span></div>}

        {/* Parámetros Globales (n y g) */}
        <div className="card">
          <div className="card-header">
            <h3>1. Parámetros Públicos (Módulo n y Generador g)</h3>
            <span className="info-tag">Longitud n: {nBitLen} bits</span>
          </div>

          <div className="preset-selector">
            <label>Cargar plantilla rápida de estándar:</label>
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
            <div className="form-group" style={{ minWidth: 0 }}>
              <label>
                <strong>Módulo Primo (n):</strong>
                <small className="help-text">Se recomienda un número primo largo (ej. 4096 bits para producción).</small>
              </label>
              <input
                  type="text"
                  value={n}
                  onChange={(e) => { setN(e.target.value); setSelectedPresetIndex(-1); }}
                  placeholder="Ingresa un número primo n"
                  className="code-input"
              />
              {isNPrime === false && (
                  <small className="text-danger">El valor ingresado no es un número primo válido.</small>
              )}
              {isNPrime === true && (
                  <small className="text-success">El número es primo. $\phi(n) = {phiN}$</small>
              )}
            </div>

            <div className="form-group" style={{ minWidth: 0 }}>
              <label>
                <strong>Generador / Raíz Primitiva (g):</strong>
                <small className="help-text">Debe ser una raíz primitiva módulo n.</small>
              </label>
              {primitiveRoots.length > 0 ? (
                  <select
                      value={g}
                      onChange={(e) => setG(e.target.value)}
                      className="code-input"
                  >
                    {primitiveRoots.map((root, i) => (
                        <option key={i} value={root}>g = {root}</option>
                    ))}
                  </select>
              ) : (
                  <input
                      type="text"
                      value={g}
                      onChange={(e) => setG(e.target.value)}
                      placeholder="Ingresa la raíz primitiva g"
                      className="code-input"
                  />
              )}
            </div>
          </div>
        </div>

        {/* Selección de Rol y Parámetros Privados */}
        <div className="card">
          <div className="card-header">
            <h3>2. Configuración de Rol y Clave Privada</h3>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ minWidth: 0 }}>
              <label><strong>Selecciona tu Rol:</strong></label>
              <div className="role-selector">
                <button
                    type="button"
                    className={`preset-btn ${userRole === 'A' ? 'active' : ''}`}
                    onClick={() => { setUserRole('A'); setPubKeyCalculated(''); setFinalK(''); }}
                >
                  Usuario A (Alice)
                </button>
                <button
                    type="button"
                    className={`preset-btn ${userRole === 'B' ? 'active' : ''}`}
                    onClick={() => { setUserRole('B'); setPubKeyCalculated(''); setFinalK(''); }}
                >
                  Usuario B (Bob)
                </button>
              </div>
            </div>

            <div className="form-group" style={{ minWidth: 0 }}>
              <label>
                <strong>Clave Privada ({userRole.toLowerCase()}):</strong>
                <small className="help-text">Condición obligatoria: Debe ser un entero entre 1 y n-2 ({getBitLength(privKey)} bits).</small>
              </label>
              <input
                  type="text"
                  value={privKey}
                  onChange={(e) => setPrivKey(e.target.value)}
                  placeholder={`Ingresa ${userRole.toLowerCase()} (1 <= ${userRole.toLowerCase()} <= n-2)`}
                  className={`code-input ${privKeyError ? 'input-error' : ''}`}
              />
              {privKeyError && <small className="text-danger">{privKeyError}</small>}
            </div>
          </div>

          <button
              type="button"
              className="btn-primary full-width"
              onClick={handleCalculatePublicExchangeKey}
          >
            Calcular K_{userRole.toLowerCase()} = g^{userRole.toLowerCase()} mod n
          </button>

          {pubKeyCalculated && (
              <div className="result-group" style={{ marginTop: '15px' }}>
                <label><strong>Clave Pública Calculada (K_{userRole.toLowerCase()}):</strong></label>
                <div className="output-box code-display">{pubKeyCalculated}</div>
                <div className="action-buttons-row" style={{ marginTop: '10px' }}>
                  <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(pubKeyCalculated);
                        showToast('Copiado al portapapeles');
                      }}
                  >
                    Copiar K_{userRole.toLowerCase()}
                  </button>
                  <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => downloadKeyTxt(pubKeyCalculated, `K_${userRole.toLowerCase()}.txt`)}
                  >
                    Descargar K_{userRole.toLowerCase()} (.txt)
                  </button>
                </div>
              </div>
          )}
        </div>

        {/* Fase 3: Obtener clave remota y calcular K final */}
        <div className="card">
          <div className="card-header">
            <h3>3. Cálculo del Secreto Compartido Final (K)</h3>
          </div>

          <div className="form-group" style={{ minWidth: 0 }}>
            <label>
              <strong>Ingresa o sube la clave pública recibida (K_{userRole === 'A' ? 'b' : 'a'}):</strong>
            </label>
            <input
                type="text"
                value={remotePubKey}
                onChange={(e) => setRemotePubKey(e.target.value)}
                placeholder={`Pega aquí la clave K_${userRole === 'A' ? 'b' : 'a'} recibida`}
                className="code-input"
            />
            <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                style={{ marginTop: '8px' }}
            />
          </div>

          <button
              type="button"
              className="btn-primary full-width"
              onClick={handleCalculateFinalK}
          >
            Calcular Clave Final K = (K_{userRole === 'A' ? 'b' : 'a'})^{userRole.toLowerCase()} mod n
          </button>

          {finalK && (
              <div className="result-group" style={{ marginTop: '15px' }}>
                <label><strong>Secreto Compartido K Calculado:</strong></label>
                <div className="output-box code-display secret-display">
                  <strong>{finalK}</strong>
                </div>
                <div className="action-buttons-row" style={{ marginTop: '10px' }}>
                  <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(finalK);
                        showToast('K copiada');
                      }}
                  >
                    Copiar K
                  </button>
                  <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        const aesKey = deriveAesKeyFromK(finalK, 16);
                        if (onSetAesKey) onSetAesKey(aesKey);
                        showToast(`K exportada a AES (${aesKey})`);
                        if (onNavigateToCipher) setTimeout(onNavigateToCipher, 500);
                      }}
                  >
                    Usar en Cifrador AES -{'>'}
                  </button>
                </div>
              </div>
          )}
        </div>

        {/* Simulador Bilateral */}
        <div className="card accordion-card">
          <div className="accordion-header" onClick={() => setShowSimulator(!showSimulator)}>
            <strong>Simulador Bilateral en Vivo</strong>
            <span>{showSimulator ? '[Ocultar]' : '[Mostrar]'}</span>
          </div>

          {showSimulator && (
              <div className="accordion-content">
                <div className="simulator-grid">
                  <div className="sim-column">
                    <h4>{userRole === 'A' ? 'Usuario A (Local)' : 'Usuario A (Simulado)'}</h4>
                    <p>Clave privada: <code>a = {userRole === 'A' ? privKey : '(simulado)'}</code></p>
                    <p>Clave pública: <code>K_a = {userRole === 'A' ? pubKeyCalculated : remotePubKey}</code></p>
                    <p>K Final: <code>{userRole === 'A' ? finalK : simBobFinalK}</code></p>
                  </div>

                  <div className="sim-column">
                    <h4>{userRole === 'B' ? 'Usuario B (Local)' : 'Usuario B (Contraparte)'}</h4>
                    <div className="form-group" style={{ minWidth: 0 }}>
                      <label><small>Clave Privada b:</small></label>
                      <input
                          type="text"
                          value={userRole === 'B' ? privKey : simBobPriv}
                          onChange={(e) => setSimBobPriv(e.target.value)}
                          disabled={userRole === 'B'}
                          className="code-input"
                      />
                    </div>
                    <p>Clave pública: <code>K_b = {userRole === 'B' ? pubKeyCalculated : simBobPub}</code></p>
                    <p>K Final: <code>{userRole === 'B' ? finalK : simBobFinalK}</code></p>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}
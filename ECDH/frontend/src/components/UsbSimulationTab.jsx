import React, { useState } from 'react';

export default function UsbSimulationTab({
  simulation,
  currentStep,
  onStepChange,
  onRunSimulation,
  loading,
  selectedCurve
}) {
  const [showPrivates, setShowPrivates] = useState({ Alice: false, Bob: false, Candy: false });
  const [usbCurrentSlot, setUsbCurrentSlot] = useState('Alice');
  const [copiedKey, setCopiedKey] = useState(null);

  const togglePrivate = (entity) => {
    setShowPrivates((prev) => ({ ...prev, [entity]: !prev[entity] }));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const downloadJson = (fileName, data) => {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stepsInfo = [
    { num: 1, title: '1. Generación de Claves', desc: 'Alice, Bob y Candy generan sus pares (a, P_A), (b, P_B), (c, P_C).' },
    { num: 2, title: '2. Intercambio USB Ronda 1', desc: 'Se graban las claves públicas en memoria USB y se transfieren circularmente.' },
    { num: 3, title: '3. Claves Intermedias', desc: 'Cada entidad calcula Z_AC = a*C, Z_BA = b*A, Z_CB = c*B.' },
    { num: 4, title: '4. Intercambio USB Ronda 2', desc: 'Se transfieren las claves intermedias parciales por USB.' },
    { num: 5, title: '5. Derivación y Verificación', desc: 'Se calcula el punto final abcG y la clave simétrica KDF SHA-256.' },
  ];

  if (!simulation && !loading) {
    return (
      <div className="empty-state-card">
        <div className="empty-icon">🔐</div>
        <h2>Simulación del Protocolo ECDH para 3 Entidades</h2>
        <p>
          Presiona el botón para inicializar la simulación interactiva con curva <strong>{selectedCurve}</strong> y simular el intercambio de claves usando la memoria USB física.
        </p>
        <button className="btn-primary-large" onClick={onRunSimulation} disabled={loading}>
          {loading ? 'Generando...' : '▶ Iniciar Protocolo ECDH Tripartito'}
        </button>
      </div>
    );
  }

  const { keyPairs, intermediateKeys, finalKeys, round1UsbFiles, round2UsbFiles, keysMatch, sharedSecretHex } = simulation || {};

  return (
    <div className="simulation-tab-container">
      {/* Barra de progreso de los 5 pasos */}
      <div className="stepper-bar">
        {stepsInfo.map((s) => (
          <button
            key={s.num}
            onClick={() => onStepChange(s.num)}
            className={`step-btn ${currentStep === s.num ? 'active' : ''} ${currentStep > s.num ? 'completed' : ''}`}
          >
            <span className="step-circle">{currentStep > s.num ? '✓' : s.num}</span>
            <div className="step-texts">
              <span className="step-title">{s.title}</span>
              <span className="step-desc-short">{s.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Controles de Simulación y USB */}
      <div className="action-control-panel">
        <div className="control-left">
          <button
            className="btn-outline"
            disabled={currentStep <= 1 || loading}
            onClick={() => onStepChange(currentStep - 1)}
          >
            ◀ Paso Anterior
          </button>
          <button
            className="btn-primary"
            disabled={currentStep >= 5 || loading}
            onClick={() => onStepChange(currentStep + 1)}
          >
            Siguiente Paso ▶
          </button>
          <button
            className="btn-secondary"
            onClick={onRunSimulation}
            disabled={loading}
          >
            🔄 Regenerar Claves Nuevas
          </button>
        </div>

        <div className="usb-quick-status">
          <span className="usb-indicator-icon">💾</span>
          <div>
            <strong>Memoria USB Virtual: </strong>
            <span className="slot-badge">Conectada en {usbCurrentSlot}</span>
          </div>
          <button
            className="btn-sm btn-outline"
            onClick={() => {
              const slots = ['Alice', 'Bob', 'Candy'];
              const next = slots[(slots.indexOf(usbCurrentSlot) + 1) % 3];
              setUsbCurrentSlot(next);
            }}
          >
            Pasar USB a {usbCurrentSlot === 'Alice' ? 'Bob' : usbCurrentSlot === 'Bob' ? 'Candy' : 'Alice'} ➔
          </button>
        </div>
      </div>

      {/* Banner de Verificación Final (Si está en el paso 5) */}
      {currentStep === 5 && (
        <div className={`verification-hero-card ${keysMatch ? 'success' : 'error'}`}>
          <div className="hero-status-icon">{keysMatch ? '🛡️' : '⚠️'}</div>
          <div className="hero-status-body">
            <h3>{keysMatch ? '¡VERIFICACIÓN EXITOSA: LAS TRES ENTIDADES TIENEN LA MISMA CLAVE!' : 'Error de Verificación'}</h3>
            <p>
              Alice, Bob y Candy derivaron de forma independiente el mismo punto elíptico <code>S = (abc) · G</code>.
              Aplicando la función KDF (SHA-256) sobre la coordenada afín X, se obtiene la clave simétrica común:
            </p>
            <div className="secret-key-display">
              <span className="key-label">Clave Secreta Compartida K_shared (SHA-256, 256 bits):</span>
              <div className="key-value-box">
                <code>{sharedSecretHex}</code>
                <button
                  className="btn-copy"
                  onClick={() => copyToClipboard(sharedSecretHex, 'k_shared')}
                >
                  {copiedKey === 'k_shared' ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
            <div className="equality-checks">
              <span className="eq-tag">Alice K_A == Bob K_B ✓</span>
              <span className="eq-tag">Bob K_B == Candy K_C ✓</span>
              <span className="eq-tag">Candy K_C == Alice K_A ✓</span>
            </div>
          </div>
        </div>
      )}

      {/* Simulación Gráfica de Memoria USB */}
      <div className="usb-drive-simulator-box">
        <div className="usb-box-header">
          <div className="usb-title">
            <span className="usb-icon-large">💾</span>
            <div>
              <h4>Simulación de Memoria USB Física (Intercambio Offline)</h4>
              <p className="usb-subtext">
                Simula el medio extraíble utilizado para transportar las claves entre los equipos de Alice, Bob y Candy.
              </p>
            </div>
          </div>
          <span className="drive-label">UNIDAD USB: [E:\ECDH_SHARE]</span>
        </div>

        <div className="usb-slots-row">
          {['Alice', 'Bob', 'Candy'].map((entity) => {
            const isMounted = usbCurrentSlot === entity;
            return (
              <div
                key={entity}
                className={`usb-slot-card ${isMounted ? 'mounted' : ''}`}
                onClick={() => setUsbCurrentSlot(entity)}
              >
                <div className="slot-header">
                  <span className="entity-avatar">{entity === 'Alice' ? '👩‍💻' : entity === 'Bob' ? '👨‍💻' : '👩‍🔬'}</span>
                  <span className="slot-name">Puerto USB de {entity}</span>
                </div>
                <div className="slot-status">
                  {isMounted ? (
                    <span className="status-badge connected">● USB Conectada</span>
                  ) : (
                    <span className="status-badge disconnected">○ Puerto Vacío</span>
                  )}
                </div>
                {isMounted && (
                  <div className="slot-action-text">Dispositivo montado y listo para lectura/escritura</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Archivos en la Memoria USB según la ronda */}
        <div className="usb-files-container">
          <h5>Archivos presentes en la Memoria USB:</h5>
          <div className="usb-files-list">
            {(currentStep >= 2 ? (currentStep >= 4 ? [...(round1UsbFiles || []), ...(round2UsbFiles || [])] : (round1UsbFiles || [])) : []).map((file, idx) => (
              <div key={idx} className="usb-file-item">
                <span className="file-icon">{file.fileType === 'PUBLIC_KEY' ? '📄' : '🔑'}</span>
                <div className="file-info">
                  <span className="file-name">{file.fileName}</span>
                  <span className="file-summary">{file.contentSummary}</span>
                </div>
                <button
                  className="btn-download"
                  onClick={() => downloadJson(file.fileName, file.payload)}
                  title="Descargar archivo JSON a tu disco o memoria USB real"
                >
                  ⬇ Descargar archivo
                </button>
              </div>
            ))}
            {currentStep < 2 && (
              <div className="empty-usb-text">La memoria USB está vacía. Avanza al Paso 2 para exportar claves a la USB.</div>
            )}
          </div>
        </div>
      </div>

      {/* Tarjetas de las 3 Entidades (Alice, Bob, Candy) */}
      <div className="entities-grid">
        {['Alice', 'Bob', 'Candy'].map((entity) => {
          const kp = keyPairs ? keyPairs[entity] : null;
          const inter = intermediateKeys ? intermediateKeys[entity] : null;
          const fin = finalKeys ? finalKeys[entity] : null;
          const themeClass = entity === 'Alice' ? 'entity-alice' : entity === 'Bob' ? 'entity-bob' : 'entity-candy';
          const avatar = entity === 'Alice' ? '👩‍💻 Alice' : entity === 'Bob' ? '👨‍💻 Bob' : '👩‍🔬 Candy';

          return (
            <div key={entity} className={`entity-card ${themeClass}`}>
              <div className="entity-header">
                <div className="entity-title">
                  <span className="entity-name">{avatar}</span>
                  <span className="entity-role">Participante</span>
                </div>
                <span className="status-pill">Curva {selectedCurve}</span>
              </div>

              {/* Fase 1: Claves Localmente Generadas */}
              <div className="card-section">
                <div className="section-title">
                  <span>Paso 1: Par de Claves</span>
                  {kp && (
                    <button
                      className="btn-text-sm"
                      onClick={() => togglePrivate(entity)}
                    >
                      {showPrivates[entity] ? 'Ocultar privada' : '👁 Revelar privada'}
                    </button>
                  )}
                </div>

                {kp ? (
                  <>
                    <div className="data-field">
                      <span className="field-label">Clave Privada escalar (d):</span>
                      <div className="field-box">
                        <code className="key-code">
                          {showPrivates[entity] ? kp.privateKeyHex : '••••••••••••••••••••••••••••••••••••••••••••••••'}
                        </code>
                        {showPrivates[entity] && (
                          <button
                            className="btn-copy-sm"
                            onClick={() => copyToClipboard(kp.privateKeyHex, `${entity}_priv`)}
                          >
                            {copiedKey === `${entity}_priv` ? '✓' : 'Copiar'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="data-field">
                      <span className="field-label">Clave Pública Punto P = d · G:</span>
                      <div className="field-box">
                        <span className="sub-label">Coord X:</span>
                        <code className="key-code-small">{kp.pointX}</code>
                        <span className="sub-label">Coord Y:</span>
                        <code className="key-code-small">{kp.pointY}</code>
                        <button
                          className="btn-copy-sm"
                          onClick={() => copyToClipboard(kp.publicKeyHex, `${entity}_pub`)}
                        >
                          {copiedKey === `${entity}_pub` ? '✓' : 'Copiar Punto Completo'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="pending-text">Pendiente de generación...</div>
                )}
              </div>

              {/* Fase 2: Claves Intermedias Parciales */}
              <div className={`card-section ${currentStep >= 3 ? '' : 'disabled-section'}`}>
                <div className="section-title">
                  <span>Paso 3: Clave Intermedia Parcial</span>
                </div>
                {inter && currentStep >= 3 ? (
                  <div className="data-field">
                    <span className="field-label">Fórmula: <code>{inter.formula}</code></span>
                    <div className="field-box">
                      <span className="sub-label">Coord X:</span>
                      <code className="key-code-small">{inter.pointX}</code>
                      <span className="sub-label">Coord Y:</span>
                      <code className="key-code-small">{inter.pointY}</code>
                      <span className="flow-badge">Se envía por USB a {inter.targetRecipient}</span>
                    </div>
                  </div>
                ) : (
                  <div className="pending-text">Disponible en el Paso 3</div>
                )}
              </div>

              {/* Fase 3: Clave Final Derivada */}
              <div className={`card-section ${currentStep >= 5 ? '' : 'disabled-section'}`}>
                <div className="section-title">
                  <span>Paso 5: Clave Final Compartida</span>
                </div>
                {fin && currentStep >= 5 ? (
                  <div className="data-field">
                    <span className="field-label">Fórmula: <code>{fin.formula}</code></span>
                    <div className="field-box success-box">
                      <span className="sub-label">Punto Final X:</span>
                      <code className="key-code-small">{fin.finalPointX}</code>
                      <span className="sub-label">Clave SHA-256 (256-bit):</span>
                      <code className="key-code highlight-key">{fin.derivedKeyHex}</code>
                      <div className="time-badge">
                        ⏱ Tiempo: {(fin.computationTimeNanos / 1_000_000).toFixed(3)} ms
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pending-text">Disponible en el Paso 5</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

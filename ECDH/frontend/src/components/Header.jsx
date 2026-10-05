import React from 'react';

export default function Header({ curves, selectedCurve, onSelectCurve, onShowCurveModal }) {
  const current = curves.find((c) => c.id === selectedCurve) || curves[0];

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="institution-brand">
          <div className="logo-badge ipn-badge">IPN</div>
          <div className="institution-text">
            <span className="inst-main">INSTITUTO POLITÉCNICO NACIONAL</span>
            <span className="inst-sub">ESCUELA SUPERIOR DE CÓMPUTO (ESCOM)</span>
          </div>
          <div className="logo-badge escom-badge">ESCOM</div>
        </div>
        <div className="course-info">
          <span className="prof-title">Dra. Nidia A. Cortez Duarte</span>
          <span className="practice-badge">Práctica 5</span>
        </div>
      </div>

      <div className="header-title-bar">
        <div>
          <h1 className="header-title">Intercambio de Claves ECDH Tripartito</h1>
          <p className="header-subtitle">
            Protocolo Elliptic Curve Diffie-Hellman para tres entidades (<strong>Alice</strong>, <strong>Bob</strong> y <strong>Candy</strong>) con simulación de Memoria USB y recomendaciones NIST.
          </p>
        </div>

        <div className="curve-selector-box">
          <div className="curve-selector-label">Curva Elíptica NIST:</div>
          <div className="curve-controls">
            <select
              value={selectedCurve}
              onChange={(e) => onSelectCurve(e.target.value)}
              className="curve-dropdown"
            >
              {curves.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.securityBits} bits de seg.)
                </option>
              ))}
            </select>
            <button
              onClick={onShowCurveModal}
              title="Ver detalles matemáticos y justificación de la curva"
              className="btn-info"
            >
              ℹ️ Detalles
            </button>
          </div>
          {current && (
            <div className="curve-quick-tags">
              <span className="tag tag-security">{current.securityBits} bits seg.</span>
              <span className="tag tag-equiv">≈ {current.rsaEquivalent}</span>
              <span className="tag tag-sym">≈ {current.aesEquivalent}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

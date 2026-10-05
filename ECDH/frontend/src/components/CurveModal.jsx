import React from 'react';

export default function CurveModal({ curve, onClose }) {
  if (!curve) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detalles de la Curva: {curve.name}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="curve-spec-grid">
            <div className="spec-item">
              <span className="spec-label">Nombre estándar:</span>
              <span className="spec-value">{curve.standardName}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Identificador OID:</span>
              <span className="spec-value mono">{curve.oid}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Nivel de Seguridad:</span>
              <span className="spec-value highlight">{curve.securityBits} bits</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Algoritmo Equivalente:</span>
              <span className="spec-value">{curve.rsaEquivalent} / {curve.aesEquivalent}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Ecuación de Weierstrass:</span>
              <span className="spec-value mono">{curve.equation}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Tamaño de Claves:</span>
              <span className="spec-value">{curve.keySize}</span>
            </div>
            <div className="spec-item full-width">
              <span className="spec-label">Tipo de Campo Finito:</span>
              <span className="spec-value">{curve.fieldType}</span>
            </div>
          </div>

          <div className="curve-justification-box">
            <h4>Justificación NIST (FIPS 186-4/5 y SP 800-56A):</h4>
            <p>{curve.justification}</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

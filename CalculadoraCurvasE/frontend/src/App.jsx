import React, { useState } from 'react';
import './App.css';

function App() {
  const [signA, setSignA] = useState('+');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [p, setP] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pointOperation, setPointOperation] = useState('DOUBLE');
  const [pointA, setPointA] = useState('');
  const [pointB, setPointB] = useState('');
  const [pointN, setPointN] = useState('');
  const [x1, setX1] = useState('');
  const [y1, setY1] = useState('');
  const [x2, setX2] = useState('');
  const [y2, setY2] = useState('');
  const [pointResult, setPointResult] = useState(null);
  const [pointLoading, setPointLoading] = useState(false);
  const [pointError, setPointError] = useState('');

  // Garantiza que los inputs solo acepten dígitos numéricos
  const handleNumberInput = (setter) => (e) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setter(val);
    }
  };

  const handleSignedNumberInput = (setter) => (e) => {
    const val = e.target.value;
    if (val === '' || val === '-' || /^-?\d+$/.test(val)) {
      setter(val);
    }
  };

  const handleVerify = async () => {
    if (!a || !b || !p) {
      setError('Por favor completa los tres campos numéricos.');
      return;
    }
    if (parseInt(p, 10) <= 0) {
      setError('El módulo p debe ser un número entero positivo.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/elliptic/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signA,
          a: parseInt(a, 10),
          b: parseInt(b, 10),
          p: parseInt(p, 10)
        })
      });

      if (!response.ok) throw new Error('Error al conectar con el servidor.');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Error en la verificación.');
    } finally {
      setLoading(false);
    }
  };

  const handlePointOperation = async () => {
    const requiredValues = [pointA, pointB, pointN, x1, y1];
    if (pointOperation === 'SUM') {
      requiredValues.push(x2, y2);
    }
    if (requiredValues.some((value) => !value || value === '-' || isNaN(parseInt(value, 10)))) {
      setPointError('Completa todos los valores necesarios con números válidos.');
      return;
    }
    if (parseInt(pointN, 10) <= 1) {
      setPointError('El módulo n debe ser mayor que 1.');
      return;
    }

    setPointError('');
    setPointLoading(true);
    setPointResult(null);

    const request = {
      operation: pointOperation,
      a: parseInt(pointA, 10),
      b: parseInt(pointB, 10),
      n: parseInt(pointN, 10),
      p: { x: parseInt(x1, 10), y: parseInt(y1, 10) },
      q: pointOperation === 'SUM'
        ? { x: parseInt(x2, 10), y: parseInt(y2, 10) }
        : null
    };

    try {
      const response = await fetch('http://localhost:8080/api/elliptic/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || 'No se pudo calcular la operación.');
      }
      setPointResult(await response.json());
    } catch (err) {
      setPointError(err.message || 'Error al calcular los puntos.');
    } finally {
      setPointLoading(false);
    }
  };

  return (
      <div className="full-container">
        <div className="card-box">
          <h1 className="main-title">Calculadora de Curvas Elípticas</h1>

          <div className="step-container">
            <h2 className="step-title">
              Primer paso: verificar que la curva elíptica sea no singular
            </h2>

            <div className="formula-card">
              <span className="math-display">Δ = 4a³ + 27b² mod p ≠ 0</span>
            </div>

            <div className="equation-builder">
              <span className="eq-text">y² ≡ x³</span>

              <select
                  value={signA}
                  onChange={(e) => setSignA(e.target.value)}
                  className="custom-select"
              >
                <option value="+">+</option>
                <option value="-">-</option>
              </select>

              <input
                  type="text"
                  inputMode="numeric"
                  placeholder="a"
                  value={a}
                  onChange={handleNumberInput(setA)}
                  className="custom-input"
              />
              <span className="eq-text">x +</span>

              <input
                  type="text"
                  inputMode="numeric"
                  placeholder="b"
                  value={b}
                  onChange={handleNumberInput(setB)}
                  className="custom-input"
              />

              <span className="eq-text">mod</span>

              <input
                  type="text"
                  inputMode="numeric"
                  placeholder="p"
                  value={p}
                  onChange={handleNumberInput(setP)}
                  className="custom-input"
              />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button
                onClick={handleVerify}
                disabled={loading}
                className="verify-btn"
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>

            {result && (
                <div className="results-panel">
                  <h3 className="section-sub">Fórmula con Valores Sustituidos:</h3>
                  <div className="formula-card">
                    <span className="math-display">{result.substitutedFormula}</span>
                  </div>

                  <h3 className="section-sub">Resultado del Cálculo:</h3>
                  <p className="delta-val">Δ = {result.deltaValue}</p>

                  <div className={`status-banner ${result.message?.includes('NO SINGULAR') ? 'success' : 'danger'}`}>
                    {result.message}
                  </div>
                </div>
            )}
          </div>

          <div className="step-container point-operations">
            <h2 className="step-title">Suma y doblado de puntos</h2>

            <div className="formula-card">
              <span className="math-display">y² ≡ x³ + ax + b mod n</span>
            </div>

            <div className="operation-toolbar">
              <label htmlFor="point-operation">Operación</label>
              <select
                id="point-operation"
                value={pointOperation}
                onChange={(e) => {
                  setPointOperation(e.target.value);
                  setPointResult(null);
                  setPointError('');
                }}
                className="custom-select"
              >
                <option value="DOUBLE">Doblar punto (2P)</option>
                <option value="SUM">Sumar puntos (P + Q)</option>
              </select>
            </div>

            <div className="point-grid">
              <label>
                <span>Coeficiente a</span>
                <input className="custom-input" type="text"
                  placeholder="a" value={pointA} onChange={handleSignedNumberInput(setPointA)} />
              </label>
              <label>
                <span>Coeficiente b</span>
                <input className="custom-input" type="text"
                  placeholder="b" value={pointB} onChange={handleSignedNumberInput(setPointB)} />
              </label>
              <label>
                <span>Módulo n</span>
                <input className="custom-input" type="text" inputMode="numeric"
                  placeholder="n" value={pointN} onChange={handleNumberInput(setPointN)} />
              </label>
            </div>

            <div className="point-inputs">
              <div className="point-card">
                <h3 className="section-sub">Punto P</h3>
                <div className="coordinate-row">
                  <input className="custom-input" type="text"
                    placeholder="x₁" value={x1} onChange={handleSignedNumberInput(setX1)} />
                  <input className="custom-input" type="text"
                    placeholder="y₁" value={y1} onChange={handleSignedNumberInput(setY1)} />
                </div>
              </div>

              {pointOperation === 'SUM' && (
                <div className="point-card">
                  <h3 className="section-sub">Punto Q</h3>
                  <div className="coordinate-row">
                    <input className="custom-input" type="text"
                      placeholder="x₂" value={x2} onChange={handleSignedNumberInput(setX2)} />
                    <input className="custom-input" type="text"
                      placeholder="y₂" value={y2} onChange={handleSignedNumberInput(setY2)} />
                  </div>
                </div>
              )}
            </div>

            {pointError && <p className="error-msg">{pointError}</p>}

            <button
              onClick={handlePointOperation}
              disabled={pointLoading}
              className="verify-btn"
            >
              {pointLoading ? 'Calculando...' : 'Calcular operación'}
            </button>

            {pointResult && (
              <div className="results-panel">
                <h3 className="section-sub">Resultado</h3>
                <div className="point-result">
                  {pointResult.result.infinity
                    ? 'Punto al infinito (∞)'
                    : `(${pointResult.result.x}, ${pointResult.result.y})`}
                </div>
                <div className="formula-card">
                  <span className="math-display">{pointResult.formula}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}

export default App;
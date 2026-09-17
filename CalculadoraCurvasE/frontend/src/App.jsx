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

  // Garantiza que los inputs solo acepten dígitos numéricos
  const handleNumberInput = (setter) => (e) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
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
        </div>
      </div>
  );
}

export default App;
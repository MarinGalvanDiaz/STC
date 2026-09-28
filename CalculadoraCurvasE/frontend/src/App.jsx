import React, { useState } from 'react';
import './App.css';

function App() {
  // Estados para validar y analizar la curva (Req. 1 y 2)
  const [signA, setSignA] = useState('+');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [p, setP] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para operaciones de puntos (Req. 3.c)
  const [pointOperation, setPointOperation] = useState('DOUBLE');
  const [pointA, setPointA] = useState('');
  const [pointB, setPointB] = useState('');
  const [pointN, setPointN] = useState('');
  const [x1, setX1] = useState('');
  const [y1, setY1] = useState('');
  const [x2, setX2] = useState('');
  const [y2, setY2] = useState('');
  const [scalarK, setScalarK] = useState('');
  const [pointResult, setPointResult] = useState(null);
  const [pointLoading, setPointLoading] = useState(false);
  const [pointError, setPointError] = useState('');

  // Pestaña activa para alternar entre tablas si se desea, o mostrar todo
  const [activeTab, setActiveTab] = useState('ALL');

  // Garantiza que los inputs solo acepten dígitos numéricos positivos
  const handleNumberInput = (setter) => (e) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setter(val);
    }
  };

  // Permite números enteros con signo
  const handleSignedNumberInput = (setter) => (e) => {
    const val = e.target.value;
    if (val === '' || val === '-' || /^-?\d+$/.test(val)) {
      setter(val);
    }
  };

  // Formateador de puntos para mostrar (x, y) u O
  const formatPoint = (pt) => {
    if (!pt) return '';
    if (pt.infinity) return 'O';
    return `(${pt.x}, ${pt.y})`;
  };

  // Validar curva y calcular puntos, cardinalidad, tablas y generadores
  const handleVerifyAndAnalyze = async () => {
    if (!a || !b || !p) {
      setError('Por favor completa los tres campos numéricos (a, b y p).');
      return;
    }
    if (parseInt(p, 10) <= 3) {
      setError('El módulo p debe ser un número primo mayor que 3.');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8080/api/elliptic/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signA,
          a: parseInt(a, 10),
          b: parseInt(b, 10),
          p: parseInt(p, 10)
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || 'Error al conectar con el servidor.');
      }

      setResult(data);

      // Si la curva es válida, sincronizamos los parámetros con la sección de operaciones
      const isNonSingular = data.nonSingular || data.isNonSingular || data.message?.includes('NO SINGULAR');
      if (isNonSingular) {
        const effectiveA = signA === '-' ? -parseInt(a, 10) : parseInt(a, 10);
        setPointA(String(effectiveA));
        setPointB(String(parseInt(b, 10)));
        setPointN(String(parseInt(p, 10)));

        // Precargar el primer punto afín si existe
        const firstAffine = data.points?.find((pt) => !pt.infinity);
        if (firstAffine) {
          setX1(String(firstAffine.x));
          setY1(String(firstAffine.y));
          setX2(String(firstAffine.x));
          setY2(String(firstAffine.y));
        }
      }
    } catch (err) {
      setError(err.message || 'Error en la verificación de la curva.');
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar operación de puntos (SUM, DOUBLE, SCALAR)
  const handlePointOperation = async () => {
    const requiredValues = [pointA, pointB, pointN, x1, y1];
    if (pointOperation === 'SUM') {
      requiredValues.push(x2, y2);
    } else if (pointOperation === 'SCALAR') {
      requiredValues.push(scalarK);
    }

    if (requiredValues.some((value) => !value || value === '-' || isNaN(parseInt(value, 10)))) {
      setPointError('Completa todos los valores necesarios con números válidos.');
      return;
    }

    if (parseInt(pointN, 10) <= 1) {
      setPointError('El módulo p debe ser mayor que 1.');
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
      p: { x: parseInt(x1, 10), y: parseInt(y1, 10), infinity: false },
      q: pointOperation === 'SUM'
          ? { x: parseInt(x2, 10), y: parseInt(y2, 10), infinity: false }
          : null,
      k: pointOperation === 'SCALAR' ? parseInt(scalarK, 10) : null
    };

    try {
      const response = await fetch('http://localhost:8080/api/elliptic/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo calcular la operación.');
      }

      setPointResult(data);
    } catch (err) {
      setPointError(err.message || 'Error al calcular los puntos.');
    } finally {
      setPointLoading(false);
    }
  };

  //Seleccionar un punto de la lista desplegable para P o Q
  const handleSelectCurvePoint = (target, indexStr) => {
    if (indexStr === '' || !result?.points) return;
    const pt = result.points[parseInt(indexStr, 10)];
    if (!pt || pt.infinity) return;
    if (target === 'P') {
      setX1(String(pt.x));
      setY1(String(pt.y));
    } else if (target === 'Q') {
      setX2(String(pt.x));
      setY2(String(pt.y));
    }
  };

  const isCurveValid = result && (result.nonSingular || result.isNonSingular || result.message?.includes('NO SINGULAR'));
  const affinePoints = result?.points?.filter((pt) => !pt.infinity) || [];

  return (
      <div className="full-container">
        <div className="card-box">
          <h1 className="main-title">Calculadora de Curvas Elípticas</h1>

          {/* PASO 1 Y 2: INGRESO DE PARÁMETROS Y VALIDACIÓN */}
          <div className="step-container">
            <h2 className="step-title">
              1. Ingreso de parámetros (a, b, p) y validación de la curva
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
                onClick={handleVerifyAndAnalyze}
                disabled={loading}
                className="verify-btn"
            >
              {loading ? 'Validando y calculando...' : 'Validar curva y calcular propiedades'}
            </button>

            {result && (
                <div className="results-panel">
                  <h3 className="section-sub">Fórmula con valores sustituidos:</h3>
                  <div className="formula-card">
                    <span className="math-display">{result.substitutedFormula}</span>
                  </div>

                  <h3 className="section-sub">Resultado del discriminante:</h3>
                  <p className="delta-val">Δ = {result.deltaValue}</p>

                  <div className={`status-banner ${isCurveValid ? 'success' : 'danger'}`}>
                    {result.message}
                  </div>
                </div>
            )}
          </div>

          {/* PASO 3: SECCIONES HABILITADAS SOLO CUANDO LA CURVA ESTÁ VALIDADA */}
          {isCurveValid && (
              <>
                {/* 3.a y 3.b: PUNTOS DE LA CURVA Y CARDINALIDAD */}
                <div className="step-container section-divider">
                  <h2 className="step-title">2. Puntos y cardinalidad de la curva</h2>

                  <div className="stats-row">
                    <div className="stat-box">
                      <span className="stat-label">Cardinalidad #E(Fₚ)</span>
                      <span className="stat-value">{result.cardinality}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Puntos Afines</span>
                      <span className="stat-value">{affinePoints.length} (+ Punto O)</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Total de Generadores</span>
                      <span className="stat-value">{result.generators?.length || 0}</span>
                    </div>
                  </div>

                  <h3 className="section-sub">
                    a) Conjunto de puntos E(Fₚ) ({result.cardinality} elementos):
                  </h3>
                  <div className="points-badge-container">
                    {result.points?.map((pt, idx) => (
                        <span
                            key={idx}
                            className={`point-badge ${pt.infinity ? 'infinity-badge' : ''}`}
                        >
                    {formatPoint(pt)}
                  </span>
                    ))}
                  </div>

                  {/* 3.f: PUNTOS GENERADORES */}
                  <h3 className="section-sub" style={{ marginTop: '1.5rem' }}>
                    b) Puntos generadores de la curva (Orden = {result.cardinality}):
                  </h3>
                  {result.generators && result.generators.length > 0 ? (
                      <div className="points-badge-container">
                        {result.generators.map((gen, idx) => (
                            <span key={idx} className="point-badge generator-badge">
                      {formatPoint(gen)}
                    </span>
                        ))}
                      </div>
                  ) : (
                      <p className="empty-msg">
                        Esta curva no tiene puntos generadores cíclicos de orden {result.cardinality}.
                      </p>
                  )}
                </div>

                {/* 3.c: OPERACIONES DE PUNTOS (SUMA, DOBLADO Y MULTIPLICACIÓN ESCALAR) */}
                <div className="step-container section-divider">
                  <h2 className="step-title">
                    3. Operaciones de puntos (Suma, Doblado y Multiplicación Escalar)
                  </h2>

                  <div className="operation-toolbar">
                    <label htmlFor="point-operation">Operación a realizar:</label>
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
                      <option value="DOUBLE">Doblado de punto (2P)</option>
                      <option value="SUM">Suma de puntos (P + Q)</option>
                      <option value="SCALAR">Multiplicación escalar (kP)</option>
                    </select>
                  </div>

                  <div className="point-grid">
                    <label>
                      <span>Coeficiente a</span>
                      <input
                          className="custom-input"
                          type="text"
                          placeholder="a"
                          value={pointA}
                          onChange={handleSignedNumberInput(setPointA)}
                      />
                    </label>
                    <label>
                      <span>Coeficiente b</span>
                      <input
                          className="custom-input"
                          type="text"
                          placeholder="b"
                          value={pointB}
                          onChange={handleSignedNumberInput(setPointB)}
                      />
                    </label>
                    <label>
                      <span>Módulo p</span>
                      <input
                          className="custom-input"
                          type="text"
                          inputMode="numeric"
                          placeholder="p"
                          value={pointN}
                          onChange={handleNumberInput(setPointN)}
                      />
                    </label>
                  </div>

                  <div className="point-inputs">
                    {/* Punto P */}
                    <div className="point-card">
                      <h3 className="section-sub">Punto P (x₁, y₁)</h3>
                      {affinePoints.length > 0 && (
                          <select
                              className="custom-select point-picker"
                              onChange={(e) => handleSelectCurvePoint('P', e.target.value)}
                              defaultValue=""
                          >
                            <option value="" disabled>Elegir punto de la curva...</option>
                            {result.points.map((pt, i) =>
                                !pt.infinity ? (
                                    <option key={i} value={i}>
                                      {formatPoint(pt)}
                                    </option>
                                ) : null
                            )}
                          </select>
                      )}
                      <div className="coordinate-row">
                        <input
                            className="custom-input"
                            type="text"
                            placeholder="x₁"
                            value={x1}
                            onChange={handleSignedNumberInput(setX1)}
                        />
                        <input
                            className="custom-input"
                            type="text"
                            placeholder="y₁"
                            value={y1}
                            onChange={handleSignedNumberInput(setY1)}
                        />
                      </div>
                    </div>

                    {/* Punto Q (Solo en SUMA) */}
                    {pointOperation === 'SUM' && (
                        <div className="point-card">
                          <h3 className="section-sub">Punto Q (x₂, y₂)</h3>
                          {affinePoints.length > 0 && (
                              <select
                                  className="custom-select point-picker"
                                  onChange={(e) => handleSelectCurvePoint('Q', e.target.value)}
                                  defaultValue=""
                              >
                                <option value="" disabled>Elegir punto de la curva...</option>
                                {result.points.map((pt, i) =>
                                    !pt.infinity ? (
                                        <option key={i} value={i}>
                                          {formatPoint(pt)}
                                        </option>
                                    ) : null
                                )}
                              </select>
                          )}
                          <div className="coordinate-row">
                            <input
                                className="custom-input"
                                type="text"
                                placeholder="x₂"
                                value={x2}
                                onChange={handleSignedNumberInput(setX2)}
                            />
                            <input
                                className="custom-input"
                                type="text"
                                placeholder="y₂"
                                value={y2}
                                onChange={handleSignedNumberInput(setY2)}
                            />
                          </div>
                        </div>
                    )}

                    {/* Escalar k (Solo en MULTIPLICACIÓN ESCALAR) */}
                    {pointOperation === 'SCALAR' && (
                        <div className="point-card">
                          <h3 className="section-sub">Escalar k</h3>
                          <div className="coordinate-row">
                            <input
                                className="custom-input"
                                type="text"
                                placeholder="k"
                                value={scalarK}
                                onChange={handleSignedNumberInput(setScalarK)}
                            />
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
                        <h3 className="section-sub">Resultado de la operación:</h3>
                        <div className="point-result">
                          {pointResult.result.infinity
                              ? 'Punto al infinito (O)'
                              : `(${pointResult.result.x}, ${pointResult.result.y})`}
                        </div>
                        <div className="formula-card">
                          <span className="math-display">{pointResult.formula}</span>
                        </div>
                      </div>
                  )}
                </div>

                {/* 3.d y 3.e: TABLAS DE SUMA Y MULTIPLICACIÓN ESCALAR */}
                <div className="step-container section-divider">
                  <h2 className="step-title">4. Tablas de operaciones de la curva</h2>

                  <div className="tabs-bar">
                    <button
                        className={`tab-btn ${activeTab === 'ALL' || activeTab === 'ADD' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ADD')}
                    >
                      a) Tabla de suma (P + Q)
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'SCALAR' ? 'active' : ''}`}
                        onClick={() => setActiveTab('SCALAR')}
                    >
                      b) Tabla de multiplicación escalar (kP)
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ALL')}
                    >
                      Mostrar ambas
                    </button>
                  </div>

                  {/* 3.d: TABLA DE SUMA DE PUNTOS */}
                  {(activeTab === 'ALL' || activeTab === 'ADD') && (
                      <div className="table-section">
                        <h3 className="section-sub">a) Tabla de suma de puntos (P + Q):</h3>
                        <div className="table-responsive">
                          <table className="crypto-table">
                            <thead>
                            <tr>
                              <th>P \ Q</th>
                              {result.points?.map((colPt, idx) => (
                                  <th key={idx}>{formatPoint(colPt)}</th>
                              ))}
                            </tr>
                            </thead>
                            <tbody>
                            {result.additionTable?.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  <th className="row-header">{formatPoint(row.rowPoint)}</th>
                                  {row.results.map((cellPt, cIdx) => (
                                      <td
                                          key={cIdx}
                                          className={cellPt.infinity ? 'cell-infinity' : ''}
                                      >
                                        {formatPoint(cellPt)}
                                      </td>
                                  ))}
                                </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  )}

                  {/* 3.e: TABLA DE MULTIPLICACIÓN ESCALAR */}
                  {(activeTab === 'ALL' || activeTab === 'SCALAR') && (
                      <div className="table-section" style={{ marginTop: '2rem' }}>
                        <h3 className="section-sub">
                          b) Tabla de multiplicación escalar (kP) e identificación de generadores:
                        </h3>
                        <div className="table-responsive">
                          <table className="crypto-table">
                            <thead>
                            <tr>
                              <th>Punto P</th>
                              {result.scalarHeaders?.map((kVal) => (
                                  <th key={kVal}>{kVal}P</th>
                              ))}
                              <th>Orden</th>
                              <th>¿Generador?</th>
                            </tr>
                            </thead>
                            <tbody>
                            {result.scalarMultiplicationTable?.map((row, rIdx) => (
                                <tr
                                    key={rIdx}
                                    className={row.generator ? 'generator-row' : ''}
                                >
                                  <th className="row-header">{formatPoint(row.basePoint)}</th>
                                  {row.multiples.map((cellPt, cIdx) => (
                                      <td
                                          key={cIdx}
                                          className={cellPt.infinity ? 'cell-infinity' : ''}
                                      >
                                        {formatPoint(cellPt)}
                                      </td>
                                  ))}
                                  <td className="order-cell">{row.order}</td>
                                  <td className="gen-status-cell">
                                    {row.generator ? 'Sí ★' : 'No'}
                                  </td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  )}
                </div>
              </>
          )}
        </div>
      </div>
  );
}

export default App;
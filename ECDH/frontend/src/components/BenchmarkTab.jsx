import React, { useState, useEffect } from 'react';
import { fetchSpecs, runBenchmark } from '../services/api';

export default function BenchmarkTab() {
  const [specs, setSpecs] = useState(null);
  const [benchmarks, setBenchmarks] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSpecs().then(setSpecs).catch(console.error);
    executeBench(10);
  }, []);

  const executeBench = async (iterations = 10) => {
    setLoading(true);
    try {
      const data = await runBenchmark(iterations);
      setBenchmarks(data);
      if (data.specs) setSpecs(data.specs);
    } catch (err) {
      console.error(err);
      alert('Error en benchmark: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="benchmark-tab-container">
      {/* Sección 1: Tabla de Características Físicas del Dispositivo (Requerida en Página 2) */}
      <div className="bench-card">
        <div className="card-header-row">
          <div>
            <h3>Características Físicas del Dispositivo (Host de Ejecución)</h3>
            <p className="card-subtext">
              Documentación del entorno de hardware y software solicitada en la página 2 del reporte.
            </p>
          </div>
          <span className="badge-device">💻 Equipo de Pruebas</span>
        </div>

        {specs ? (
          <div className="table-wrapper">
            <table className="specs-table">
              <thead>
                <tr>
                  <th>Componente</th>
                  <th>Especificación Técnica del Dispositivo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Sistema Operativo (S.O.)</strong></td>
                  <td>{specs.osName} {specs.osVersion} ({specs.osArchitecture})</td>
                </tr>
                <tr>
                  <td><strong>Procesador (CPU)</strong></td>
                  <td>{specs.processorName}</td>
                </tr>
                <tr>
                  <td><strong>Núcleos / Hilos de Procesamiento</strong></td>
                  <td>{specs.processorCores} núcleos físicos / {specs.processorLogical} hilos lógicos</td>
                </tr>
                <tr>
                  <td><strong>Memoria RAM Instalada</strong></td>
                  <td>{specs.totalRam}</td>
                </tr>
                <tr>
                  <td><strong>Entorno de Ejecución (JRE / JDK)</strong></td>
                  <td>Java {specs.javaVersion} ({specs.javaVendor})</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="loading-state">Cargando especificaciones del sistema...</div>
        )}
      </div>

      {/* Sección 2: Tiempos de Ejecución y Comparación entre Curvas NIST */}
      <div className="bench-card">
        <div className="card-header-row">
          <div>
            <h3>Tiempos de Generación e Influencia del Tamaño de Curva</h3>
            <p className="card-subtext">
              Medición experimental (promedio de 10 iteraciones en nanosegundos / milisegundos).
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => executeBench(10)}
            disabled={loading}
          >
            {loading ? 'Midiendo Rendimiento...' : '⚡ Reejecutar Benchmark (10 iteraciones)'}
          </button>
        </div>

        {benchmarks && benchmarks.curveBenchmarks ? (
          <div className="table-wrapper">
            <table className="crypto-table">
              <thead>
                <tr>
                  <th>Curva NIST</th>
                  <th>Seguridad (bits)</th>
                  <th>Gen. Claves (ms)</th>
                  <th>Ronda 2: Parcial (ms)</th>
                  <th>Ronda 3: Final (ms)</th>
                  <th>Tiempo Total (ms)</th>
                  <th>Factor Escalar Relativo</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(benchmarks.curveBenchmarks).map((cb) => {
                  const p256Time = benchmarks.curveBenchmarks['P-256']?.avgTotal3PartyMs || 1;
                  const ratio = (cb.avgTotal3PartyMs / p256Time).toFixed(2);
                  return (
                    <tr key={cb.curveId}>
                      <td><strong>{cb.curveName}</strong></td>
                      <td><span className="badge-security">{cb.securityBits} bits</span></td>
                      <td>{cb.avgKeyGenMs} ms</td>
                      <td>{cb.avgRound2Ms} ms</td>
                      <td>{cb.avgRound3Ms} ms</td>
                      <td><strong className="text-highlight">{cb.avgTotal3PartyMs} ms</strong></td>
                      <td><span className="ratio-badge">{ratio}x vs P-256</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="loading-state">Calculando métricas de rendimiento...</div>
        )}

        <div className="bench-insight-box">
          <h5>💡 Análisis de Influencia del Tamaño de Clave:</h5>
          <p>
            La multiplicación escalar sobre la curva elíptica <code>k · P</code> escala de manera cuasi-cuadrática 
            con respecto a la longitud del campo en bits <code>O(m^2 · log m)</code>. Conforme incrementamos de <strong>P-256 (256 bits)</strong> a <strong>P-521 (521 bits)</strong>, 
            el tamaño del escalar se duplica, aumentando las operaciones aritméticas de campo en un factor de 3x a 4x. 
            Sin embargo, incluso para P-521 el tiempo total se mantiene en el orden de pocos milisegundos, siendo órdenes de magnitud más rápido que RSA o DH tradicional equivalente a 15,360 bits.
          </p>
        </div>
      </div>

      {/* Sección 3: Comparativa de Complejidad: 2 vs 3 Participantes */}
      <div className="bench-card">
        <div className="card-header-row">
          <div>
            <h3>Complejidad Algorítmica: Extensión de 2 a 3 Participantes</h3>
            <p className="card-subtext">
              Análisis del crecimiento computacional y de mensajes de comunicación (Página 2 del reporte).
            </p>
          </div>
        </div>

        {benchmarks && benchmarks.participantComparisons ? (
          <div className="table-wrapper">
            <table className="crypto-table">
              <thead>
                <tr>
                  <th>Escenario</th>
                  <th>Participantes</th>
                  <th>Rondas</th>
                  <th>Mult. Escalares / Entidad</th>
                  <th>Mult. Escalares Totales</th>
                  <th>Tiempo Promedio</th>
                  <th>Complejidad Entidad / Total</th>
                  <th>Flujo de Mensajes (USB / Red)</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(benchmarks.participantComparisons).map((comp, idx) => (
                  <tr key={idx}>
                    <td><strong>{comp.scenario}</strong></td>
                    <td>{comp.participants}</td>
                    <td>{comp.rounds}</td>
                    <td><code>{comp.scalarMultiplicationsPerParty} (d·G, d·P, d·Z)</code></td>
                    <td><strong className="text-highlight">{comp.totalScalarMultiplications}</strong></td>
                    <td>{comp.avgExecutionMs} ms</td>
                    <td><code>{comp.computationalComplexity}</code></td>
                    <td>{comp.networkMessages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="complexity-qa-grid">
          <div className="qa-item">
            <h6>¿Hay un crecimiento lineal o exponencial?</h6>
            <p>
              El crecimiento computacional es <strong>ESTRICTAMENTE LINEAL O(N)</strong> por cada entidad (cada una realiza N multiplicaciones escalares en el esquema circular básico), 
              y <strong>O(N²)</strong> a nivel global del sistema. En ningún caso es exponencial.
            </p>
          </div>
          <div className="qa-item">
            <h6>Impacto del intercambio por Memoria USB:</h6>
            <p>
              El mayor cuello de botella en un entorno de 3 o más entidades cuando se utiliza un medio extraíble (USB) 
              no es el cómputo matemático (que toma &lt; 5 ms), sino la <strong>latencia de transporte físico secuencial</strong> (la memoria USB debe pasar de mano en mano en 2 rondas sucesivas).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

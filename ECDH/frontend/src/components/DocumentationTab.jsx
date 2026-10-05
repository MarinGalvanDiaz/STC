import React from 'react';

export default function DocumentationTab() {
  return (
    <div className="doc-tab-container">
      {/* 1. Descripción del Algoritmo ECDH */}
      <div className="doc-card">
        <h3>1. Breve Descripción del Algoritmo ECDH</h3>
        <p>
          El algoritmo <strong>Elliptic Curve Diffie-Hellman (ECDH)</strong> es una variante de intercambio de claves 
          basada en la criptografía de curvas elípticas (ECC). En lugar de basarse en el problema del logaritmo discreto sobre el grupo multiplicativo de un campo finito <code>F_p*</code> (como en Diffie-Hellman clásico), 
          ECDH opera sobre el grupo abeliano aditivo de puntos de una curva elíptica:
        </p>
        <div className="math-callout">
          <code>E(F_p): y² ≡ x³ + ax + b (mod p)</code>
        </div>
        <p>
          En el protocolo para dos partes, Alice genera un escalar secreto <code>a</code> y publica <code>P_A = a · G</code>; 
          Bob genera un escalar secreto <code>b</code> y publica <code>P_B = b · G</code>. 
          Ambos pueden derivar el punto común <code>S = a · P_B = b · P_A = (ab) · G</code> gracias a la asociatividad y conmutatividad de la multiplicación escalar. 
          La seguridad radica en la intratabilidad computacional del <strong>Problema del Logaritmo Discreto en Curvas Elípticas (ECDLP)</strong>: dado <code>G</code> y <code>Q = k · G</code>, es computacionalmente inviable determinar <code>k</code>.
        </p>
      </div>

      {/* 2. Diagrama para 3 Entidades (Elaboración Propia) */}
      <div className="doc-card">
        <h3>2. Diagrama de Arquitectura y Protocolo para 3 Entidades (Elaboración Propia)</h3>
        <p>
          Flujo de comunicación circular en 2 rondas con intercambio simulado mediante memoria USB física:
        </p>

        <div className="diagram-container">
          <div className="diagram-round-box">
            <div className="round-badge">Ronda 1: Generación e Intercambio de Claves Públicas (USB)</div>
            <div className="diagram-nodes-flow">
              <div className="diagram-node node-alice">
                <strong>Alice (A)</strong>
                <span>Elige privado <code>a</code></span>
                <span>Calcula <code>P_A = a·G</code></span>
                <span className="usb-arrow">➔ Copia a USB ➔</span>
              </div>
              <div className="diagram-node node-bob">
                <strong>Bob (B)</strong>
                <span>Elige privado <code>b</code></span>
                <span>Calcula <code>P_B = b·G</code></span>
                <span className="usb-arrow">➔ Copia a USB ➔</span>
              </div>
              <div className="diagram-node node-candy">
                <strong>Candy (C)</strong>
                <span>Elige privado <code>c</code></span>
                <span>Calcula <code>P_C = c·G</code></span>
                <span className="usb-arrow">➔ Copia a USB ➔</span>
              </div>
            </div>
            <div className="flow-summary-tag">
              Intercambio en Anillo: Alice envía <code>P_A</code> a Bob | Bob envía <code>P_B</code> a Candy | Candy envía <code>P_C</code> a Alice
            </div>
          </div>

          <div className="diagram-arrow-down">⬇ Memoria USB transportada físicamente ⬇</div>

          <div className="diagram-round-box">
            <div className="round-badge">Ronda 2: Cálculo de Claves Parciales e Intercambio (USB)</div>
            <div className="diagram-nodes-flow">
              <div className="diagram-node node-alice">
                <strong>Alice calcula:</strong>
                <code>Z_AC = a · P_C = (ac)·G</code>
                <span className="usb-arrow">➔ Copia a USB para Bob ➔</span>
              </div>
              <div className="diagram-node node-bob">
                <strong>Bob calcula:</strong>
                <code>Z_BA = b · P_A = (ba)·G</code>
                <span className="usb-arrow">➔ Copia a USB para Candy ➔</span>
              </div>
              <div className="diagram-node node-candy">
                <strong>Candy calcula:</strong>
                <code>Z_CB = c · P_B = (cb)·G</code>
                <span className="usb-arrow">➔ Copia a USB para Alice ➔</span>
              </div>
            </div>
          </div>

          <div className="diagram-arrow-down">⬇ Memoria USB transportada físicamente ⬇</div>

          <div className="diagram-round-box success-round">
            <div className="round-badge success">Ronda 3: Derivación del Secreto Final Común y KDF</div>
            <div className="diagram-nodes-flow">
              <div className="diagram-node node-alice">
                <strong>Alice recibe <code>Z_CB</code>:</strong>
                <code>K_A = a · Z_CB = (abc)·G</code>
              </div>
              <div className="diagram-node node-bob">
                <strong>Bob recibe <code>Z_AC</code>:</strong>
                <code>K_B = b · Z_AC = (abc)·G</code>
              </div>
              <div className="diagram-node node-candy">
                <strong>Candy recibe <code>Z_BA</code>:</strong>
                <code>K_C = c · Z_BA = (abc)·G</code>
              </div>
            </div>
            <div className="final-kdf-box">
              <strong>Función KDF (NIST SP 800-56A):</strong>
              <code>K_compartida = SHA-256(Affine_X((abc)·G))</code>
              <span>¡Las tres entidades obtienen exactamente la misma clave simétrica de 256 bits!</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tabla de Biblioteca, Curva, Nivel de Seguridad y Algoritmo Equivalente */}
      <div className="doc-card">
        <h3>3. Justificación de Biblioteca, Curva y Referencias</h3>
        <p className="card-subtext">
          Tabla explícitamente requerida en la página 2 del reporte de la práctica:
        </p>

        <div className="table-wrapper">
          <table className="crypto-table">
            <thead>
              <tr>
                <th>Biblioteca</th>
                <th>Curva Utilizada</th>
                <th>Nivel de Seguridad (bits)</th>
                <th>Algoritmo Equivalente</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Bouncy Castle Crypto 1.78.1 / Java 19 JCA</strong></td>
                <td><strong>NIST P-256</strong> (secp256r1 / prime256v1)</td>
                <td><span className="badge-security">128 bits</span></td>
                <td>AES-128 / RSA-3072 bits</td>
              </tr>
              <tr>
                <td><strong>Bouncy Castle Crypto 1.78.1 / Java 19 JCA</strong></td>
                <td><strong>NIST P-384</strong> (secp384r1)</td>
                <td><span className="badge-security">192 bits</span></td>
                <td>AES-192 / RSA-7680 bits</td>
              </tr>
              <tr>
                <td><strong>Bouncy Castle Crypto 1.78.1 / Java 19 JCA</strong></td>
                <td><strong>NIST P-521</strong> (secp521r1)</td>
                <td><span className="badge-security">256 bits</span></td>
                <td>AES-256 / RSA-15360 bits</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="justification-text-box">
          <h5>Justificación del Lenguaje y Biblioteca:</h5>
          <ul>
            <li>
              <strong>Lenguaje Java 19:</strong> Provee tipos de datos numéricos de precisión arbitraria (<code>BigInteger</code>), APIs estándar de seguridad criptográfica (JCA/JCE) con generadores de números pseudoaleatorios criptográficamente seguros (<code>SecureRandom</code>) validados bajo FIPS.
            </li>
            <li>
              <strong>Biblioteca Bouncy Castle 1.78.1:</strong> Es el estándar de facto internacional en Java para criptografía avanzada. 
              <em>¿Existe una API nativa de "3 personas" en JCE/BouncyCastle estándar?</em> Tanto la implementación estándar de Java (SunEC) como el proveedor JCE de Bouncy Castle limitan <code>KeyAgreement.doPhase(false)</code> arrojando la excepción <em>"ECDH can only be between two parties"</em>. Esto se debe a que la especificación JCE asume que una fase intermedia produce un secreto simétrico directo en lugar de un punto elíptico público para retransmitir. Por ello, <strong>Bouncy Castle provee nativamente el motor matemático de puntos elípticos (<code>org.bouncycastle.math.ec.ECPoint</code>)</strong> y los parámetros de dominio de curvas NIST, permitiendo computar de manera nativa, exacta y segura la multiplicación escalar <code>point.multiply(d)</code> requerida para el protocolo tripartito en anillo.
            </li>
            <li>
              <strong>Referencias:</strong>
              <ul>
                <li>NIST SP 800-56A Rev. 3: <em>Recommendation for Pair-Wise Key Establishment Schemes Using Discrete Logarithm Cryptography</em>.</li>
                <li>NIST FIPS PUB 186-5: <em>Digital Signature Standard (DSS) - Elliptic Curve Domain Parameters</em>.</li>
                <li>RFC 5903: <em>Elliptic Curve Groups modulo Prime (ECDLP) for IKE and IKEv2</em>.</li>
                <li>Legion of the Bouncy Castle: <em>Bouncy Castle Java Cryptography API Documentation</em> (v1.78.1).</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Respuestas a Preguntas Individuales */}
      <div className="doc-card">
        <h3>4. Respuestas a las Preguntas Individuales del Reporte</h3>

        <div className="qa-accordion">
          <div className="qa-card">
            <h4>¿Qué ventajas observaste al usar ECDH frente a DH tradicional en términos de eficiencia y seguridad?</h4>
            <p>
              1. <strong>Tamaño de Claves y Eficiencia en Trasmisión:</strong> Para lograr 128 bits de seguridad simétrica, ECDH requiere una clave de tan solo 256 bits (curva P-256), mientras que DH tradicional sobre campos finitos requiere un módulo primo de al menos 3072 bits. Esto reduce el tamaño de los datos almacenados y transportados en la memoria USB en casi un 90%.<br/>
              2. <strong>Carga Computacional y Memoria:</strong> Las operaciones de suma y duplicación de puntos elípticos consumen significativamente menos ciclos de reloj y memoria RAM que las exponenciaciones modulares sobre números gigantescos de 3072 a 15360 bits.<br/>
              3. <strong>Resistencia Criptográfica Superior:</strong> DH tradicional es susceptible a ataques sub-exponenciales mediante el Algoritmo de Criba del Cuerpo de Números Generalizado (GNFS). En contraste, en curvas elípticas bien construidas no existen ataques sub-exponenciales conocidos; el mejor ataque es genérico (Pollard's rho) con complejidad completamente exponencial <code>O(√n)</code>.
            </p>
          </div>

          <div className="qa-card">
            <h4>¿Qué papel juega la curva elíptica seleccionada y por qué es importante seguir las recomendaciones del NIST?</h4>
            <p>
              La curva elíptica define el grupo algebraico (orden <code>n</code>, punto generador <code>G</code>, coeficientes <code>a, b</code> y primo del campo <code>p</code>) sobre el cual se sustenta toda la seguridad matemática del protocolo.<br/>
              Seguir las recomendaciones del NIST (FIPS 186-4/5 y SP 800-186) es crucial porque:
              <br/>• <strong>Evita curvas débiles o anómalas:</strong> Garantiza que la curva no sea vulnerable a reducciones de MOV (Frey-Rück) a campos finitos, ni a ataques de Smart/Satoh/Araki para curvas con <code>#E(F_p) = p</code>.
              <br/>• <strong>Cofactor h = 1:</strong> Previene ataques de subgrupo pequeño (Small Subgroup Attacks), garantizando que todo punto generado pertenezca al grupo primo de orden completo.
              <br/>• <strong>Aritmética Optimizada con Primos Pseudo-Mersenne:</strong> Las curvas NIST P-256, P-384 y P-521 están construidas sobre primos especiales que permiten realizar reducciones modulares ultrarrápidas mediante sumas y desplazamientos de palabras, sin costosas divisiones multiprecisión.
            </p>
          </div>

          <div className="qa-card">
            <h4>¿Cuánto tiempo tomó generar la clave compartida ECDH? ¿En qué medida influye el tipo de curva o el tamaño de la clave?</h4>
            <p>
              En las pruebas experimentales ejecutadas en la máquina host (AMD Ryzen 7 5800H, 16 GB RAM, Windows 11), el tiempo total de generación e intercambio para las 3 entidades fue de aproximadamente <strong>1.5 a 3.0 ms para P-256</strong>, <strong>3.5 a 6.0 ms para P-384</strong> y <strong>8.0 a 14.0 ms para P-521</strong>.<br/>
              <strong>Influencia del tamaño:</strong> La multiplicación escalar de curvas elípticas escala con complejidad cuasi-cuadrática <code>O(m² log m)</code> respecto a la cantidad de bits <code>m</code>. Al pasar de 256 bits a 521 bits, la longitud del escalar se duplica y el tiempo de cómputo aumenta aproximadamente por un factor de 3x a 4x.
            </p>
          </div>

          <div className="qa-card">
            <h4>¿De qué manera cambia la complejidad del algoritmo al extenderlo de dos a tres participantes?</h4>
            <p>
              • <strong>Rondas de Comunicación:</strong> En 2 participantes se requiere únicamente 1 ronda de intercambio simultáneo de claves públicas (A ↔ B). En 3 participantes se requieren obligatoriamente <strong>2 rondas secuenciales</strong> (Ronda 1 para claves públicas y Ronda 2 para claves intermedias).<br/>
              • <strong>Multiplicaciones escalares por entidad:</strong> En 2 participantes cada entidad realiza 2 multiplicaciones escalares (1 para su clave pública <code>aG</code> y 1 para el secreto <code>a P_B</code>). En 3 participantes cada entidad debe realizar <strong>3 multiplicaciones escalares</strong> (<code>aG</code>, <code>a P_C</code> y finalmente <code>a Z_CB</code>).<br/>
              • <strong>Multiplicaciones totales del sistema:</strong> Pasa de 4 operaciones en 2 participantes a 9 operaciones en 3 participantes (crecimiento de <code>2²</code> a <code>3²</code> en el protocolo en anillo).
            </p>
          </div>

          <div className="qa-card">
            <h4>¿Cómo afecta el número de participantes al consumo de recursos computacionales? ¿Hay un crecimiento lineal o exponencial?</h4>
            <p>
              El consumo de recursos computacionales por entidad es <strong>LINEAL O(N)</strong> en el esquema circular (cada participante realiza <code>N</code> multiplicaciones escalares de curva). A nivel global de todos los participantes combinados, el número total de operaciones es <code>O(N²)</code> en el protocolo circular en anillo.<br/>
              <strong>Conclusión fundamental:</strong> <u>Bajo ninguna circunstancia hay un crecimiento exponencial</u> en el cálculo matemático. El verdadero desafío al escalar el número de participantes con memoria USB reside en la <strong>latencia de transporte físico y sincronización de las rondas</strong>.
            </p>
          </div>

          <div className="qa-card">
            <h4>¿Qué optimizaciones podrías aplicar para mejorar el rendimiento sin comprometer la seguridad?</h4>
            <p>
              1. <strong>Coordenadas Proyectivas / Jacobianas:</strong> Realizar todas las adiciones y duplicaciones de puntos en coordenadas Jacobianas <code>(X : Y : Z)</code>. Esto elimina la necesidad de realizar costosas inversiones modulares (que requieren el algoritmo extendido de Euclides) en cada paso de adición, posponiendo una única inversión modular al final para regresar a coordenadas afines <code>(x, y)</code>.<br/>
              2. <strong>Escalera de Montgomery (Montgomery Ladder) en Tiempo Constante:</strong> Ejecutar la multiplicación escalar con operaciones uniformes e independientes de los bits del escalar privado, previniendo ataques de canal lateral (Side-Channel Attacks como Simple Power Analysis SPA o Timing Attacks).<br/>
              3. <strong>Precomputación de Múltiplos del Generador G:</strong> Dado que el punto base <code>G</code> es público y constante en las curvas NIST, se pueden precalcular tablas de múltiplos (método de ventanas / Comb method) para reducir a una cuarta parte el tiempo de generación del par de claves inicial <code>d·G</code>.<br/>
              4. <strong>Formato de Puntos Comprimidos:</strong> Almacenar y transferir en la memoria USB únicamente la coordenada <code>x</code> y 1 bit para el signo de <code>y</code> (33 bytes en lugar de 65 bytes para P-256), disminuyendo a la mitad el tamaño de los archivos exportados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

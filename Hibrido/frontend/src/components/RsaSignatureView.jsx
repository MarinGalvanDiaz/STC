import React, { useState, useEffect } from 'react';
import {
  signDataWithRsa,
  verifySignatureWithDigestComparison,
  parseSignedDocument,
  createSignedDocument,
  calculateSha3Hex
} from '../utils/cryptoUtils';

export default function RsaSignatureView({
  textToSign = '',
  plainTextData = null,
  cipherTextData = null,
  decryptedResultData = null,
  sourceDescription = ''
}) {
  const [activeTab, setActiveTab] = useState('sign'); // 'sign' | 'verify'

  // Clave privada RSA para firmar
  const [privateKeyPem, setPrivateKeyPem] = useState('');

  // 1. Selector Texto Plano (para calcular el digesto SHA-3)
  const [plainFile, setPlainFile] = useState(null);
  const [plainContent, setPlainContent] = useState('');
  const [plainFileName, setPlainFileName] = useState('');
  const [plainSha3Digest, setPlainSha3Digest] = useState('');
  const [plainSourceNotice, setPlainSourceNotice] = useState('');

  // 2. Selector Archivo Cifrado (al que se le concatenará la firma)
  const [cipherFile, setCipherFile] = useState(null);
  const [cipherContent, setCipherContent] = useState('');
  const [cipherFileName, setCipherFileName] = useState('');
  const [cipherSourceNotice, setCipherSourceNotice] = useState('');

  // Estados de resultado de firma
  const [signatureResult, setSignatureResult] = useState('');
  const [signedDocResult, setSignedDocResult] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState('');

  // Estados de Verificación
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyContent, setVerifyContent] = useState('');
  const [verifyPublicKeyPem, setVerifyPublicKeyPem] = useState('');
  const [verifySignatureInput, setVerifySignatureInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null); // { isValid, calculatedDigest, decryptedDigest, algorithm }
  const [verifyError, setVerifyError] = useState('');
  const [verifyDetectionNotice, setVerifyDetectionNotice] = useState('');

  const [toastMessage, setToastMessage] = useState('');

  // Trasladar texto plano cuando se procesa o carga en el cifrador AES
  useEffect(() => {
    if (plainTextData && plainTextData.content) {
      setPlainContent(plainTextData.content);
      setPlainFileName(plainTextData.fileName || 'texto_plano.txt');
      setPlainFile(plainTextData.file || null);
      setPlainSha3Digest(calculateSha3Hex(plainTextData.content));
      setPlainSourceNotice('Texto plano trasladado automáticamente del proceso de cifrado AES.');
    }
  }, [plainTextData]);

  // Trasladar archivo cifrado resultante de AES
  useEffect(() => {
    if (cipherTextData && cipherTextData.content) {
      setCipherContent(cipherTextData.content);
      setCipherFileName(cipherTextData.fileName || 'archivo_cifrado.txt');
      setCipherSourceNotice('Archivo cifrado trasladado automáticamente del resultado AES.');
    }
  }, [cipherTextData]);

  // Trasladar resultado de descifrado a la verificación si contiene firma
  useEffect(() => {
    if (decryptedResultData && decryptedResultData.content) {
      const parsed = parseSignedDocument(decryptedResultData.content);
      if (parsed.hasSignature) {
        setVerifyContent(parsed.content);
        setVerifySignatureInput(parsed.signature);
        setVerifyDetectionNotice('Documento descifrado con firma cargado automáticamente desde AES.');
      } else {
        setVerifyContent(decryptedResultData.content);
      }
    }
  }, [decryptedResultData]);

  // Sincronización de compatibilidad si viene textToSign genérico
  useEffect(() => {
    if (textToSign && !plainTextData && !cipherTextData) {
      const parsed = parseSignedDocument(textToSign);
      if (parsed.hasSignature) {
        setVerifyContent(parsed.content);
        setVerifySignatureInput(parsed.signature);
      } else {
        setPlainContent(textToSign);
        setPlainSha3Digest(calculateSha3Hex(textToSign));
      }
    }
  }, [textToSign, plainTextData, cipherTextData]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // --- MANEJO DEL SELECTOR 1: TEXTO PLANO ---
  const handlePlainFileChange = (e) => {
    const file = e.target.files[0];
    processPlainFile(file);
  };

  const processPlainFile = async (file) => {
    setSignError('');
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setSignError('Por favor selecciona un archivo de texto plano con extensión .txt.');
      return;
    }

    setPlainFile(file);
    setPlainFileName(file.name);
    setPlainSourceNotice('');

    try {
      const buffer = await file.arrayBuffer();
      const content = new TextDecoder('utf-8').decode(buffer);
      setPlainContent(content);
      setPlainSha3Digest(calculateSha3Hex(content));
    } catch (err) {
      setSignError('No se pudo leer el archivo de texto plano en UTF-8: ' + err.message);
    }
  };

  const handlePlainDragOver = (e) => e.preventDefault();
  const handlePlainDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processPlainFile(e.dataTransfer.files[0]);
    }
  };

  // --- MANEJO DEL SELECTOR 2: ARCHIVO CIFRADO ---
  const handleCipherFileChange = (e) => {
    const file = e.target.files[0];
    processCipherFile(file);
  };

  const processCipherFile = async (file) => {
    setSignError('');
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setSignError('Por favor selecciona un archivo cifrado con extensión .txt.');
      return;
    }

    setCipherFile(file);
    setCipherFileName(file.name);
    setCipherSourceNotice('');

    try {
      const buffer = await file.arrayBuffer();
      const content = new TextDecoder('utf-8').decode(buffer);
      setCipherContent(content);
    } catch (err) {
      setSignError('No se pudo leer el archivo cifrado en UTF-8: ' + err.message);
    }
  };

  const handleCipherDragOver = (e) => e.preventDefault();
  const handleCipherDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processCipherFile(e.dataTransfer.files[0]);
    }
  };

  // Acción: Firmar con RSA-4096 (Digesto de Texto Plano + Concatenación a Cifrado)
  const handleSign = async () => {
    setSignError('');
    setSignatureResult('');
    setSignedDocResult('');

    if (!plainContent.trim()) {
      setSignError('Por favor selecciona o sube el archivo de texto plano para calcular el digesto SHA-3.');
      return;
    }
    if (!cipherContent.trim()) {
      setSignError('Por favor selecciona o sube el archivo cifrado al cual se le concatenará la firma digital.');
      return;
    }
    if (!privateKeyPem.trim()) {
      setSignError('Por favor pega tu Clave Privada RSA.');
      return;
    }

    setIsSigning(true);
    try {
      // 1. Calcular el digesto SHA-3 (SHA3-256) sobre el TEXTO PLANO
      const digest = calculateSha3Hex(plainContent);
      setPlainSha3Digest(digest);

      // 2. Firmar el texto plano con la clave privada RSA 4096
      const sig = await signDataWithRsa(privateKeyPem, plainContent);
      setSignatureResult(sig);

      // 3. Concatenar: escribir "Firma digital", salto de línea y la firma AL FINAL DEL ARCHIVO CIFRADO
      const combinedDoc = createSignedDocument(cipherContent, sig);
      setSignedDocResult(combinedDoc);

      showToast('Firma generada a partir del texto plano y concatenada al archivo cifrado.');
    } catch (err) {
      setSignError('Error al firmar: ' + err.message);
    } finally {
      setIsSigning(false);
    }
  };

  // Descargar archivo cifrado con la firma concatenada forzando UTF-8
  const downloadSignedDocumentFile = () => {
    if (!signedDocResult) return;
    const blob = new Blob([new TextEncoder().encode(signedDocResult)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = cipherFileName || 'archivo_cifrado.txt';
    a.download = baseName.startsWith('firmado_') ? baseName : `firmado_${baseName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Archivo descargado: '${a.download}'`);
  };

  // Descargar únicamente la firma en archivo .sig forzando UTF-8
  const downloadSignatureOnly = () => {
    if (!signatureResult) return;
    const blob = new Blob([new TextEncoder().encode(signatureResult)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'firma_digital_sha3_rsa4096.sig';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Archivo de firma descargado (.sig)');
  };

  // Pasar el documento a verificación
  const transferToVerification = () => {
    if (!signedDocResult) return;
    const parsed = parseSignedDocument(signedDocResult);
    // El texto que debe verificarse es el texto plano correspondiente
    setVerifyContent(plainContent || parsed.content);
    setVerifySignatureInput(parsed.signature);
    setVerifyDetectionNotice('Firma y texto plano transferidos a la pestaña de verificación.');
    setActiveTab('verify');
    showToast('Datos transferidos a verificación.');
  };

  // --- MANEJO DE ARCHIVO EN PESTAÑA VERIFICAR ---
  const handleVerifyFileChange = (e) => {
    const file = e.target.files[0];
    processVerifyFile(file);
  };

  const processVerifyFile = async (file) => {
    setVerifyError('');
    setVerificationResult(null);
    setVerifyDetectionNotice('');
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt')) {
      setVerifyError('Por favor selecciona un archivo con extensión .txt.');
      return;
    }

    setVerifyFile(file);
    try {
      const buffer = await file.arrayBuffer();
      const text = new TextDecoder('utf-8').decode(buffer);
      const parsed = parseSignedDocument(text);

      if (parsed.hasSignature) {
        setVerifyContent(parsed.content);
        setVerifySignatureInput(parsed.signature);
        setVerifyDetectionNotice(
          `✓ Firma digital detectada en '${file.name}'. Se extrajo el mensaje antes de la firma y la firma en Base64 automáticamente.`
        );
      } else {
        setVerifyContent(text);
        setVerifySignatureInput('');
        setVerifyDetectionNotice(
          `Archivo cargado. No se detectó la etiqueta 'Firma digital'; puedes ingresar la firma manualmente.`
        );
      }
    } catch (err) {
      setVerifyError('No se pudo leer el archivo seleccionado en formato UTF-8: ' + err.message);
    }
  };

  const handleVerifyDragOver = (e) => e.preventDefault();
  const handleVerifyDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processVerifyFile(e.dataTransfer.files[0]);
    }
  };

  // Acción: Verificar Firma comparando el Digesto SHA-3
  const handleVerify = async () => {
    setVerifyError('');
    setVerificationResult(null);

    if (!verifyContent) {
      setVerifyError('Debes ingresar o cargar el contenido original o descifrado a verificar.');
      return;
    }
    if (!verifyPublicKeyPem.trim()) {
      setVerifyError('Debes ingresar la Clave Pública RSA del firmante.');
      return;
    }
    if (!verifySignatureInput.trim()) {
      setVerifyError('Debes ingresar o cargar la firma digital en Base64 a verificar.');
      return;
    }

    setIsVerifying(true);
    try {
      // Comparar digesto calculado del contenido antes de la firma vs digesto descifrado de la firma
      const result = await verifySignatureWithDigestComparison(
        verifyPublicKeyPem,
        verifyContent,
        verifySignatureInput
      );
      setVerificationResult(result);
    } catch (err) {
      setVerifyError('Error al verificar firma: ' + err.message);
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="card signature-module-card">
      <div className="card-header">
        <div>
          <h3>Firma Digital y Verificación (RSA 4096 bits · SHA-3)</h3>
          <p className="section-description">
            Garantiza la autenticidad e integridad calculando el digesto SHA-3 sobre el texto plano y concatenando la firma al archivo cifrado.
          </p>
        </div>
        <span className="party-badge rsa-badge">RSA-4096 / SHA-3</span>
      </div>

      {toastMessage && (
        <div className="alert alert-success">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub-navegación interna */}
      <div className="subtabs-bar">
        <button
          type="button"
          className={`subtab-btn ${activeTab === 'sign' ? 'active' : ''}`}
          onClick={() => setActiveTab('sign')}
        >
          Firmar Archivo
        </button>
        <button
          type="button"
          className={`subtab-btn ${activeTab === 'verify' ? 'active' : ''}`}
          onClick={() => setActiveTab('verify')}
        >
          Verificar Firma de Archivo
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA: FIRMAR ARCHIVO (DOBLE SELECTOR)                */}
      {/* ======================================================== */}
      {activeTab === 'sign' && (
        <div className="tab-pane">
          {sourceDescription && (
            <div className="info-banner">
              <span>Estado en cifrador: <strong>{sourceDescription}</strong></span>
            </div>
          )}

          {signError && (
            <div className="alert alert-danger">
              <span>{signError}</span>
            </div>
          )}

          {/* DOBLE SELECTOR DE ARCHIVOS */}
          <div className="grid-2">
            {/* SELECTOR 1: ARCHIVO DE TEXTO PLANO */}
            <div className="form-group">
              <label>
                <strong>1. Archivo de Texto Plano (para Digesto SHA-3):</strong>
                <small className="help-text">
                  El digesto SHA-3 se calcula a partir de este texto original para verificarlo al ser descifrado
                </small>
              </label>
              <div
                className="dropzone signature-dropzone"
                onDragOver={handlePlainDragOver}
                onDrop={handlePlainDrop}
              >
                <h4>
                  {plainFileName
                    ? `Texto plano: ${plainFileName} (${(plainContent.length / 1024).toFixed(2)} KB)`
                    : 'Arrastra y suelta tu archivo de texto plano (.txt) aquí'}
                </h4>
                <input
                  type="file"
                  id="rsa-plain-file-input"
                  accept=".txt"
                  onChange={handlePlainFileChange}
                  className="file-hidden-input"
                />
                <label htmlFor="rsa-plain-file-input" className="btn-secondary btn-sm">
                  Examinar Texto Plano (.txt)
                </label>
              </div>

              {plainSourceNotice && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#1E5C3E', fontWeight: 600 }}>
                  ✓ {plainSourceNotice}
                </div>
              )}

              {plainContent && (
                <div className="file-preview-accordion" style={{ marginTop: '0.5rem' }}>
                  <details>
                    <summary>
                      <strong>Vista previa texto plano</strong> ({plainContent.length} car.)
                      {plainSha3Digest && (
                        <span className="length-tag" style={{ marginLeft: '0.5rem' }}>
                          SHA-3: {plainSha3Digest.slice(0, 10)}...
                        </span>
                      )}
                    </summary>
                    <pre className="preview-code">
                      {plainContent.slice(0, 350)}
                      {plainContent.length > 350 && '\n... [resto del texto plano]'}
                    </pre>
                  </details>
                </div>
              )}
            </div>

            {/* SELECTOR 2: ARCHIVO CIFRADO */}
            <div className="form-group">
              <label>
                <strong>2. Archivo Cifrado (al que se le concatenará la firma):</strong>
                <small className="help-text">
                  Se escribirá "Firma digital", salto de línea y la firma al final de este archivo
                </small>
              </label>
              <div
                className="dropzone signature-dropzone"
                onDragOver={handleCipherDragOver}
                onDrop={handleCipherDrop}
              >
                <h4>
                  {cipherFileName
                    ? `Archivo cifrado: ${cipherFileName} (${(cipherContent.length / 1024).toFixed(2)} KB)`
                    : 'Arrastra y suelta tu archivo cifrado (.txt) aquí'}
                </h4>
                <input
                  type="file"
                  id="rsa-cipher-file-input"
                  accept=".txt"
                  onChange={handleCipherFileChange}
                  className="file-hidden-input"
                />
                <label htmlFor="rsa-cipher-file-input" className="btn-secondary btn-sm">
                  Examinar Archivo Cifrado (.txt)
                </label>
              </div>

              {cipherSourceNotice && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#1E5C3E', fontWeight: 600 }}>
                  ✓ {cipherSourceNotice}
                </div>
              )}

              {cipherContent && (
                <div className="file-preview-accordion" style={{ marginTop: '0.5rem' }}>
                  <details>
                    <summary>
                      <strong>Vista previa archivo cifrado</strong> ({cipherContent.length} car.)
                    </summary>
                    <pre className="preview-code">
                      {cipherContent.slice(0, 350)}
                      {cipherContent.length > 350 && '\n... [resto del criptograma]'}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>

          {/* Clave Privada RSA */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <div className="label-with-action">
              <label htmlFor="rsa-priv-key">
                <strong>Clave Privada RSA :</strong>
                <small className="help-text">Utilizada para firmar el digesto SHA-3 del texto plano con RSA-4096</small>
              </label>
              <div className="actions-inline">
                {privateKeyPem && (
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setPrivateKeyPem('')}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
            <textarea
              id="rsa-priv-key"
              rows={5}
              value={privateKeyPem}
              onChange={(e) => setPrivateKeyPem(e.target.value)}
              placeholder="-----Pega aquí tu clave privada RSA-----"
              className="code-textarea"
            />
          </div>

          {/* Botón de Firmado */}
          <button
            type="button"
            className="btn-primary full-width"
            onClick={handleSign}
            disabled={isSigning || !plainContent || !cipherContent}
          >
            {isSigning
              ? 'Calculando digesto SHA-3 del texto plano y firmando...'
              : 'Firmar (Calcular Digesto de Texto Plano y Concatenar a Cifrado)'}
          </button>

          {/* Resultado de la firma y documento concatenado */}
          {signedDocResult && (
            <div className="result-card signature-result">
              <div className="card-header">
                <strong>Archivo Cifrado con Firma Concatenada:</strong>
                <span className="length-tag">{signedDocResult.length} caracteres</span>
              </div>

              {/* Muestra del digesto SHA-3 calculado sobre el texto plano */}
              <div className="digest-info-banner">
                <div className="digest-label">
                  Digesto SHA-3 (SHA3-256) calculado a partir del TEXTO PLANO:
                </div>
                <code className="digest-code-sm">{plainSha3Digest}</code>
                <small style={{ color: '#4A5F57', marginTop: '0.25rem' }}>
                  ℹ La firma protege el texto plano original y se encuentra concatenada al final del archivo cifrado. Al descifrar el criptograma en el destino, este digesto coincidirá de forma idéntica.
                </small>
              </div>

              {/* Vista previa del documento concatenado */}
              <div className="output-box code-display wrap-text max-preview">
                {signedDocResult.slice(0, 600)}
                {signedDocResult.length > 600 && '\n... [firma digital concatenada al final]'}
              </div>

              <div className="action-buttons-row">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={downloadSignedDocumentFile}
                >
                  Descargar Archivo Cifrado con Firma (.txt)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={downloadSignatureOnly}
                >
                  Descargar Firma (.sig)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(signedDocResult);
                    showToast('Archivo firmado completo copiado al portapapeles.');
                  }}
                >
                  Copiar Todo
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={transferToVerification}
                >
                  Pasar a Verificación ➔
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA: VERIFICAR FIRMA DE ARCHIVO                     */}
      {/* ======================================================== */}
      {activeTab === 'verify' && (
        <div className="tab-pane">
          {verifyDetectionNotice && (
            <div className="alert alert-success">
              <span>{verifyDetectionNotice}</span>
            </div>
          )}

          {verifyError && (
            <div className="alert alert-danger">
              <span>{verifyError}</span>
            </div>
          )}

          {/* Campo para subir archivo firmado a verificar */}
          <div className="form-group">
            <label>
              <strong>Subir Archivo Firmado para Verificar (.txt):</strong>
              <small className="help-text">
                El sistema detectará automáticamente la etiqueta "Firma digital" y extraerá el mensaje y la firma
              </small>
            </label>
            <div
              className="dropzone signature-dropzone"
              onDragOver={handleVerifyDragOver}
              onDrop={handleVerifyDrop}
            >
              <h4>
                {verifyFile
                  ? `Archivo cargado: ${verifyFile.name} (${(verifyFile.size / 1024).toFixed(2)} KB)`
                  : 'Arrastra y suelta tu archivo firmado (.txt) aquí, o usa el botón para examinar'}
              </h4>
              <input
                type="file"
                id="rsa-verify-file-input"
                accept=".txt"
                onChange={handleVerifyFileChange}
                className="file-hidden-input"
              />
              <label htmlFor="rsa-verify-file-input" className="btn-secondary btn-sm">
                Examinar Archivo Firmado (.txt)
              </label>
            </div>
          </div>

          {/* Contenido del Documento a Verificar (antes de la firma) */}
          <div className="form-group">
            <label htmlFor="rsa-verify-content">
              <strong>Contenido del Documento a Verificar (antes de la firma):</strong>
              <small className="help-text">
                Texto del documento (texto plano descifrado) a partir del cual se calculará independientemente el digesto SHA-3
              </small>
            </label>
            <textarea
              id="rsa-verify-content"
              rows={4}
              value={verifyContent}
              onChange={(e) => {
                setVerifyContent(e.target.value);
                setVerificationResult(null);
              }}
              placeholder="El contenido del documento antes de la firma digital..."
              className="code-textarea"
            />
          </div>

          <div className="grid-2">
            {/* Clave Pública RSA */}
            <div className="form-group">
              <label htmlFor="rsa-pub-key">
                <strong>Clave Pública RSA:</strong>
                <small className="help-text">Clave pública del firmante para descifrar la firma</small>
              </label>
              <textarea
                id="rsa-pub-key"
                rows={5}
                value={verifyPublicKeyPem}
                onChange={(e) => {
                  setVerifyPublicKeyPem(e.target.value);
                  setVerificationResult(null);
                }}
                placeholder="-----Pega aquí la clave pública RSA-----"
                className="code-textarea"
              />
            </div>

            {/* Firma Digital extraída o ingresada */}
            <div className="form-group">
              <label htmlFor="rsa-sig-input">
                <strong>Firma Digital (Base64):</strong>
                <small className="help-text">Se llena automáticamente al subir el archivo firmado</small>
              </label>
              <textarea
                id="rsa-sig-input"
                rows={5}
                value={verifySignatureInput}
                onChange={(e) => {
                  setVerifySignatureInput(e.target.value);
                  setVerificationResult(null);
                }}
                placeholder="Firma digital en Base64..."
                className="code-textarea"
              />
            </div>
          </div>

          {/* Botón de Verificación */}
          <button
            type="button"
            className="btn-primary full-width"
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? 'Calculando y comparando digestos SHA-3...' : 'Verificar Firma Digital (Comparar Digestos SHA-3)'}
          </button>

          {/* Resultado de la Verificación y Comparación de Digestos */}
          {verificationResult && (
            <div className={`digest-comparison-card ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
              <div className="card-header">
                <h4>
                  {verificationResult.isValid
                    ? '✓ Firma Digital VÁLIDA y Auténtica'
                    : '✗ Firma Digital INVÁLIDA'}
                </h4>
                <span className={`match-badge ${verificationResult.isValid ? 'match-success' : 'match-fail'}`}>
                  {verificationResult.isValid ? 'Coincidencia Exacta' : 'Discrepancia en Digestos'}
                </span>
              </div>

              <div className="digest-comparison-body">
                <p className="comparison-intro">
                  {verificationResult.isValid
                    ? 'El digesto SHA-3 calculado a partir del contenido antes de la firma coincide de forma idéntica con el digesto descifrado de la firma digital mediante la clave pública RSA.'
                    : 'El digesto calculado no coincide con el digesto descifrado de la firma digital. El archivo fue modificado o la clave pública proporcionada no corresponde a la firma.'}
                </p>

                <div className="digest-block">
                  <label>
                    <strong>1. Digesto SHA-3 calculado del contenido (antes de la firma):</strong>
                  </label>
                  <div className="digest-box code-display">
                    {verificationResult.calculatedDigest}
                  </div>
                </div>

                <div className="digest-block">
                  <label>
                    <strong>2. Digesto SHA-3 descifrado de la firma digital (con clave pública):</strong>
                  </label>
                  <div className="digest-box code-display">
                    {verificationResult.decryptedDigest}
                  </div>
                </div>

                <div className="digest-result-banner">
                  <strong>Comparación: </strong>
                  {verificationResult.isValid ? (
                    <span className="text-success">
                      AMBOS DIGESTOS COINCIDEN (Integridad y Autenticidad verificadas).
                    </span>
                  ) : (
                    <span className="text-danger">
                      LOS DIGESTOS NO COINCIDEN (El contenido fue alterado o la clave es incorrecta).
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

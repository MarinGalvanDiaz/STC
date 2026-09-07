import React, { useState, useEffect } from 'react';
import {
  signDataWithRsa,
  verifySignatureWithRsa
} from '../utils/cryptoUtils';

export default function RsaSignatureView({ textToSign = '', sourceDescription = '' }) {
  const [activeTab, setActiveTab] = useState('sign'); // 'sign' | 'verify' | 'keys'

  // Claves RSA generadas o en uso (inician vacías)
  const [privateKeyPem, setPrivateKeyPem] = useState('');
  const [publicKeyPem, setPublicKeyPem] = useState('');
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);

  // Estados de Firma (inician vacíos, sin datos de prueba)
  const [signContent, setSignContent] = useState('');
  const [signatureResult, setSignatureResult] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState('');

  // Estados de Verificación (inician vacíos)
  const [verifyContent, setVerifyContent] = useState('');
  const [verifyPublicKeyPem, setVerifyPublicKeyPem] = useState('');
  const [verifySignatureInput, setVerifySignatureInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // true | false | null
  const [verifyError, setVerifyError] = useState('');

  const [toastMessage, setToastMessage] = useState('');

  // Sincronizar contenido si viene de AES
  useEffect(() => {
    if (textToSign) {
      setSignContent(textToSign);
      setVerifyContent(textToSign);
    }
  }, [textToSign]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Firmar
  const handleSign = async () => {
    setSignError('');
    setSignatureResult('');
    if (!signContent) {
      setSignError('Por favor ingresa o carga el contenido a firmar.');
      return;
    }
    if (!privateKeyPem) {
      setSignError('Por favor pega o genera una Clave Privada RSA (4096 bits).');
      return;
    }

    setIsSigning(true);
    try {
      const sig = await signDataWithRsa(privateKeyPem, signContent);
      setSignatureResult(sig);
      setVerifySignatureInput(sig);
      showToast('Firma generada exitosamente con RSA 4096.');
    } catch (err) {
      setSignError('Error al firmar: ' + err.message);
    } finally {
      setIsSigning(false);
    }
  };

  // Verificar
  const handleVerify = async () => {
    setVerifyError('');
    setVerificationStatus(null);
    if (!verifyContent) {
      setVerifyError('Debes ingresar el contenido original o descifrado a verificar.');
      return;
    }
    if (!verifyPublicKeyPem) {
      setVerifyError('Debes ingresar la Clave Pública RSA del firmante.');
      return;
    }
    if (!verifySignatureInput) {
      setVerifyError('Debes ingresar la firma digital en Base64 para verificar.');
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await verifySignatureWithRsa(
        verifyPublicKeyPem,
        verifyContent,
        verifySignatureInput
      );
      setVerificationStatus(isValid);
    } catch (err) {
      setVerifyError('Error al verificar firma: ' + err.message);
      setVerificationStatus(false);
    } finally {
      setIsVerifying(false);
    }
  };

  // Descargar archivo de firma
  const downloadSignatureFile = () => {
    if (!signatureResult) return;
    const blob = new Blob([signatureResult], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'firma_digital_rsa4096.sig';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Archivo de firma descargado (.sig)');
  };

  const downloadKeyFile = (content, filename) => {
    const blob = new Blob([content], { type: 'application/x-pem-file;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card signature-module-card">
      <div className="card-header">
        <div>
          <h3>Firma Digital y Verificación (RSA 4096 bits)</h3>
          <p className="section-description">
            Garantiza la autenticidad, integridad y no repudio del archivo cifrado o descifrado.
          </p>
        </div>
        <span className="party-badge rsa-badge">RSA-4096 / SHA-256</span>
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
          Firmar Contenido
        </button>
        <button
          type="button"
          className={`subtab-btn ${activeTab === 'verify' ? 'active' : ''}`}
          onClick={() => setActiveTab('verify')}
        >
          Verificar Firma
        </button>
      </div>

      {/* PESTAÑA: FIRMAR */}
      {activeTab === 'sign' && (
        <div className="tab-pane">
          {sourceDescription && (
            <div className="info-banner">
              <span>Contenido cargado desde: <strong>{sourceDescription}</strong></span>
            </div>
          )}

          {signError && (
            <div className="alert alert-danger">
              <span>{signError}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="rsa-sign-content">
              <strong>Contenido del Documento a Firmar:</strong>
              <small className="help-text">Texto plano o texto cifrado del archivo</small>
            </label>
            <textarea
              id="rsa-sign-content"
              rows={4}
              value={signContent}
              onChange={(e) => setSignContent(e.target.value)}
              placeholder="Ingresa o pega aquí el texto que deseas firmar digitalmente..."
              className="code-textarea"
            />
          </div>

          <div className="form-group">
            <div className="label-with-action">
              <label htmlFor="rsa-priv-key">
                <strong>Clave Privada RSA (PEM):</strong>
                <small className="help-text">Se utiliza para generar la firma digital única</small>
              </label>
              <div className="actions-inline">
                {privateKeyPem ? (
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setPrivateKeyPem('')}
                  >
                    Limpiar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setActiveTab('keys')}
                  >
                    Generar claves 4096 bits
                  </button>
                )}
              </div>
            </div>
            <textarea
              id="rsa-priv-key"
              rows={5}
              value={privateKeyPem}
              onChange={(e) => setPrivateKeyPem(e.target.value)}
              placeholder="-----BEGIN PRIVATE KEY-----&#10;Pega aquí tu clave privada RSA en formato PEM...&#10;-----END PRIVATE KEY-----"
              className="code-textarea"
            />
          </div>

          <button
            type="button"
            className="btn-primary full-width"
            onClick={handleSign}
            disabled={isSigning}
          >
            {isSigning ? 'Calculando firma RSA 4096...' : 'Generar Firma Digital (RSA-4096)'}
          </button>

          {signatureResult && (
            <div className="result-card signature-result">
              <div className="card-header">
                <strong>Firma Digital Generada (Base64):</strong>
                <span className="length-tag">{signatureResult.length} caracteres</span>
              </div>
              <div className="output-box code-display wrap-text">
                {signatureResult}
              </div>
              <div className="action-buttons-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(signatureResult);
                    showToast('Firma digital copiada al portapapeles.');
                  }}
                >
                  Copiar Firma
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={downloadSignatureFile}
                >
                  Descargar Firma (.sig)
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setVerifyContent(signContent);
                    setVerifySignatureInput(signatureResult);
                    if (publicKeyPem) setVerifyPublicKeyPem(publicKeyPem);
                    setActiveTab('verify');
                  }}
                >
                  Pasar a Verificación ➔
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA: VERIFICAR */}
      {activeTab === 'verify' && (
        <div className="tab-pane">
          {verifyError && (
            <div className="alert alert-danger">
              <span>{verifyError}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="rsa-verify-content">
              <strong>Contenido del Documento a Verificar:</strong>
              <small className="help-text">El texto tal como fue emitido</small>
            </label>
            <textarea
              id="rsa-verify-content"
              rows={4}
              value={verifyContent}
              onChange={(e) => {
                setVerifyContent(e.target.value);
                setVerificationStatus(null);
              }}
              placeholder="Ingresa el contenido que deseas verificar..."
              className="code-textarea"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="rsa-pub-key">
                  <strong>Clave Pública RSA (PEM):</strong>
                  <small className="help-text">Clave pública correspondiente al firmante</small>
                </label>
                {publicKeyPem && (
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setVerifyPublicKeyPem(publicKeyPem)}
                  >
                    Cargar clave generada
                  </button>
                )}
              </div>
              <textarea
                id="rsa-pub-key"
                rows={5}
                value={verifyPublicKeyPem}
                onChange={(e) => {
                  setVerifyPublicKeyPem(e.target.value);
                  setVerificationStatus(null);
                }}
                placeholder="-----BEGIN PUBLIC KEY-----&#10;Pega aquí la clave pública RSA en formato PEM...&#10;-----END PUBLIC KEY-----"
                className="code-textarea"
              />
            </div>

            <div className="form-group">
              <label htmlFor="rsa-sig-input">
                <strong>Firma Digital (Base64):</strong>
                <small className="help-text">Cadena de firma a verificar</small>
              </label>
              <textarea
                id="rsa-sig-input"
                rows={5}
                value={verifySignatureInput}
                onChange={(e) => {
                  setVerifySignatureInput(e.target.value);
                  setVerificationStatus(null);
                }}
                placeholder="Pega aquí la firma digital en Base64..."
                className="code-textarea"
              />
            </div>
          </div>

          <button
            type="button"
            className="btn-primary full-width"
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? 'Verificando autenticidad...' : 'Verificar Firma Digital'}
          </button>

          {/* Resultado visual de la verificación */}
          {verificationStatus !== null && (
            <div className={`verification-badge-card ${verificationStatus ? 'valid' : 'invalid'}`}>
              <div className="verification-details">
                <h4>
                  {verificationStatus
                    ? 'Firma Digital VÁLIDA y Auténtica'
                    : 'Firma Digital INVÁLIDA'}
                </h4>
                <p>
                  {verificationStatus
                    ? 'El documento no ha sido modificado y fue firmado indudablemente con la clave privada correspondiente a esta clave pública RSA de 4096 bits.'
                    : 'El contenido del documento no coincide con la firma, el documento fue alterado, o la clave pública proporcionada no corresponde al firmante.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA: GENERADOR DE CLAVES RSA 4096 */}
      {activeTab === 'keys' && (
        <div className="tab-pane">
          <div className="key-gen-intro">
            <p>
              Genera un par de claves RSA criptográficamente seguro de <strong>4096 bits</strong> utilizando la API nativa Web Crypto de tu navegador.
            </p>
            <button
              type="button"
              className="btn-primary btn-lg"
              onClick={handleGenerateKeys}
              disabled={isGeneratingKeys}
            >
              {isGeneratingKeys ? 'Generando par de 4096 bits (esto toma un par de segundos)...' : 'Generar Nuevo Par RSA 4096'}
            </button>
          </div>

          {publicKeyPem && privateKeyPem && (
            <div className="grid-2 key-display-grid">
              <div className="key-box">
                <div className="key-box-header">
                  <strong>Clave Privada (4096 bits)</strong>
                  <span className="security-alert">Privada (No compartir)</span>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={privateKeyPem}
                  className="code-textarea"
                />
                <div className="action-buttons-row">
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(privateKeyPem);
                      showToast('Clave privada copiada al portapapeles.');
                    }}
                  >
                    Copiar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => downloadKeyFile(privateKeyPem, 'clave_privada_rsa4096.pem')}
                  >
                    Descargar .pem
                  </button>
                </div>
              </div>

              <div className="key-box">
                <div className="key-box-header">
                  <strong>Clave Pública (4096 bits)</strong>
                  <span className="public-alert">Pública (Para verificación)</span>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={publicKeyPem}
                  className="code-textarea"
                />
                <div className="action-buttons-row">
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(publicKeyPem);
                      showToast('Clave pública copiada al portapapeles.');
                    }}
                  >
                    Copiar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => downloadKeyFile(publicKeyPem, 'clave_publica_rsa4096.pem')}
                  >
                    Descargar .pem
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

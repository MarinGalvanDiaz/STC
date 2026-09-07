import React, { useState } from 'react';
import RsaSignatureView from './RsaSignatureView';
import {
  generateRandomAesKey,
  generateRandomIv,
  parseSignedDocument,
  createSignedDocument
} from '../utils/cryptoUtils';

export default function AesCipherView({ defaultAesKey = '' }) {
  // Modo de operación: 'encrypt' | 'decrypt'
  const [operationMode, setOperationMode] = useState('encrypt');

  // Parámetros criptográficos (inician vacíos, sin datos de prueba precargados)
  const [key, setKey] = useState(defaultAesKey || '');
  const [iv, setIv] = useState('');

  // Archivo seleccionado
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');

  // Estados de proceso
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Resultado de la última operación
  const [lastResultText, setLastResultText] = useState('');
  const [lastResultType, setLastResultType] = useState(''); // 'Cifrado' | 'Descifrado'
  const [lastDownloadedFilename, setLastDownloadedFilename] = useState('');

  // Manejo de carga de archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processSelectedFile(file);
  };

  const processSelectedFile = async (file) => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt')) {
      setErrorMessage('Por favor selecciona un archivo con extensión .txt');
      return;
    }

    setSelectedFile(file);

    // Leer vista previa forzando UTF-8 de forma estricta
    try {
      const buffer = await file.arrayBuffer();
      const text = new TextDecoder('utf-8').decode(buffer);
      setFilePreview(text);
    } catch (err) {
      setFilePreview('No se pudo previsualizar el archivo: ' + err.message);
    }
  };

  // Drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Cifrar o Descifrar en el backend
  const handleProcessCrypto = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedFile) {
      setErrorMessage('Debes seleccionar un archivo .txt para continuar.');
      return;
    }
    if (!key.trim()) {
      setErrorMessage('Debes ingresar la llave AES.');
      return;
    }
    if (!iv.trim()) {
      setErrorMessage('Debes ingresar el vector inicial (IV).');
      return;
    }

    setIsLoading(true);

    try {
      let fileToSend = selectedFile;
      let signatureToPreserve = null;

      // Si estamos descifrando, verificar si el archivo contiene firma digital
      if (operationMode === 'decrypt') {
        const fileBuffer = await selectedFile.arrayBuffer();
        const fileText = new TextDecoder('utf-8').decode(fileBuffer);
        const parsed = parseSignedDocument(fileText);
        if (parsed.hasSignature) {
          signatureToPreserve = parsed.signature;
          // Identificar y excluir la parte de la firma digital del mensaje a descifrar
          fileToSend = new File(
            [new TextEncoder().encode(parsed.content)],
            selectedFile.name,
            { type: 'text/plain;charset=utf-8' }
          );
        }
      }

      const formData = new FormData();
      formData.append('file', fileToSend);
      formData.append('key', key.trim());
      formData.append('iv', iv.trim());

      const endpoint = operationMode === 'encrypt'
        ? 'http://localhost:8081/api/crypto/encrypt'
        : 'http://localhost:8081/api/crypto/decrypt';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Error del servidor (${response.status})`);
      }

      // Obtener nombre sugerido de descarga desde el header Content-Disposition
      let filename = operationMode === 'encrypt'
        ? `cifrado_${selectedFile.name}`
        : `descifrado_${selectedFile.name}`;

      const disposition = response.headers.get('Content-Disposition');
      if (disposition && disposition.includes('filename=')) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      setLastDownloadedFilename(filename);

      // Obtener el buffer y decodificar estrictamente con UTF-8
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      let textResult = new TextDecoder('utf-8').decode(arrayBuffer);

      // Si había firma digital en modo descifrado, verificar y dejar la firma al final
      if (operationMode === 'decrypt' && signatureToPreserve) {
        const parsedBackend = parseSignedDocument(textResult);
        if (!parsedBackend.hasSignature) {
          textResult = createSignedDocument(textResult, signatureToPreserve);
        }
      }

      setLastResultText(textResult);
      setLastResultType(operationMode === 'encrypt' ? 'Cifrado' : 'Descifrado');

      // Descargar automáticamente el archivo .txt forzando UTF-8
      const finalBlob = new Blob([new TextEncoder().encode(textResult)], { type: 'text/plain;charset=utf-8' });
      const downloadUrl = window.URL.createObjectURL(finalBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(downloadUrl);

      if (operationMode === 'decrypt' && signatureToPreserve) {
        setSuccessMessage(
          `Archivo descifrado exitosamente. Se identificó la firma digital, se descifró el mensaje y se preservó la firma al final de '${filename}'.`
        );
      } else {
        setSuccessMessage(
          `Archivo ${operationMode === 'encrypt' ? 'cifrado' : 'descifrado'} exitosamente. Descargando '${filename}'...`
        );
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error de conexión con el backend (puerto 8081).');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="header-badge">Paso 2: Cifrado y Autenticación</div>
        <h2>Cifrado AES-CBC y Firma Digital RSA</h2>
        <p className="subtitle">
          Cifra o descifra archivos .txt con AES en modo CBC a través del backend, y firma digitalmente con RSA 4096 bits.
        </p>
      </div>

      {successMessage && (
        <div className="alert alert-success">
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selector de Modo: Cifrar / Descifrar */}
      <div className="card">
        <div className="tab-switch-row">
          <button
            type="button"
            className={`tab-switch-btn ${operationMode === 'encrypt' ? 'active' : ''}`}
            onClick={() => {
              setOperationMode('encrypt');
              setErrorMessage('');
              setSuccessMessage('');
            }}
          >
            Cifrar Archivo .txt
          </button>
          <button
            type="button"
            className={`tab-switch-btn ${operationMode === 'decrypt' ? 'active' : ''}`}
            onClick={() => {
              setOperationMode('decrypt');
              setErrorMessage('');
              setSuccessMessage('');
            }}
          >
            Descifrar Archivo .txt
          </button>
        </div>

        {/* Zona de Carga de Archivo */}
        <div
          className="dropzone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <h4>
            {selectedFile
              ? `Archivo seleccionado: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`
              : 'Arrastra y suelta tu archivo .txt aquí, o usa el botón para examinar'}
          </h4>
          <input
            type="file"
            id="file-upload-input"
            accept=".txt"
            onChange={handleFileChange}
            className="file-hidden-input"
          />
          <label htmlFor="file-upload-input" className="btn-secondary btn-sm">
            Examinar Archivo (.txt)
          </label>
        </div>

        {/* Previsualización del archivo cargado */}
        {filePreview && (
          <div className="file-preview-accordion">
            <details>
              <summary>
                <strong>Vista previa de: {selectedFile?.name}</strong> (primeros 500 caracteres)
                {operationMode === 'decrypt' && parseSignedDocument(filePreview).hasSignature && (
                  <span className="badge-notification" style={{ marginLeft: '0.5rem' }}>Firma digital detectada</span>
                )}
              </summary>
              <pre className="preview-code">
                {filePreview.slice(0, 500)}
                {filePreview.length > 500 && '\n... [contenido truncado para vista previa]'}
              </pre>
            </details>
            {operationMode === 'decrypt' && parseSignedDocument(filePreview).hasSignature && (
              <div className="info-banner" style={{ marginTop: '0.5rem' }}>
                <span>
                  ✓ <strong>Firma digital detectada en el archivo:</strong> Al procesar, se excluirá la firma digital para descifrar el criptograma y se preservará la firma al final del archivo resultante.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Inputs de Llave e IV */}
        <div className="grid-2 crypto-params-grid">
          <div className="form-group">
            <div className="label-with-action">
              <label htmlFor="aes-key">
                <strong>Llave AES (Key):</strong>
                <span className="length-tag">{key.length} caracteres</span>
              </label>
              <div className="actions-inline">
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => setKey(generateRandomAesKey(16))}
                >
                  Generar 16B (AES-128)
                </button>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => setKey(generateRandomAesKey(32))}
                >
                  Generar 32B (AES-256)
                </button>
              </div>
            </div>
            <input
              id="aes-key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Ingresa la llave (16, 24 o 32 caracteres)"
              className="code-input"
            />
            <small className="help-text">
              Requerido: 16 caracteres (128 bits) o 32 caracteres (256 bits).
            </small>
          </div>

          <div className="form-group">
            <div className="label-with-action">
              <label htmlFor="aes-iv">
                <strong>Vector Inicial (IV):</strong>
                <span className="length-tag">{iv.length} caracteres</span>
              </label>
              <button
                type="button"
                className="btn-link"
                onClick={() => setIv(generateRandomIv(16))}
              >
                Generar 16B
              </button>
            </div>
            <input
              id="aes-iv"
              type="text"
              value={iv}
              onChange={(e) => setIv(e.target.value)}
              placeholder="Ingresa el vector de 16 caracteres"
              className="code-input"
            />
            <small className="help-text">
              Debe tener exactamente 16 caracteres (128 bits para el bloque AES).
            </small>
          </div>
        </div>

        {/* Botón Principal de Acción */}
        <button
          type="button"
          className={`btn-primary btn-lg full-width ${operationMode === 'encrypt' ? 'btn-encrypt' : 'btn-decrypt'}`}
          onClick={handleProcessCrypto}
          disabled={isLoading}
        >
          {isLoading ? (
            <span>Procesando solicitud en el backend...</span>
          ) : operationMode === 'encrypt' ? (
            <span>Cifrar con AES-CBC y Descargar .txt</span>
          ) : (
            <span>Descifrar con AES-CBC y Descargar .txt</span>
          )}
        </button>

        {/* Muestra del resultado procesado */}
        {lastResultText && (
          <div className="result-card">
            <div className="card-header">
              <strong>Resultado {lastResultType} del archivo:</strong>
              <span className="length-tag">{lastResultText.length} caracteres</span>
            </div>
            <div className="output-box code-display wrap-text max-preview">
              {lastResultText.slice(0, 400)}
              {lastResultText.length > 400 && '... [resto del archivo]'}
            </div>
            <div className="action-buttons-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(lastResultText);
                  setSuccessMessage('Texto copiado al portapapeles.');
                }}
              >
                Copiar Texto {lastResultType}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SEGUNDA PARTE: FIRMA DIGITAL Y VERIFICACIÓN RSA 4096 BITS */}
      <RsaSignatureView
        plainTextData={
          operationMode === 'encrypt' && (filePreview || selectedFile)
            ? {
                file: selectedFile,
                content: filePreview,
                fileName: selectedFile?.name || 'texto_plano.txt',
              }
            : null
        }
        cipherTextData={
          operationMode === 'encrypt' && lastResultText
            ? {
                content: lastResultText,
                fileName: lastDownloadedFilename || (selectedFile ? `cifrado_${selectedFile.name}` : 'archivo_cifrado.txt'),
              }
            : null
        }
        decryptedResultData={
          operationMode === 'decrypt' && lastResultText
            ? {
                content: lastResultText,
                fileName: lastDownloadedFilename || (selectedFile ? `descifrado_${selectedFile.name}` : 'archivo_descifrado.txt'),
              }
            : null
        }
        sourceDescription={
          lastResultText
            ? `Resultado ${lastResultType} (${selectedFile?.name || 'archivo.txt'})`
            : selectedFile
            ? `Archivo cargado (${selectedFile.name})`
            : ''
        }
      />
    </div>
  );
}

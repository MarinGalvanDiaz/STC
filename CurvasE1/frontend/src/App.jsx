import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:8080/api/ecdsa'

function App() {
  const [fileToSign, setFileToSign] = useState(null)
  const [fileToVerify, setFileToVerify] = useState(null)
  const [keys, setKeys] = useState(null)
  const [extractedSignature, setExtractedSignature] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function readError(response) {
    try {
      const data = await response.json()
      return data.detail || data.message || 'La operación falló.'
    } catch {
      return 'La operación falló.'
    }
  }

  useEffect(() => {
    fetch(`${API_URL}/keys`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await readError(response))
        return response.json()
      })
      .then(setKeys)
      .catch((error) => setResult({ valid: false, text: error.message }))
  }, [])

  function selectTxtFile(event, setter) {
    const file = event.target.files[0]
    setter(file && file.name.toLowerCase().endsWith('.txt') ? file : null)
    if (file && !file.name.toLowerCase().endsWith('.txt')) {
      setResult({ valid: false, text: 'Solo se permiten archivos con extensión .txt.' })
    }
  }

  async function signFile(event) {
    event.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const body = new FormData()
      body.append('file', fileToSign)
      const response = await fetch(`${API_URL}/sign-file`, { method: 'POST', body })
      if (!response.ok) throw new Error(await readError(response))
      download(await response.blob(), `firmado-${fileToSign.name}`)
      setResult({ valid: true, text: 'Firma agregada al final del archivo. Descarga iniciada.' })
    } catch (error) {
      setResult({ valid: false, text: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function verifyFile() {
    setLoading(true)
    setResult(null)
    setExtractedSignature('')
    try {
      const body = new FormData()
      body.append('file', fileToVerify)
      const response = await fetch(`${API_URL}/verify-file`, { method: 'POST', body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || data.message || 'No fue posible validar el archivo.')
      setExtractedSignature(data.signature)
      setResult({ valid: data.valid, text: data.message })
    } catch (error) {
      setResult({ valid: false, text: error.message })
    } finally {
      setLoading(false)
    }
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <span className="eyebrow">Laboratorio de criptografía</span>
        <h1>Firma digital de <span>archivos TXT</span></h1>
        <p>La firma se agrega al final del archivo y se valida con las claves generadas por el backend.</p>
      </header>

      <section className="keys-card card">
        <div className="card-heading">
          <div className="step">00</div>
          <div>
            <h2>Par de claves ECDSA</h2>
            <p>Generadas al iniciar el backend. Se muestran únicamente con fines educativos.</p>
          </div>
        </div>
        {keys ? (
          <div className="key-grid">
            <div>
              <label htmlFor="private-key">Clave privada</label>
              <textarea id="private-key" value={keys.privateKey} readOnly rows="8" />
            </div>
            <div>
              <label htmlFor="public-key">Clave pública</label>
              <textarea id="public-key" value={keys.publicKey} readOnly rows="8" />
            </div>
          </div>
        ) : <p>Cargando claves desde el backend...</p>}
        <span className="warning">{keys?.warning}</span>
      </section>

      <section className="workspace">
        <form className="card" onSubmit={signFile}>
          <div className="card-heading">
            <div className="step">01</div>
            <div>
              <h2>Firmar archivo</h2>
              <p>Selecciona un archivo de texto UTF-8.</p>
            </div>
          </div>
          <label htmlFor="file-to-sign">Archivo TXT original</label>
          <input id="file-to-sign" type="file" accept=".txt,text/plain" onChange={(event) => selectTxtFile(event, setFileToSign)} />
          <p className="selected-file">{fileToSign ? `Seleccionado: ${fileToSign.name}` : 'Ningún archivo seleccionado'}</p>
          <button className="primary-button" type="submit" disabled={loading || !fileToSign}>
            {loading ? 'Procesando...' : 'Firmar y descargar'}
          </button>
        </form>

        <section className="card">
          <div className="card-heading">
            <div className="step">02</div>
            <div>
              <h2>Validar archivo</h2>
              <p>La firma se extrae del bloque final del TXT.</p>
            </div>
          </div>
          <label htmlFor="file-to-verify">Archivo TXT firmado</label>
          <input id="file-to-verify" type="file" accept=".txt,text/plain" onChange={(event) => selectTxtFile(event, setFileToVerify)} />
          <p className="selected-file">{fileToVerify ? `Seleccionado: ${fileToVerify.name}` : 'Ningún archivo seleccionado'}</p>
          <button className="secondary-button" type="button" onClick={verifyFile} disabled={loading || !fileToVerify}>
            Validar firma extraída
          </button>
          {extractedSignature && (
            <div className="signature-output">
              <label htmlFor="extracted-signature">Firma extraída del TXT</label>
              <textarea id="extracted-signature" value={extractedSignature} readOnly rows="4" />
            </div>
          )}
        </section>
      </section>

      <section className={`result ${result ? (result.valid ? 'success' : 'error') : ''}`} aria-live="polite">
        <div className="status-dot" />
        <div>
          <strong>{result ? result.text : 'El resultado de la operación aparecerá aquí.'}</strong>
          <span>SHA256withECDSA · secp256r1 · firma almacenada en el propio TXT</span>
        </div>
      </section>
    </main>
  )
}

export default App

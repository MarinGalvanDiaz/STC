const BASE_URL = '/api/ecdh';

export async function fetchCurves() {
  const res = await fetch(`${BASE_URL}/curves`);
  if (!res.ok) throw new Error('Error al cargar curvas');
  return res.json();
}

export async function generateKey(curveId = 'P-256', entity = 'Usuario') {
  const res = await fetch(`${BASE_URL}/generate-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curveId, entity }),
  });
  if (!res.ok) throw new Error(`Error generando par de claves para ${entity}`);
  return res.json();
}

export async function calculateSharedKey(curveId, privHex, peerPubHex) {
  const res = await fetch(`${BASE_URL}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curveId, privHex, peerPubHex }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error calculando clave compartida');
  }
  return res.json();
}

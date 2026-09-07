// ==========================================
// UTILIDADES CRIPTOGRÁFICAS (DH + RSA 4096 / SHA-3 + AES HELPERS)
// ==========================================

import { sha3_256 } from 'js-sha3';

/**
 * Exponenciación modular rápida para números de cualquier tamaño con BigInt:
 * Calcula (base^exp) % mod de forma eficiente y segura contra desbordamientos.
 */
export function modPow(base, exp, mod) {
  let b = BigInt(base);
  let e = BigInt(exp);
  let m = BigInt(mod);

  if (m <= 0n) {
    throw new Error("El módulo debe ser positivo y mayor a cero.");
  }
  if (m === 1n) return 0n;
  if (e < 0n) {
    throw new Error("El exponente no puede ser negativo.");
  }

  let result = 1n;
  b = b % m;

  while (e > 0n) {
    if (e % 2n === 1n) {
      result = (result * b) % m;
    }
    e = e / 2n;
    b = (b * b) % m;
  }

  return result;
}

/**
 * Presets didácticos y estándar para Diffie-Hellman
 */
export const DH_PRESETS = [
  {
    name: "Educativo pequeño (p=23, g=5)",
    p: "23",
    g: "5",
    description: "Ideal para clases y cálculos manuales de verificación rápida."
  },
  {
    name: "Educativo mediano (p=353, g=3)",
    p: "353",
    g: "3",
    description: "Excelente para comprender intercambio con números mayores a 2 dígitos."
  },
  {
    name: "Primo grande (p=7919, g=7)",
    p: "7919",
    g: "7",
    description: "Demuestra cálculos con números primos de 4 dígitos."
  },
  {
    name: "RFC 3526 (Grupo 14 MODP - 2048 bits)",
    p: "3231700607131100730071487668866995196044410266971548403213034542752465513886735083828056769766068872472827851565507956915451994837269784180364279952199460742831096108745952465862900031089535837946258334292898688081033023168440493766543447912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999837297804995105973173281609631859502445945534690830264252230825334468503526193118817101000313",
    g: "2",
    description: "Estándar de grado criptográfico seguro según RFC 3526."
  }
];

/**
 * Convierte un secreto compartido K (BigInt o string) en una clave AES utilizable
 */
export function deriveAesKeyFromK(kValue, lengthInBytes = 32) {
  if (!kValue) return "";
  const kStr = kValue.toString();
  let hex = BigInt(kStr).toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;

  const targetChars = lengthInBytes * 2;
  if (hex.length < targetChars) {
    return hex.padStart(targetChars, "0");
  }
  return hex.substring(0, targetChars);
}

/**
 * Genera una clave AES aleatoria de longitud fija (16, 24 o 32 caracteres)
 */
export function generateRandomAesKey(byteLength = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  const array = new Uint8Array(byteLength);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join("");
}

/**
 * Genera un Vector Inicial (IV) aleatorio de exactamente 16 caracteres
 */
export function generateRandomIv(byteLength = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const array = new Uint8Array(byteLength);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join("");
}

// ==========================================
// FORMATEO DE DOCUMENTOS CON FIRMA CONCATENADA
// ==========================================

/**
 * Analiza un texto para identificar si contiene la sección de 'Firma digital'.
 * Retorna el contenido del mensaje antes de la firma y la firma en Base64.
 * Preserva idéntico byte a byte el contenido previo, incluyendo saltos de línea (\n, \r\n) y UTF-8.
 */
export function parseSignedDocument(rawText) {
  if (!rawText) {
    return { content: '', signature: '', hasSignature: false };
  }

  const regex = /(?:\r?\n)Firma digital\r?\n([\s\S]*)$/i;
  const match = rawText.match(regex);

  if (match) {
    const content = rawText.slice(0, match.index);
    const signature = match[1].trim();
    return { content, signature, hasSignature: true };
  }

  const regexStart = /^Firma digital\r?\n([\s\S]*)$/i;
  const matchStart = rawText.match(regexStart);
  if (matchStart) {
    return { content: '', signature: matchStart[1].trim(), hasSignature: true };
  }

  return { content: rawText, signature: '', hasSignature: false };
}

/**
 * Concatena el contenido del mensaje, escribe "Firma digital", salto de línea y la firma.
 */
export function createSignedDocument(content, signatureBase64) {
  const safeContent = content !== undefined && content !== null ? String(content) : '';
  const trimmedSig = (signatureBase64 || '').trim();
  const newline = safeContent.includes('\r\n') ? '\r\n' : '\n';
  return `${safeContent}${newline}Firma digital${newline}${trimmedSig}`;
}

// ==========================================
// CÁLCULO DE DIGESTO CON SHA-3 (SHA3-256)
// ==========================================

export function calculateSha3Hex(data) {
  if (data === undefined || data === null) {
    return "";
  }
  const utf8Bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return sha3_256(utf8Bytes).toLowerCase();
}

// ==========================================
// PARSEO ASN.1 Y MATEMÁTICA RSA 4096 / SHA-3
// ==========================================

function base64ToBytes(base64) {
  const cleaned = base64.replace(/\s+/g, "");
  const decodeFn = typeof atob !== 'undefined'
      ? atob
      : (typeof globalThis !== 'undefined' && globalThis.atob)
          ? globalThis.atob
          : (b) => Buffer.from(b, 'base64').toString('binary');
  const binary = decodeFn(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const encodeFn = typeof btoa !== 'undefined'
      ? btoa
      : (typeof globalThis !== 'undefined' && globalThis.btoa)
          ? globalThis.btoa
          : (b) => Buffer.from(b, 'binary').toString('base64');
  return encodeFn(binary);
}

function bytesToHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const cleanHex = hex.length % 2 !== 0 ? '0' + hex : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

function extractAsn1Integers(buf) {
  const integers = [];
  let pos = 0;
  while (pos < buf.length) {
    const tag = buf[pos++];
    let length = buf[pos++];
    if (length & 0x80) {
      const nBytes = length & 0x7f;
      length = 0;
      for (let i = 0; i < nBytes; i++) length = (length << 8) | buf[pos++];
    }
    if (tag === 0x02) {
      integers.push(buf.subarray(pos, pos + length));
      pos += length;
    } else if (tag === 0x30 || tag === 0x04) {
      integers.push(...extractAsn1Integers(buf.subarray(pos, pos + length)));
      pos += length;
    } else if (tag === 0x03) {
      pos++;
      length--;
      integers.push(...extractAsn1Integers(buf.subarray(pos, pos + length)));
      pos += length;
    } else {
      pos += length;
    }
  }
  return integers;
}

export function parseRsaPrivateKey(pem) {
  if (!pem || typeof pem !== 'string') {
    throw new Error('La clave privada proporcionada está vacía.');
  }
  const cleaned = pem.replace(/-----[^\n]+-----/g, '').replace(/\s+/g, '');
  if (!cleaned) {
    throw new Error('Formato PEM de clave privada no válido.');
  }
  const buf = base64ToBytes(cleaned);
  const ints = extractAsn1Integers(buf);
  const largeInts = ints.filter(b => b.length > 64);
  if (largeInts.length < 2) {
    throw new Error('Clave privada RSA no válida: faltan parámetros numéricos n y d.');
  }

  const nBytes = largeInts[0];
  const dBytes = largeInts[1];

  const smallInts = ints.filter(b => b.length <= 8 && b.length > 0);
  let eBytes = smallInts.find(b => {
    let hex = bytesToHex(b);
    let val = BigInt('0x' + (hex || '0'));
    return val === 65537n || val === 3n;
  }) || smallInts[smallInts.length - 1];

  const n = BigInt('0x' + bytesToHex(nBytes));
  const d = BigInt('0x' + bytesToHex(dBytes));
  const e = eBytes ? BigInt('0x' + bytesToHex(eBytes)) : 65537n;
  const byteLen = nBytes[0] === 0x00 ? nBytes.length - 1 : nBytes.length;

  return { n, d, e, byteLen };
}

export function parseRsaPublicKey(pem) {
  if (!pem || typeof pem !== 'string') {
    throw new Error('La clave pública proporcionada está vacía.');
  }
  const cleaned = pem.replace(/-----[^\n]+-----/g, '').replace(/\s+/g, '');
  if (!cleaned) {
    throw new Error('Formato PEM de clave pública no válido.');
  }
  const buf = base64ToBytes(cleaned);
  const ints = extractAsn1Integers(buf);
  const largeInts = ints.filter(b => b.length > 64);
  if (largeInts.length < 1) {
    throw new Error('Clave pública RSA no válida: falta parámetro numérico n.');
  }

  const nBytes = largeInts[0];
  const smallInts = ints.filter(b => b.length <= 8 && b.length > 0);
  let eBytes = smallInts.find(b => {
    let hex = bytesToHex(b);
    let val = BigInt('0x' + (hex || '0'));
    return val === 65537n || val === 3n;
  }) || smallInts[smallInts.length - 1];

  const n = BigInt('0x' + bytesToHex(nBytes));
  const e = eBytes ? BigInt('0x' + bytesToHex(eBytes)) : 65537n;
  const byteLen = nBytes[0] === 0x00 ? nBytes.length - 1 : nBytes.length;

  return { n, e, byteLen };
}

const SHA3_256_DIGEST_INFO_PREFIX = hexToBytes("3031300d060960864801650304020805000420");

export async function signDataWithRsa(privateKeyPem, data) {
  const { n, d, byteLen } = parseRsaPrivateKey(privateKeyPem);

  const hashHex = calculateSha3Hex(data);
  const hashBytes = hexToBytes(hashHex);

  const tBytes = new Uint8Array(SHA3_256_DIGEST_INFO_PREFIX.length + hashBytes.length);
  tBytes.set(SHA3_256_DIGEST_INFO_PREFIX, 0);
  tBytes.set(hashBytes, SHA3_256_DIGEST_INFO_PREFIX.length);

  const em = new Uint8Array(byteLen);
  em[0] = 0x00;
  em[1] = 0x01;
  const psLen = byteLen - tBytes.length - 3;
  if (psLen < 8) {
    throw new Error('La longitud de clave RSA es insuficiente para el relleno PKCS#1 con SHA-3.');
  }
  em.fill(0xff, 2, 2 + psLen);
  em[2 + psLen] = 0x00;
  em.set(tBytes, 2 + psLen + 1);

  const mBigInt = BigInt('0x' + bytesToHex(em));
  const sBigInt = modPow(mBigInt, d, n);
  const sHex = sBigInt.toString(16).padStart(byteLen * 2, '0');
  const signatureBytes = hexToBytes(sHex);

  return bytesToBase64(signatureBytes);
}

export function decryptRsaSignatureDigest(publicKeyPem, signatureBase64) {
  const { n, e, byteLen } = parseRsaPublicKey(publicKeyPem);
  const sigBytes = base64ToBytes(signatureBase64);
  const sBigInt = BigInt('0x' + bytesToHex(sigBytes));

  const mBigInt = modPow(sBigInt, e, n);
  const mHex = mBigInt.toString(16).padStart(byteLen * 2, '0');

  return mHex.slice(-64).toLowerCase();
}

export async function verifySignatureWithDigestComparison(publicKeyPem, content, signatureBase64) {
  if (!content) {
    throw new Error("El contenido del documento a verificar está vacío.");
  }
  if (!publicKeyPem) {
    throw new Error("Debes proporcionar la clave pública RSA (PEM).");
  }
  if (!signatureBase64) {
    throw new Error("Debes proporcionar la firma digital a verificar.");
  }

  const calculatedDigest = calculateSha3Hex(content);
  const decryptedDigest = decryptRsaSignatureDigest(publicKeyPem, signatureBase64);
  const isValid = calculatedDigest === decryptedDigest;

  return {
    isValid,
    calculatedDigest,
    decryptedDigest,
    algorithm: "SHA3-256"
  };
}

export async function verifySignatureWithRsa(publicKeyPem, data, signatureBase64) {
  const result = await verifySignatureWithDigestComparison(publicKeyPem, data, signatureBase64);
  return result.isValid;
}

// ==========================================
// VALIDACIONES Y RAÍCES PRIMITIVAS DIFFIE-HELLMAN
// ==========================================

/**
 * Comprueba si un BigInt es primo (Ensayo directo para pequeños / Miller-Rabin para grandes)
 */
export function isPrimeBigInt(n, k = 5) {
  if (n <= 1n) return false;
  if (n <= 3n) return true;
  if (n % 2n === 0n || n % 3n === 0n) return false;

  // Optimización para números pequeños (< 10000)
  if (n < 10000n) {
    for (let i = 5n; i * i <= n; i += 6n) {
      if (n % i === 0n || n % (i + 2n) === 0n) return false;
    }
    return true;
  }

  // Miller-Rabin para números grandes
  let d = n - 1n;
  let s = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    s += 1n;
  }

  const nMinusOne = n - 1n;
  const range = n - 4n;
  if (range <= 0n) return true;

  for (let i = 0; i < k; i++) {
    const a = 2n + (BigInt(Math.floor(Math.random() * 100000)) % range);
    let x = modPow(a, d, n);
    if (x === 1n || x === nMinusOne) continue;

    let composite = true;
    for (let r = 1n; r < s; r++) {
      x = modPow(x, 2n, n);
      if (x === nMinusOne) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
  }
  return true;
}

function getPrimeFactors(n) {
  const factors = new Set();
  let temp = n;

  if (temp % 2n === 0n) {
    factors.add(2n);
    while (temp % 2n === 0n) temp /= 2n;
  }

  for (let i = 3n; i * i <= temp; i += 2n) {
    if (temp % i === 0n) {
      factors.add(i);
      while (temp % i === 0n) temp /= i;
    }
  }

  if (temp > 2n) {
    factors.add(temp);
  }

  return Array.from(factors);
}

export function calculateEulerPhi(n) {
  const nBig = BigInt(n);
  if (nBig <= 1n) return 0n;
  return nBig - 1n; // Asumiendo n primo
}

export function findPrimitiveRoots(n, limit = 50) {
  const nBig = BigInt(n);
  if (nBig <= 2n || !isPrimeBigInt(nBig)) return [];

  const phi = nBig - 1n;
  const factors = getPrimeFactors(phi);
  const roots = [];

  for (let g = 2n; g < nBig; g++) {
    let isPrimitive = true;
    for (const factor of factors) {
      if (modPow(g, phi / factor, nBig) === 1n) {
        isPrimitive = false;
        break;
      }
    }
    if (isPrimitive) {
      roots.push(g.toString());
      if (roots.length >= limit) break;
    }
  }

  return roots;
}

export function getBitLength(valueStr) {
  try {
    const b = BigInt(valueStr);
    return b === 0n ? 0 : b.toString(2).length;
  } catch (e) {
    return 0;
  }
}
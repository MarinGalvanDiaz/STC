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
/**
 * Analiza un texto para identificar si contiene la sección de 'Firma digital'.
 * Retorna el contenido del mensaje antes de la firma y la firma en Base64.
 * Preserva idéntico byte a byte el contenido previo, incluyendo saltos de línea (\n, \r\n) y UTF-8.
 */
export function parseSignedDocument(rawText) {
  if (!rawText) {
    return { content: '', signature: '', hasSignature: false };
  }

  // Detecta el encabezado "Firma digital" precedido por salto de línea (\r?\n) al final del archivo
  const regex = /(?:\r?\n)Firma digital\r?\n([\s\S]*)$/i;
  const match = rawText.match(regex);

  if (match) {
    // Todo lo que está exactamente antes del salto de línea del separador es el contenido intacto
    const content = rawText.slice(0, match.index);
    const signature = match[1].trim();
    return {
      content,
      signature,
      hasSignature: true
    };
  }

  // Si el archivo empieza directamente con "Firma digital\n"
  const regexStart = /^Firma digital\r?\n([\s\S]*)$/i;
  const matchStart = rawText.match(regexStart);
  if (matchStart) {
    return {
      content: '',
      signature: matchStart[1].trim(),
      hasSignature: true
    };
  }

  return {
    content: rawText,
    signature: '',
    hasSignature: false
  };
}

/**
 * Concatena el contenido del mensaje, escribe "Firma digital", salto de línea y la firma.
 * Utiliza siempre \nFirma digital\n para que el contenido original anterior permanezca inalterado.
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

/**
 * Calcula el digesto SHA-3 (SHA3-256) de una cadena de texto o bytes UTF-8.
 * Retorna una cadena hexadecimal de 64 caracteres en minúsculas.
 */
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

/**
 * Extrae todos los enteros INTEGER codificados en ASN.1 DER
 */
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
    if (tag === 0x02) { // INTEGER
      integers.push(buf.subarray(pos, pos + length));
      pos += length;
    } else if (tag === 0x30 || tag === 0x04) { // SEQUENCE o OCTET STRING
      integers.push(...extractAsn1Integers(buf.subarray(pos, pos + length)));
      pos += length;
    } else if (tag === 0x03) { // BIT STRING
      pos++; // saltar bits no usados
      length--;
      integers.push(...extractAsn1Integers(buf.subarray(pos, pos + length)));
      pos += length;
    } else {
      pos += length;
    }
  }
  return integers;
}

/**
 * Parsea una clave privada RSA en formato PEM (soporta PKCS#8 y PKCS#1)
 */
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

/**
 * Parsea una clave pública RSA en formato PEM (soporta SPKI y PKCS#1)
 */
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

// OID estándar NIST/RFC 8017 para SHA3-256 DigestInfo en PKCS#1 v1.5:
// 30 31 30 0d 06 09 60 86 48 01 65 03 04 02 08 05 00 04 20
const SHA3_256_DIGEST_INFO_PREFIX = hexToBytes("3031300d060960864801650304020805000420");

/**
 * Firma digitalmente un texto usando RSA con el digesto SHA-3 (SHA3-256).
 * Emplea relleno estándar PKCS#1 v1.5 y exponenciación modular S = (EM)^d mod n.
 */
export async function signDataWithRsa(privateKeyPem, data) {
  const { n, d, byteLen } = parseRsaPrivateKey(privateKeyPem);
  
  // 1. Calcular digesto SHA-3 (SHA3-256)
  const hashHex = calculateSha3Hex(data);
  const hashBytes = hexToBytes(hashHex);

  // 2. Construir bloque T = DigestInfo || H
  const tBytes = new Uint8Array(SHA3_256_DIGEST_INFO_PREFIX.length + hashBytes.length);
  tBytes.set(SHA3_256_DIGEST_INFO_PREFIX, 0);
  tBytes.set(hashBytes, SHA3_256_DIGEST_INFO_PREFIX.length);

  // 3. Relleno PKCS#1 v1.5: EM = 00 01 FF ... FF 00 || T
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

  // 4. Exponenciación modular S = (EM)^d mod n
  const mBigInt = BigInt('0x' + bytesToHex(em));
  const sBigInt = modPow(mBigInt, d, n);
  const sHex = sBigInt.toString(16).padStart(byteLen * 2, '0');
  const signatureBytes = hexToBytes(sHex);

  return bytesToBase64(signatureBytes);
}

/**
 * Descifra la firma digital con la clave pública RSA (EM' = S^e mod n)
 * y extrae los 32 bytes (64 caracteres hexadecimales) correspondientes al digesto SHA-3.
 */
export function decryptRsaSignatureDigest(publicKeyPem, signatureBase64) {
  const { n, e, byteLen } = parseRsaPublicKey(publicKeyPem);
  const sigBytes = base64ToBytes(signatureBase64);
  const sBigInt = BigInt('0x' + bytesToHex(sigBytes));

  // Descifrado con clave pública: EM' = S^e mod n
  const mBigInt = modPow(sBigInt, e, n);
  const mHex = mBigInt.toString(16).padStart(byteLen * 2, '0');

  // En PKCS#1 v1.5, el digesto hash (32 bytes = 64 caracteres hex) se encuentra al final
  const decryptedDigest = mHex.slice(-64).toLowerCase();
  return decryptedDigest;
}

/**
 * Compara el digesto SHA-3 del documento (antes de la firma) con el digesto
 * descifrado de la firma digital mediante la clave pública RSA.
 */
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

  // 1. Calcular el digesto SHA-3 del documento hasta antes de la firma
  const calculatedDigest = calculateSha3Hex(content);

  // 2. Descifrar el digesto desde la firma digital con la clave pública
  const decryptedDigest = decryptRsaSignatureDigest(publicKeyPem, signatureBase64);

  // 3. Comparación explícita de digestos
  const isValid = calculatedDigest === decryptedDigest;

  return {
    isValid,
    calculatedDigest,
    decryptedDigest,
    algorithm: "SHA3-256"
  };
}

/**
 * Función de verificación retrocompatible
 */
export async function verifySignatureWithRsa(publicKeyPem, data, signatureBase64) {
  const result = await verifySignatureWithDigestComparison(publicKeyPem, data, signatureBase64);
  return result.isValid;
}


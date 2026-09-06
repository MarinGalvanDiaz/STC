// ==========================================
// UTILIDADES CRIPTOGRÁFICAS (DH + RSA 4096 + AES HELPERS)
// ==========================================

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
    p: "32317006071311007300714876688669951960444102669715484032130345427524655138867350838280567697660688724728278515655079569154519948372697841803642799521994607428310961087459524658629000310895358379462583342928986880810330231684404937665434479122793818301194912983367336244065664308602139494639522473719070217986094370277053921717629317675238467481846766940513200056812714526356082778577134275778960917363717872146844090122495343014654958537105079227968925892354201995611212902196086403441815981362977477130996051870721134999999837297804995105973173281609631859502445945534690830264252230825334468503526193118817101000313",
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
  // Si K cabe o es un número, creamos una representación hex o padded
  let hex = BigInt(kStr).toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;
  
  // Si necesitamos longitud específica (16 bytes = 32 hex chars, 32 bytes = 64 hex chars)
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
// FIRMA DIGITAL RSA 4096 BITS (Web Crypto API)
// ==========================================

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64) {
  const cleaned = base64.replace(/\s+/g, "");
  const binary = window.atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function formatPem(base64, label) {
  let pem = `-----BEGIN ${label}-----\n`;
  for (let i = 0; i < base64.length; i += 64) {
    pem += base64.slice(i, i + 64) + "\n";
  }
  pem += `-----END ${label}-----`;
  return pem;
}

function cleanPem(pem, label) {
  return pem
    .replace(new RegExp(`-----BEGIN ${label}-----`, "g"), "")
    .replace(new RegExp(`-----END ${label}-----`, "g"), "")
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, "")
    .replace(/-----END RSA PRIVATE KEY-----/g, "")
    .replace(/-----BEGIN RSA PUBLIC KEY-----/g, "")
    .replace(/-----END RSA PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");
}

/**
 * Genera un par de claves RSA de 4096 bits en formato PEM estándar
 */
export async function generateRsa4096KeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256"
    },
    true,
    ["sign", "verify"]
  );

  const exportedPrivate = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const exportedPublic = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);

  const privateKeyPem = formatPem(bufferToBase64(exportedPrivate), "PRIVATE KEY");
  const publicKeyPem = formatPem(bufferToBase64(exportedPublic), "PUBLIC KEY");

  return { privateKeyPem, publicKeyPem };
}

/**
 * Firma un texto o datos binarios usando una clave privada RSA 4096 PEM
 */
export async function signDataWithRsa(privateKeyPem, data) {
  const cleaned = cleanPem(privateKeyPem, "PRIVATE KEY");
  if (!cleaned) {
    throw new Error("La clave privada proporcionada no tiene un formato PEM válido.");
  }

  const binaryDer = base64ToBuffer(cleaned);
  const privateKey = await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const dataBuffer = typeof data === "string" 
    ? new TextEncoder().encode(data) 
    : data;

  const signature = await window.crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    dataBuffer
  );

  return bufferToBase64(signature);
}

/**
 * Verifica la firma digital de un texto o datos binarios usando una clave pública RSA 4096 PEM
 */
export async function verifySignatureWithRsa(publicKeyPem, data, signatureBase64) {
  const cleaned = cleanPem(publicKeyPem, "PUBLIC KEY");
  if (!cleaned) {
    throw new Error("La clave pública proporcionada no tiene un formato PEM válido.");
  }

  const binaryDer = base64ToBuffer(cleaned);
  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["verify"]
  );

  const signatureBuffer = base64ToBuffer(signatureBase64);
  const dataBuffer = typeof data === "string" 
    ? new TextEncoder().encode(data) 
    : data;

  return await window.crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    publicKey,
    signatureBuffer,
    dataBuffer
  );
}


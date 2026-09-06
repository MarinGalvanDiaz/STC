package com.hibrido.backend.service;

import org.springframework.stereotype.Service;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Service
public class AesCryptoService {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";

    /**
     * Cifra el contenido de un archivo .txt con AES-CBC.
     * Retorna el texto cifrado codificado en Base64 para garantizar que el archivo .txt
     * resultante sea legible y seguro contra problemas de codificación de caracteres.
     */
    public byte[] encrypt(byte[] fileBytes, String keyInput, String ivInput, boolean returnBase64) {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new IllegalArgumentException("El archivo a cifrar está vacío.");
        }

        byte[] keyBytes = parseKey(keyInput);
        byte[] ivBytes = parseIv(ivInput);

        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(keyBytes, "AES");
            IvParameterSpec ivParameterSpec = new IvParameterSpec(ivBytes);

            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, ivParameterSpec);
            byte[] cipherBytes = cipher.doFinal(fileBytes);

            if (returnBase64) {
                String base64Cipher = Base64.getEncoder().encodeToString(cipherBytes);
                return base64Cipher.getBytes(StandardCharsets.UTF_8);
            } else {
                return cipherBytes;
            }
        } catch (NoSuchAlgorithmException | NoSuchPaddingException | InvalidKeyException |
                 InvalidAlgorithmParameterException | IllegalBlockSizeException | BadPaddingException e) {
            throw new RuntimeException("Error durante el cifrado AES-CBC: " + e.getMessage(), e);
        }
    }

    /**
     * Descifra el contenido de un archivo .txt cifrado con AES-CBC.
     * Detecta automáticamente si el archivo está en formato Base64 o en bytes puros.
     */
    public byte[] decrypt(byte[] fileBytes, String keyInput, String ivInput) {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new IllegalArgumentException("El archivo a descifrar está vacío.");
        }

        byte[] keyBytes = parseKey(keyInput);
        byte[] ivBytes = parseIv(ivInput);

        // Detectar si el contenido es Base64
        byte[] cipherBytes;
        String contentStr = new String(fileBytes, StandardCharsets.UTF_8).trim();
        try {
            // Intentar decodificar como Base64 (el formato estándar generado por encrypt)
            cipherBytes = Base64.getDecoder().decode(contentStr);
        } catch (IllegalArgumentException e) {
            // Si no es Base64 válido, se asumen los bytes crudos
            cipherBytes = fileBytes;
        }

        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(keyBytes, "AES");
            IvParameterSpec ivParameterSpec = new IvParameterSpec(ivBytes);

            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, ivParameterSpec);
            return cipher.doFinal(cipherBytes);
        } catch (BadPaddingException e) {
            throw new IllegalArgumentException("Error al descifrar: La clave o el vector inicial (IV) son incorrectos, o el archivo no fue cifrado con AES-CBC PKCS5.");
        } catch (IllegalBlockSizeException e) {
            throw new IllegalArgumentException("Error al descifrar: El tamaño del bloque cifrado es inválido.");
        } catch (NoSuchAlgorithmException | NoSuchPaddingException | InvalidKeyException |
                 InvalidAlgorithmParameterException e) {
            throw new RuntimeException("Error durante el descifrado AES-CBC: " + e.getMessage(), e);
        }
    }

    /**
     * Parsea la clave AES proporcionada por el usuario.
     * Soporta:
     * 1. Claves hexadecimales de 32, 48 o 64 caracteres (16, 24 o 32 bytes).
     * 2. Cadenas de texto de exactamente 16, 24 o 32 caracteres UTF-8.
     * 3. Si no cumple exactamente esas longitudes, calcula el hash SHA-256 para obtener 32 bytes (256 bits).
     */
    public byte[] parseKey(String keyInput) {
        if (keyInput == null || keyInput.trim().isEmpty()) {
            throw new IllegalArgumentException("La llave AES no puede estar vacía.");
        }

        String cleaned = keyInput.trim();

        // 1. Si es hexadecimal y coincide con 16, 24 o 32 bytes
        if (isHexString(cleaned) && (cleaned.length() == 32 || cleaned.length() == 48 || cleaned.length() == 64)) {
            return hexToBytes(cleaned);
        }

        // 2. Si como texto tiene exactamente 16, 24 o 32 bytes UTF-8
        byte[] utf8Bytes = cleaned.getBytes(StandardCharsets.UTF_8);
        if (utf8Bytes.length == 16 || utf8Bytes.length == 24 || utf8Bytes.length == 32) {
            return utf8Bytes;
        }

        // 3. Derivación SHA-256 como fallback seguro para claves arbitrarias o números DH
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            return sha256.digest(utf8Bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("No se encontró el algoritmo SHA-256", e);
        }
    }

    /**
     * Parsea el Vector Inicial (IV).
     * Debe ser exactamente de 16 bytes (128 bits) para AES.
     */
    public byte[] parseIv(String ivInput) {
        if (ivInput == null || ivInput.trim().isEmpty()) {
            throw new IllegalArgumentException("El vector inicial (IV) no puede estar vacío.");
        }

        String cleaned = ivInput.trim();

        // Si es hexadecimal de 32 caracteres -> 16 bytes
        if (isHexString(cleaned) && cleaned.length() == 32) {
            return hexToBytes(cleaned);
        }

        byte[] utf8Bytes = cleaned.getBytes(StandardCharsets.UTF_8);
        if (utf8Bytes.length == 16) {
            return utf8Bytes;
        }

        // Si tiene longitud diferente, se ajusta a 16 bytes mediante MD5 o relleno/truncado
        try {
            MessageDigest md5 = MessageDigest.getInstance("MD5");
            return md5.digest(utf8Bytes);
        } catch (NoSuchAlgorithmException e) {
            byte[] adjusted = new byte[16];
            System.arraycopy(utf8Bytes, 0, adjusted, 0, Math.min(utf8Bytes.length, 16));
            return adjusted;
        }
    }

    private boolean isHexString(String s) {
        if (s == null || s.isEmpty() || s.length() % 2 != 0) return false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            boolean isHexChar = (c >= '0' && c <= '9') ||
                                (c >= 'a' && c <= 'f') ||
                                (c >= 'A' && c <= 'F');
            if (!isHexChar) return false;
        }
        return true;
    }

    private byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                                 + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
}


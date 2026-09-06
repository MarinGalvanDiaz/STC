package com.hibrido.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

public class AesCryptoServiceTest {

    private AesCryptoService aesCryptoService;

    @BeforeEach
    void setUp() {
        aesCryptoService = new AesCryptoService();
    }

    @Test
    void testEncryptDecrypt16ByteKey() {
        String originalText = "Este es un mensaje secreto para probar AES-CBC en un archivo .txt!";
        String key = "1234567890123456"; // 16 bytes
        String iv = "abcdefghijklmnop";  // 16 bytes

        byte[] encrypted = aesCryptoService.encrypt(originalText.getBytes(StandardCharsets.UTF_8), key, iv, true);
        assertNotNull(encrypted);
        assertTrue(encrypted.length > 0);

        byte[] decrypted = aesCryptoService.decrypt(encrypted, key, iv);
        String decryptedText = new String(decrypted, StandardCharsets.UTF_8);

        assertEquals(originalText, decryptedText);
    }

    @Test
    void testEncryptDecrypt32ByteKey() {
        String originalText = "Probando AES-256 CBC con clave de 32 bytes y caracteres acentuados: áéíóú ñ";
        String key = "12345678901234561234567890123456"; // 32 bytes
        String iv = "1234567890123456";                 // 16 bytes

        byte[] encrypted = aesCryptoService.encrypt(originalText.getBytes(StandardCharsets.UTF_8), key, iv, true);
        byte[] decrypted = aesCryptoService.decrypt(encrypted, key, iv);

        assertEquals(originalText, new String(decrypted, StandardCharsets.UTF_8));
    }

    @Test
    void testWrongKeyThrowsException() {
        String originalText = "Mensaje confidencial";
        String key = "1234567890123456";
        String iv = "1234567890123456";

        byte[] encrypted = aesCryptoService.encrypt(originalText.getBytes(StandardCharsets.UTF_8), key, iv, true);

        // Clave equivocada
        String wrongKey = "6543210987654321";
        assertThrows(IllegalArgumentException.class, () -> {
            aesCryptoService.decrypt(encrypted, wrongKey, iv);
        });
    }

    @Test
    void testHexKeyAndIv() {
        String originalText = "Prueba con Hexadecimal";
        String hexKey = "00112233445566778899aabbccddeeff"; // 16 bytes en hex
        String hexIv = "ffeeddccbbaa99887766554433221100";  // 16 bytes en hex

        byte[] encrypted = aesCryptoService.encrypt(originalText.getBytes(StandardCharsets.UTF_8), hexKey, hexIv, true);
        byte[] decrypted = aesCryptoService.decrypt(encrypted, hexKey, hexIv);

        assertEquals(originalText, new String(decrypted, StandardCharsets.UTF_8));
    }
}


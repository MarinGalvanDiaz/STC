package com.hibrido.backend.controller;

import com.hibrido.backend.service.AesCryptoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/crypto")
@CrossOrigin(origins = "*", exposedHeaders = {HttpHeaders.CONTENT_DISPOSITION})
public class CryptoController {

    private final AesCryptoService aesCryptoService;

    @Autowired
    public CryptoController(AesCryptoService aesCryptoService) {
        this.aesCryptoService = aesCryptoService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "AES-CBC Encryption Service");
        status.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(status);
    }

    /**
     * Endpoint para cifrar un archivo .txt con AES-CBC.
     */
    @PostMapping(value = "/encrypt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> encryptFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("key") String key,
            @RequestParam("iv") String iv,
            @RequestParam(value = "format", defaultValue = "base64") String format
    ) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("Debe proporcionar un archivo .txt no vacío.");
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.trim().isEmpty()) {
                originalFilename = "archivo.txt";
            }

            boolean returnBase64 = !"raw".equalsIgnoreCase(format);
            byte[] encryptedBytes = aesCryptoService.encrypt(file.getBytes(), key, iv, returnBase64);

            String downloadFilename = "cifrado_" + originalFilename;
            if (!downloadFilename.toLowerCase().endsWith(".txt")) {
                downloadFilename += ".txt";
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadFilename + "\"")
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(encryptedBytes);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al leer el archivo subido: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error interno durante el cifrado: " + e.getMessage());
        }
    }

    /**
     * Endpoint para descifrar un archivo .txt con AES-CBC.
     */
    @PostMapping(value = "/decrypt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> decryptFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("key") String key,
            @RequestParam("iv") String iv
    ) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body("Debe proporcionar un archivo .txt no vacío.");
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.trim().isEmpty()) {
                originalFilename = "archivo_descifrado.txt";
            }

            byte[] decryptedBytes = aesCryptoService.decrypt(file.getBytes(), key, iv);

            String downloadFilename = originalFilename.startsWith("cifrado_")
                    ? originalFilename.replaceFirst("cifrado_", "descifrado_")
                    : "descifrado_" + originalFilename;

            if (!downloadFilename.toLowerCase().endsWith(".txt")) {
                downloadFilename += ".txt";
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadFilename + "\"")
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(decryptedBytes);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al leer el archivo subido: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error interno durante el descifrado: " + e.getMessage());
        }
    }
}


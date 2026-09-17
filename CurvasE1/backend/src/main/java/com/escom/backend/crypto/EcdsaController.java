package com.escom.backend.crypto;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/ecdsa")
@CrossOrigin(origins = "http://localhost:5173")
public class EcdsaController {
    private final EcdsaService ecdsaService;

    public EcdsaController(EcdsaService ecdsaService) {
        this.ecdsaService = ecdsaService;
    }

    @GetMapping("/keys")
    public KeyPairResponse keys() {
        return ecdsaService.getKeys();
    }

    @PostMapping("/sign")
    public SignResponse sign(@RequestBody SignRequest request) {
        try {
            return ecdsaService.sign(request.message());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage(), exception);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No fue posible generar la firma.", exception);
        }
    }

    @PostMapping("/verify")
    public VerifyResponse verify(@RequestBody VerifyRequest request) {
        try {
            return ecdsaService.verify(request.message(), request.signature(), request.publicKey());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos criptográficos no tienen un formato válido.", exception);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No fue posible validar la firma.", exception);
        }
    }

    @PostMapping(value = "/sign-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> signFile(@RequestPart("file") MultipartFile file) {
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            String signedContent = ecdsaService.signTextFile(content);
            String filename = file.getOriginalFilename() == null ? "firmado.txt" : file.getOriginalFilename();
            if (!filename.toLowerCase().endsWith(".txt")) {
                filename += ".txt";
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"firmado-" + filename + "\"")
                    .header("X-ECDSA-Algorithm", "SHA256withECDSA")
                    .header("X-ECDSA-Curve", "secp256r1")
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(signedContent.getBytes(StandardCharsets.UTF_8));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage(), exception);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No fue posible firmar el archivo.", exception);
        }
    }

    @PostMapping(value = "/verify-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public VerifyResponse verifyFile(@RequestPart("file") MultipartFile file) {
        try {
            return ecdsaService.verifyTextFile(new String(file.getBytes(), StandardCharsets.UTF_8));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage(), exception);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No fue posible validar el archivo.", exception);
        }
    }
}

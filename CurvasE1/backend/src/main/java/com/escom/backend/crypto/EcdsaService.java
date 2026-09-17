package com.escom.backend.crypto;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Service
public class EcdsaService {
    private static final String ALGORITHM = "SHA256withECDSA";
    private static final String CURVE = "secp256r1";
    private static final String SIGNATURE_MARKER = "--- FIRMA ECDSA ---";

    private final KeyPair keyPair;

    public EcdsaService() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new java.security.spec.ECGenParameterSpec(CURVE));
        this.keyPair = generator.generateKeyPair();
    }

    public SignResponse sign(String message) throws Exception {
        requireText(message, "El mensaje es obligatorio.");

        Signature signer = Signature.getInstance(ALGORITHM);
        signer.initSign(keyPair.getPrivate());
        signer.update(message.getBytes(StandardCharsets.UTF_8));

        return new SignResponse(
                ALGORITHM,
                CURVE,
                message,
                Base64.getEncoder().encodeToString(signer.sign()),
                publicKeyPem(keyPair.getPublic())
        );
    }

    public VerifyResponse verify(String message, String signatureBase64, String publicKeyPem) throws Exception {
        requireText(message, "El mensaje es obligatorio.");
        requireText(signatureBase64, "La firma es obligatoria.");
        requireText(publicKeyPem, "La clave pública es obligatoria.");

        PublicKey publicKey = decodePublicKey(publicKeyPem);
        Signature verifier = Signature.getInstance(ALGORITHM);
        verifier.initVerify(publicKey);
        verifier.update(message.getBytes(StandardCharsets.UTF_8));

        boolean valid = verifier.verify(Base64.getDecoder().decode(signatureBase64));
        return new VerifyResponse(valid, valid ? "La firma es válida." : "La firma no coincide con el mensaje.", signatureBase64);
    }

    public KeyPairResponse getKeys() {
        return new KeyPairResponse(
                ALGORITHM,
                CURVE,
                privateKeyPem(keyPair),
                publicKeyPem(keyPair.getPublic()),
                "Demostración educativa: nunca expongas la clave privada en una aplicación real."
        );
    }

    public String signTextFile(String content) throws Exception {
        requireText(content, "El archivo TXT está vacío.");
        String signature = createSignature(content);
        return content + "\n"
                + SIGNATURE_MARKER + "\n"
                + "Algoritmo: " + ALGORITHM + "\n"
                + "Curva: " + CURVE + "\n"
                + "Firma: " + signature + "\n";
    }

    public VerifyResponse verifyTextFile(String signedContent) throws Exception {
        requireText(signedContent, "El archivo TXT está vacío.");

        int markerIndex = signedContent.lastIndexOf(SIGNATURE_MARKER);
        if (markerIndex < 0) {
            throw new IllegalArgumentException("El archivo no contiene una firma ECDSA.");
        }

        String originalContent = signedContent.substring(0, markerIndex);
        if (originalContent.endsWith("\n")) {
            originalContent = originalContent.substring(0, originalContent.length() - 1);
        }

        String signature = extractSignature(signedContent.substring(markerIndex));
        Signature verifier = Signature.getInstance(ALGORITHM);
        verifier.initVerify(keyPair.getPublic());
        verifier.update(originalContent.getBytes(StandardCharsets.UTF_8));

        boolean valid = verifier.verify(Base64.getDecoder().decode(signature));
        return new VerifyResponse(valid,
                valid ? "La firma del archivo es válida." : "El archivo fue alterado o la firma no corresponde.",
                signature);
    }

    private String createSignature(String message) throws Exception {
        Signature signer = Signature.getInstance(ALGORITHM);
        signer.initSign(keyPair.getPrivate());
        signer.update(message.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(signer.sign());
    }

    private String extractSignature(String signatureBlock) {
        for (String line : signatureBlock.split("\\R")) {
            if (line.startsWith("Firma: ")) {
                String signature = line.substring("Firma: ".length()).trim();
                requireText(signature, "La firma del archivo está vacía.");
                return signature;
            }
        }
        throw new IllegalArgumentException("No se encontró la firma dentro del archivo.");
    }

    private PublicKey decodePublicKey(String pem) throws Exception {
        String encoded = pem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");
        return KeyFactory.getInstance("EC").generatePublic(
                new X509EncodedKeySpec(Base64.getDecoder().decode(encoded))
        );
    }

    private String publicKeyPem(PublicKey publicKey) {
        String encoded = Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.UTF_8))
                .encodeToString(publicKey.getEncoded());
        return "-----BEGIN PUBLIC KEY-----\n" + encoded + "\n-----END PUBLIC KEY-----";
    }

    private String privateKeyPem(KeyPair pair) {
        String encoded = Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.UTF_8))
                .encodeToString(pair.getPrivate().getEncoded());
        return "-----BEGIN PRIVATE KEY-----\n" + encoded + "\n-----END PRIVATE KEY-----";
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}

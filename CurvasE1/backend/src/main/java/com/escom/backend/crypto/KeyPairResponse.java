package com.escom.backend.crypto;

public record KeyPairResponse(
        String algorithm,
        String curve,
        String privateKey,
        String publicKey,
        String warning
) {
}

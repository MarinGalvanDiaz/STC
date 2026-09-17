package com.escom.backend.crypto;

public record VerifyRequest(String message, String signature, String publicKey) {
}

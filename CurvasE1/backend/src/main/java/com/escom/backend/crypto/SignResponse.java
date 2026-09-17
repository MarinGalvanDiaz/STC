package com.escom.backend.crypto;

public record SignResponse(String algorithm, String curve, String message, String signature, String publicKey) {
}

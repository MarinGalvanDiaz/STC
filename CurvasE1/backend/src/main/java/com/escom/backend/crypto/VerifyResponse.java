package com.escom.backend.crypto;

public record VerifyResponse(boolean valid, String message, String signature) {
}

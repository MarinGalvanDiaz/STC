package com.escom.backend.model;

public class EntityKeyPair {
    private String entity;          // "Alice", "Bob", "Candy" o usuario
    private String privateKeyHex;    // Escalar d (secreto)
    private String publicKeyHex;     // Punto Q (uncompressed 04 + X + Y)
    private String pointX;           // Coordenada X
    private String pointY;           // Coordenada Y
    private String pemFormat;        // Llave en formato legible
    private long generationTimeNanos;
    private double generationTimeMs;

    public EntityKeyPair() {}

    public EntityKeyPair(String entity, String privateKeyHex, String publicKeyHex,
                         String pointX, String pointY, String pemFormat) {
        this.entity = entity;
        this.privateKeyHex = privateKeyHex;
        this.publicKeyHex = publicKeyHex;
        this.pointX = pointX;
        this.pointY = pointY;
        this.pemFormat = pemFormat;
    }

    public EntityKeyPair(String entity, String privateKeyHex, String publicKeyHex,
                         String pointX, String pointY, String pemFormat,
                         long generationTimeNanos, double generationTimeMs) {
        this.entity = entity;
        this.privateKeyHex = privateKeyHex;
        this.publicKeyHex = publicKeyHex;
        this.pointX = pointX;
        this.pointY = pointY;
        this.pemFormat = pemFormat;
        this.generationTimeNanos = generationTimeNanos;
        this.generationTimeMs = generationTimeMs;
    }

    public String getEntity() { return entity; }
    public void setEntity(String entity) { this.entity = entity; }

    public String getPrivateKeyHex() { return privateKeyHex; }
    public void setPrivateKeyHex(String privateKeyHex) { this.privateKeyHex = privateKeyHex; }

    public String getPublicKeyHex() { return publicKeyHex; }
    public void setPublicKeyHex(String publicKeyHex) { this.publicKeyHex = publicKeyHex; }

    public String getPointX() { return pointX; }
    public void setPointX(String pointX) { this.pointX = pointX; }

    public String getPointY() { return pointY; }
    public void setPointY(String pointY) { this.pointY = pointY; }

    public String getPemFormat() { return pemFormat; }
    public void setPemFormat(String pemFormat) { this.pemFormat = pemFormat; }

    public long getGenerationTimeNanos() { return generationTimeNanos; }
    public void setGenerationTimeNanos(long generationTimeNanos) { this.generationTimeNanos = generationTimeNanos; }

    public double getGenerationTimeMs() { return generationTimeMs; }
    public void setGenerationTimeMs(double generationTimeMs) { this.generationTimeMs = generationTimeMs; }
}

package com.escom.backend.model;

public class FinalSharedKey {
    private String entity;          // "Alice", "Bob", "Candy"
    private String formula;         // ej: "K_A = a * Z_CB = a * (bcG) = abcG"
    private String finalPointX;     // Coordenada X del punto abcG
    private String finalPointY;     // Coordenada Y del punto abcG
    private String derivedKeyHex;   // SHA-256(X) en formato Hexadecimal (clave simétrica compartida)
    private String derivedKeyBase64;// Formato Base64
    private long computationTimeNanos; // Tiempo de cálculo en nanosegundos

    public FinalSharedKey() {}

    public FinalSharedKey(String entity, String formula, String finalPointX,
                          String finalPointY, String derivedKeyHex, String derivedKeyBase64,
                          long computationTimeNanos) {
        this.entity = entity;
        this.formula = formula;
        this.finalPointX = finalPointX;
        this.finalPointY = finalPointY;
        this.derivedKeyHex = derivedKeyHex;
        this.derivedKeyBase64 = derivedKeyBase64;
        this.computationTimeNanos = computationTimeNanos;
    }

    public String getEntity() { return entity; }
    public void setEntity(String entity) { this.entity = entity; }

    public String getFormula() { return formula; }
    public void setFormula(String formula) { this.formula = formula; }

    public String getFinalPointX() { return finalPointX; }
    public void setFinalPointX(String finalPointX) { this.finalPointX = finalPointX; }

    public String getFinalPointY() { return finalPointY; }
    public void setFinalPointY(String finalPointY) { this.finalPointY = finalPointY; }

    public String getDerivedKeyHex() { return derivedKeyHex; }
    public void setDerivedKeyHex(String derivedKeyHex) { this.derivedKeyHex = derivedKeyHex; }

    public String getDerivedKeyBase64() { return derivedKeyBase64; }
    public void setDerivedKeyBase64(String derivedKeyBase64) { this.derivedKeyBase64 = derivedKeyBase64; }

    public long getComputationTimeNanos() { return computationTimeNanos; }
    public void setComputationTimeNanos(long computationTimeNanos) { this.computationTimeNanos = computationTimeNanos; }
}

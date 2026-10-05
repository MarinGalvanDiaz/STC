package com.escom.backend.model;

public class CalculationResult {
    private String curveId;
    private String pointX;
    private String pointY;
    private String uncompressedHex;
    private String derivedKeySha256Hex;
    private String derivedKeyBase64;
    private long computationTimeNanos;
    private double computationTimeMs;

    public CalculationResult() {}

    public CalculationResult(String curveId, String pointX, String pointY,
                             String uncompressedHex, String derivedKeySha256Hex,
                             String derivedKeyBase64, long computationTimeNanos,
                             double computationTimeMs) {
        this.curveId = curveId;
        this.pointX = pointX;
        this.pointY = pointY;
        this.uncompressedHex = uncompressedHex;
        this.derivedKeySha256Hex = derivedKeySha256Hex;
        this.derivedKeyBase64 = derivedKeyBase64;
        this.computationTimeNanos = computationTimeNanos;
        this.computationTimeMs = computationTimeMs;
    }

    public String getCurveId() { return curveId; }
    public void setCurveId(String curveId) { this.curveId = curveId; }

    public String getPointX() { return pointX; }
    public void setPointX(String pointX) { this.pointX = pointX; }

    public String getPointY() { return pointY; }
    public void setPointY(String pointY) { this.pointY = pointY; }

    public String getUncompressedHex() { return uncompressedHex; }
    public void setUncompressedHex(String uncompressedHex) { this.uncompressedHex = uncompressedHex; }

    public String getDerivedKeySha256Hex() { return derivedKeySha256Hex; }
    public void setDerivedKeySha256Hex(String derivedKeySha256Hex) { this.derivedKeySha256Hex = derivedKeySha256Hex; }

    public String getDerivedKeyBase64() { return derivedKeyBase64; }
    public void setDerivedKeyBase64(String derivedKeyBase64) { this.derivedKeyBase64 = derivedKeyBase64; }

    public long getComputationTimeNanos() { return computationTimeNanos; }
    public void setComputationTimeNanos(long computationTimeNanos) { this.computationTimeNanos = computationTimeNanos; }

    public double getComputationTimeMs() { return computationTimeMs; }
    public void setComputationTimeMs(double computationTimeMs) { this.computationTimeMs = computationTimeMs; }
}

package com.escom.backend.model;

public class IntermediateKey {
    private String calculatedBy;   // Quien lo calculó (ej: "Alice")
    private String usedPeer;        // Clave de quién usó (ej: "Candy (C)")
    private String formula;         // ej: "Z_AC = a * C = a * c * G"
    private String targetRecipient; // A quién se envía por USB (ej: "Bob")
    private String pointX;
    private String pointY;
    private String uncompressedHex;

    public IntermediateKey() {}

    public IntermediateKey(String calculatedBy, String usedPeer, String formula,
                           String targetRecipient, String pointX, String pointY,
                           String uncompressedHex) {
        this.calculatedBy = calculatedBy;
        this.usedPeer = usedPeer;
        this.formula = formula;
        this.targetRecipient = targetRecipient;
        this.pointX = pointX;
        this.pointY = pointY;
        this.uncompressedHex = uncompressedHex;
    }

    public String getCalculatedBy() { return calculatedBy; }
    public void setCalculatedBy(String calculatedBy) { this.calculatedBy = calculatedBy; }

    public String getUsedPeer() { return usedPeer; }
    public void setUsedPeer(String usedPeer) { this.usedPeer = usedPeer; }

    public String getFormula() { return formula; }
    public void setFormula(String formula) { this.formula = formula; }

    public String getTargetRecipient() { return targetRecipient; }
    public void setTargetRecipient(String targetRecipient) { this.targetRecipient = targetRecipient; }

    public String getPointX() { return pointX; }
    public void setPointX(String pointX) { this.pointX = pointX; }

    public String getPointY() { return pointY; }
    public void setPointY(String pointY) { this.pointY = pointY; }

    public String getUncompressedHex() { return uncompressedHex; }
    public void setUncompressedHex(String uncompressedHex) { this.uncompressedHex = uncompressedHex; }
}

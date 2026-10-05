package com.escom.backend.model;

public class CurveInfo {
    private String id;
    private String name;
    private String standardName;
    private int securityBits;
    private String rsaEquivalent;
    private String aesEquivalent;
    private String fieldType;
    private String keySize;
    private String oid;
    private String equation;
    private String justification;

    public CurveInfo() {}

    public CurveInfo(String id, String name, String standardName, int securityBits,
                     String rsaEquivalent, String aesEquivalent, String fieldType,
                     String keySize, String oid, String equation, String justification) {
        this.id = id;
        this.name = name;
        this.standardName = standardName;
        this.securityBits = securityBits;
        this.rsaEquivalent = rsaEquivalent;
        this.aesEquivalent = aesEquivalent;
        this.fieldType = fieldType;
        this.keySize = keySize;
        this.oid = oid;
        this.equation = equation;
        this.justification = justification;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getStandardName() { return standardName; }
    public void setStandardName(String standardName) { this.standardName = standardName; }

    public int getSecurityBits() { return securityBits; }
    public void setSecurityBits(int securityBits) { this.securityBits = securityBits; }

    public String getRsaEquivalent() { return rsaEquivalent; }
    public void setRsaEquivalent(String rsaEquivalent) { this.rsaEquivalent = rsaEquivalent; }

    public String getAesEquivalent() { return aesEquivalent; }
    public void setAesEquivalent(String aesEquivalent) { this.aesEquivalent = aesEquivalent; }

    public String getFieldType() { return fieldType; }
    public void setFieldType(String fieldType) { this.fieldType = fieldType; }

    public String getKeySize() { return keySize; }
    public void setKeySize(String keySize) { this.keySize = keySize; }

    public String getOid() { return oid; }
    public void setOid(String oid) { this.oid = oid; }

    public String getEquation() { return equation; }
    public void setEquation(String equation) { this.equation = equation; }

    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }
}

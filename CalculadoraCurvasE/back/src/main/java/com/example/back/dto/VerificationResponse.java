package com.example.back.dto;

import java.math.BigInteger;

public class VerificationResponse {
    private String substitutedFormula;
    private BigInteger deltaValue;
    private boolean isNonSingular;
    private String message;

    public VerificationResponse(String substitutedFormula, BigInteger deltaValue, boolean isNonSingular, String message) {
        this.substitutedFormula = substitutedFormula;
        this.deltaValue = deltaValue;
        this.isNonSingular = isNonSingular;
        this.message = message;
    }

    public String getSubstitutedFormula() { return substitutedFormula; }
    public BigInteger getDeltaValue() { return deltaValue; }
    public boolean isNonSingular() { return isNonSingular; }
    public String getMessage() { return message; }
}
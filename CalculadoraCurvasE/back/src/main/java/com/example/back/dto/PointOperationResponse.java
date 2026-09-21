package com.example.back.dto;

public class PointOperationResponse {
    private final String operation;
    private final String formula;
    private final EllipticPoint result;

    public PointOperationResponse(String operation, String formula, EllipticPoint result) {
        this.operation = operation;
        this.formula = formula;
        this.result = result;
    }

    public String getOperation() {
        return operation;
    }

    public String getFormula() {
        return formula;
    }

    public EllipticPoint getResult() {
        return result;
    }
}

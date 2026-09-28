package com.example.back.dto;

import java.math.BigInteger;
import java.util.List;

public class CurveAnalysisResponse {

    private String substitutedFormula;
    private BigInteger deltaValue;
    private boolean isNonSingular;
    private String message;

    // 3.a y 3.b: Puntos y cardinalidad
    private List<EllipticPoint> points;
    private int cardinality;

    // 3.d: Tabla de suma de puntos
    private List<AdditionTableRow> additionTable;

    // 3.e: Tabla de multiplicación escalar
    private List<Integer> scalarHeaders;
    private List<ScalarTableRow> scalarMultiplicationTable;

    // 3.f: Puntos generadores
    private List<EllipticPoint> generators;

    public CurveAnalysisResponse(
            String substitutedFormula,
            BigInteger deltaValue,
            boolean isNonSingular,
            String message,
            List<EllipticPoint> points,
            int cardinality,
            List<AdditionTableRow> additionTable,
            List<Integer> scalarHeaders,
            List<ScalarTableRow> scalarMultiplicationTable,
            List<EllipticPoint> generators) {
        this.substitutedFormula = substitutedFormula;
        this.deltaValue = deltaValue;
        this.isNonSingular = isNonSingular;
        this.message = message;
        this.points = points;
        this.cardinality = cardinality;
        this.additionTable = additionTable;
        this.scalarHeaders = scalarHeaders;
        this.scalarMultiplicationTable = scalarMultiplicationTable;
        this.generators = generators;
    }

    public String getSubstitutedFormula() { return substitutedFormula; }
    public BigInteger getDeltaValue() { return deltaValue; }
    public boolean isNonSingular() { return isNonSingular; }
    public String getMessage() { return message; }
    public List<EllipticPoint> getPoints() { return points; }
    public int getCardinality() { return cardinality; }
    public List<AdditionTableRow> getAdditionTable() { return additionTable; }
    public List<Integer> getScalarHeaders() { return scalarHeaders; }
    public List<ScalarTableRow> getScalarMultiplicationTable() { return scalarMultiplicationTable; }
    public List<EllipticPoint> getGenerators() { return generators; }
}
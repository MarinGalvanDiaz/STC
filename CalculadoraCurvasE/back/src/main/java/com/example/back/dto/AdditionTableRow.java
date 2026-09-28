package com.example.back.dto;

import java.util.List;

public class AdditionTableRow {

    private EllipticPoint rowPoint;
    private List<EllipticPoint> results;

    public AdditionTableRow(EllipticPoint rowPoint, List<EllipticPoint> results) {
        this.rowPoint = rowPoint;
        this.results = results;
    }

    public EllipticPoint getRowPoint() {
        return rowPoint;
    }

    public List<EllipticPoint> getResults() {
        return results;
    }
}
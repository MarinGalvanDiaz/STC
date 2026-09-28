package com.example.back.dto;

import java.util.List;

public class ScalarTableRow {

    private EllipticPoint basePoint;
    private List<EllipticPoint> multiples;
    private int order;
    private boolean generator;

    public ScalarTableRow(EllipticPoint basePoint, List<EllipticPoint> multiples, int order, boolean generator) {
        this.basePoint = basePoint;
        this.multiples = multiples;
        this.order = order;
        this.generator = generator;
    }

    public EllipticPoint getBasePoint() {
        return basePoint;
    }

    public List<EllipticPoint> getMultiples() {
        return multiples;
    }

    public int getOrder() {
        return order;
    }

    public boolean isGenerator() {
        return generator;
    }
}
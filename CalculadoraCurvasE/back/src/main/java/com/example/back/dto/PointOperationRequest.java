package com.example.back.dto;

import java.math.BigInteger;

public class PointOperationRequest {

    private String operation; // "SUM", "DOUBLE", "SCALAR"
    private BigInteger a;
    private BigInteger b;
    private BigInteger n; // Módulo p
    private EllipticPoint p;
    private EllipticPoint q;
    private BigInteger k; // Escalar para k * P

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public BigInteger getA() {
        return a;
    }

    public void setA(BigInteger a) {
        this.a = a;
    }

    public BigInteger getB() {
        return b;
    }

    public void setB(BigInteger b) {
        this.b = b;
    }

    public BigInteger getN() {
        return n;
    }

    public void setN(BigInteger n) {
        this.n = n;
    }

    public EllipticPoint getP() {
        return p;
    }

    public void setP(EllipticPoint p) {
        this.p = p;
    }

    public EllipticPoint getQ() {
        return q;
    }

    public void setQ(EllipticPoint q) {
        this.q = q;
    }

    public BigInteger getK() {
        return k;
    }

    public void setK(BigInteger k) {
        this.k = k;
    }
}
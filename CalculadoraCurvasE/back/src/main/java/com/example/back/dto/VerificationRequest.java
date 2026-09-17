package com.example.back.dto;

import java.math.BigInteger;

public class VerificationRequest {
    private String signA; // "+" o "-"
    private BigInteger a;
    private BigInteger b;
    private BigInteger p;

    public String getSignA() { return signA; }
    public void setSignA(String signA) { this.signA = signA; }
    public BigInteger getA() { return a; }
    public void setA(BigInteger a) { this.a = a; }
    public BigInteger getB() { return b; }
    public void setB(BigInteger b) { this.b = b; }
    public BigInteger getP() { return p; }
    public void setP(BigInteger p) { this.p = p; }
}
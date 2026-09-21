package com.example.back.dto;

import java.math.BigInteger;

public class EllipticPoint {
    private BigInteger x;
    private BigInteger y;
    private boolean infinity;

    public EllipticPoint() {
    }

    public EllipticPoint(BigInteger x, BigInteger y) {
        this.x = x;
        this.y = y;
        this.infinity = false;
    }

    public static EllipticPoint infinity() {
        EllipticPoint point = new EllipticPoint();
        point.infinity = true;
        return point;
    }

    public BigInteger getX() {
        return x;
    }

    public void setX(BigInteger x) {
        this.x = x;
    }

    public BigInteger getY() {
        return y;
    }

    public void setY(BigInteger y) {
        this.y = y;
    }

    public boolean isInfinity() {
        return infinity;
    }

    public void setInfinity(boolean infinity) {
        this.infinity = infinity;
    }
}

package com.example.back.dto;

import java.math.BigInteger;
import java.util.Objects;

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

    public String getLabel() {
        return infinity ? "O" : "(" + x + ", " + y + ")";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        EllipticPoint that = (EllipticPoint) o;
        if (infinity && that.infinity) return true;
        if (infinity != that.infinity) return false;
        return Objects.equals(x, that.x) && Objects.equals(y, that.y);
    }

    @Override
    public int hashCode() {
        return infinity ? Objects.hash(true) : Objects.hash(false, x, y);
    }

    @Override
    public String toString() {
        return getLabel();
    }
}
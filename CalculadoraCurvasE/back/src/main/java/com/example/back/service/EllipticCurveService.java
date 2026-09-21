package com.example.back.service;

import com.example.back.dto.VerificationRequest;
import com.example.back.dto.VerificationResponse;
import com.example.back.dto.EllipticPoint;
import com.example.back.dto.PointOperationRequest;
import com.example.back.dto.PointOperationResponse;
import org.springframework.stereotype.Service;
import java.math.BigInteger;

@Service
public class EllipticCurveService {

    public VerificationResponse verifyNonSingularity(VerificationRequest request) {
        BigInteger rawA = request.getA();
        BigInteger effectiveA = "-".equals(request.getSignA()) ? rawA.negate() : rawA;
        BigInteger b = request.getB();
        BigInteger p = request.getP();

        // 4 * a^3 + 27 * b^2
        BigInteger aCubed = effectiveA.pow(3);
        BigInteger term1 = BigInteger.valueOf(4).multiply(aCubed);

        BigInteger bSquared = b.pow(2);
        BigInteger term2 = BigInteger.valueOf(27).multiply(bSquared);

        BigInteger sumDelta = term1.add(term2);

        // Módulo p (manejando correctamente números negativos)
        BigInteger deltaModP = sumDelta.mod(p);

        String signAStr = "-".equals(request.getSignA()) ? "-" : "";
        String substituted = String.format("Δ = 4(%s%s)³ + 27(%s)² mod %s",
                signAStr, rawA.toString(), b.toString(), p.toString());

        boolean isNonSingular = !deltaModP.equals(BigInteger.ZERO);
        String resultMessage = isNonSingular
                ? "Curva elíptica VERIFICADA, ES NO SINGULAR"
                : "La curva elíptica ES SINGULAR";

        return new VerificationResponse(substituted, deltaModP, isNonSingular, resultMessage);
    }

    public PointOperationResponse calculatePointOperation(PointOperationRequest request) {
        BigInteger a = requireValue(request.getA(), "a");
        BigInteger b = requireValue(request.getB(), "b");
        BigInteger n = requireValue(request.getN(), "n");
        if (n.compareTo(BigInteger.ONE) <= 0) {
            throw new IllegalArgumentException("El módulo n debe ser mayor que 1");
        }

        String operation = request.getOperation() == null
                ? ""
                : request.getOperation().trim().toUpperCase();
        if ("SUM".equals(operation) || "SUMA".equals(operation)) {
            EllipticPoint result = addPoints(request.getP(), requirePoint(request.getQ(), "Q"), a, b, n);
            return new PointOperationResponse("SUM", "P + Q mod " + n, result);
        }
        if ("DOUBLE".equals(operation) || "DOBLE".equals(operation) || "DOBLAR".equals(operation)) {
            EllipticPoint result = doublePoint(requirePoint(request.getP(), "P"), a, b, n);
            return new PointOperationResponse("DOUBLE", "2P mod " + n, result);
        }
        throw new IllegalArgumentException("La operación debe ser SUM o DOUBLE");
    }

    private EllipticPoint addPoints(EllipticPoint p, EllipticPoint q,
                                    BigInteger a, BigInteger b, BigInteger n) {
        validatePoint(p, "P", a, b, n);
        validatePoint(q, "Q", a, b, n);
        if (p.isInfinity()) {
            return normalizedPoint(q, n);
        }
        if (q.isInfinity()) {
            return normalizedPoint(p, n);
        }

        BigInteger x1 = p.getX().mod(n);
        BigInteger y1 = p.getY().mod(n);
        BigInteger x2 = q.getX().mod(n);
        BigInteger y2 = q.getY().mod(n);
        BigInteger denominator = x2.subtract(x1).mod(n);

        if (denominator.equals(BigInteger.ZERO)) {
            if (y1.add(y2).mod(n).equals(BigInteger.ZERO)) {
                return EllipticPoint.infinity();
            }
            throw new IllegalArgumentException("La suma no está definida: el denominador no tiene inverso módulo n");
        }

        BigInteger slope = modularQuotient(y2.subtract(y1), denominator, n);
        return pointFromSlope(slope, x1, y1, x2, n);
    }

    private EllipticPoint doublePoint(EllipticPoint p, BigInteger a, BigInteger b, BigInteger n) {
        validatePoint(p, "P", a, b, n);
        if (p.isInfinity()) {
            return p;
        }

        BigInteger x = p.getX().mod(n);
        BigInteger y = p.getY().mod(n);
        BigInteger denominator = y.multiply(BigInteger.TWO).mod(n);
        if (denominator.equals(BigInteger.ZERO)) {
            return EllipticPoint.infinity();
        }

        BigInteger numerator = BigInteger.valueOf(3).multiply(x.pow(2)).add(a);
        BigInteger slope = modularQuotient(numerator, denominator, n);
        return pointFromSlope(slope, x, y, x, n);
    }

    private EllipticPoint pointFromSlope(BigInteger slope, BigInteger x1, BigInteger y1,
                                         BigInteger x2, BigInteger n) {
        BigInteger x3 = slope.pow(2).subtract(x1).subtract(x2).mod(n);
        BigInteger y3 = slope.multiply(x1.subtract(x3)).subtract(y1).mod(n);
        return new EllipticPoint(x3, y3);
    }

    private EllipticPoint normalizedPoint(EllipticPoint point, BigInteger n) {
        if (point.isInfinity()) {
            return EllipticPoint.infinity();
        }
        return new EllipticPoint(point.getX().mod(n), point.getY().mod(n));
    }

    private BigInteger modularQuotient(BigInteger numerator, BigInteger denominator, BigInteger n) {
        try {
            return numerator.multiply(denominator.modInverse(n)).mod(n);
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException(
                    "La operación no está definida: el denominador no tiene inverso módulo n", exception);
        }
    }

    private void validatePoint(EllipticPoint point, String name, BigInteger a, BigInteger b, BigInteger n) {
        if (point == null) {
            throw new IllegalArgumentException("El punto " + name + " es obligatorio");
        }
        if (point.isInfinity()) {
            return;
        }
        if (point.getX() == null || point.getY() == null) {
            throw new IllegalArgumentException("El punto " + name + " debe contener x e y");
        }
        BigInteger x = point.getX().mod(n);
        BigInteger y = point.getY().mod(n);
        BigInteger left = y.pow(2).mod(n);
        BigInteger right = x.pow(3).add(a.multiply(x)).add(b).mod(n);
        if (!left.equals(right)) {
            throw new IllegalArgumentException("El punto " + name + " no pertenece a la curva");
        }
    }

    private EllipticPoint requirePoint(EllipticPoint point, String name) {
        if (point == null) {
            throw new IllegalArgumentException("El punto " + name + " es obligatorio");
        }
        return point;
    }

    private BigInteger requireValue(BigInteger value, String name) {
        if (value == null) {
            throw new IllegalArgumentException("El valor " + name + " es obligatorio");
        }
        return value;
    }
}
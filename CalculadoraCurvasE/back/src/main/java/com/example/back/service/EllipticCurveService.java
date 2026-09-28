package com.example.back.service;

import com.example.back.dto.*;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.util.*;

@Service
public class EllipticCurveService {

    // Requerimiento 2: Validar la curva elíptica
    public VerificationResponse verifyNonSingularity(VerificationRequest request) {
        BigInteger rawA = requireValue(request.getA(), "a");
        BigInteger effectiveA = "-".equals(request.getSignA()) ? rawA.negate() : rawA;
        BigInteger b = requireValue(request.getB(), "b");
        BigInteger p = requireValue(request.getP(), "p");

        if (p.compareTo(BigInteger.valueOf(3)) <= 0 || !p.isProbablePrime(20)) {
            throw new IllegalArgumentException("El módulo p debe ser un número primo mayor que 3");
        }

        // Delta = 4 * a^3 + 27 * b^2 mod p
        BigInteger aCubed = effectiveA.pow(3);
        BigInteger term1 = BigInteger.valueOf(4).multiply(aCubed);
        BigInteger bSquared = b.pow(2);
        BigInteger term2 = BigInteger.valueOf(27).multiply(bSquared);
        BigInteger sumDelta = term1.add(term2);
        BigInteger deltaModP = sumDelta.mod(p);

        String signAStr = "-".equals(request.getSignA()) ? "-" : "";
        String substituted = String.format("Δ = 4(%s%s)³ + 27(%s)² mod %s",
                signAStr, rawA.toString(), b.toString(), p.toString());

        boolean isNonSingular = !deltaModP.equals(BigInteger.ZERO);
        String resultMessage = isNonSingular
                ? "Curva elíptica VERIFICADA, ES NO SINGULAR"
                : "La curva elíptica ES SINGULAR (Δ ≡ 0 mod p)";

        return new VerificationResponse(substituted, deltaModP, isNonSingular, resultMessage);
    }

    // Requerimiento 2 y 3 (a, b, d, e, f): Análisis completo de la curva validada
    public CurveAnalysisResponse analyzeCurve(VerificationRequest request) {
        VerificationResponse verification = verifyNonSingularity(request);

        if (!verification.isNonSingular()) {
            return new CurveAnalysisResponse(
                    verification.getSubstitutedFormula(),
                    verification.getDeltaValue(),
                    false,
                    verification.getMessage(),
                    Collections.emptyList(),
                    0,
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyList()
            );
        }

        BigInteger rawA = request.getA();
        BigInteger effectiveA = "-".equals(request.getSignA()) ? rawA.negate().mod(request.getP()) : rawA.mod(request.getP());
        BigInteger b = request.getB().mod(request.getP());
        BigInteger p = request.getP();

        // 3.a: Calcular todos los puntos de la curva (incluyendo el punto al infinito O)
        List<EllipticPoint> points = calculateCurvePoints(effectiveA, b, p);

        // 3.b: Cardinalidad de la curva (#E(Fp))
        int cardinality = points.size();

        // 3.d: Tabla de suma de puntos (P + Q para todo P, Q en E)
        List<AdditionTableRow> additionTable = buildAdditionTable(points, effectiveA, b, p);

        // 3.e y 3.f: Tabla de multiplicación escalar y puntos generadores
        List<Integer> scalarHeaders = new ArrayList<>();
        for (int k = 1; k <= cardinality; k++) {
            scalarHeaders.add(k);
        }

        List<ScalarTableRow> scalarTable = new ArrayList<>();
        List<EllipticPoint> generators = new ArrayList<>();

        for (EllipticPoint point : points) {
            if (point.isInfinity()) {
                continue; // Opcional: omitir O como fila base o incluirlo; aquí listamos los puntos afines
            }
            List<EllipticPoint> multiples = new ArrayList<>();
            Set<EllipticPoint> generatedSet = new HashSet<>();
            EllipticPoint current = EllipticPoint.infinity();

            for (int k = 1; k <= cardinality; k++) {
                current = addPointsInternal(current, point, effectiveA, p);
                multiples.add(current);
                generatedSet.add(current);
            }

            int order = generatedSet.size();
            boolean isGenerator = (order == cardinality);
            if (isGenerator) {
                generators.add(point);
            }

            scalarTable.add(new ScalarTableRow(point, multiples, order, isGenerator));
        }

        return new CurveAnalysisResponse(
                verification.getSubstitutedFormula(),
                verification.getDeltaValue(),
                true,
                verification.getMessage(),
                points,
                cardinality,
                additionTable,
                scalarHeaders,
                scalarTable,
                generators
        );
    }

    // Requerimiento 3.c: Realizar operaciones de puntos (Suma, Doblado y Multiplicación Escalar)
    public PointOperationResponse calculatePointOperation(PointOperationRequest request) {
        BigInteger a = requireValue(request.getA(), "a");
        BigInteger b = requireValue(request.getB(), "b");
        BigInteger n = requireValue(request.getN(), "n");

        if (n.compareTo(BigInteger.ONE) <= 0) {
            throw new IllegalArgumentException("El módulo p debe ser mayor que 1");
        }

        String operation = request.getOperation() == null
                ? ""
                : request.getOperation().trim().toUpperCase();

        EllipticPoint p = requirePoint(request.getP(), "P");
        validatePoint(p, "P", a, b, n);

        switch (operation) {
            case "SUM":
            case "SUMA": {
                EllipticPoint q = requirePoint(request.getQ(), "Q");
                validatePoint(q, "Q", a, b, n);
                EllipticPoint result = addPointsInternal(p, q, a, n);
                return new PointOperationResponse("SUM", "P + Q mod " + n, result);
            }
            case "DOUBLE":
            case "DOBLE":
            case "DOBLAR": {
                EllipticPoint result = doublePointInternal(p, a, n);
                return new PointOperationResponse("DOUBLE", "2P mod " + n, result);
            }
            case "SCALAR":
            case "MULTIPLICACION":
            case "ESCALAR": {
                BigInteger k = requireValue(request.getK(), "k");
                EllipticPoint result = scalarMultiplyInternal(p, k, a, n);
                return new PointOperationResponse("SCALAR", k + "P mod " + n, result);
            }
            default:
                throw new IllegalArgumentException("La operación debe ser SUM, DOUBLE o SCALAR");
        }
    }

    // 3.a: Cálculo de todos los puntos pertenecientes a y^2 ≡ x^3 + ax + b (mod p)
    public List<EllipticPoint> calculateCurvePoints(BigInteger a, BigInteger b, BigInteger p) {
        List<EllipticPoint> points = new ArrayList<>();
        int pInt = p.intValueExact();

        // Precalcular residuos cuadráticos: y^2 mod p -> lista de valores y
        Map<BigInteger, List<BigInteger>> quadraticResidues = new HashMap<>();
        for (int yInt = 0; yInt < pInt; yInt++) {
            BigInteger y = BigInteger.valueOf(yInt);
            BigInteger ySquared = y.pow(2).mod(p);
            quadraticResidues.computeIfAbsent(ySquared, k -> new ArrayList<>()).add(y);
        }

        // Evaluar x^3 + ax + b mod p para cada x en [0, p-1]
        for (int xInt = 0; xInt < pInt; xInt++) {
            BigInteger x = BigInteger.valueOf(xInt);
            BigInteger rhs = x.pow(3).add(a.multiply(x)).add(b).mod(p);
            List<BigInteger> matchingYs = quadraticResidues.get(rhs);
            if (matchingYs != null) {
                for (BigInteger y : matchingYs) {
                    points.add(new EllipticPoint(x, y));
                }
            }
        }

        // Agregar el punto al infinito O
        points.add(EllipticPoint.infinity());
        return points;
    }

    // 3.d: Construcción de la tabla de suma de puntos
    private List<AdditionTableRow> buildAdditionTable(List<EllipticPoint> points, BigInteger a, BigInteger b, BigInteger p) {
        List<AdditionTableRow> table = new ArrayList<>();
        for (EllipticPoint rowPoint : points) {
            List<EllipticPoint> rowResults = new ArrayList<>();
            for (EllipticPoint colPoint : points) {
                rowResults.add(addPointsInternal(rowPoint, colPoint, a, p));
            }
            table.add(new AdditionTableRow(rowPoint, rowResults));
        }
        return table;
    }

    // Suma de puntos P + Q (maneja identidad O, inversos P + (-P) = O y doblado P = Q)
    private EllipticPoint addPointsInternal(EllipticPoint p, EllipticPoint q, BigInteger a, BigInteger n) {
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

        // Si x1 == x2 (mod n)
        if (x1.equals(x2)) {
            // Si y1 == y2 (mod n), entonces P == Q -> Doblado de punto (2P)
            if (y1.equals(y2)) {
                return doublePointInternal(p, a, n);
            }
            // Si y1 != y2 en la misma coordenada x, son inversos aditivos -> Punto al infinito O
            return EllipticPoint.infinity();
        }

        BigInteger denominator = x2.subtract(x1).mod(n);
        BigInteger slope = modularQuotient(y2.subtract(y1), denominator, n);
        return pointFromSlope(slope, x1, y1, x2, n);
    }

    // Doblado de punto 2P
    private EllipticPoint doublePointInternal(EllipticPoint p, BigInteger a, BigInteger n) {
        if (p.isInfinity()) {
            return EllipticPoint.infinity();
        }

        BigInteger x = p.getX().mod(n);
        BigInteger y = p.getY().mod(n);
        BigInteger denominator = y.multiply(BigInteger.TWO).mod(n);

        // Si 2y ≡ 0 (mod n), la tangente es vertical -> Punto al infinito O
        if (denominator.equals(BigInteger.ZERO)) {
            return EllipticPoint.infinity();
        }

        BigInteger numerator = BigInteger.valueOf(3).multiply(x.pow(2)).add(a).mod(n);
        BigInteger slope = modularQuotient(numerator, denominator, n);
        return pointFromSlope(slope, x, y, x, n);
    }

    // Multiplicación escalar kP mediante algoritmo Double-and-Add
    private EllipticPoint scalarMultiplyInternal(EllipticPoint p, BigInteger k, BigInteger a, BigInteger n) {
        if (k.equals(BigInteger.ZERO) || p.isInfinity()) {
            return EllipticPoint.infinity();
        }

        EllipticPoint base = normalizedPoint(p, n);
        BigInteger scalar = k;

        // Si k es negativo, usamos -k * (-P)
        if (scalar.compareTo(BigInteger.ZERO) < 0) {
            scalar = scalar.negate();
            base = new EllipticPoint(base.getX(), base.getY().negate().mod(n));
        }

        EllipticPoint result = EllipticPoint.infinity();
        EllipticPoint addend = base;

        while (scalar.compareTo(BigInteger.ZERO) > 0) {
            if (scalar.testBit(0)) {
                result = addPointsInternal(result, addend, a, n);
            }
            addend = doublePointInternal(addend, a, n);
            scalar = scalar.shiftRight(1);
        }

        return result;
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
            return numerator.mod(n).multiply(denominator.modInverse(n)).mod(n);
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException(
                    "La operación no está definida: el denominador no tiene inverso módulo " + n, exception);
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
            throw new IllegalArgumentException("El punto " + name + " (" + x + ", " + y + ") no pertenece a la curva");
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
package com.example.back;

import com.example.back.dto.EllipticPoint;
import com.example.back.dto.PointOperationRequest;
import com.example.back.dto.PointOperationResponse;
import com.example.back.service.EllipticCurveService;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EllipticCurveServiceTest {

    private final EllipticCurveService service = new EllipticCurveService();

    @Test
    void doublesPointModuloN() {
        PointOperationRequest request = request("DOUBLE", new EllipticPoint(value(3), value(6)), null);

        PointOperationResponse response = service.calculatePointOperation(request);

        assertEquals(value(80), response.getResult().getX());
        assertEquals(value(10), response.getResult().getY());
    }

    @Test
    void acceptsNegativeCoefficientsAndCoordinates() {
        PointOperationRequest request = request(
                "DOUBLE",
                new EllipticPoint(value(-94), value(-91)),
                null);
        request.setA(value(-95));
        request.setB(value(-94));

        PointOperationResponse response = service.calculatePointOperation(request);

        assertEquals(value(80), response.getResult().getX());
        assertEquals(value(10), response.getResult().getY());
    }

    @Test
    void addsTwoPointsModuloN() {
        PointOperationRequest request = request(
                "SUM",
                new EllipticPoint(value(3), value(6)),
                new EllipticPoint(value(80), value(10)));

        PointOperationResponse response = service.calculatePointOperation(request);

        assertEquals(value(80), response.getResult().getX());
        assertEquals(value(87), response.getResult().getY());
    }

    @Test
    void addingOppositePointsReturnsInfinity() {
        PointOperationRequest request = request(
                "SUM",
                new EllipticPoint(value(3), value(6)),
                new EllipticPoint(value(3), value(91)));

        PointOperationResponse response = service.calculatePointOperation(request);

        assertTrue(response.getResult().isInfinity());
    }

    private PointOperationRequest request(String operation, EllipticPoint p, EllipticPoint q) {
        PointOperationRequest request = new PointOperationRequest();
        request.setOperation(operation);
        request.setA(value(2));
        request.setB(value(3));
        request.setN(value(97));
        request.setP(p);
        request.setQ(q);
        return request;
    }

    private BigInteger value(long value) {
        return BigInteger.valueOf(value);
    }
}

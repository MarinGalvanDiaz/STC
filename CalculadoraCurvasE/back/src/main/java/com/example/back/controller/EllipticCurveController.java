package com.example.back.controller;

import com.example.back.dto.*;
import com.example.back.service.EllipticCurveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/elliptic")
@CrossOrigin(origins = "*")
public class EllipticCurveController {

    @Autowired
    private EllipticCurveService curveService;

    // Requerimiento 2: Validar si la curva es no singular
    @PostMapping("/verify")
    public VerificationResponse verifyCurve(@RequestBody VerificationRequest request) {
        return curveService.verifyNonSingularity(request);
    }

    // Requerimientos 2 y 3 (a, b, d, e, f): Validar y obtener puntos, cardinalidad, tablas y generadores
    @PostMapping("/analyze")
    public CurveAnalysisResponse analyzeCurve(@RequestBody VerificationRequest request) {
        return curveService.analyzeCurve(request);
    }

    // Requerimiento 3.c: Operaciones de puntos (SUM, DOUBLE, SCALAR)
    @PostMapping("/points")
    public PointOperationResponse calculatePointOperation(@RequestBody PointOperationRequest request) {
        return curveService.calculatePointOperation(request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}
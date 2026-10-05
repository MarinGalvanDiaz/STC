package com.escom.backend.controller;

import com.escom.backend.model.*;
import com.escom.backend.service.EcdhService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ecdh")
@CrossOrigin(origins = "*")
public class EcdhController {

    private final EcdhService ecdhService;

    public EcdhController(EcdhService ecdhService) {
        this.ecdhService = ecdhService;
    }

    @GetMapping("/curves")
    public ResponseEntity<List<CurveInfo>> getCurves() {
        return ResponseEntity.ok(ecdhService.getAvailableCurves());
    }

    @GetMapping("/specs")
    public ResponseEntity<SystemSpecs> getSystemSpecs() {
        return ResponseEntity.ok(ecdhService.getSystemSpecs());
    }

    @PostMapping("/generate-key")
    public ResponseEntity<EntityKeyPair> generateKey(@RequestBody Map<String, String> body) {
        String curveId = body.getOrDefault("curveId", "P-256");
        String entity = body.getOrDefault("entity", "Alice");
        return ResponseEntity.ok(ecdhService.generateKeyPair(curveId, entity));
    }

    @PostMapping("/compute-intermediate")
    public ResponseEntity<IntermediateKey> computeIntermediate(@RequestBody Map<String, String> body) {
        String curveId = body.getOrDefault("curveId", "P-256");
        String calculatedBy = body.getOrDefault("calculatedBy", "Alice");
        String usedPeer = body.getOrDefault("usedPeer", "Candy");
        String targetRecipient = body.getOrDefault("targetRecipient", "Bob");
        String privHex = body.get("privHex");
        String peerPubHex = body.get("peerPubHex");

        return ResponseEntity.ok(ecdhService.computeIntermediateKey(curveId, calculatedBy, usedPeer, targetRecipient, privHex, peerPubHex));
    }

    @PostMapping("/compute-final")
    public ResponseEntity<FinalSharedKey> computeFinal(@RequestBody Map<String, String> body) {
        String curveId = body.getOrDefault("curveId", "P-256");
        String entityName = body.getOrDefault("entityName", "Alice");
        String formula = body.getOrDefault("formula", "abcG");
        String privHex = body.get("privHex");
        String intermediateHex = body.get("intermediateHex");

        return ResponseEntity.ok(ecdhService.computeFinalKey(curveId, entityName, formula, privHex, intermediateHex));
    }

    @PostMapping("/simulate")
    public ResponseEntity<SimulationResult> runSimulation(@RequestBody(required = false) Map<String, String> body) {
        String curveId = (body != null && body.containsKey("curveId")) ? body.get("curveId") : "P-256";
        return ResponseEntity.ok(ecdhService.runSimulation(curveId));
    }

    @PostMapping("/benchmark")
    public ResponseEntity<BenchmarkResult> runBenchmark(@RequestBody(required = false) Map<String, Object> body) {
        int iterations = 10;
        if (body != null && body.containsKey("iterations")) {
            try {
                iterations = Integer.parseInt(body.get("iterations").toString());
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(ecdhService.runBenchmark(iterations));
    }

    @PostMapping("/calculate")
    public ResponseEntity<CalculationResult> calculate(@RequestBody Map<String, String> body) {
        String curveId = body.getOrDefault("curveId", "P-256");
        String privHex = body.get("privHex");
        String peerPubHex = body.get("peerPubHex");
        return ResponseEntity.ok(ecdhService.calculateShared(curveId, privHex, peerPubHex));
    }
}

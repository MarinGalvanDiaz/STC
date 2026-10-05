package com.escom.backend;

import com.escom.backend.model.*;
import com.escom.backend.service.EcdhService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private EcdhService ecdhService;

    @Test
    void contextLoads() {
        assertNotNull(ecdhService);
    }

    @Test
    void testAvailableCurves() {
        List<CurveInfo> curves = ecdhService.getAvailableCurves();
        assertEquals(3, curves.size());
        assertTrue(curves.stream().anyMatch(c -> c.getId().equals("P-256")));
        assertTrue(curves.stream().anyMatch(c -> c.getId().equals("P-384")));
        assertTrue(curves.stream().anyMatch(c -> c.getId().equals("P-521")));
    }

    @Test
    void testSimulationP256() {
        SimulationResult result = ecdhService.runSimulation("P-256");
        assertNotNull(result);
        assertTrue(result.isKeysMatch(), "Las tres claves compartidas deben ser idénticas");
        assertNotNull(result.getSharedSecretHex());
        assertEquals(64, result.getSharedSecretHex().length(), "La clave SHA-256 debe tener 64 caracteres hex (256 bits)");

        FinalSharedKey alice = result.getFinalKeys().get("Alice");
        FinalSharedKey bob = result.getFinalKeys().get("Bob");
        FinalSharedKey candy = result.getFinalKeys().get("Candy");

        assertEquals(alice.getDerivedKeyHex(), bob.getDerivedKeyHex());
        assertEquals(bob.getDerivedKeyHex(), candy.getDerivedKeyHex());
    }

    @Test
    void testSimulationP384AndP521() {
        SimulationResult res384 = ecdhService.runSimulation("P-384");
        assertTrue(res384.isKeysMatch());

        SimulationResult res521 = ecdhService.runSimulation("P-521");
        assertTrue(res521.isKeysMatch());
    }

    @Test
    void testBenchmark() {
        BenchmarkResult bench = ecdhService.runBenchmark(2);
        assertNotNull(bench);
        assertNotNull(bench.getSpecs());
        assertEquals(3, bench.getCurveBenchmarks().size());
        assertEquals(2, bench.getParticipantComparisons().size());
    }
}

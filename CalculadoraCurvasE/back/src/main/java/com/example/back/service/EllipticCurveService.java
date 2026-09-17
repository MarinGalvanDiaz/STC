package com.example.back.service;

import com.example.back.dto.VerificationRequest;
import com.example.back.dto.VerificationResponse;
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
}
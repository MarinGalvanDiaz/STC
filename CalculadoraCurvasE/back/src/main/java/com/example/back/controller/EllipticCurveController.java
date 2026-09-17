package com.example.back.controller;

import com.example.back.dto.VerificationRequest;
import com.example.back.dto.VerificationResponse;
import com.example.back.service.EllipticCurveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/elliptic")
@CrossOrigin(origins = "*")
public class EllipticCurveController {

    @Autowired
    private EllipticCurveService curveService;

    @PostMapping("/verify")
    public VerificationResponse verifyCurve(@RequestBody VerificationRequest request) {
        return curveService.verifyNonSingularity(request);
    }
}
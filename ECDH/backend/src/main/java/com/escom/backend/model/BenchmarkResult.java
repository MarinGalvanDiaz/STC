package com.escom.backend.model;

import java.util.Map;

public class BenchmarkResult {
    private int iterations;
    private SystemSpecs specs;
    private Map<String, CurveBenchmark> curveBenchmarks;
    private Map<String, ComplexityComparison> participantComparisons;

    public static class CurveBenchmark {
        private String curveId;
        private String curveName;
        private int securityBits;
        private double avgKeyGenMs;
        private double avgRound2Ms;
        private double avgRound3Ms;
        private double avgTotal3PartyMs;

        public CurveBenchmark() {}

        public CurveBenchmark(String curveId, String curveName, int securityBits,
                              double avgKeyGenMs, double avgRound2Ms, double avgRound3Ms, double avgTotal3PartyMs) {
            this.curveId = curveId;
            this.curveName = curveName;
            this.securityBits = securityBits;
            this.avgKeyGenMs = avgKeyGenMs;
            this.avgRound2Ms = avgRound2Ms;
            this.avgRound3Ms = avgRound3Ms;
            this.avgTotal3PartyMs = avgTotal3PartyMs;
        }

        public String getCurveId() { return curveId; }
        public void setCurveId(String curveId) { this.curveId = curveId; }
        public String getCurveName() { return curveName; }
        public void setCurveName(String curveName) { this.curveName = curveName; }
        public int getSecurityBits() { return securityBits; }
        public void setSecurityBits(int securityBits) { this.securityBits = securityBits; }
        public double getAvgKeyGenMs() { return avgKeyGenMs; }
        public void setAvgKeyGenMs(double avgKeyGenMs) { this.avgKeyGenMs = avgKeyGenMs; }
        public double getAvgRound2Ms() { return avgRound2Ms; }
        public void setAvgRound2Ms(double avgRound2Ms) { this.avgRound2Ms = avgRound2Ms; }
        public double getAvgRound3Ms() { return avgRound3Ms; }
        public void setAvgRound3Ms(double avgRound3Ms) { this.avgRound3Ms = avgRound3Ms; }
        public double getAvgTotal3PartyMs() { return avgTotal3PartyMs; }
        public void setAvgTotal3PartyMs(double avgTotal3PartyMs) { this.avgTotal3PartyMs = avgTotal3PartyMs; }
    }

    public static class ComplexityComparison {
        private String scenario; // "2 Partes (Alice, Bob)" vs "3 Partes (Alice, Bob, Candy)"
        private int participants;
        private int rounds;
        private int scalarMultiplicationsPerParty;
        private int totalScalarMultiplications;
        private double avgExecutionMs;
        private String computationalComplexity; // "O(1)" vs "O(N)"
        private String networkMessages;

        public ComplexityComparison() {}

        public ComplexityComparison(String scenario, int participants, int rounds,
                                    int scalarMultiplicationsPerParty, int totalScalarMultiplications,
                                    double avgExecutionMs, String computationalComplexity, String networkMessages) {
            this.scenario = scenario;
            this.participants = participants;
            this.rounds = rounds;
            this.scalarMultiplicationsPerParty = scalarMultiplicationsPerParty;
            this.totalScalarMultiplications = totalScalarMultiplications;
            this.avgExecutionMs = avgExecutionMs;
            this.computationalComplexity = computationalComplexity;
            this.networkMessages = networkMessages;
        }

        public String getScenario() { return scenario; }
        public void setScenario(String scenario) { this.scenario = scenario; }
        public int getParticipants() { return participants; }
        public void setParticipants(int participants) { this.participants = participants; }
        public int getRounds() { return rounds; }
        public void setRounds(int rounds) { this.rounds = rounds; }
        public int getScalarMultiplicationsPerParty() { return scalarMultiplicationsPerParty; }
        public void setScalarMultiplicationsPerParty(int scalarMultiplicationsPerParty) { this.scalarMultiplicationsPerParty = scalarMultiplicationsPerParty; }
        public int getTotalScalarMultiplications() { return totalScalarMultiplications; }
        public void setTotalScalarMultiplications(int totalScalarMultiplications) { this.totalScalarMultiplications = totalScalarMultiplications; }
        public double getAvgExecutionMs() { return avgExecutionMs; }
        public void setAvgExecutionMs(double avgExecutionMs) { this.avgExecutionMs = avgExecutionMs; }
        public String getComputationalComplexity() { return computationalComplexity; }
        public void setComputationalComplexity(String computationalComplexity) { this.computationalComplexity = computationalComplexity; }
        public String getNetworkMessages() { return networkMessages; }
        public void setNetworkMessages(String networkMessages) { this.networkMessages = networkMessages; }
    }

    public BenchmarkResult() {}

    public int getIterations() { return iterations; }
    public void setIterations(int iterations) { this.iterations = iterations; }
    public SystemSpecs getSpecs() { return specs; }
    public void setSpecs(SystemSpecs specs) { this.specs = specs; }
    public Map<String, CurveBenchmark> getCurveBenchmarks() { return curveBenchmarks; }
    public void setCurveBenchmarks(Map<String, CurveBenchmark> curveBenchmarks) { this.curveBenchmarks = curveBenchmarks; }
    public Map<String, ComplexityComparison> getParticipantComparisons() { return participantComparisons; }
    public void setParticipantComparisons(Map<String, ComplexityComparison> participantComparisons) { this.participantComparisons = participantComparisons; }
}

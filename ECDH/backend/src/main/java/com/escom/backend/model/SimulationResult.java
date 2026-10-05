package com.escom.backend.model;

import java.util.List;
import java.util.Map;

public class SimulationResult {
    private CurveInfo curve;
    private Map<String, EntityKeyPair> keyPairs;
    private Map<String, IntermediateKey> intermediateKeys;
    private Map<String, FinalSharedKey> finalKeys;
    private List<UsbFile> round1UsbFiles;
    private List<UsbFile> round2UsbFiles;
    private boolean keysMatch;
    private String sharedSecretHex;
    private long keyGenTimeNanos;
    private long round2TimeNanos;
    private long round3TimeNanos;
    private long totalTimeNanos;
    private List<SimulationStep> steps;

    public SimulationResult() {}

    public CurveInfo getCurve() { return curve; }
    public void setCurve(CurveInfo curve) { this.curve = curve; }

    public Map<String, EntityKeyPair> getKeyPairs() { return keyPairs; }
    public void setKeyPairs(Map<String, EntityKeyPair> keyPairs) { this.keyPairs = keyPairs; }

    public Map<String, IntermediateKey> getIntermediateKeys() { return intermediateKeys; }
    public void setIntermediateKeys(Map<String, IntermediateKey> intermediateKeys) { this.intermediateKeys = intermediateKeys; }

    public Map<String, FinalSharedKey> getFinalKeys() { return finalKeys; }
    public void setFinalKeys(Map<String, FinalSharedKey> finalKeys) { this.finalKeys = finalKeys; }

    public List<UsbFile> getRound1UsbFiles() { return round1UsbFiles; }
    public void setRound1UsbFiles(List<UsbFile> round1UsbFiles) { this.round1UsbFiles = round1UsbFiles; }

    public List<UsbFile> getRound2UsbFiles() { return round2UsbFiles; }
    public void setRound2UsbFiles(List<UsbFile> round2UsbFiles) { this.round2UsbFiles = round2UsbFiles; }

    public boolean isKeysMatch() { return keysMatch; }
    public void setKeysMatch(boolean keysMatch) { this.keysMatch = keysMatch; }

    public String getSharedSecretHex() { return sharedSecretHex; }
    public void setSharedSecretHex(String sharedSecretHex) { this.sharedSecretHex = sharedSecretHex; }

    public long getKeyGenTimeNanos() { return keyGenTimeNanos; }
    public void setKeyGenTimeNanos(long keyGenTimeNanos) { this.keyGenTimeNanos = keyGenTimeNanos; }

    public long getRound2TimeNanos() { return round2TimeNanos; }
    public void setRound2TimeNanos(long round2TimeNanos) { this.round2TimeNanos = round2TimeNanos; }

    public long getRound3TimeNanos() { return round3TimeNanos; }
    public void setRound3TimeNanos(long round3TimeNanos) { this.round3TimeNanos = round3TimeNanos; }

    public long getTotalTimeNanos() { return totalTimeNanos; }
    public void setTotalTimeNanos(long totalTimeNanos) { this.totalTimeNanos = totalTimeNanos; }

    public List<SimulationStep> getSteps() { return steps; }
    public void setSteps(List<SimulationStep> steps) { this.steps = steps; }
}

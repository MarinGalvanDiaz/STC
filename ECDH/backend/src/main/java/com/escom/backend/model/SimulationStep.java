package com.escom.backend.model;

public class SimulationStep {
    private int stepNumber;
    private String title;
    private String description;
    private String phase;
    private String participant;
    private String mathOperation;
    private String usbAction;

    public SimulationStep() {}

    public SimulationStep(int stepNumber, String title, String description,
                          String phase, String participant, String mathOperation, String usbAction) {
        this.stepNumber = stepNumber;
        this.title = title;
        this.description = description;
        this.phase = phase;
        this.participant = participant;
        this.mathOperation = mathOperation;
        this.usbAction = usbAction;
    }

    public int getStepNumber() { return stepNumber; }
    public void setStepNumber(int stepNumber) { this.stepNumber = stepNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPhase() { return phase; }
    public void setPhase(String phase) { this.phase = phase; }

    public String getParticipant() { return participant; }
    public void setParticipant(String participant) { this.participant = participant; }

    public String getMathOperation() { return mathOperation; }
    public void setMathOperation(String mathOperation) { this.mathOperation = mathOperation; }

    public String getUsbAction() { return usbAction; }
    public void setUsbAction(String usbAction) { this.usbAction = usbAction; }
}

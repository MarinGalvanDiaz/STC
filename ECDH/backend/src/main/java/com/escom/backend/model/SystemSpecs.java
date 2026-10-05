package com.escom.backend.model;

public class SystemSpecs {
    private String osName;
    private String osVersion;
    private String osArchitecture;
    private String processorName;
    private int processorCores;
    private int processorLogical;
    private String totalRam;
    private String javaVersion;
    private String javaVendor;

    public SystemSpecs() {}

    public String getOsName() { return osName; }
    public void setOsName(String osName) { this.osName = osName; }

    public String getOsVersion() { return osVersion; }
    public void setOsVersion(String osVersion) { this.osVersion = osVersion; }

    public String getOsArchitecture() { return osArchitecture; }
    public void setOsArchitecture(String osArchitecture) { this.osArchitecture = osArchitecture; }

    public String getProcessorName() { return processorName; }
    public void setProcessorName(String processorName) { this.processorName = processorName; }

    public int getProcessorCores() { return processorCores; }
    public void setProcessorCores(int processorCores) { this.processorCores = processorCores; }

    public int getProcessorLogical() { return processorLogical; }
    public void setProcessorLogical(int processorLogical) { this.processorLogical = processorLogical; }

    public String getTotalRam() { return totalRam; }
    public void setTotalRam(String totalRam) { this.totalRam = totalRam; }

    public String getJavaVersion() { return javaVersion; }
    public void setJavaVersion(String javaVersion) { this.javaVersion = javaVersion; }

    public String getJavaVendor() { return javaVendor; }
    public void setJavaVendor(String javaVendor) { this.javaVendor = javaVendor; }
}

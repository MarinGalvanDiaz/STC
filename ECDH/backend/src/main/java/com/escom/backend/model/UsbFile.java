package com.escom.backend.model;

public class UsbFile {
    private String fileName;
    private String fileType;        // "PUBLIC_KEY" o "INTERMEDIATE_KEY"
    private String creator;         // "Alice", "Bob", "Candy"
    private String targetRecipient; // "Bob", "Candy", "Alice"
    private String contentSummary;
    private Object payload;
    private long timestamp;

    public UsbFile() {}

    public UsbFile(String fileName, String fileType, String creator,
                   String targetRecipient, String contentSummary, Object payload, long timestamp) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.creator = creator;
        this.targetRecipient = targetRecipient;
        this.contentSummary = contentSummary;
        this.payload = payload;
        this.timestamp = timestamp;
    }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public String getCreator() { return creator; }
    public void setCreator(String creator) { this.creator = creator; }

    public String getTargetRecipient() { return targetRecipient; }
    public void setTargetRecipient(String targetRecipient) { this.targetRecipient = targetRecipient; }

    public String getContentSummary() { return contentSummary; }
    public void setContentSummary(String contentSummary) { this.contentSummary = contentSummary; }

    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}

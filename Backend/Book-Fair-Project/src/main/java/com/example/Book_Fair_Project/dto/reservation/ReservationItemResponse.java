package com.example.Book_Fair_Project.dto.reservation;



public class ReservationItemResponse {
    private Long stallId;
    private String stallCode;
    private String size;

    public ReservationItemResponse() {}

    public ReservationItemResponse(Long stallId, String stallCode, String size) {
        this.stallId = stallId;
        this.stallCode = stallCode;
        this.size = size;
    }

    public Long getStallId() { return stallId; }
    public void setStallId(Long stallId) { this.stallId = stallId; }

    public String getStallCode() { return stallCode; }
    public void setStallCode(String stallCode) { this.stallCode = stallCode; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
}

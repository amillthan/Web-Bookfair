package com.example.Book_Fair_Project.dto.reservation;

import com.example.Book_Fair_Project.model.Reservation;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ReservationResponse {
    private Long id;
    private Long vendorUserId;
    private String vendorUsername;
    private String vendorName;
    private String vendorEmail;
    private String organizationName;
    private Long exhibitionId;
    private String exhibitionName;
    private LocalDate reservationDate;
    private String stallType;
    private String stallSize;
    private Integer numberOfStalls;
    private String businessCategory;
    private String specialRequirements;
    private String status;
    private String documentName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ReservationResponse() {}

    public ReservationResponse(Reservation reservation) {
        this.id = reservation.getId();
        if (reservation.getVendorUserProfile() != null) {
            this.vendorUserId = reservation.getVendorUserProfile().getId();
            this.vendorUsername = reservation.getVendorUserProfile().getUsername();
            this.vendorName = reservation.getVendorUserProfile().getName();
            this.vendorEmail = reservation.getVendorUserProfile().getEmail();
            this.organizationName = reservation.getVendorUserProfile().getOrganizationName();
        }
        if (reservation.getExhibition() != null) {
            this.exhibitionId = reservation.getExhibition().getId();
            this.exhibitionName = reservation.getExhibition().getName();
        }
        this.reservationDate = reservation.getReservationDate();
        this.stallType = reservation.getStallType();
        this.stallSize = reservation.getStallSize();
        this.numberOfStalls = reservation.getNumberOfStalls();
        this.businessCategory = reservation.getBusinessCategory();
        this.specialRequirements = reservation.getSpecialRequirements();
        this.status = reservation.getStatus();
        this.documentName = reservation.getDocumentName();
        this.createdAt = reservation.getCreatedAt();
        this.updatedAt = reservation.getUpdatedAt();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVendorUserId() { return vendorUserId; }
    public void setVendorUserId(Long vendorUserId) { this.vendorUserId = vendorUserId; }

    public String getVendorUsername() { return vendorUsername; }
    public void setVendorUsername(String vendorUsername) { this.vendorUsername = vendorUsername; }

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }

    public String getVendorEmail() { return vendorEmail; }
    public void setVendorEmail(String vendorEmail) { this.vendorEmail = vendorEmail; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public Long getExhibitionId() { return exhibitionId; }
    public void setExhibitionId(Long exhibitionId) { this.exhibitionId = exhibitionId; }

    public String getExhibitionName() { return exhibitionName; }
    public void setExhibitionName(String exhibitionName) { this.exhibitionName = exhibitionName; }

    public LocalDate getReservationDate() { return reservationDate; }
    public void setReservationDate(LocalDate reservationDate) { this.reservationDate = reservationDate; }

    public String getStallType() { return stallType; }
    public void setStallType(String stallType) { this.stallType = stallType; }

    public String getStallSize() { return stallSize; }
    public void setStallSize(String stallSize) { this.stallSize = stallSize; }

    public Integer getNumberOfStalls() { return numberOfStalls; }
    public void setNumberOfStalls(Integer numberOfStalls) { this.numberOfStalls = numberOfStalls; }

    public String getBusinessCategory() { return businessCategory; }
    public void setBusinessCategory(String businessCategory) { this.businessCategory = businessCategory; }

    public String getSpecialRequirements() { return specialRequirements; }
    public void setSpecialRequirements(String specialRequirements) { this.specialRequirements = specialRequirements; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

package com.example.Book_Fair_Project.dto.reservation;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class ReservationCreateRequest {

    @NotNull(message = "Exhibition ID is required.")
    private Long exhibitionId;

    @NotNull(message = "Reservation date is required.")
    private LocalDate reservationDate;

    @NotBlank(message = "Stall type is required.")
    @Pattern(regexp = "Standard|Premium|Corner Stall", message = "Stall type must be 'Standard', 'Premium', or 'Corner Stall'.")
    private String stallType;

    @NotBlank(message = "Stall size is required.")
    @Pattern(regexp = "Small|Medium|Large", message = "Stall size must be 'Small', 'Medium', or 'Large'.")
    private String stallSize;

    @NotNull(message = "Number of stalls is required.")
    @Min(value = 1, message = "At least 1 stall is required.")
    @Max(value = 3, message = "You can reserve at most 3 stalls.")
    private Integer numberOfStalls;

    @NotBlank(message = "Business category is required.")
    @Pattern(regexp = "Food & Beverage|Clothing|Electronics|Handicrafts|Services|Other", message = "Business category must be 'Food & Beverage', 'Clothing', 'Electronics', 'Handicrafts', 'Services', or 'Other'.")
    private String businessCategory;

    @Size(max = 1000, message = "Special requirements must be at most 1000 characters.")
    private String specialRequirements;

    private String documentName;
    private String documentContentBase64;

    public ReservationCreateRequest() {}

    public ReservationCreateRequest(Long exhibitionId, LocalDate reservationDate, String stallType, String stallSize, Integer numberOfStalls, String businessCategory, String specialRequirements) {
        this.exhibitionId = exhibitionId;
        this.reservationDate = reservationDate;
        this.stallType = stallType;
        this.stallSize = stallSize;
        this.numberOfStalls = numberOfStalls;
        this.businessCategory = businessCategory;
        this.specialRequirements = specialRequirements;
    }

    public ReservationCreateRequest(Long exhibitionId, LocalDate reservationDate, String stallType, String stallSize, Integer numberOfStalls, String businessCategory, String specialRequirements, String documentName, String documentContentBase64) {
        this.exhibitionId = exhibitionId;
        this.reservationDate = reservationDate;
        this.stallType = stallType;
        this.stallSize = stallSize;
        this.numberOfStalls = numberOfStalls;
        this.businessCategory = businessCategory;
        this.specialRequirements = specialRequirements;
        this.documentName = documentName;
        this.documentContentBase64 = documentContentBase64;
    }

    // Getters and Setters
    public Long getExhibitionId() { return exhibitionId; }
    public void setExhibitionId(Long exhibitionId) { this.exhibitionId = exhibitionId; }

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

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }

    public String getDocumentContentBase64() { return documentContentBase64; }
    public void setDocumentContentBase64(String documentContentBase64) { this.documentContentBase64 = documentContentBase64; }
}

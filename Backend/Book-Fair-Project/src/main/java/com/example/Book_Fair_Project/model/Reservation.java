package com.example.Book_Fair_Project.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "vendor_user_id", nullable = false)
    private UserProfile vendorUserProfile;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "exhibition_id", nullable = false)
    private Exhibition exhibition;

    @Column(name = "reservation_date", nullable = false)
    private LocalDate reservationDate;

    @Column(name = "stall_type", nullable = false, length = 50)
    private String stallType; // 'Standard', 'Premium', 'Corner Stall'

    @Column(name = "stall_size", nullable = false, length = 50)
    private String stallSize; // 'Small', 'Medium', 'Large'

    @Column(name = "number_of_stalls", nullable = false)
    private Integer numberOfStalls;

    @Column(name = "business_category", nullable = false, length = 100)
    private String businessCategory;

    @Column(name = "special_requirements", columnDefinition = "TEXT")
    private String specialRequirements;

    @Column(nullable = false, length = 50)
    private String status = "Pending"; // 'Pending', 'Approved', 'Rejected', 'Cancelled'

    @Column(name = "document_name", length = 255)
    private String documentName;

    @Column(name = "document_path", length = 512)
    private String documentPath;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Reservation() {}

    public Reservation(UserProfile vendorUserProfile, Exhibition exhibition, LocalDate reservationDate,
                       String stallType, String stallSize, Integer numberOfStalls,
                       String businessCategory, String specialRequirements, String status) {
        this.vendorUserProfile = vendorUserProfile;
        this.exhibition = exhibition;
        this.reservationDate = reservationDate;
        this.stallType = stallType;
        this.stallSize = stallSize;
        this.numberOfStalls = numberOfStalls;
        this.businessCategory = businessCategory;
        this.specialRequirements = specialRequirements;
        this.status = status;
    }

    public Reservation(UserProfile vendorUserProfile, Exhibition exhibition, LocalDate reservationDate,
                       String stallType, String stallSize, Integer numberOfStalls,
                       String businessCategory, String specialRequirements, String status,
                       String documentName, String documentPath) {
        this.vendorUserProfile = vendorUserProfile;
        this.exhibition = exhibition;
        this.reservationDate = reservationDate;
        this.stallType = stallType;
        this.stallSize = stallSize;
        this.numberOfStalls = numberOfStalls;
        this.businessCategory = businessCategory;
        this.specialRequirements = specialRequirements;
        this.status = status;
        this.documentName = documentName;
        this.documentPath = documentPath;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UserProfile getVendorUserProfile() { return vendorUserProfile; }
    public void setVendorUserProfile(UserProfile vendorUserProfile) { this.vendorUserProfile = vendorUserProfile; }

    public Exhibition getExhibition() { return exhibition; }
    public void setExhibition(Exhibition exhibition) { this.exhibition = exhibition; }

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

    public String getDocumentPath() { return documentPath; }
    public void setDocumentPath(String documentPath) { this.documentPath = documentPath; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

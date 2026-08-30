package com.example.Book_Fair_Project.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "identity_provider_user_id", nullable = false, unique = true, length = 255)
    private String identityProviderUserId; // holds OIDC 'sub' claim

    @Column(nullable = false, length = 100)
    private String username;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "contact_number", length = 50)
    private String contactNumber;

    @Column(name = "organization_name", length = 100)
    private String organizationName;

    @Column(nullable = false, length = 50)
    private String role = "Vendor"; // 'Vendor' or 'Organizer'

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public UserProfile() {}

    public UserProfile(String identityProviderUserId, String username, String name, String email, String contactNumber, String organizationName, String role) {
        this.identityProviderUserId = identityProviderUserId;
        this.username = username;
        this.name = name;
        this.email = email;
        this.contactNumber = contactNumber;
        this.organizationName = organizationName;
        this.role = role;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIdentityProviderUserId() { return identityProviderUserId; }
    public void setIdentityProviderUserId(String identityProviderUserId) { this.identityProviderUserId = identityProviderUserId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

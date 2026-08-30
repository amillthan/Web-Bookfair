package com.example.Book_Fair_Project.dto.user;

import com.example.Book_Fair_Project.model.UserProfile;
import java.time.LocalDateTime;

public class UserProfileResponse {
    private Long id;
    private String identityProviderUserId;
    private String username;
    private String name;
    private String email;
    private String contactNumber;
    private String organizationName;
    private String role;
    private LocalDateTime createdAt;

    public UserProfileResponse() {}

    public UserProfileResponse(UserProfile userProfile) {
        this.id = userProfile.getId();
        this.identityProviderUserId = userProfile.getIdentityProviderUserId();
        this.username = userProfile.getUsername();
        this.name = userProfile.getName();
        this.email = userProfile.getEmail();
        this.contactNumber = userProfile.getContactNumber();
        this.organizationName = userProfile.getOrganizationName();
        this.role = userProfile.getRole();
        this.createdAt = userProfile.getCreatedAt();
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
}

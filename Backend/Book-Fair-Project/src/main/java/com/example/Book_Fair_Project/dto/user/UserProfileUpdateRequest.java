package com.example.Book_Fair_Project.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO for user profile update requests (OWASP A04: Insecure Design -- mass assignment prevention).
 *
 * Only exposes the three fields a user is permitted to change. Sensitive fields such as
 * 'role', 'email', and 'identityProviderUserId' are deliberately excluded to prevent
 * privilege escalation via mass assignment.
 */
public class UserProfileUpdateRequest {

    @NotBlank(message = "Name is required.")
    @Size(max = 100, message = "Name must not exceed 100 characters.")
    private String name;

    @Size(max = 50, message = "Contact number must not exceed 50 characters.")
    @Pattern(regexp = "^[+\\d\\s\\-()]*$", message = "Contact number must contain only digits, spaces, +, -, or ().")
    private String contactNumber;

    @Size(max = 100, message = "Organization name must not exceed 100 characters.")
    private String organizationName;

    public UserProfileUpdateRequest() {}

    public UserProfileUpdateRequest(String name, String contactNumber, String organizationName) {
        this.name = name;
        this.contactNumber = contactNumber;
        this.organizationName = organizationName;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
}

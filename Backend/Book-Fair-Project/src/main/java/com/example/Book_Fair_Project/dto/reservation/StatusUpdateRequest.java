package com.example.Book_Fair_Project.dto.reservation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO for reservation status update requests (OWASP A03: Injection -- controller-layer validation).
 *
 * Using a typed DTO with @Pattern annotation enforces a strict allowlist of valid
 * status values at the deserialization boundary, before any service logic runs.
 */
public class StatusUpdateRequest {

    @NotBlank(message = "Status is required.")
    @Pattern(
        regexp = "Pending|Approved|Rejected|Cancelled",
        message = "Status must be 'Pending', 'Approved', 'Rejected', or 'Cancelled'."
    )
    private String status;

    public StatusUpdateRequest() {}

    public StatusUpdateRequest(String status) {
        this.status = status;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

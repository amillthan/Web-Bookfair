package com.example.Book_Fair_Project.controller;

import com.example.Book_Fair_Project.dto.common.ApiResponse;
import com.example.Book_Fair_Project.dto.reservation.ReservationCreateRequest;
import com.example.Book_Fair_Project.dto.reservation.ReservationResponse;
import com.example.Book_Fair_Project.model.UserProfile;
import com.example.Book_Fair_Project.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    /**
     * POST /api/reservations — Create a new stall reservation.
     * Restricted to VENDOR role only. The vendor's identity is taken from the JWT principal,
     * never from the request body, preventing IDOR/impersonation (OWASP A01).
     */
    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @AuthenticationPrincipal UserProfile userProfile,
            @Valid @RequestBody ReservationCreateRequest request) {
        ReservationResponse reservation = reservationService.createReservation(request, userProfile);
        return ResponseEntity.status(201)
                .body(ApiResponse.ok("Reservation request submitted successfully", reservation, 201));
    }

    /**
     * GET /api/reservations/my — List all reservations for the authenticated vendor.
     * Restricted to VENDOR role only.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getMyReservations(
            @AuthenticationPrincipal UserProfile userProfile) {
        List<ReservationResponse> reservations = reservationService.getMyReservations(userProfile);
        return ResponseEntity.ok(ApiResponse.ok("Reservations retrieved successfully", reservations, 200));
    }

    /**
     * GET /api/reservations/{id} — Retrieve a specific reservation.
     * VENDOR must own the reservation (BOLA check in service). ORGANIZER may view any.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VENDOR', 'ORGANIZER')")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservationById(
            @AuthenticationPrincipal UserProfile userProfile,
            @PathVariable Long id) {
        ReservationResponse reservation = reservationService.getReservationById(id, userProfile);
        return ResponseEntity.ok(ApiResponse.ok("Reservation details retrieved successfully", reservation, 200));
    }

    /**
     * PUT /api/reservations/{id} — Update a pending reservation.
     * VENDOR must own the reservation. ORGANIZER may update any.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('VENDOR', 'ORGANIZER')")
    public ResponseEntity<ApiResponse<ReservationResponse>> updateReservation(
            @AuthenticationPrincipal UserProfile userProfile,
            @PathVariable Long id,
            @Valid @RequestBody ReservationCreateRequest request) {
        ReservationResponse reservation = reservationService.updateReservation(id, request, userProfile);
        return ResponseEntity.ok(ApiResponse.ok("Reservation updated successfully", reservation, 200));
    }

    /**
     * DELETE /api/reservations/{id} — Cancel a reservation (sets status to Cancelled).
     * VENDOR must own the reservation. ORGANIZER may cancel any.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('VENDOR', 'ORGANIZER')")
    public ResponseEntity<ApiResponse<Void>> cancelReservation(
            @AuthenticationPrincipal UserProfile userProfile,
            @PathVariable Long id) {
        reservationService.cancelReservation(id, userProfile);
        return ResponseEntity.ok(ApiResponse.ok("Reservation cancelled successfully", null, 200));
    }

    /**
     * GET /api/reservations/{id}/download — Securely download reservation document.
     * Accessible by VENDOR (must own reservation) and ORGANIZER. Enforces BOLA (OWASP A01).
     */
    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('VENDOR', 'ORGANIZER')")
    public ResponseEntity<org.springframework.core.io.Resource> downloadDocument(
            @AuthenticationPrincipal UserProfile userProfile,
            @PathVariable Long id) {
        String docPath = reservationService.getDocumentPath(id, userProfile);
        java.nio.file.Path path = java.nio.file.Paths.get(docPath);
        
        org.springframework.core.io.Resource resource;
        try {
            resource = new org.springframework.core.io.UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new com.example.Book_Fair_Project.exception.NotFoundException("Document file not found on server.");
            }
        } catch (java.net.MalformedURLException e) {
            throw new com.example.Book_Fair_Project.exception.NotFoundException("Document file path is malformed.");
        }

        String contentType = "application/octet-stream";
        try {
            String detected = java.nio.file.Files.probeContentType(path);
            if (detected != null) {
                contentType = detected;
            }
        } catch (java.io.IOException e) {
            // Fallback
        }

        String filename = path.getFileName().toString();
        // Remove UUID prefix (36 chars uuid + 1 underscore)
        if (filename.length() > 37 && filename.substring(0, 36).contains("-")) {
            filename = filename.substring(37);
        }

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }
}

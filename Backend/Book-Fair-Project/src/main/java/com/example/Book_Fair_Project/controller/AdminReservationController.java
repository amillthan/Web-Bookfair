package com.example.Book_Fair_Project.controller;

import com.example.Book_Fair_Project.dto.common.ApiResponse;
import com.example.Book_Fair_Project.dto.reservation.ReservationResponse;
import com.example.Book_Fair_Project.dto.reservation.StatusUpdateRequest;
import com.example.Book_Fair_Project.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin reservation management endpoints.
 * Access is restricted to ORGANIZER role via:
 *   1. URL-pattern rule in SecurityConfig: /api/admin/** -> hasRole('ORGANIZER')
 *   2. Method-level @PreAuthorize on each handler (defense-in-depth, OWASP A01)
 */
@RestController
@RequestMapping("/api/admin/reservations")
public class AdminReservationController {

    private final ReservationService reservationService;

    public AdminReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    /**
     * GET /api/admin/reservations
     * Returns all reservations in the system. Organizer-only.
     */
    @GetMapping
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getAllReservations() {
        List<ReservationResponse> reservations = reservationService.getAllReservations();
        return ResponseEntity.ok(ApiResponse.ok("All reservations retrieved successfully for organizers", reservations, 200));
    }

    /**
     * GET /api/admin/reservations/{id}
     * Returns a single reservation by ID. No ownership constraint for organizers.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservationById(@PathVariable Long id) {
        // Organizer bypasses BOLA check — organisers may view any reservation
        ReservationResponse reservation = reservationService.getReservationByIdAsAdmin(id);
        return ResponseEntity.ok(ApiResponse.ok("Reservation retrieved successfully", reservation, 200));
    }

    /**
     * PUT /api/admin/reservations/{id}/status
     * Updates the status of a reservation. Uses a typed DTO for input validation (OWASP A03).
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<ApiResponse<ReservationResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        ReservationResponse reservation = reservationService.updateReservationStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("Reservation status updated to: " + request.getStatus(), reservation, 200));
    }

    /**
     * DELETE /api/admin/reservations/{id}
     * Permanently deletes a reservation record from the database.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<ApiResponse<Void>> deleteReservation(@PathVariable Long id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.ok(ApiResponse.ok("Reservation deleted successfully", null, 200));
    }
}

package com.example.Book_Fair_Project.service;

import com.example.Book_Fair_Project.dto.reservation.ReservationCreateRequest;
import com.example.Book_Fair_Project.dto.reservation.ReservationResponse;
import com.example.Book_Fair_Project.exception.NotFoundException;
import com.example.Book_Fair_Project.model.Exhibition;
import com.example.Book_Fair_Project.model.Reservation;
import com.example.Book_Fair_Project.model.UserProfile;
import com.example.Book_Fair_Project.repository.ExhibitionRepository;
import com.example.Book_Fair_Project.repository.ReservationRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final ExhibitionRepository exhibitionRepository;

    public ReservationServiceImpl(ReservationRepository reservationRepository, ExhibitionRepository exhibitionRepository) {
        this.reservationRepository = reservationRepository;
        this.exhibitionRepository = exhibitionRepository;
    }

    @Override
    @Transactional
    public ReservationResponse createReservation(ReservationCreateRequest request, UserProfile userProfile) {
        // 1. Validate exhibition
        Exhibition exhibition = exhibitionRepository.findById(request.getExhibitionId())
                .orElseThrow(() -> new IllegalArgumentException("Exhibition not found with ID: " + request.getExhibitionId()));

        if (!exhibition.getIsActive()) {
            throw new IllegalArgumentException("Cannot reserve stalls for an inactive exhibition.");
        }

        // 2. Validate date (cannot be in the past)
        if (request.getReservationDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Reservation date cannot be in the past.");
        }

        // 3. Business rule check: Max 3 stalls per business
        // Retrieve count of currently active/pending/approved stalls reserved by this vendor
        List<Reservation> activeReservations = reservationRepository.findByVendorUserProfileId(userProfile.getId())
                .stream()
                .filter(r -> !r.getStatus().equalsIgnoreCase("Cancelled") && !r.getStatus().equalsIgnoreCase("Rejected"))
                .collect(Collectors.toList());

        int currentReservedStalls = activeReservations.stream()
                .mapToInt(Reservation::getNumberOfStalls)
                .sum();

        if (currentReservedStalls + request.getNumberOfStalls() > 3) {
            throw new IllegalArgumentException("Business rule violation: You can reserve at most 3 stalls in total. Currently reserved: " + currentReservedStalls);
        }

        // 4. Create and Save reservation
        String docPath = saveDocument(request.getDocumentName(), request.getDocumentContentBase64());
        Reservation reservation = new Reservation(
                userProfile,
                exhibition,
                request.getReservationDate(),
                request.getStallType(),
                request.getStallSize(),
                request.getNumberOfStalls(),
                request.getBusinessCategory(),
                request.getSpecialRequirements(),
                "Pending",
                request.getDocumentName(),
                docPath
        );

        Reservation saved = reservationRepository.save(reservation);
        return new ReservationResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getMyReservations(UserProfile userProfile) {
        return reservationRepository.findByVendorUserProfileId(userProfile.getId())
                .stream()
                .map(ReservationResponse::new)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getReservationById(Long id, UserProfile userProfile) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reservation not found"));

        // BOLA / IDOR Verification: Verify that the current user is an Organizer OR owns this reservation
        verifyOwnershipOrAdmin(reservation, userProfile);

        return new ReservationResponse(reservation);
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getReservationByIdAsAdmin(Long id) {
        // Admin/Organizer retrieval — no ownership check required.
        // @PreAuthorize on the controller guarantees the caller is ORGANIZER before reaching here.
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reservation not found"));
        return new ReservationResponse(reservation);
    }

    @Override
    @Transactional
    public ReservationResponse updateReservation(Long id, ReservationCreateRequest request, UserProfile userProfile) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reservation not found"));

        // BOLA / IDOR Verification: Ensure they own the reservation
        verifyOwnershipOrAdmin(reservation, userProfile);

        // Business rule: Only Pending reservations can be updated
        if (!reservation.getStatus().equalsIgnoreCase("Pending")) {
            throw new IllegalArgumentException("Cannot update a reservation that is already " + reservation.getStatus());
        }

        // Validate date (cannot be in the past)
        if (request.getReservationDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Reservation date cannot be in the past.");
        }

        // Validate max stalls limit (excluding the current reservation being updated)
        List<Reservation> activeReservations = reservationRepository.findByVendorUserProfileId(userProfile.getId())
                .stream()
                .filter(r -> !r.getId().equals(id) && !r.getStatus().equalsIgnoreCase("Cancelled") && !r.getStatus().equalsIgnoreCase("Rejected"))
                .collect(Collectors.toList());

        int otherReservedStalls = activeReservations.stream()
                .mapToInt(Reservation::getNumberOfStalls)
                .sum();

        if (otherReservedStalls + request.getNumberOfStalls() > 3) {
            throw new IllegalArgumentException("Business rule violation: You can reserve at most 3 stalls in total. Other reservations: " + otherReservedStalls);
        }

        // If a new document is provided, validate/save it and delete the old one
        if (request.getDocumentContentBase64() != null && !request.getDocumentContentBase64().isBlank()) {
            String oldPath = reservation.getDocumentPath();
            String docPath = saveDocument(request.getDocumentName(), request.getDocumentContentBase64());
            reservation.setDocumentName(request.getDocumentName());
            reservation.setDocumentPath(docPath);
            deleteDocument(oldPath);
        }

        // Apply updates
        Exhibition exhibition = exhibitionRepository.findById(request.getExhibitionId())
                .orElseThrow(() -> new IllegalArgumentException("Exhibition not found with ID: " + request.getExhibitionId()));

        reservation.setExhibition(exhibition);
        reservation.setReservationDate(request.getReservationDate());
        reservation.setStallType(request.getStallType());
        reservation.setStallSize(request.getStallSize());
        reservation.setNumberOfStalls(request.getNumberOfStalls());
        reservation.setBusinessCategory(request.getBusinessCategory());
        reservation.setSpecialRequirements(request.getSpecialRequirements());

        Reservation updated = reservationRepository.save(reservation);
        return new ReservationResponse(updated);
    }

    @Override
    @Transactional
    public void cancelReservation(Long id, UserProfile userProfile) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reservation not found"));

        // BOLA / IDOR Verification: Verify ownership or admin
        verifyOwnershipOrAdmin(reservation, userProfile);

        // Cancel status update
        reservation.setStatus("Cancelled");
        reservationRepository.save(reservation);
    }

    // Organizer actions
    @Override
    public List<ReservationResponse> getAllReservations() {
        return reservationRepository.findAll()
                .stream()
                .map(ReservationResponse::new)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReservationResponse updateReservationStatus(Long id, String status) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reservation not found"));

        // Status value is pre-validated by @Pattern on StatusUpdateRequest DTO;
        // the service check here provides an additional layer of defense (OWASP A03)
        if (!status.equalsIgnoreCase("Pending") && !status.equalsIgnoreCase("Approved") &&
            !status.equalsIgnoreCase("Rejected") && !status.equalsIgnoreCase("Cancelled")) {
            throw new IllegalArgumentException("Invalid reservation status: " + status);
        }

        reservation.setStatus(status);
        Reservation updated = reservationRepository.save(reservation);
        return new ReservationResponse(updated);
    }

    @Override
    @Transactional
    public void deleteReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reservation not found"));
        String docPath = reservation.getDocumentPath();
        reservationRepository.delete(reservation);
        deleteDocument(docPath);
    }

    private void verifyOwnershipOrAdmin(Reservation reservation, UserProfile userProfile) {
        // Enforce access control boundary (IDOR / BOLA mitigation)
        boolean isOrganizer = userProfile.getRole().equalsIgnoreCase("Organizer");
        boolean isOwner = reservation.getVendorUserProfile().getId().equals(userProfile.getId());
        
        if (!isOrganizer && !isOwner) {
            throw new AccessDeniedException("Access denied: You do not have permission to access this resource.");
        }
    }

    private String saveDocument(String originalName, String base64Content) {
        if (originalName == null || base64Content == null || base64Content.isBlank()) {
            return null;
        }

        // 1. Sanitize filename
        String cleanName = com.example.Book_Fair_Project.utils.FileValidationUtil.sanitizeFilename(originalName);

        // 2. Base64 decode
        byte[] bytes;
        try {
            // Strip data:url prefix if present (e.g. "data:application/pdf;base64,")
            if (base64Content.contains(",")) {
                base64Content = base64Content.substring(base64Content.indexOf(",") + 1);
            }
            bytes = java.util.Base64.getDecoder().decode(base64Content.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid Base64 encoding for document content.");
        }

        // 3. Validate size
        com.example.Book_Fair_Project.utils.FileValidationUtil.validateSize(bytes);

        // 4. Validate extension and magic bytes (signatures)
        com.example.Book_Fair_Project.utils.FileValidationUtil.validateFileType(cleanName, bytes);

        // 5. Save file securely with UUID prefix to prevent collisions/traversal
        try {
            java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads");
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }

            String uniqueName = java.util.UUID.randomUUID().toString() + "_" + cleanName;
            java.nio.file.Path targetPath = uploadDir.resolve(uniqueName);

            java.nio.file.Files.write(targetPath, bytes);

            return targetPath.toString();
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to save uploaded file on the server.", e);
        }
    }

    private void deleteDocument(String pathString) {
        if (pathString == null || pathString.isBlank()) {
            return;
        }
        try {
            java.nio.file.Path path = java.nio.file.Paths.get(pathString);
            java.nio.file.Files.deleteIfExists(path);
        } catch (java.io.IOException e) {
            System.err.println("Failed to delete file: " + pathString);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String getDocumentPath(Long id, UserProfile userProfile) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reservation not found"));

        // BOLA / IDOR Verification: Ensure the caller owns the reservation or is an Organizer
        verifyOwnershipOrAdmin(reservation, userProfile);

        if (reservation.getDocumentPath() == null || reservation.getDocumentPath().isBlank()) {
            throw new IllegalArgumentException("No document attached to this reservation.");
        }

        return reservation.getDocumentPath();
    }
}
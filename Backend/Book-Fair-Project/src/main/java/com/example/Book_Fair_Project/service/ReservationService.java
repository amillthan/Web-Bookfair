package com.example.Book_Fair_Project.service;

import com.example.Book_Fair_Project.dto.reservation.ReservationCreateRequest;
import com.example.Book_Fair_Project.dto.reservation.ReservationResponse;
import com.example.Book_Fair_Project.model.UserProfile;

import java.util.List;

public interface ReservationService {
    ReservationResponse createReservation(ReservationCreateRequest request, UserProfile userProfile);
    List<ReservationResponse> getMyReservations(UserProfile userProfile);
    ReservationResponse getReservationById(Long id, UserProfile userProfile);
    ReservationResponse getReservationByIdAsAdmin(Long id); // Admin/Organizer — no ownership check
    ReservationResponse updateReservation(Long id, ReservationCreateRequest request, UserProfile userProfile);
    void cancelReservation(Long id, UserProfile userProfile);
    String getDocumentPath(Long id, UserProfile userProfile);

    // Organizer actions
    List<ReservationResponse> getAllReservations();
    ReservationResponse updateReservationStatus(Long id, String status);
    void deleteReservation(Long id);
}

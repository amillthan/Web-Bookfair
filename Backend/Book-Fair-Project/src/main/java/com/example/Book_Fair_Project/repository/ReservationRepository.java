package com.example.Book_Fair_Project.repository;

import com.example.Book_Fair_Project.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByVendorUserProfileId(Long vendorUserId);
    List<Reservation> findByVendorUserProfileIdentityProviderUserId(String identityProviderUserId);
    long countByVendorUserProfileId(Long vendorUserId);
    long countByStatus(String status);
    long countByVendorUserProfileIdAndStatus(Long vendorUserId, String status);
}
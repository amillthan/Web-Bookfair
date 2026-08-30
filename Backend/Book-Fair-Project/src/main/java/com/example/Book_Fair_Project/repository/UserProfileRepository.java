package com.example.Book_Fair_Project.repository;

import com.example.Book_Fair_Project.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByIdentityProviderUserId(String identityProviderUserId);
    Optional<UserProfile> findByEmail(String email);
    long countByRole(String role);
}

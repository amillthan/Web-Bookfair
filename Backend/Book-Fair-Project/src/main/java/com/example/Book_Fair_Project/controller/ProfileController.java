package com.example.Book_Fair_Project.controller;

import com.example.Book_Fair_Project.dto.common.ApiResponse;
import com.example.Book_Fair_Project.dto.user.UserProfileResponse;
import com.example.Book_Fair_Project.dto.user.UserProfileUpdateRequest;
import com.example.Book_Fair_Project.model.UserProfile;
import com.example.Book_Fair_Project.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserProfileService userProfileService;

    public ProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    /**
     * GET /api/profile
     * Returns the authenticated user's stored profile.
     * Access: VENDOR and ORGANIZER (any authenticated user).
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('VENDOR', 'ORGANIZER')")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(@AuthenticationPrincipal UserProfile userProfile) {
        // Principal comes directly from the verified JWT — no parameter injection risk
        UserProfile profile = userProfileService.getProfileById(userProfile.getId());
        return ResponseEntity.ok(ApiResponse.ok("Profile retrieved successfully", new UserProfileResponse(profile), 200));
    }

    /**
     * PUT /api/profile
     * Updates mutable profile fields for the authenticated user.
     * Only name, contactNumber, and organizationName are accepted (mass assignment prevention).
     * Access: VENDOR and ORGANIZER.
     */
    @PutMapping
    @PreAuthorize("hasAnyRole('VENDOR', 'ORGANIZER')")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserProfile userProfile,
            @Valid @RequestBody UserProfileUpdateRequest updateRequest) {
        // Sub is taken from the verified JWT principal — never from the request body
        UserProfile profile = userProfileService.updateProfile(userProfile.getIdentityProviderUserId(), updateRequest);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", new UserProfileResponse(profile), 200));
    }
}


package com.example.Book_Fair_Project.controller;

import com.example.Book_Fair_Project.dto.common.ApiResponse;
import com.example.Book_Fair_Project.dto.user.UserProfileResponse;
import com.example.Book_Fair_Project.model.UserProfile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMe(@AuthenticationPrincipal UserProfile userProfile) {
        if (userProfile == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("Unauthenticated", 401));
        }
        return ResponseEntity.ok(ApiResponse.ok("Current authenticated user profile", new UserProfileResponse(userProfile), 200));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // Stateless API: Notify client to clear tokens and state locally
        return ResponseEntity.ok(ApiResponse.ok("Session terminated. Clear client token storage.", null, 200));
    }
}
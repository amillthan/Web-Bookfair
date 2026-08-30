package com.example.Book_Fair_Project.service;

import com.example.Book_Fair_Project.dto.user.UserProfileUpdateRequest;
import com.example.Book_Fair_Project.model.UserProfile;
import org.springframework.security.oauth2.jwt.Jwt;

public interface UserProfileService {
    UserProfile getOrCreateProfile(Jwt jwt);
    UserProfile getProfileById(Long id);
    UserProfile getProfileByIdentityProviderUserId(String sub);
    UserProfile updateProfile(String sub, UserProfileUpdateRequest updateRequest);
}

package com.example.Book_Fair_Project.service;

import com.example.Book_Fair_Project.dto.user.UserProfileUpdateRequest;
import com.example.Book_Fair_Project.exception.NotFoundException;
import com.example.Book_Fair_Project.model.UserProfile;
import com.example.Book_Fair_Project.repository.UserProfileRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileRepository userProfileRepository;

    public UserProfileServiceImpl(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    @Override
    @Transactional
    public UserProfile getOrCreateProfile(Jwt jwt) {
        String sub = jwt.getSubject();
        if (sub == null || sub.isBlank()) {
            throw new IllegalArgumentException("JWT subject (sub) claim is missing");
        }

        Optional<UserProfile> existingProfileOpt = userProfileRepository.findByIdentityProviderUserId(sub);

        // Trim all string claims before storing to prevent oversized data (OWASP A03)
        String email = trimClaim(jwt.getClaimAsString("email"));
        if (email == null) {
            email = trimClaim(jwt.getClaimAsString("email_address"));
        }
        if (email == null) {
            email = "no-email-" + sub + "@bookfair.com";
        }

        String name = trimClaim(jwt.getClaimAsString("name"));
        if (name == null) {
            name = trimClaim(jwt.getClaimAsString("preferred_username"));
        }
        if (name == null) {
            name = "User-" + sub.substring(Math.max(0, sub.length() - 8));
        }

        String username = trimClaim(jwt.getClaimAsString("preferred_username"));
        if (username == null) {
            username = trimClaim(jwt.getClaimAsString("nickname"));
        }
        if (username == null) {
            username = email.split("@")[0];
        }

        /**
         * Role resolution — Asgardeo claim priority (OWASP A07):
         *   1. "groups" claim  — standard Asgardeo group membership (preferred)
         *   2. "roles" claim   — generic fallback
         *   3. Auth0 namespace — backwards-compatibility during migration
         *
         * Recognized group names that grant Organizer-level access:
         *   "Organizer", "Admin", "Exhibition Organizer"
         * All other users are assigned the default "Vendor" role.
         */
        String resolvedRole = "Vendor";
        List<String> groups = jwt.getClaimAsStringList("groups");
        if (groups == null) {
            groups = jwt.getClaimAsStringList("roles");
        }
        if (groups == null) {
            groups = jwt.getClaimAsStringList("https://api.bookfair.com/roles");
        }
        if (groups != null) {
            for (String g : groups) {
                String normalized = g.trim().toLowerCase();
                if (normalized.equals("organizer") || normalized.equals("admin") ||
                    normalized.equals("exhibition organizer")) {
                    resolvedRole = "Organizer";
                    break;
                }
            }
        }

        if (existingProfileOpt.isPresent()) {
            UserProfile profile = existingProfileOpt.get();
            // Sync details if changed
            boolean updated = false;
            if (!profile.getEmail().equals(email)) {
                profile.setEmail(email);
                updated = true;
            }
            if (!profile.getName().equals(name)) {
                profile.setName(name);
                updated = true;
            }
            if (!profile.getUsername().equals(username)) {
                profile.setUsername(username);
                updated = true;
            }
            // If the OIDC token explicitly defined a role, sync it
            if (groups != null && !profile.getRole().equals(resolvedRole)) {
                profile.setRole(resolvedRole);
                updated = true;
            }
            if (updated) {
                return userProfileRepository.save(profile);
            }
            return profile;
        } else {
            // Check if email already registered under another ID (conflict mitigation)
            Optional<UserProfile> emailConflict = userProfileRepository.findByEmail(email);
            if (emailConflict.isPresent()) {
                UserProfile conflict = emailConflict.get();
                conflict.setIdentityProviderUserId(sub);
                conflict.setRole(resolvedRole);
                return userProfileRepository.save(conflict);
            }

            // Provision JIT Profile — trim optional claims to prevent oversized storage
            UserProfile newProfile = new UserProfile(
                    sub,
                    username,
                    name,
                    email,
                    trimClaim(jwt.getClaimAsString("phone_number")), // optional OIDC claim
                    trimClaim(jwt.getClaimAsString("organization")),  // optional OIDC claim
                    resolvedRole
            );
            return userProfileRepository.save(newProfile);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfile getProfileById(Long id) {
        return userProfileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User profile not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfile getProfileByIdentityProviderUserId(String sub) {
        return userProfileRepository.findByIdentityProviderUserId(sub)
                .orElseThrow(() -> new NotFoundException("User profile not found"));
    }

    @Override
    @Transactional
    public UserProfile updateProfile(String sub, UserProfileUpdateRequest updateRequest) {
        UserProfile profile = getProfileByIdentityProviderUserId(sub);
        // Only update the three explicitly allowed mutable fields (A04 — mass assignment prevention)
        profile.setName(updateRequest.getName());
        profile.setContactNumber(updateRequest.getContactNumber());
        profile.setOrganizationName(updateRequest.getOrganizationName());
        return userProfileRepository.save(profile);
    }

    /**
     * Trims and sanitizes a JWT string claim value.
     * Returns null if the value is null or blank — callers can then apply fallbacks.
     */
    private String trimClaim(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}

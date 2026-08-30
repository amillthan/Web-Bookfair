package com.example.Book_Fair_Project.config;

import com.example.Book_Fair_Project.model.UserProfile;
import com.example.Book_Fair_Project.service.UserProfileService;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class JwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UserProfileService userProfileService;

    public JwtAuthenticationConverter(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        // 1. Perform JIT provisioning and profile synchronization
        UserProfile userProfile = userProfileService.getOrCreateProfile(jwt);

        // 2. Build authorities list based on mapped role
        List<GrantedAuthority> authorities = new ArrayList<>();
        // Maps to ROLE_VENDOR or ROLE_ORGANIZER (matching SecurityConfig requirements)
        authorities.add(new SimpleGrantedAuthority("ROLE_" + userProfile.getRole().toUpperCase()));

        // 3. Return a standard UsernamePasswordAuthenticationToken, carrying the UserProfile as the Principal
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                userProfile, // Principal: our mapped domain UserProfile entity
                jwt,         // Credentials: the raw jwt token
                authorities
        );
        return token;
    }
}

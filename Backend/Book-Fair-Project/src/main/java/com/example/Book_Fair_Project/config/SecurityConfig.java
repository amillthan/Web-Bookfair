package com.example.Book_Fair_Project.config;

import com.example.Book_Fair_Project.filter.RateLimitingFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationConverter jwtAuthenticationConverter;

    @Value("${app.frontend.origin:http://localhost:5173}")
    private String frontendOrigin;

    public SecurityConfig(JwtAuthenticationConverter jwtAuthenticationConverter) {
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. CORS Configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // 2. CSRF Mitigation: Stateless API using Authorization header Bearer tokens is immune to standard cookie CSRF.
            .csrf(csrf -> csrf.disable())
            
            // 3. Stateless Session Management
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // 4. Secure Security Headers (OWASP A05: Security Misconfiguration)
            .headers(headers -> headers
                // Prevent MIME-type sniffing attacks (A05)
                .contentTypeOptions(contentType -> {})
                // Content Security Policy: restrict resource loading to same origin (A05, A03 XSS)
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; " +
                    "script-src 'self'; " +
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                    "font-src 'self' https://fonts.gstatic.com; " +
                    "img-src 'self' data:; " +
                    "frame-ancestors 'none'; " +
                    "object-src 'none';"
                ))
                // Deny embedding in iframes (clickjacking prevention, A05)
                .frameOptions(frame -> frame.deny())
                // Referrer policy: limit information sent to external sites
                .referrerPolicy(ref -> ref.policy(
                    org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN
                ))
                // HTTP Strict Transport Security: force HTTPS for 1 year (A02, A05)
                // Only enable when SSL is active; configure via environment for local dev
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000) // 1 year
                    .preload(false)
                )
                // Permissions-Policy: disable browser features not needed by the API
                // Using addHeaderWriter since permissionsPolicy() is deprecated in Spring Security 6.3+
                .addHeaderWriter(new org.springframework.security.web.header.writers.StaticHeadersWriter(
                    "Permissions-Policy",
                    "geolocation=(), microphone=(), camera=(), payment=(), usb=()"
                ))
            )
            
            // 5. Exception Handling
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json");
                    response.setStatus(401);
                    response.getWriter().write("{\"message\": \"Please login again.\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json");
                    response.setStatus(403);
                    response.getWriter().write("{\"message\": \"You do not have permission to access this resource.\"}");
                })
            )
            
            // 6. Endpoints Authorization Rules
            .authorizeHttpRequests(auth -> auth
                // Allow OPTIONS preflight requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // Static resources or public endpoints (if any)
                .requestMatchers("/api/public/**").permitAll()
                
                // Organizer-only endpoints
                .requestMatchers("/api/admin/**").hasRole("ORGANIZER")
                
                // Vendor & Organizer shared endpoints
                .requestMatchers("/api/reservations/my").hasRole("VENDOR")
                .requestMatchers(HttpMethod.POST, "/api/reservations").hasRole("VENDOR")
                .requestMatchers("/api/reservations/**").hasAnyRole("VENDOR", "ORGANIZER")
                .requestMatchers("/api/profile/**").hasAnyRole("VENDOR", "ORGANIZER")
                .requestMatchers("/api/exhibitions/**").hasAnyRole("VENDOR", "ORGANIZER")
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers("/api/auth/logout").authenticated()
                
                // Fallback authentication check for all other requests
                .anyRequest().authenticated()
            )
            
            // 7. JWT Validation via OIDC Resource Server Configuration
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Secure CORS configuration: Explicitly allow the frontend origin
        config.setAllowedOrigins(List.of(frontendOrigin));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

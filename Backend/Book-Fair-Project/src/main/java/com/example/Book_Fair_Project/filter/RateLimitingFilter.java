package com.example.Book_Fair_Project.filter;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import com.google.common.util.concurrent.RateLimiter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

/**
 * Rate Limiting Filter - OWASP A04:2021 (Insecure Design)
 * Prevents brute force attacks and DoS by limiting requests per IP address.
 *
 * Configuration via application.properties / environment variables:
 *   app.rate-limiting.enabled=true
 *   app.rate-limiting.requests-per-minute=100
 *   app.trusted-proxy-ip=127.0.0.1   (optional — IP of your reverse proxy)
 *
 * Security note on X-Forwarded-For:
 *   X-Forwarded-For is attacker-controlled and can be spoofed to bypass per-IP limits.
 *   This filter only trusts the header if the request comes from a known trusted proxy IP.
 *   If no trusted proxy is configured, getRemoteAddr() is always used directly.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    @Value("${app.rate-limiting.enabled:true}")
    private boolean rateLimitingEnabled;

    @Value("${app.rate-limiting.requests-per-minute:100}")
    private int requestsPerMinute;

    /**
     * Optional trusted reverse proxy IP.
     * Only trust X-Forwarded-For when the direct connection comes from this IP.
     * Leave blank to always use getRemoteAddr() (safe default for local dev).
     */
    @Value("${app.trusted-proxy-ip:}")
    private String trustedProxyIp;

    // Cache of rate limiters per IP address, with 10-minute expiration
    private final LoadingCache<String, RateLimiter> limiters = CacheBuilder.newBuilder()
            .maximumSize(10000) // Limit cache size to prevent memory exhaustion
            .expireAfterAccess(10, TimeUnit.MINUTES)
            .build(new CacheLoader<String, RateLimiter>() {
                @Override
                public RateLimiter load(String key) {
                    return RateLimiter.create(requestsPerMinute / 60.0);
                }
            });

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!rateLimitingEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String clientIp = getClientIp(request);
            RateLimiter rateLimiter = limiters.get(clientIp);

            if (!rateLimiter.tryAcquire()) {
                response.setStatus(429); // 429 Too Many Requests
                response.setContentType("application/json");
                response.getWriter().write(
                    "{\"message\": \"Rate limit exceeded. Maximum " + requestsPerMinute + " requests per minute allowed.\", \"status\": 429}"
                );
                return;
            }

            filterChain.doFilter(request, response);
        } catch (ExecutionException e) {
            logger.error("Rate limiting error: " + e.getMessage(), e);
            filterChain.doFilter(request, response); // Fail-open: allow request on filter error
        }
    }

    /**
     * Determines the real client IP address.
     *
     * Security: X-Forwarded-For is only trusted if the direct connection originates
     * from a configured trusted proxy IP. This prevents IP spoofing attacks where
     * an attacker sends "X-Forwarded-For: 1.2.3.4" to impersonate a different IP
     * and bypass per-IP rate limiting (OWASP A04).
     *
     * If no trusted proxy is configured (blank), getRemoteAddr() is always used.
     */
    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();

        // Only trust X-Forwarded-For if this request came directly from the trusted proxy
        if (trustedProxyIp != null && !trustedProxyIp.isBlank() && trustedProxyIp.equals(remoteAddr)) {
            String forwardedFor = request.getHeader("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                // X-Forwarded-For may contain multiple IPs; the leftmost is the original client
                return forwardedFor.split(",")[0].trim();
            }
        }

        return remoteAddr;
    }
}

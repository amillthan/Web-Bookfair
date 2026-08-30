package com.example.Book_Fair_Project.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * AuditLogService - OWASP A09:2021 (Security Logging and Monitoring Failures)
 *
 * Provides structured audit logging for security-relevant events.
 * All log entries include: timestamp (from SLF4J), event type, user sub (identity),
 * resource ID, and outcome. Sensitive data (tokens, passwords, PII) are NEVER logged.
 *
 * Log output is written to: logs/bookfair.log (see application.properties)
 */
@Service
public class AuditLogService {

    private static final Logger auditLog = LoggerFactory.getLogger("AUDIT");

    // ===== Authentication Events =====

    /**
     * Log a successful JIT profile provisioning (first login).
     */
    public void logJitProvisioning(String userSub, String role) {
        auditLog.info("[AUTH] JIT_PROVISION | sub={} | role={} | outcome=SUCCESS", sanitize(userSub), role);
    }

    /**
     * Log a profile sync on subsequent login (claims changed).
     */
    public void logProfileSync(String userSub, String fieldChanged) {
        auditLog.info("[AUTH] PROFILE_SYNC | sub={} | field={} | outcome=SUCCESS", sanitize(userSub), fieldChanged);
    }

    // ===== Reservation Events =====

    /**
     * Log reservation creation.
     */
    public void logReservationCreated(String userSub, Long reservationId, Long exhibitionId) {
        auditLog.info("[RESERVATION] CREATE | sub={} | reservationId={} | exhibitionId={} | outcome=SUCCESS",
                sanitize(userSub), reservationId, exhibitionId);
    }

    /**
     * Log reservation cancellation.
     */
    public void logReservationCancelled(String userSub, Long reservationId, String reason) {
        auditLog.info("[RESERVATION] CANCEL | sub={} | reservationId={} | reason={} | outcome=SUCCESS",
                sanitize(userSub), reservationId, reason);
    }

    /**
     * Log reservation status change by organizer.
     */
    public void logReservationStatusUpdated(String organizerSub, Long reservationId, String oldStatus, String newStatus) {
        auditLog.info("[RESERVATION] STATUS_UPDATE | organizerSub={} | reservationId={} | from={} | to={} | outcome=SUCCESS",
                sanitize(organizerSub), reservationId, oldStatus, newStatus);
    }

    /**
     * Log reservation deletion by organizer.
     */
    public void logReservationDeleted(String organizerSub, Long reservationId) {
        auditLog.info("[RESERVATION] DELETE | organizerSub={} | reservationId={} | outcome=SUCCESS",
                sanitize(organizerSub), reservationId);
    }

    // ===== Access Control Events =====

    /**
     * Log an access denied event (BOLA/IDOR violation attempt).
     */
    public void logAccessDenied(String userSub, String resource, String resourceId) {
        auditLog.warn("[ACCESS] DENIED | sub={} | resource={} | resourceId={} | outcome=BLOCKED",
                sanitize(userSub), resource, resourceId);
    }

    /**
     * Log a role escalation attempt (e.g., vendor trying to access admin endpoint).
     */
    public void logRoleViolation(String userSub, String attemptedRole, String endpoint) {
        auditLog.warn("[ACCESS] ROLE_VIOLATION | sub={} | attemptedRole={} | endpoint={} | outcome=BLOCKED",
                sanitize(userSub), attemptedRole, sanitize(endpoint));
    }

    // ===== Profile Events =====

    /**
     * Log a profile update.
     */
    public void logProfileUpdated(String userSub) {
        auditLog.info("[PROFILE] UPDATE | sub={} | outcome=SUCCESS", sanitize(userSub));
    }

    // ===== Utility =====

    /**
     * Sanitize a value before logging to prevent log injection attacks.
     * Replaces newlines and carriage returns that could forge log entries.
     */
    private String sanitize(String value) {
        if (value == null) return "null";
        return value.replaceAll("[\n\r\t]", "_");
    }
}

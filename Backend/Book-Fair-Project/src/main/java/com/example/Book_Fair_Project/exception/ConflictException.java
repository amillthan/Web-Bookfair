package com.example.Book_Fair_Project.exception;

import org.springframework.http.HttpStatus;

public class ConflictException extends RuntimeException {
    private final HttpStatus status = HttpStatus.CONFLICT;
    public ConflictException(String message) { super(message); }
    public HttpStatus getStatus() { return status; }
}

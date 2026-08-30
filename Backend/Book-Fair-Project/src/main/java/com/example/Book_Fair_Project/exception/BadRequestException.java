package com.example.Book_Fair_Project.exception;

import org.springframework.http.HttpStatus;

public class BadRequestException extends RuntimeException {
    private final HttpStatus status = HttpStatus.BAD_REQUEST;
    public BadRequestException(String message) { super(message); }
    public HttpStatus getStatus() { return status; }
}
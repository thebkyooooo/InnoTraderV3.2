package com.innotrader.common.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global exception handler that translates exceptions into RFC 9457 Problem Details responses.
 *
 * <p>All responses include a {@code traceId} sourced from {@link MDC} (key: {@code traceId})
 * for log correlation. Populate the MDC key in a servlet filter or Spring Security filter
 * (e.g. via {@code MDC.put("traceId", UUID.randomUUID().toString())}).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String TRACE_ID_KEY = "traceId";

    // -------------------------------------------------------------------------
    // Validation errors
    // -------------------------------------------------------------------------

    /**
     * Handles {@code @Valid} / {@code @Validated} bean validation failures on request bodies.
     * Returns 400 with a list of field-level error details.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        List<Map<String, String>> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> {
                    Object rejected = fe.getRejectedValue();
                    return Map.of(
                            "field", fe.getField(),
                            "rejectedValue", rejected == null ? "" : rejected.toString(),
                            "message", fe.getDefaultMessage() == null ? "" : fe.getDefaultMessage()
                    );
                })
                .collect(Collectors.toList());

        ErrorResponse base = ErrorResponse.of(
                ErrorCode.INVALID_INPUT,
                "Validation failed for one or more fields",
                request,
                traceId()
        );

        Map<String, Object> body = Map.of(
                "type", base.type(),
                "title", base.title(),
                "status", base.status(),
                "code", base.code(),
                "detail", base.detail(),
                "instance", base.instance(),
                "timestamp", base.timestamp(),
                "traceId", base.traceId() == null ? "" : base.traceId(),
                "errors", fieldErrors
        );

        log.warn("Validation error on {}: {}", request.getRequestURI(), fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Handles constraint violations raised by method-level {@code @Validated} (path/query params).
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request) {

        String detail = ex.getConstraintViolations()
                .stream()
                .map(cv -> cv.getPropertyPath() + ": " + cv.getMessage())
                .collect(Collectors.joining("; "));

        log.warn("Constraint violation on {}: {}", request.getRequestURI(), detail);
        ErrorResponse body = ErrorResponse.of(ErrorCode.INVALID_INPUT, detail, request, traceId());
        return ResponseEntity.badRequest().body(body);
    }

    // -------------------------------------------------------------------------
    // Business exceptions
    // -------------------------------------------------------------------------

    /**
     * Handles all {@link BusinessException} subtypes, mapping them to their declared HTTP status.
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException ex,
            HttpServletRequest request) {

        ErrorCode code = ex.getErrorCode();
        log.warn("Business exception [{}] on {}: {}", code.getCode(), request.getRequestURI(), ex.getMessage());
        ErrorResponse body = ErrorResponse.of(code, ex.getMessage(), request, traceId());
        return ResponseEntity.status(code.getHttpStatus().value()).body(body);
    }

    // -------------------------------------------------------------------------
    // Spring MVC infrastructure exceptions
    // -------------------------------------------------------------------------

    /**
     * Handles Spring 6 {@link NoResourceFoundException} (replaces {@code NoHandlerFoundException}).
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(
            NoResourceFoundException ex,
            HttpServletRequest request) {

        log.debug("No resource found: {}", request.getRequestURI());
        ErrorResponse body = ErrorResponse.of(
                ErrorCode.ORDER_NOT_FOUND,   // reuse 404 code; adjust if a COMMON_NOT_FOUND is added
                "No resource found at " + request.getRequestURI(),
                request,
                traceId()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // -------------------------------------------------------------------------
    // Catch-all
    // -------------------------------------------------------------------------

    /**
     * Catch-all handler for unhandled exceptions — returns 500.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(
            Exception ex,
            HttpServletRequest request) {

        log.error("Unhandled exception on {}", request.getRequestURI(), ex);
        ErrorResponse body = ErrorResponse.of(
                ErrorCode.INTERNAL_SERVER_ERROR,
                ErrorCode.INTERNAL_SERVER_ERROR.getMessage(),
                request,
                traceId()
        );
        return ResponseEntity.internalServerError().body(body);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String traceId() {
        return MDC.get(TRACE_ID_KEY);
    }
}

package com.innotrader.common.error;

import jakarta.servlet.http.HttpServletRequest;

import java.time.Instant;
import java.time.format.DateTimeFormatter;

/**
 * RFC 9457 Problem Details–based error response.
 *
 * <p>Fields:
 * <ul>
 *   <li>{@code type}     — URI reference identifying the problem type</li>
 *   <li>{@code title}    — short human-readable summary of the problem type</li>
 *   <li>{@code status}   — HTTP status code</li>
 *   <li>{@code code}     — application-specific error code (from {@link ErrorCode})</li>
 *   <li>{@code detail}   — human-readable explanation specific to this occurrence</li>
 *   <li>{@code instance} — URI reference identifying the specific occurrence (request path)</li>
 *   <li>{@code timestamp} — ISO-8601 timestamp of the error</li>
 *   <li>{@code traceId}  — MDC trace identifier for log correlation</li>
 * </ul>
 */
public record ErrorResponse(
        String type,
        String title,
        int status,
        String code,
        String detail,
        String instance,
        String timestamp,
        String traceId
) {

    private static final String TYPE_BASE_URI = "https://innotrader.com/errors/";

    /**
     * Creates an {@link ErrorResponse} from an {@link ErrorCode} with the default message.
     *
     * @param errorCode the error code
     * @param instance  the request URI (used as {@code instance})
     * @param traceId   the MDC trace ID
     */
    public static ErrorResponse of(ErrorCode errorCode, String instance, String traceId) {
        return of(errorCode, errorCode.getMessage(), instance, traceId);
    }

    /**
     * Creates an {@link ErrorResponse} from an {@link ErrorCode} with a custom detail message.
     *
     * @param errorCode the error code
     * @param detail    custom detail message
     * @param instance  the request URI (used as {@code instance})
     * @param traceId   the MDC trace ID
     */
    public static ErrorResponse of(ErrorCode errorCode, String detail, String instance, String traceId) {
        return new ErrorResponse(
                TYPE_BASE_URI + errorCode.getCode().toLowerCase().replace('_', '-'),
                errorCode.getMessage(),
                errorCode.getHttpStatus().value(),
                errorCode.getCode(),
                detail,
                instance,
                DateTimeFormatter.ISO_INSTANT.format(Instant.now()),
                traceId
        );
    }

    /**
     * Convenience factory that resolves the instance path from an {@link HttpServletRequest}.
     */
    public static ErrorResponse of(ErrorCode errorCode, String detail,
                                   HttpServletRequest request, String traceId) {
        return of(errorCode, detail, request.getRequestURI(), traceId);
    }
}

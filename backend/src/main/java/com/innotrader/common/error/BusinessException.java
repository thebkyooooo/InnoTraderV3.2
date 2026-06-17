package com.innotrader.common.error;

/**
 * Base runtime exception for all application-level business rule violations.
 *
 * <p>Throw a subclass (or this class directly) whenever a domain/application rule is violated
 * and the error should be translated to a structured {@link ErrorResponse} by
 * {@link GlobalExceptionHandler}.
 */
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    /**
     * Creates a {@link BusinessException} with the default message from the given {@link ErrorCode}.
     *
     * @param errorCode the error code describing the violation
     */
    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    /**
     * Creates a {@link BusinessException} with a custom detail message.
     *
     * @param errorCode the error code describing the violation
     * @param detail    additional context about this specific occurrence
     */
    public BusinessException(ErrorCode errorCode, String detail) {
        super(detail);
        this.errorCode = errorCode;
    }

    /**
     * Returns the {@link ErrorCode} associated with this exception.
     */
    public ErrorCode getErrorCode() {
        return errorCode;
    }
}

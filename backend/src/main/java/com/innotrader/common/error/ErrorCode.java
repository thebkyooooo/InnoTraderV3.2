package com.innotrader.common.error;

import org.springframework.http.HttpStatus;

/**
 * Application-wide error codes.
 *
 * <p>Each constant carries:
 * <ul>
 *   <li>{@link HttpStatus} — the HTTP status code to return</li>
 *   <li>{@code code} — a machine-readable string identifier (used in {@code ErrorResponse})</li>
 *   <li>{@code message} — a human-readable default message</li>
 * </ul>
 */
public enum ErrorCode {

    // -------------------------------------------------------------------------
    // COMMON
    // -------------------------------------------------------------------------
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "COMMON_001", "Invalid input value"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_002", "An unexpected error occurred"),

    // -------------------------------------------------------------------------
    // AUTH
    // -------------------------------------------------------------------------
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH_001", "Authentication is required"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "AUTH_002", "Access is denied"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "AUTH_003", "Token has expired"),
    AUTH_DUPLICATE_EMAIL(HttpStatus.CONFLICT, "AUTH_011", "이미 사용 중인 이메일입니다."),
    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "AUTH_012", "이메일 또는 비밀번호가 올바르지 않습니다."),
    AUTH_INACTIVE_USER(HttpStatus.FORBIDDEN, "AUTH_013", "비활성화된 계정입니다."),
    AUTH_TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "AUTH_014", "유효하지 않은 토큰입니다."),
    AUTH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "AUTH_015", "만료된 토큰입니다."),
    AUTH_REFRESH_TOKEN_REUSED(HttpStatus.UNAUTHORIZED, "AUTH_016", "비정상적인 토큰 사용이 감지되었습니다. 재로그인해 주세요."),
    AUTH_TOO_MANY_ATTEMPTS(HttpStatus.TOO_MANY_REQUESTS, "AUTH_017", "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요."),

    // -------------------------------------------------------------------------
    // USER
    // -------------------------------------------------------------------------
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_001", "User not found"),
    USER_ALREADY_EXISTS(HttpStatus.CONFLICT, "USER_002", "Email is already registered"),
    USER_NOT_ACTIVE(HttpStatus.UNPROCESSABLE_ENTITY, "USER_003", "User account is not active"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "USER_004", "Invalid email or password"),
    TOKEN_REUSE_DETECTED(HttpStatus.UNAUTHORIZED, "USER_005", "Refresh token reuse detected — all sessions invalidated"),

    // -------------------------------------------------------------------------
    // ORDER
    // -------------------------------------------------------------------------
    INSUFFICIENT_BALANCE(HttpStatus.UNPROCESSABLE_ENTITY, "ORDER_001", "Insufficient account balance"),
    DUPLICATE_ORDER(HttpStatus.CONFLICT, "ORDER_002", "Duplicate order request"),
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "ORDER_003", "Order not found"),

    // -------------------------------------------------------------------------
    // PORTFOLIO
    // -------------------------------------------------------------------------
    POSITION_NOT_FOUND(HttpStatus.NOT_FOUND, "PORTFOLIO_001", "Position not found"),

    // -------------------------------------------------------------------------
    // ACCOUNT
    // -------------------------------------------------------------------------
    ACCOUNT_NOT_FOUND(HttpStatus.NOT_FOUND, "ACCOUNT_001", "계좌를 찾을 수 없습니다."),

    // -------------------------------------------------------------------------
    // WATCHLIST
    // -------------------------------------------------------------------------
    WATCHLIST_GROUP_NOT_FOUND(HttpStatus.NOT_FOUND, "WATCHLIST_001", "관심그룹을 찾을 수 없습니다."),
    WATCHLIST_GROUP_LIMIT(HttpStatus.UNPROCESSABLE_ENTITY, "WATCHLIST_002", "관심그룹은 최대 100개까지 등록할 수 있습니다."),
    WATCHLIST_ITEM_LIMIT(HttpStatus.UNPROCESSABLE_ENTITY, "WATCHLIST_003", "그룹당 관심종목은 최대 100개까지 등록할 수 있습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String code, String message) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}

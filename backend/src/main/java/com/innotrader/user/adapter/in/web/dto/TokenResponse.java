package com.innotrader.user.adapter.in.web.dto;

/**
 * HTTP response body carrying a JWT access token.
 *
 * <p>The refresh token is delivered as an HttpOnly cookie by the controller
 * and is therefore intentionally absent from this DTO.
 *
 * @param accessToken signed JWT access token string
 * @param tokenType   always {@code "Bearer"}
 * @param expiresIn   remaining lifetime of the access token in seconds
 */
public record TokenResponse(
        String accessToken,
        String tokenType,
        long   expiresIn
) {}

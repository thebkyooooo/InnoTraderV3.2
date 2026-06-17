package com.innotrader.user.domain.port.in;

import com.innotrader.user.domain.model.User;

/**
 * Inbound port: authenticate a user and issue JWT tokens.
 */
public interface LoginUseCase {

    /**
     * Command carrying login credentials.
     *
     * @param email       raw email string
     * @param rawPassword plain-text password
     */
    record LoginCommand(String email, String rawPassword) {}

    /**
     * Result returned on successful authentication.
     *
     * @param accessToken  short-lived JWT access token (15 min)
     * @param refreshToken long-lived JWT refresh token (14 days)
     * @param user         the authenticated user aggregate
     */
    record LoginResult(String accessToken, String refreshToken, User user) {}

    /**
     * Authenticates the user and returns a {@link LoginResult} containing JWT tokens.
     *
     * @param command login credentials
     * @return tokens and the authenticated user
     */
    LoginResult login(LoginCommand command);
}

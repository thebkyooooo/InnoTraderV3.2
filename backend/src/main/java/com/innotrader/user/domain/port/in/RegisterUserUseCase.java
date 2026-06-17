package com.innotrader.user.domain.port.in;

import com.innotrader.user.domain.model.User;

/**
 * Inbound port: register a new user account.
 */
public interface RegisterUserUseCase {

    /**
     * Command carrying the data needed to register a new user.
     *
     * @param email       raw (unvalidated) email string
     * @param rawPassword plain-text password — will be hashed by the use-case implementation
     */
    record RegisterUserCommand(String email, String rawPassword) {}

    /**
     * Registers a new user and returns the created {@link User} aggregate.
     *
     * @param command registration data
     * @return the persisted user aggregate
     */
    User register(RegisterUserCommand command);
}

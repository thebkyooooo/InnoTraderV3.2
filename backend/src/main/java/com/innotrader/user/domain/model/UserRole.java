package com.innotrader.user.domain.model;

/**
 * Roles assignable to a {@link User} aggregate.
 * Values are prefixed with {@code ROLE_} to align with Spring Security conventions.
 */
public enum UserRole {
    ROLE_USER,
    ROLE_ADMIN
}

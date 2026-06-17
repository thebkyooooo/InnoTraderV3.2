package com.innotrader.user.adapter.in.web.dto;

import com.innotrader.user.domain.model.User;

/**
 * HTTP response body representing a user resource.
 *
 * @param userId UUID string identifying the user
 * @param email  normalised e-mail address
 * @param role   Spring Security role string (e.g. {@code ROLE_USER})
 * @param status lifecycle status (e.g. {@code ACTIVE})
 */
public record UserResponse(
        String userId,
        String email,
        String role,
        String status
) {

    /**
     * Maps a domain {@link User} aggregate to a {@link UserResponse}.
     *
     * @param user the domain aggregate to convert
     * @return a new {@code UserResponse} with values derived from the aggregate
     */
    public static UserResponse from(User user) {
        return new UserResponse(
                user.id().toString(),
                user.email().value(),
                user.role().name(),
                user.status().name()
        );
    }
}

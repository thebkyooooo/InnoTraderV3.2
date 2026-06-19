package com.innotrader.user.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link UserJpaEntity}.
 *
 * <p>Extended query methods mirror the outbound port contract so that the
 * persistence adapter can delegate directly without writing JPQL.
 */
public interface UserJpaRepository extends JpaRepository<UserJpaEntity, UUID> {

    /**
     * Finds a user by their e-mail address (case-sensitive, stored lowercase).
     *
     * @param email normalised lowercase e-mail string
     * @return an {@link Optional} containing the entity, or empty if not found
     */
    Optional<UserJpaEntity> findByEmail(String email);

    /**
     * Checks whether a user with the given e-mail address already exists.
     *
     * @param email normalised lowercase e-mail string
     * @return {@code true} if a row exists
     */
    boolean existsByEmail(String email);
}

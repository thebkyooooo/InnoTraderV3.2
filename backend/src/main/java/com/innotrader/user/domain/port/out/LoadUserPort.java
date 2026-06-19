package com.innotrader.user.domain.port.out;

import com.innotrader.user.domain.model.Email;
import com.innotrader.user.domain.model.User;
import com.innotrader.user.domain.model.UserId;

import java.util.Optional;

/**
 * Outbound port: load a {@link User} aggregate from the persistence layer.
 */
public interface LoadUserPort {

    /**
     * Finds a user by their e-mail address.
     *
     * @param email validated email value object
     * @return an {@link Optional} containing the user, or empty if not found
     */
    Optional<User> loadByEmail(Email email);

    /**
     * Finds a user by their unique ID.
     *
     * @param id the user's {@link UserId}
     * @return an {@link Optional} containing the user, or empty if not found
     */
    Optional<User> loadById(UserId id);
}

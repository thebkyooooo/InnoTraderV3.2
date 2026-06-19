package com.innotrader.user.domain.port.out;

import com.innotrader.user.domain.model.User;

/**
 * Outbound port: persist a {@link User} aggregate.
 */
public interface SaveUserPort {

    /**
     * Persists the given user (insert or update) and returns the saved state.
     *
     * @param user the user aggregate to save
     * @return the saved user aggregate (may differ from input if the adapter enriches it)
     */
    User save(User user);
}

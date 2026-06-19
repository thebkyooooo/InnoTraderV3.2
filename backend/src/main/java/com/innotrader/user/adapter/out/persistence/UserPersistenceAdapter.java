package com.innotrader.user.adapter.out.persistence;

import com.innotrader.common.annotation.PersistenceAdapter;
import com.innotrader.user.domain.model.Email;
import com.innotrader.user.domain.model.User;
import com.innotrader.user.domain.model.UserId;
import com.innotrader.user.domain.port.out.LoadUserPort;
import com.innotrader.user.domain.port.out.SaveUserPort;

import java.util.Objects;
import java.util.Optional;

/**
 * Persistence adapter implementing both {@link LoadUserPort} and {@link SaveUserPort}.
 *
 * <p>Translates between the domain {@link User} aggregate and the JPA-managed
 * {@link UserJpaEntity}, keeping the domain model free of persistence annotations.
 */
@PersistenceAdapter
public class UserPersistenceAdapter implements LoadUserPort, SaveUserPort {

    private final UserJpaRepository userJpaRepository;

    public UserPersistenceAdapter(UserJpaRepository userJpaRepository) {
        this.userJpaRepository = userJpaRepository;
    }

    // -----------------------------------------------------------------------
    // SaveUserPort
    // -----------------------------------------------------------------------

    /**
     * Persists (inserts or updates) the given user aggregate and returns the saved state
     * reconstituted as a domain object.
     */
    @Override
    public User save(User user) {
        UserJpaEntity entity = UserJpaEntity.fromDomain(user);
        UserJpaEntity saved  = userJpaRepository.save(Objects.requireNonNull(entity));
        return saved.toDomain();
    }

    // -----------------------------------------------------------------------
    // LoadUserPort
    // -----------------------------------------------------------------------

    /**
     * Finds a user by their validated {@link Email} value object.
     */
    @Override
    public Optional<User> loadByEmail(Email email) {
        return userJpaRepository.findByEmail(email.value())
                .map(UserJpaEntity::toDomain);
    }

    /**
     * Finds a user by their {@link UserId}.
     */
    @Override
    public Optional<User> loadById(UserId id) {
        return userJpaRepository.findById(Objects.requireNonNull(id.value()))
                .map(UserJpaEntity::toDomain);
    }
}

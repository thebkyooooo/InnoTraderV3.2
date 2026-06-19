package com.innotrader.user.adapter.out.persistence;

import com.innotrader.common.domain.BaseEntity;
import com.innotrader.user.domain.model.Email;
import com.innotrader.user.domain.model.User;
import com.innotrader.user.domain.model.UserId;
import com.innotrader.user.domain.model.UserRole;
import com.innotrader.user.domain.model.UserStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

import static lombok.AccessLevel.PROTECTED;

/**
 * JPA entity for the {@code users} table.
 *
 * <p>Intentionally kept separate from the domain {@link User} aggregate — persistence
 * concerns (column names, indexes, JPA lifecycle) do not leak into the domain model.
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = PROTECTED)
public class UserJpaEntity extends BaseEntity {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "email", unique = true, nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "role", nullable = false, length = 50)
    private String role;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    private UserJpaEntity(UUID id, String email, String passwordHash, String role, String status) {
        this.id           = id;
        this.email        = email;
        this.passwordHash = passwordHash;
        this.role         = role;
        this.status       = status;
    }

    // -----------------------------------------------------------------------
    // Mapping helpers
    // -----------------------------------------------------------------------

    /**
     * Converts this JPA entity back to the domain {@link User} aggregate.
     */
    public User toDomain() {
        return User.reconstitute(
                UserId.of(id),
                Email.of(email),
                passwordHash,
                UserRole.valueOf(role),
                UserStatus.valueOf(status)
        );
    }

    /**
     * Creates a {@link UserJpaEntity} from a domain {@link User} aggregate.
     */
    public static UserJpaEntity fromDomain(User user) {
        return new UserJpaEntity(
                user.id().value(),
                user.email().value(),
                user.passwordHash(),
                user.role().name(),
                user.status().name()
        );
    }
}

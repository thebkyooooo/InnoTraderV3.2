package com.innotrader.user.domain.model;

import com.innotrader.common.error.BusinessException;
import com.innotrader.common.error.ErrorCode;

import java.util.Objects;

/**
 * User Aggregate Root — pure domain model, no framework or persistence annotations.
 *
 * <p>All state transitions are enforced through domain methods so invariants are
 * maintained regardless of which application service drives the change.
 */
public final class User {

    private final UserId id;
    private final Email email;
    private final String passwordHash;
    private UserRole role;
    private UserStatus status;

    private User(UserId id, Email email, String passwordHash, UserRole role, UserStatus status) {
        this.id           = Objects.requireNonNull(id,           "id must not be null");
        this.email        = Objects.requireNonNull(email,        "email must not be null");
        this.passwordHash = Objects.requireNonNull(passwordHash, "passwordHash must not be null");
        this.role         = Objects.requireNonNull(role,         "role must not be null");
        this.status       = Objects.requireNonNull(status,       "status must not be null");
    }

    /**
     * Creates a new {@link User} with a generated {@link UserId}, {@link UserRole#ROLE_USER}
     * and {@link UserStatus#ACTIVE}.
     *
     * @param email        validated email value object
     * @param passwordHash BCrypt-hashed password (never store raw passwords here)
     * @return newly created, unsaved User aggregate
     */
    public static User create(Email email, String passwordHash) {
        return new User(
                UserId.generate(),
                email,
                passwordHash,
                UserRole.ROLE_USER,
                UserStatus.ACTIVE
        );
    }

    /**
     * Reconstitutes a {@link User} from persistence — all fields provided explicitly.
     */
    public static User reconstitute(UserId id, Email email, String passwordHash,
                                    UserRole role, UserStatus status) {
        return new User(id, email, passwordHash, role, status);
    }

    // -----------------------------------------------------------------------
    // Queries
    // -----------------------------------------------------------------------

    public UserId id()            { return id; }
    public Email email()          { return email; }
    public String passwordHash()  { return passwordHash; }
    public UserRole role()        { return role; }
    public UserStatus status()    { return status; }

    /** Returns {@code true} when this user may log in and trade. */
    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }

    // -----------------------------------------------------------------------
    // Commands
    // -----------------------------------------------------------------------

    /**
     * Suspends the user.
     *
     * @throws BusinessException with {@link ErrorCode#USER_NOT_ACTIVE} if the user
     *                           is not currently {@link UserStatus#ACTIVE}.
     */
    public void suspend() {
        if (status != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.USER_NOT_ACTIVE,
                    "Cannot suspend user that is not ACTIVE (current status: " + status + ")");
        }
        this.status = UserStatus.SUSPENDED;
    }

    /**
     * Changes the role assigned to this user.
     *
     * @param newRole the role to assign; must not be {@code null}
     */
    public void changeRole(UserRole newRole) {
        this.role = Objects.requireNonNull(newRole, "newRole must not be null");
    }

    // -----------------------------------------------------------------------
    // equals / hashCode — identity based on id
    // -----------------------------------------------------------------------

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User other)) return false;
        return id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }

    @Override
    public String toString() {
        return "User{id=" + id + ", email=" + email + ", role=" + role + ", status=" + status + "}";
    }
}

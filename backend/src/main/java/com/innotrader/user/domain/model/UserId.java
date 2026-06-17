package com.innotrader.user.domain.model;

import java.util.Objects;
import java.util.UUID;

/**
 * Type-safe, immutable Value Object wrapping a UUID to identify a User aggregate.
 */
public final class UserId {

    private final UUID value;

    private UserId(UUID value) {
        this.value = Objects.requireNonNull(value, "UserId value must not be null");
    }

    /** Creates a {@code UserId} from an existing {@link UUID}. */
    public static UserId of(UUID value) {
        return new UserId(value);
    }

    /** Creates a {@code UserId} from a UUID string representation. */
    public static UserId of(String value) {
        return new UserId(UUID.fromString(value));
    }

    /** Generates a new random {@code UserId}. */
    public static UserId generate() {
        return new UserId(UUID.randomUUID());
    }

    /** Returns the underlying {@link UUID}. */
    public UUID value() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserId other)) return false;
        return value.equals(other.value);
    }

    @Override
    public int hashCode() {
        return value.hashCode();
    }

    @Override
    public String toString() {
        return value.toString();
    }
}

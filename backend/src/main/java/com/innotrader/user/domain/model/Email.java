package com.innotrader.user.domain.model;

import java.util.Objects;
import java.util.regex.Pattern;

/**
 * Immutable Value Object representing a validated, lowercase-normalised e-mail address.
 */
public final class Email {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$");

    private final String value;

    private Email(String value) {
        Objects.requireNonNull(value, "Email value must not be null");
        String normalised = value.strip().toLowerCase();
        if (!EMAIL_PATTERN.matcher(normalised).matches()) {
            throw new IllegalArgumentException("Invalid email format: " + value);
        }
        this.value = normalised;
    }

    /** Factory method — validates and normalises the raw string. */
    public static Email of(String value) {
        return new Email(value);
    }

    /** Returns the lowercase, validated e-mail string. */
    public String value() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Email other)) return false;
        return value.equals(other.value);
    }

    @Override
    public int hashCode() {
        return value.hashCode();
    }

    @Override
    public String toString() {
        return value;
    }
}

package com.innotrader.common.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Immutable value object representing a monetary amount with a currency.
 *
 * <p>Designed as a JPA {@link Embeddable} so it can be embedded directly into entity classes.
 * All arithmetic operations return a new {@link Money} instance (immutability guarantee).
 *
 * <p>Invariant: {@code amount >= 0}. Constructors and factory methods enforce this.
 */
@Embeddable
public final class Money {

    private static final String DEFAULT_CURRENCY = "KRW";
    private static final int SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    @Column(name = "amount", precision = 20, scale = 2, nullable = false)
    private final BigDecimal amount;

    @Column(name = "currency", length = 10, nullable = false)
    private final String currency;

    /**
     * Required no-arg constructor for JPA.
     */
    protected Money() {
        this.amount = BigDecimal.ZERO;
        this.currency = DEFAULT_CURRENCY;
    }

    private Money(BigDecimal amount, String currency) {
        Objects.requireNonNull(amount, "amount must not be null");
        Objects.requireNonNull(currency, "currency must not be null");
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Money amount must be >= 0, got: " + amount);
        }
        this.amount = amount.setScale(SCALE, ROUNDING);
        this.currency = currency;
    }

    // -------------------------------------------------------------------------
    // Static factory methods
    // -------------------------------------------------------------------------

    /**
     * Creates a {@link Money} with the given amount and currency code.
     *
     * @param amount   non-negative monetary amount
     * @param currency ISO 4217 currency code (e.g. "KRW", "USD")
     */
    public static Money of(BigDecimal amount, String currency) {
        return new Money(amount, currency);
    }

    /**
     * Creates a KRW-denominated {@link Money}.
     *
     * @param amount non-negative monetary amount in KRW
     */
    public static Money krw(BigDecimal amount) {
        return new Money(amount, DEFAULT_CURRENCY);
    }

    /**
     * Creates a zero-value KRW {@link Money}.
     */
    public static Money zero() {
        return new Money(BigDecimal.ZERO, DEFAULT_CURRENCY);
    }

    // -------------------------------------------------------------------------
    // Arithmetic
    // -------------------------------------------------------------------------

    /**
     * Returns a new {@link Money} representing {@code this + other}.
     *
     * @throws IllegalArgumentException if currencies differ
     */
    public Money plus(Money other) {
        assertSameCurrency(other);
        return new Money(this.amount.add(other.amount), this.currency);
    }

    /**
     * Returns a new {@link Money} representing {@code this - other}.
     *
     * @throws IllegalArgumentException if currencies differ or result would be negative
     */
    public Money minus(Money other) {
        assertSameCurrency(other);
        BigDecimal result = this.amount.subtract(other.amount);
        if (result.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                "Subtraction would result in negative money: " + this.amount + " - " + other.amount);
        }
        return new Money(result, this.currency);
    }

    /**
     * Returns a new {@link Money} representing {@code this * multiplier}.
     *
     * @param multiplier non-negative multiplier
     */
    public Money multiply(BigDecimal multiplier) {
        Objects.requireNonNull(multiplier, "multiplier must not be null");
        return new Money(this.amount.multiply(multiplier), this.currency);
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public boolean isGreaterThan(Money other) {
        assertSameCurrency(other);
        return this.amount.compareTo(other.amount) > 0;
    }

    public boolean isGreaterThanOrEqualTo(Money other) {
        assertSameCurrency(other);
        return this.amount.compareTo(other.amount) >= 0;
    }

    // -------------------------------------------------------------------------
    // equals / hashCode / toString
    // -------------------------------------------------------------------------

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money money)) return false;
        return amount.compareTo(money.amount) == 0
                && Objects.equals(currency, money.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount.stripTrailingZeros(), currency);
    }

    @Override
    public String toString() {
        return amount.toPlainString() + " " + currency;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private void assertSameCurrency(Money other) {
        Objects.requireNonNull(other, "other Money must not be null");
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException(
                "Currency mismatch: " + this.currency + " vs " + other.currency);
        }
    }
}

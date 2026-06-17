package com.innotrader.common.security;

import com.innotrader.user.domain.model.UserId;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Objects;

/**
 * Manages refresh token whitelist in Redis with replay-attack detection.
 *
 * <p>Key layout:
 * <pre>
 *   refresh:{userId}:{jti}          → "1"          TTL: 14 days  (whitelist)
 *   refresh:used:{userId}:{jti}     → "1"          TTL: 14 days  (used marker)
 * </pre>
 *
 * <p>Replay-attack mitigation (refresh token rotation):
 * When a refresh token is used once ({@link #markUsed}), its JTI is recorded in a
 * separate "used" key with the same TTL.  Any subsequent attempt to use the same JTI
 * ({@link #isAlreadyUsed}) triggers {@link #deleteAll} — invalidating every active
 * session for that user.
 */
@Service
public class RefreshTokenService {

    private static final String PREFIX        = "refresh:";
    private static final String USED_PREFIX   = "refresh:used:";

    private final StringRedisTemplate redisTemplate;

    public RefreshTokenService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // -----------------------------------------------------------------------
    // Whitelist management
    // -----------------------------------------------------------------------

    /**
     * Adds a refresh token JTI to the whitelist.
     *
     * @param userId the owning user
     * @param jti    JWT ID from the refresh token
     * @param ttl    time-to-live (should match the token's remaining lifetime)
     */
    public void save(UserId userId, String jti, Duration ttl) {
        redisTemplate.opsForValue().set(whitelistKey(userId, jti), "1", Objects.requireNonNull(ttl));
    }

    /**
     * Returns {@code true} when the JTI is present in the whitelist
     * (token has not been deleted or expired).
     */
    public boolean isValid(UserId userId, String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(whitelistKey(userId, jti)));
    }

    /**
     * Removes a single refresh token from the whitelist (single-session logout).
     */
    public void delete(UserId userId, String jti) {
        redisTemplate.delete(whitelistKey(userId, jti));
    }

    /**
     * Removes ALL refresh tokens for the given user (global logout / theft response).
     * Scans for keys matching {@code refresh:{userId}:*}.
     */
    public void deleteAll(UserId userId) {
        String pattern = PREFIX + userId + ":*";
        var keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    // -----------------------------------------------------------------------
    // Replay-attack detection
    // -----------------------------------------------------------------------

    /**
     * Marks a refresh token JTI as already consumed.
     * The used marker is stored with the same TTL so it naturally expires.
     *
     * @param userId the owning user
     * @param jti    JWT ID of the consumed token
     * @param ttl    expiry duration (match the original token's remaining TTL)
     */
    public void markUsed(UserId userId, String jti, Duration ttl) {
        redisTemplate.opsForValue().set(usedKey(userId, jti), "1", Objects.requireNonNull(ttl));
        // Remove from whitelist immediately — this token cannot be used again
        delete(userId, jti);
    }

    /**
     * Returns {@code true} when this JTI has already been consumed.
     *
     * <p>If {@code true}, callers MUST invoke {@link #deleteAll} to invalidate all
     * sessions for this user (token theft assumed).
     */
    public boolean isAlreadyUsed(UserId userId, String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(usedKey(userId, jti)));
    }

    // -----------------------------------------------------------------------
    // Key builders
    // -----------------------------------------------------------------------

    @NonNull
    private String whitelistKey(UserId userId, String jti) {
        return PREFIX + userId + ":" + jti;
    }

    @NonNull
    private String usedKey(UserId userId, String jti) {
        return USED_PREFIX + userId + ":" + jti;
    }
}

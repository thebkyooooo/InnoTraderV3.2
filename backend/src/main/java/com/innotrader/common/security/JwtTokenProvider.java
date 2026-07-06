package com.innotrader.common.security;

import com.innotrader.user.domain.model.UserId;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import org.springframework.util.StringUtils;

/**
 * Generates and validates JWT access tokens and refresh tokens using jjwt 0.12.x.
 *
 * <p>Configuration (application.yml):
 * <pre>
 *   jwt:
 *     secret: &lt;min 256-bit Base64 or plain secret&gt;
 *     access-token-validity-seconds: 900   # 15 min
 * </pre>
 * Refresh token validity is fixed at 14 days (1 209 600 seconds).
 */
@Component
public class JwtTokenProvider {

    private static final long REFRESH_TOKEN_VALIDITY_SECONDS = 14L * 24 * 60 * 60; // 14 days

    private final SecretKey signingKey;
    private final long accessTokenValiditySeconds;

    /** HS256 서명에 필요한 최소 키 길이 (256비트 = 32바이트). */
    private static final int MIN_SECRET_BYTES = 32;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-validity-seconds:900}") long accessTokenValiditySeconds) {
        if (!StringUtils.hasText(secret) || secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "jwt.secret 이 설정되지 않았거나 " + MIN_SECRET_BYTES + "바이트(256비트) 미만입니다. "
                            + "환경변수 JWT_SECRET 을 충분히 긴 랜덤 값으로 설정하세요.");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenValiditySeconds = accessTokenValiditySeconds;
    }

    // -----------------------------------------------------------------------
    // Token generation
    // -----------------------------------------------------------------------

    /**
     * Generates a short-lived access token.
     *
     * <p>Claims: {@code sub}=userId, {@code email}, {@code role}, {@code jti}, {@code iat}, {@code exp}.
     *
     * @param userId unique user identifier
     * @param email  user's email address
     * @param role   Spring Security role string (e.g. {@code ROLE_USER})
     * @return signed JWT string
     */
    public String generateAccessToken(UserId userId, String email, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessTokenValiditySeconds)))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Generates a long-lived refresh token (14 days).
     *
     * <p>Claims: {@code sub}=userId, {@code jti}, {@code iat}, {@code exp}.
     *
     * @param userId unique user identifier
     * @return signed JWT string
     */
    public String generateRefreshToken(UserId userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(REFRESH_TOKEN_VALIDITY_SECONDS)))
                .signWith(signingKey)
                .compact();
    }

    // -----------------------------------------------------------------------
    // Token parsing
    // -----------------------------------------------------------------------

    /**
     * Parses and fully validates (signature + expiry) a JWT string.
     *
     * @param token compact JWT string
     * @return verified {@link Claims}
     * @throws JwtException if the token is malformed, expired, or the signature does not match
     */
    public Claims parseToken(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extracts the {@code sub} (userId) claim without re-verifying the signature.
     * Always call {@link #parseToken} first for full validation.
     */
    public String extractUserId(String token) {
        return parseToken(token).getSubject();
    }

    /**
     * Extracts the {@code jti} (JWT ID) claim.
     */
    public String extractJti(String token) {
        return parseToken(token).getId();
    }

    /**
     * Returns {@code true} when the token's {@code exp} claim is in the past.
     * This method swallows the expiry exception — use {@link #parseToken} when you need
     * to distinguish expiry from other errors.
     */
    public boolean isTokenExpired(String token) {
        try {
            Date expiration = parseToken(token).getExpiration();
            return expiration.before(new Date());
        } catch (JwtException e) {
            return true;
        }
    }
}

package com.innotrader.user.adapter.in.web;

import com.innotrader.common.error.BusinessException;
import com.innotrader.common.error.ErrorCode;
import com.innotrader.common.security.JwtTokenProvider;
import com.innotrader.common.security.JwtUserDetails;
import com.innotrader.common.security.RefreshTokenService;
import com.innotrader.user.adapter.in.web.dto.LoginRequest;
import com.innotrader.user.adapter.in.web.dto.RegisterRequest;
import com.innotrader.user.adapter.in.web.dto.TokenResponse;
import com.innotrader.user.adapter.in.web.dto.UserResponse;
import com.innotrader.user.domain.model.User;
import com.innotrader.user.domain.model.UserId;
import com.innotrader.user.domain.port.in.LoginUseCase;
import com.innotrader.user.domain.port.in.LoginUseCase.LoginCommand;
import com.innotrader.user.domain.port.in.LoginUseCase.LoginResult;
import com.innotrader.user.domain.port.in.RegisterUserUseCase;
import com.innotrader.user.domain.port.in.RegisterUserUseCase.RegisterUserCommand;
import com.innotrader.user.domain.port.out.LoadUserPort;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

/**
 * REST inbound adapter for authentication endpoints.
 *
 * <p>Endpoint summary:
 * <ul>
 *   <li>{@code POST /api/v1/auth/register}  — create a new account</li>
 *   <li>{@code POST /api/v1/auth/login}     — authenticate and issue tokens</li>
 *   <li>{@code POST /api/v1/auth/refresh}   — rotate the refresh token and issue a new access token</li>
 *   <li>{@code POST /api/v1/auth/logout}    — invalidate the current session</li>
 *   <li>{@code GET  /api/v1/auth/me}        — return the authenticated user's profile</li>
 * </ul>
 *
 * <p>The refresh token is transmitted exclusively via an HttpOnly + Secure + SameSite=Strict
 * cookie named {@code refreshToken} to prevent XSS-based token theft.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String  REFRESH_COOKIE_NAME    = "refreshToken";
    private static final int     REFRESH_COOKIE_MAX_AGE = (int) Duration.ofDays(14).getSeconds();
    private static final long    ACCESS_TOKEN_EXPIRES_IN = 900L; // 15 minutes in seconds
    // 토큰 회전 race 허용 윈도우: 직후 같은 RT로 동시 도착한 요청에 동일 토큰을 반환해
    // 정상 동시성(다중 탭/병렬 요청/StrictMode 중복)을 재사용 공격으로 오인하지 않도록 한다.
    private static final Duration REFRESH_ROTATION_GRACE = Duration.ofSeconds(30);

    private final RegisterUserUseCase registerUserUseCase;
    private final LoginUseCase        loginUseCase;
    private final JwtTokenProvider    jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final LoadUserPort        loadUserPort;

    /** 리프레시 쿠키 SameSite 속성 (동일 도메인: Strict, 교차 도메인 배포: None). */
    @Value("${app.refresh-cookie.same-site:Strict}")
    private String refreshCookieSameSite;

    public AuthController(RegisterUserUseCase registerUserUseCase,
                          LoginUseCase loginUseCase,
                          JwtTokenProvider jwtTokenProvider,
                          RefreshTokenService refreshTokenService,
                          LoadUserPort loadUserPort) {
        this.registerUserUseCase = registerUserUseCase;
        this.loginUseCase        = loginUseCase;
        this.jwtTokenProvider    = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.loadUserPort        = loadUserPort;
    }

    // -----------------------------------------------------------------------
    // POST /register
    // -----------------------------------------------------------------------

    /**
     * Registers a new user account.
     *
     * @param request validated registration payload
     * @return {@code 201 Created} with the newly created {@link UserResponse}
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = registerUserUseCase.register(
                new RegisterUserCommand(request.email(), request.password()));
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    // -----------------------------------------------------------------------
    // POST /login
    // -----------------------------------------------------------------------

    /**
     * Authenticates the user, issues an access token in the response body, and stores
     * the refresh token in an HttpOnly cookie.
     *
     * @param request  validated login credentials
     * @param response used to attach the refresh token cookie
     * @return {@code 200 OK} with a {@link TokenResponse}
     */
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletResponse response) {
        LoginResult result = loginUseCase.login(
                new LoginCommand(request.email(), request.password()));

        appendRefreshTokenCookie(response, result.refreshToken(), REFRESH_COOKIE_MAX_AGE);

        return ResponseEntity.ok(
                new TokenResponse(result.accessToken(), "Bearer", ACCESS_TOKEN_EXPIRES_IN));
    }

    // -----------------------------------------------------------------------
    // POST /refresh
    // -----------------------------------------------------------------------

    /**
     * Rotates the refresh token: validates the existing RT, issues a new AT + RT pair,
     * and replaces the cookie.
     *
     * <p>Replay-attack detection: if the presented JTI is in the "used" set, all sessions
     * for the user are invalidated and {@code 401} is returned.
     *
     * @param refreshToken the RT from the HttpOnly cookie
     * @param response     used to set the new refresh token cookie
     * @return {@code 200 OK} with a new {@link TokenResponse}
     */
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken == null) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_INVALID);
        }

        Claims claims;
        try {
            claims = jwtTokenProvider.parseToken(refreshToken);
        } catch (JwtException ex) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_EXPIRED);
        }

        String  userIdStr = claims.getSubject();
        String  jti       = claims.getId();
        UserId  userId    = UserId.of(userIdStr);

        // Replay-attack detection — token already consumed
        if (refreshTokenService.isAlreadyUsed(userId, jti)) {
            // 회전 직후 동시/중복 요청(정상)일 수 있으므로 grace 윈도우 내라면
            // 직전에 발급한 토큰 쌍을 그대로 반환 → 세션을 끊지 않는다.
            var grace = refreshTokenService.getGrace(userId, jti);
            if (grace != null) {
                appendRefreshTokenCookie(response, grace.refreshToken(), REFRESH_COOKIE_MAX_AGE);
                return ResponseEntity.ok(
                        new TokenResponse(grace.accessToken(), "Bearer", ACCESS_TOKEN_EXPIRES_IN));
            }
            // grace 만료 후 재사용 → 진짜 탈취로 간주, 전 세션 무효화
            refreshTokenService.deleteAll(userId);
            appendRefreshTokenCookie(response, "", 0); // expire the cookie
            throw new BusinessException(ErrorCode.AUTH_REFRESH_TOKEN_REUSED);
        }

        // Validate whitelist
        if (!refreshTokenService.isValid(userId, jti)) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_INVALID);
        }

        // Load user to obtain current role/email for the new AT
        User user = loadUserPort.loadById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_TOKEN_INVALID));

        // Mark old RT as used and remove from whitelist
        refreshTokenService.markUsed(userId, jti, Duration.ofDays(14));

        // Issue new AT + RT
        String newAccessToken  = jwtTokenProvider.generateAccessToken(
                user.id(), user.email().value(), user.role().name());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.id());

        String newJti = jwtTokenProvider.extractJti(newRefreshToken);
        refreshTokenService.save(userId, newJti, Duration.ofDays(14));

        // 회전 race 대비: 직전 jti로 곧 도착할 수 있는 동시 요청에 동일 토큰을 줄 수 있도록 캐시
        refreshTokenService.saveGrace(userId, jti, newAccessToken, newRefreshToken, REFRESH_ROTATION_GRACE);

        appendRefreshTokenCookie(response, newRefreshToken, REFRESH_COOKIE_MAX_AGE);

        return ResponseEntity.ok(
                new TokenResponse(newAccessToken, "Bearer", ACCESS_TOKEN_EXPIRES_IN));
    }

    // -----------------------------------------------------------------------
    // POST /logout
    // -----------------------------------------------------------------------

    /**
     * Invalidates the current session by deleting the refresh token from Redis
     * and expiring the cookie.
     *
     * @param refreshToken the RT from the HttpOnly cookie (may be absent if already expired)
     * @param response     used to expire the cookie
     * @return {@code 204 No Content}
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken != null) {
            try {
                Claims claims = jwtTokenProvider.parseToken(refreshToken);
                UserId userId = UserId.of(claims.getSubject());
                String jti    = claims.getId();
                refreshTokenService.delete(userId, jti);
            } catch (JwtException ignored) {
                // Token is already invalid — proceed to expire the cookie anyway
            }
        }

        appendRefreshTokenCookie(response, "", 0);
        return ResponseEntity.noContent().build();
    }

    // -----------------------------------------------------------------------
    // GET /me
    // -----------------------------------------------------------------------

    /**
     * Returns the profile of the currently authenticated user.
     *
     * <p>Requires a valid Bearer access token. The {@link JwtAuthenticationFilter} populates
     * the {@link org.springframework.security.core.context.SecurityContext} before this
     * method is called.
     *
     * @param principal injected by Spring Security from the JWT access token
     * @return {@code 200 OK} with the user's {@link UserResponse}
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal JwtUserDetails principal) {
        UserId userId = UserId.of(principal.getUserId());
        User user = loadUserPort.loadById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_TOKEN_INVALID));
        return ResponseEntity.ok(UserResponse.from(user));
    }

    // -----------------------------------------------------------------------
    // Cookie helper
    // -----------------------------------------------------------------------

    /**
     * Builds and appends an HttpOnly, Secure, SameSite=Strict cookie carrying the
     * refresh token.
     *
     * @param response servlet response to attach the cookie to
     * @param value    cookie value (empty string to clear)
     * @param maxAge   max-age in seconds; {@code 0} expires the cookie immediately
     */
    private void appendRefreshTokenCookie(HttpServletResponse response,
                                          String value,
                                          int maxAge) {
        // Use Set-Cookie header directly to support SameSite attribute,
        // which the legacy javax/jakarta Cookie API does not expose.
        String cookieHeader = REFRESH_COOKIE_NAME + "=" + value
                + "; Path=/api/v1/auth"
                + "; HttpOnly"
                + "; Secure"
                + "; SameSite=" + refreshCookieSameSite
                + "; Max-Age=" + maxAge;
        response.addHeader("Set-Cookie", cookieHeader);
    }
}

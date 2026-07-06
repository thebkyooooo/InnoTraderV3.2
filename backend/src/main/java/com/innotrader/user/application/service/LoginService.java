package com.innotrader.user.application.service;

import com.innotrader.common.annotation.UseCase;
import com.innotrader.common.error.BusinessException;
import com.innotrader.common.error.ErrorCode;
import com.innotrader.common.security.JwtTokenProvider;
import com.innotrader.common.security.LoginAttemptService;
import com.innotrader.common.security.RefreshTokenService;
import com.innotrader.user.domain.model.Email;
import com.innotrader.user.domain.model.User;
import com.innotrader.user.domain.port.in.LoginUseCase;
import com.innotrader.user.domain.port.out.LoadUserPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

/**
 * Application service that authenticates a user and issues JWT token pairs.
 *
 * <p>Token rotation strategy: a new refresh token (RT) is generated on every successful
 * login. The RT is stored in Redis so that replay attacks can be detected by
 * {@link RefreshTokenService#isAlreadyUsed}.
 */
@UseCase
@Transactional(readOnly = true)
public class LoginService implements LoginUseCase {

    private static final Duration REFRESH_TOKEN_TTL = Duration.ofDays(14);

    private final LoadUserPort       loadUserPort;
    private final PasswordEncoder    passwordEncoder;
    private final JwtTokenProvider   jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final LoginAttemptService loginAttemptService;

    public LoginService(LoadUserPort loadUserPort,
                        PasswordEncoder passwordEncoder,
                        JwtTokenProvider jwtTokenProvider,
                        RefreshTokenService refreshTokenService,
                        LoginAttemptService loginAttemptService) {
        this.loadUserPort        = loadUserPort;
        this.passwordEncoder     = passwordEncoder;
        this.jwtTokenProvider    = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.loginAttemptService = loginAttemptService;
    }

    /**
     * Authenticates the user and returns a {@link LoginResult} carrying an access token,
     * a refresh token, and the authenticated {@link User} aggregate.
     *
     * @param command login credentials
     * @return token pair and authenticated user
     * @throws BusinessException {@link ErrorCode#AUTH_INVALID_CREDENTIALS} — user not found or wrong password
     * @throws BusinessException {@link ErrorCode#AUTH_INACTIVE_USER} — account is suspended/deleted
     * @throws BusinessException {@link ErrorCode#AUTH_TOO_MANY_ATTEMPTS} — too many recent failed attempts
     */
    @Override
    public LoginResult login(LoginCommand command) {
        Email email = Email.of(command.email());

        if (loginAttemptService.isLockedOut(email.value())) {
            throw new BusinessException(ErrorCode.AUTH_TOO_MANY_ATTEMPTS);
        }

        User user = loadUserPort.loadByEmail(email)
                .orElseGet(() -> {
                    loginAttemptService.recordFailure(email.value());
                    throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS);
                });

        if (!user.isActive()) {
            throw new BusinessException(ErrorCode.AUTH_INACTIVE_USER);
        }

        if (!passwordEncoder.matches(command.rawPassword(), user.passwordHash())) {
            loginAttemptService.recordFailure(email.value());
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS);
        }

        loginAttemptService.reset(email.value());

        String accessToken  = jwtTokenProvider.generateAccessToken(
                user.id(), user.email().value(), user.role().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.id());

        String jti = jwtTokenProvider.extractJti(refreshToken);
        refreshTokenService.save(user.id(), jti, REFRESH_TOKEN_TTL);

        return new LoginResult(accessToken, refreshToken, user);
    }
}

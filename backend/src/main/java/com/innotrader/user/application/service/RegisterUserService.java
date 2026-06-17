package com.innotrader.user.application.service;

import com.innotrader.common.annotation.UseCase;
import com.innotrader.common.error.BusinessException;
import com.innotrader.common.error.ErrorCode;
import com.innotrader.user.domain.model.Email;
import com.innotrader.user.domain.model.User;
import com.innotrader.user.domain.port.in.RegisterUserUseCase;
import com.innotrader.user.domain.port.out.LoadUserPort;
import com.innotrader.user.domain.port.out.SaveUserPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service that handles new user registration.
 *
 * <p>Responsibilities:
 * <ol>
 *   <li>Validate e-mail uniqueness.</li>
 *   <li>Hash the raw password via {@link PasswordEncoder}.</li>
 *   <li>Create and persist a new {@link User} aggregate.</li>
 * </ol>
 */
@UseCase
@Transactional
public class RegisterUserService implements RegisterUserUseCase {

    private final LoadUserPort loadUserPort;
    private final SaveUserPort saveUserPort;
    private final PasswordEncoder passwordEncoder;

    public RegisterUserService(LoadUserPort loadUserPort,
                               SaveUserPort saveUserPort,
                               PasswordEncoder passwordEncoder) {
        this.loadUserPort    = loadUserPort;
        this.saveUserPort    = saveUserPort;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registers a new user.
     *
     * @param command registration data containing a raw e-mail and plain-text password
     * @return the persisted {@link User} aggregate
     * @throws BusinessException with {@link ErrorCode#AUTH_DUPLICATE_EMAIL} if the e-mail is taken
     */
    @Override
    public User register(RegisterUserCommand command) {
        Email email = Email.of(command.email());

        if (loadUserPort.loadByEmail(email).isPresent()) {
            throw new BusinessException(ErrorCode.AUTH_DUPLICATE_EMAIL);
        }

        String passwordHash = passwordEncoder.encode(command.rawPassword());
        User user = User.create(email, passwordHash);

        return saveUserPort.save(user);
    }
}

package com.innotrader.common.config;

import com.innotrader.common.error.BusinessException;
import com.innotrader.common.error.ErrorCode;
import com.innotrader.user.domain.port.in.RegisterUserUseCase;
import com.innotrader.user.domain.port.in.RegisterUserUseCase.RegisterUserCommand;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
public class LocalDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDataInitializer.class);

    private final RegisterUserUseCase registerUserUseCase;

    public LocalDataInitializer(RegisterUserUseCase registerUserUseCase) {
        this.registerUserUseCase = registerUserUseCase;
    }

    @Override
    public void run(String... args) {
        createUserIfAbsent("test@innotrader.com", "Test1234!");
    }

    private void createUserIfAbsent(String email, String password) {
        try {
            registerUserUseCase.register(new RegisterUserCommand(email, password));
            log.info("[LocalDataInitializer] 테스트 계정 생성: {} / {}", email, password);
        } catch (BusinessException e) {
            if (e.getErrorCode() == ErrorCode.AUTH_DUPLICATE_EMAIL) {
                log.debug("[LocalDataInitializer] 테스트 계정 이미 존재: {}", email);
            } else {
                throw e;
            }
        }
    }
}

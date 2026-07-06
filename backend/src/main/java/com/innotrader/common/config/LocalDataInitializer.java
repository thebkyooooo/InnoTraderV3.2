package com.innotrader.common.config;

import com.innotrader.account.domain.port.in.AccountUseCase;
import com.innotrader.holding.domain.port.in.HoldingUseCase;
import com.innotrader.order.domain.port.in.OrderUseCase;
import com.innotrader.common.error.BusinessException;
import com.innotrader.common.error.ErrorCode;
import com.innotrader.user.domain.model.Email;
import com.innotrader.user.domain.model.User;
import com.innotrader.user.domain.port.in.RegisterUserUseCase;
import com.innotrader.user.domain.port.in.RegisterUserUseCase.RegisterUserCommand;
import com.innotrader.user.domain.port.out.LoadUserPort;
import com.innotrader.watchlist.domain.port.in.WatchlistUseCase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * 기동 시 기본 계정 + 시드 데이터(관심종목/계좌/잔고/주문)를 생성한다.
 *
 * <p>{@code app.seed.enabled=true} 일 때만 동작한다 (로컬: application-local.yml에서 true,
 * 운영: 환경변수 {@code APP_SEED_ENABLED=true} 로 한시적으로 켜서 시드 후 끄면 됨).
 * 모든 시드는 멱등(존재 시 건너뜀)이라 재기동해도 중복 생성되지 않는다.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class LocalDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDataInitializer.class);

    private static final String TEST_EMAIL = "test@innotrader.com";

    private final RegisterUserUseCase registerUserUseCase;
    private final LoadUserPort loadUserPort;
    private final WatchlistUseCase watchlistUseCase;
    private final AccountUseCase accountUseCase;
    private final HoldingUseCase holdingUseCase;
    private final OrderUseCase orderUseCase;

    public LocalDataInitializer(RegisterUserUseCase registerUserUseCase,
                                LoadUserPort loadUserPort,
                                WatchlistUseCase watchlistUseCase,
                                AccountUseCase accountUseCase,
                                HoldingUseCase holdingUseCase,
                                OrderUseCase orderUseCase) {
        this.registerUserUseCase = registerUserUseCase;
        this.loadUserPort        = loadUserPort;
        this.watchlistUseCase    = watchlistUseCase;
        this.accountUseCase      = accountUseCase;
        this.holdingUseCase      = holdingUseCase;
        this.orderUseCase        = orderUseCase;
    }

    @Override
    public void run(String... args) {
        createUserIfAbsent(TEST_EMAIL, "Test1234!");
        UUID userId = loadUserPort.loadByEmail(Email.of(TEST_EMAIL))
                .map(User::id).map(id -> id.value()).orElse(null);
        if (userId == null) {
            log.warn("[LocalDataInitializer] 시드 건너뜀 — 사용자 없음: {}", TEST_EMAIL);
            return;
        }
        seedWatchlist(userId);
        seedAccounts(userId);
        seedHoldings(userId);
        seedOrders(userId);
    }

    private void createUserIfAbsent(String email, String password) {
        try {
            registerUserUseCase.register(new RegisterUserCommand(email, password));
            log.info("[LocalDataInitializer] 테스트 계정 생성: {}", email);
        } catch (BusinessException e) {
            if (e.getErrorCode() == ErrorCode.AUTH_DUPLICATE_EMAIL) {
                log.debug("[LocalDataInitializer] 테스트 계정 이미 존재: {}", email);
            } else {
                throw e;
            }
        }
    }

    /** 기본 관심그룹/관심종목을 시드 (빈 경우만). 초기화는 POST /api/private/watchlist/seed. */
    private void seedWatchlist(UUID userId) {
        if (!watchlistUseCase.listGroups(userId).isEmpty()) {
            log.debug("[LocalDataInitializer] 관심종목 이미 존재 — 자동 시드 건너뜀");
            return;
        }
        watchlistUseCase.seedDefaults(userId);
        log.info("[LocalDataInitializer] 관심종목 시드 적용");
    }

    /** 기본 계좌를 시드 (계좌번호 기준 멱등). */
    private void seedAccounts(UUID userId) {
        accountUseCase.seedDefaults(userId);
        log.info("[LocalDataInitializer] 계좌 시드 적용");
    }

    /** 계좌별 보유종목을 시드 (계좌 단위 멱등). */
    private void seedHoldings(UUID userId) {
        holdingUseCase.seedDefaults(userId);
        log.info("[LocalDataInitializer] 보유종목 시드 적용");
    }

    /** 계좌별 주문내역을 시드 (계좌 단위 멱등). */
    private void seedOrders(UUID userId) {
        orderUseCase.seedDefaults(userId);
        log.info("[LocalDataInitializer] 주문내역 시드 적용");
    }
}

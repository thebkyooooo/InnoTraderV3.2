package com.innotrader.account.application.service;

import com.innotrader.account.domain.model.SecuritiesAccount;
import com.innotrader.account.domain.port.in.AccountUseCase;
import com.innotrader.account.domain.port.out.AccountPort;
import com.innotrader.common.annotation.UseCase;
import com.innotrader.common.error.BusinessException;
import com.innotrader.common.error.ErrorCode;
import com.innotrader.stock.domain.model.StockMaster;
import com.innotrader.stock.domain.port.in.GetStockMasterUseCase;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * 계좌내역 애플리케이션 서비스.
 *
 * <ul>
 *   <li>계좌목록/주문가능금액 조회</li>
 *   <li>주문가능수량 = 주문가능금액 / 현재가 (stock master 시세 사용)</li>
 *   <li>기본 계좌 시드 (계좌번호 기준 멱등)</li>
 * </ul>
 */
@UseCase
@Transactional
public class AccountService implements AccountUseCase {

    /** 시드 계좌 정의: {계좌번호 접미, 계좌명, 유형코드, 유형명, 주문가능금액} */
    private record SeedAccount(String code, String name, String typeName, long amount) {}

    private static final String ACCOUNT_PREFIX = "123-456789-";
    private static final List<SeedAccount> SEED_ACCOUNTS = List.of(
            new SeedAccount("01", "종합계좌",     "종합",     50_000_000L),
            new SeedAccount("02", "주식계좌",     "주식",     30_000_000L),
            new SeedAccount("05", "CMA계좌",      "CMA",      10_000_000L),
            new SeedAccount("11", "해외주식계좌", "해외주식", 20_000_000L),
            new SeedAccount("61", "연금저축계좌", "연금저축", 15_000_000L),
            new SeedAccount("71", "ISA계좌",      "ISA",      25_000_000L)
    );

    private final AccountPort accountPort;
    private final GetStockMasterUseCase getStockMasterUseCase;

    public AccountService(AccountPort accountPort, GetStockMasterUseCase getStockMasterUseCase) {
        this.accountPort = accountPort;
        this.getStockMasterUseCase = getStockMasterUseCase;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SecuritiesAccount> listAccounts(UUID userId) {
        return accountPort.findAll(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public long orderableAmount(UUID userId, String accountNo) {
        return loadAccount(userId, accountNo).orderableAmount();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderableShares orderableShares(UUID userId, String accountNo, String symbol) {
        SecuritiesAccount account = loadAccount(userId, accountNo);
        StockMaster stock = getStockMasterUseCase.getBySymbol(symbol)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT, "종목을 찾을 수 없습니다: " + symbol));
        long price = Math.max(1L, stock.price());
        long shares = account.orderableAmount() / price;
        return new OrderableShares(accountNo, symbol, stock.name(), shares);
    }

    @Override
    public void seedDefaults(UUID userId) {
        for (SeedAccount s : SEED_ACCOUNTS) {
            String accountNo = ACCOUNT_PREFIX + s.code();
            if (accountPort.find(userId, accountNo).isPresent()) continue;
            accountPort.save(SecuritiesAccount.create(
                    userId, accountNo, s.name(), s.code(), s.typeName(), s.amount()));
        }
    }

    private SecuritiesAccount loadAccount(UUID userId, String accountNo) {
        return accountPort.find(userId, accountNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));
    }
}

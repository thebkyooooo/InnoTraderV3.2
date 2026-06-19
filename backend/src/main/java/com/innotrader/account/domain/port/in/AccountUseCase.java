package com.innotrader.account.domain.port.in;

import com.innotrader.account.domain.model.SecuritiesAccount;

import java.util.List;
import java.util.UUID;

/**
 * Inbound port: 계좌내역 조회 유스케이스.
 *
 * <p>사용자ID는 인증 주체(JWT)에서 전달된다.
 */
public interface AccountUseCase {

    /** 주문가능수량 결과 */
    record OrderableShares(String accountNo, String symbol, String name, long shares) {}

    /** 계좌목록 조회 */
    List<SecuritiesAccount> listAccounts(UUID userId);

    /** 주문가능금액 조회 */
    long orderableAmount(UUID userId, String accountNo);

    /** 주문가능수량 조회 (주문가능금액 / 현재가) */
    OrderableShares orderableShares(UUID userId, String accountNo, String symbol);

    /** 기본 계좌 시드 (계좌번호 기준 멱등) */
    void seedDefaults(UUID userId);
}

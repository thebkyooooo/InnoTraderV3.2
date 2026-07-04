package com.innotrader.holding.domain.port.out;

import com.innotrader.holding.domain.model.Holding;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Outbound port: 보유종목 영속성.
 */
public interface HoldingPort {

    List<Holding> findByAccount(UUID userId, String accountNo);

    /** 계좌+종목 단건 조회 (체결 반영 시 기존 보유분 확인용). */
    Optional<Holding> findByAccountAndSymbol(UUID userId, String accountNo, String symbol);

    Holding save(Holding holding);

    /** 보유수량이 0이 되어 더 이상 보유하지 않는 종목 삭제. */
    void delete(Holding holding);
}

package com.innotrader.holding.domain.port.out;

import com.innotrader.holding.domain.model.Holding;

import java.util.List;
import java.util.UUID;

/**
 * Outbound port: 보유종목 영속성.
 */
public interface HoldingPort {

    List<Holding> findByAccount(UUID userId, String accountNo);

    Holding save(Holding holding);
}

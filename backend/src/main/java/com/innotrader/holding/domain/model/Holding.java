package com.innotrader.holding.domain.model;

import java.util.UUID;

/**
 * 보유종목 도메인 모델 (계좌별 보유 수량/평균단가).
 */
public record Holding(
        UUID   id,
        UUID   userId,
        String accountNo,
        String symbol,
        long   quantity,   // 보유수량
        long   avgPrice    // 평균단가
) {
    public static Holding create(UUID userId, String accountNo, String symbol, long quantity, long avgPrice) {
        return new Holding(UUID.randomUUID(), userId, accountNo, symbol, quantity, avgPrice);
    }
}

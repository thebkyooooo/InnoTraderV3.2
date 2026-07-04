package com.innotrader.holding.domain.port.in;

import java.util.List;
import java.util.UUID;

/**
 * Inbound port: 계좌잔고(주식잔고) 조회 유스케이스.
 */
public interface HoldingUseCase {

    /** 보유종목 항목 */
    record HoldingItem(
            String name, String symbol,
            long quantity, long avgPrice, long currentPrice,
            long evalAmount, long profit, double profitRate
    ) {}

    /** 잔고 요약 */
    record HoldingSummary(
            long totalAssets,       // 총자산 (총평가금액 + 예수금)
            long totalEvalAmount,   // 총평가금액
            long principal,         // 원금
            long totalProfit,       // 총수익금
            double totalProfitRate  // 총수익률(%)
    ) {}

    /** 주식잔고 조회 결과 (요약 + 목록) */
    record HoldingsResult(HoldingSummary summary, List<HoldingItem> items) {}

    /** 주식잔고 조회 */
    HoldingsResult getHoldings(UUID userId, String accountNo);

    /** 계좌별 보유종목 시드 (계좌 단위 멱등) */
    void seedDefaults(UUID userId);

    /**
     * 주문 체결 반영. 매수=수량 증가 + 평균단가 가중평균 재계산(신규 보유면 생성),
     * 매도=수량 감소(0이 되면 보유종목 삭제).
     */
    void applyFill(UUID userId, String accountNo, String symbol, boolean isBuy, long fillQuantity, long fillPrice);
}

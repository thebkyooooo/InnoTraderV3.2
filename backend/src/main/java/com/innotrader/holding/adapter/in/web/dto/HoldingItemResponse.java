package com.innotrader.holding.adapter.in.web.dto;

import com.innotrader.holding.domain.port.in.HoldingUseCase.HoldingItem;

/** 보유종목 응답 (종목명/종목코드/보유수량/평균단가/현재가/평가금액/수익금/수익률). */
public record HoldingItemResponse(
        String name,
        String symbol,
        long   quantity,
        long   avgPrice,
        long   currentPrice,
        long   evalAmount,
        long   profit,
        double profitRate
) {
    public static HoldingItemResponse from(HoldingItem i) {
        return new HoldingItemResponse(
                i.name(), i.symbol(), i.quantity(), i.avgPrice(), i.currentPrice(),
                i.evalAmount(), i.profit(), i.profitRate());
    }
}

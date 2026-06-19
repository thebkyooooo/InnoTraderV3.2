package com.innotrader.holding.adapter.in.web.dto;

import com.innotrader.holding.domain.port.in.HoldingUseCase.HoldingsResult;

import java.util.List;

/** 주식잔고 조회 응답 (요약 + 보유종목 목록). */
public record HoldingsResponse(
        Summary summary,
        List<HoldingItemResponse> items
) {
    /** 잔고 요약 (총자산/총평가금액/원금/총수익금/총수익률). */
    public record Summary(
            long   totalAssets,
            long   totalEvalAmount,
            long   principal,
            long   totalProfit,
            double totalProfitRate
    ) {}

    public static HoldingsResponse from(HoldingsResult r) {
        Summary summary = new Summary(
                r.summary().totalAssets(),
                r.summary().totalEvalAmount(),
                r.summary().principal(),
                r.summary().totalProfit(),
                r.summary().totalProfitRate());
        List<HoldingItemResponse> items = r.items().stream().map(HoldingItemResponse::from).toList();
        return new HoldingsResponse(summary, items);
    }
}

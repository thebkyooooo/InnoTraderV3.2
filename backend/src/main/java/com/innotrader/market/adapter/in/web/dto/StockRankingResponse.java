package com.innotrader.market.adapter.in.web.dto;

import com.innotrader.market.domain.model.StockRanking;

public record StockRankingResponse(
        int    rank,
        String symbol,
        String name,
        String market,
        long   price,
        long   prevDiff,
        double change,
        Long   marketCap,
        Long   volume,
        Long   tradingAmount
) {
    public static StockRankingResponse from(StockRanking r) {
        return new StockRankingResponse(
                r.rank(), r.symbol(), r.name(), r.market(),
                r.price(), r.prevDiff(), r.change(),
                r.marketCap(), r.volume(), r.tradingAmount()
        );
    }
}

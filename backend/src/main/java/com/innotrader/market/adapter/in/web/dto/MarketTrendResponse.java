package com.innotrader.market.adapter.in.web.dto;

import com.innotrader.market.domain.model.MarketTrend;

public record MarketTrendResponse(
        long foreign,
        long individual,
        long institution
) {
    public static MarketTrendResponse from(MarketTrend t) {
        return new MarketTrendResponse(t.foreign(), t.individual(), t.institution());
    }
}

package com.innotrader.market.adapter.in.web.dto;

import com.innotrader.market.domain.model.ExchangeRate;

public record ExchangeRateResponse(
        String pair,
        String name,
        double rate,
        double prevDiff,
        double change
) {
    public static ExchangeRateResponse from(ExchangeRate e) {
        return new ExchangeRateResponse(e.pair(), e.name(), e.rate(), e.prevDiff(), e.change());
    }
}

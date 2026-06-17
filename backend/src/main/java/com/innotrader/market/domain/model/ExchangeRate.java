package com.innotrader.market.domain.model;

public record ExchangeRate(
        String pair,      // USD/KRW, JPY/KRW, EUR/KRW, GBP/KRW, CNY/KRW
        String name,      // 미국 달러/원, ...
        double rate,
        double prevDiff,
        double change
) {}

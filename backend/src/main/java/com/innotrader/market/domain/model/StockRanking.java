package com.innotrader.market.domain.model;

public record StockRanking(
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
) {}

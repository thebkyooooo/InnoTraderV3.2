package com.innotrader.market.domain.model;

public record StockRanking(
        int    rank,
        String symbol,
        String name,
        String market,         // KOSPI, KOSDAQ
        long   price,
        long   prevDiff,
        double change,
        Long   marketCap,      // 시가총액상위 전용 (null 가능)
        Long   volume,         // 거래량상위 전용 (null 가능)
        Long   tradingAmount   // 거래대금상위 전용 (null 가능)
) {}

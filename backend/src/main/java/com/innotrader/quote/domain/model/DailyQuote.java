package com.innotrader.quote.domain.model;

public record DailyQuote(
        String date,       // yyyyMMdd
        long   price,      // 종가
        long   prevDiff,   // 전일대비
        double change,     // 등락률
        long   open,       // 시가
        long   high,       // 고가
        long   low,        // 저가
        long   volume,     // 거래량
        long   turnoverMan // 거래금액(만)
) {}

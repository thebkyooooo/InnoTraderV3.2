package com.innotrader.quote.domain.model;

public record InvestmentTrend(
        String date,       // yyyyMMdd
        long   price,      // 종가
        long   prevDiff,   // 전일대비
        double change,     // 등락률
        long   volume,     // 거래량
        long   foreign,    // 외국인 순매수
        long   individual, // 개인 순매수
        long   institution // 기관 순매수
) {}

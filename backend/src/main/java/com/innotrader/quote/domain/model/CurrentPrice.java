package com.innotrader.quote.domain.model;

public record CurrentPrice(
        String symbol,      // 종목코드
        String name,        // 종목명
        String market,      // 시장구분
        long   price,       // 현재가
        long   prevDiff,    // 전일대비
        double change,      // 등락률(%)
        long   volume,      // 거래량
        long   open,        // 시가
        long   high,        // 고가
        long   low,         // 저가
        long   prevClose,   // 전일종가
        long   upperLimit,  // 상한가
        long   lowerLimit,  // 하한가
        long   tradingAmount // 거래대금(만원)
) {}

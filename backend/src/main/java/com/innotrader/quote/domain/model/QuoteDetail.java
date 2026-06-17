package com.innotrader.quote.domain.model;

public record QuoteDetail(
        String name,       // 종목명
        String symbol,     // 종목코드
        long   marketCap,  // 시가총액(만)
        long   lstdShrs,   // 상장주식수
        long   parValue,   // 액면가
        long   upperLimit, // 상한가
        long   lowerLimit, // 하한가
        long   high52w,    // 52주최고
        long   low52w,     // 52주최저
        double per,        // PER
        long   eps,        // EPS
        double pbr,        // PBR
        long   bps         // BPS
) {}

package com.innotrader.quote.domain.model;

public record FilledQuote(
        String time,         // HHmmss
        long   price,        // 현재가
        long   prevDiff,     // 전일대비
        double change,       // 등락률
        long   askPrice,     // 매도호가
        long   bidPrice,     // 매수호가
        long   filledVolume, // 체결량
        double fillStrength, // 체결강도
        long   volume        // 누적거래량
) {}

package com.innotrader.quote.domain.model;

public record FilledQuote(
        String time,         // 체결시간 HHmmss
        long   price,        // 체결가격
        long   prevDiff,     // 전일대비
        double change,       // 등락률
        long   askPrice,     // 매도호가
        long   bidPrice,     // 매수호가
        long   filledVolume, // 체결수량
        double fillStrength, // 체결강도(%) — 누적 매수/매도 체결량 비율
        long   volume        // 누적거래량
) {}

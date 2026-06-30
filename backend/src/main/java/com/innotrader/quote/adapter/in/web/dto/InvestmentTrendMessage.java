package com.innotrader.quote.adapter.in.web.dto;

/**
 * WebSocket STOMP 투자동향 메시지.
 * 구독 채널: /topic/quote/trend/{symbol}
 *
 * <p>당일(오늘) 외국인/개인/기관 순매수 누적. 현재가/체결 메시지와 같은 시점에 산출된다.
 * 외국인+개인+기관 = 0 (제로섬).
 */
public record InvestmentTrendMessage(
        String symbol,
        String date,         // 거래일 yyyyMMdd
        long   price,        // 현재가
        long   prevDiff,     // 전일대비
        double change,       // 등락률
        long   foreign,      // 외국인 순매수
        long   individual,   // 개인 순매수
        long   institution,  // 기관 순매수
        long   volume        // 누적거래량
) {}

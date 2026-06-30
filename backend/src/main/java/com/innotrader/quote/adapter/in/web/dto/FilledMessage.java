package com.innotrader.quote.adapter.in.web.dto;

/**
 * WebSocket STOMP 체결 메시지.
 * 구독 채널: /topic/quote/filled/{symbol}
 *
 * <p>현재가 메시지({@link StockPriceMessage})와 분리된 체결 전용 스트림.
 * 한 번의 시세 시뮬레이션에서 함께 산출되어 같은 시점을 공유한다.
 */
public record FilledMessage(
        String symbol,
        String time,         // 체결시간 HHmmss
        long   price,        // 체결가격
        long   prevDiff,     // 전일대비
        double change,       // 등락률
        long   askPrice,     // 매도호가
        long   bidPrice,     // 매수호가
        long   filledVolume, // 체결수량
        double fillStrength, // 체결강도(%)
        long   volume        // 누적거래량
) {}

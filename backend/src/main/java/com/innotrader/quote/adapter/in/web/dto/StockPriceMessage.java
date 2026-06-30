package com.innotrader.quote.adapter.in.web.dto;

/**
 * WebSocket STOMP 브로드캐스트용 실시간 현재가 메시지.
 * 구독 채널: /topic/quote/price/{symbol}
 */
public record StockPriceMessage(
        String symbol,
        String name,
        String market,
        String date,          // 서버 KST 거래일 (yyyyMMdd)
        String time,          // 서버 KST 현재시각 (HHmmss)
        long   price,
        long   prevDiff,
        double change,
        long   volume,
        long   open,
        long   high,
        long   low,
        long   prevClose,
        long   upperLimit,
        long   lowerLimit,
        long   tradingAmount
) {}

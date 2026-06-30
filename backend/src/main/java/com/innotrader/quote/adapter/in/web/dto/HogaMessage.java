package com.innotrader.quote.adapter.in.web.dto;

import com.innotrader.quote.domain.model.HogaEntry;

import java.util.List;

/**
 * WebSocket STOMP 호가 메시지.
 * 구독 채널: /topic/quote/hoga/{symbol}
 *
 * <p>현재가 메시지와 같은 시점에 산출되는 10호가(매도/매수) 잔량 스냅샷.
 */
public record HogaMessage(
        String symbol,
        String time,          // 체결시각 HHmmss
        List<HogaEntry> asks, // 매도호가 (낮은 가격 → 높은 가격, 매도1~10)
        List<HogaEntry> bids  // 매수호가 (높은 가격 → 낮은 가격, 매수1~10)
) {}

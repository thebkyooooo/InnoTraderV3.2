package com.innotrader.order.adapter.in.web.dto;

import com.innotrader.order.domain.port.in.OrderUseCase.OrderResult;

import java.time.Instant;

/**
 * 매수/매도 주문 응답.
 */
public record OrderResponse(
        String  accountNo,
        String  orderNo,
        String  symbol,
        String  side,           // buy | sell
        String  sideName,       // 매수 | 매도
        String  orderType,      // MARKET | LIMIT
        String  orderTypeName,  // 시장가 | 지정가
        long    quantity,
        long    price,
        String  status,         // RECEIVED | FILLED | PARTIAL | ...
        String  statusName,     // 접수 | 전체체결 | 부분체결 | ...
        long    filledQuantity,
        Instant orderedAt
) {
    public static OrderResponse from(OrderResult r) {
        return new OrderResponse(
                r.accountNo(), r.orderNo(), r.symbol(),
                r.side().code(), r.side().label(),
                r.orderType().code(), r.orderType().label(),
                r.quantity(), r.price(),
                r.status().code(), r.status().label(),
                r.filledQuantity(), r.orderedAt());
    }
}

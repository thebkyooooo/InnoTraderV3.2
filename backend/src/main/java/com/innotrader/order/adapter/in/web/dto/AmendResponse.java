package com.innotrader.order.adapter.in.web.dto;

import com.innotrader.order.domain.port.in.OrderUseCase.AmendResult;

import java.time.Instant;

/**
 * 정정 주문 응답.
 */
public record AmendResponse(
        String  accountNo,
        String  orderNo,
        String  originalOrderNo,
        String  symbol,
        String  orderType,
        String  orderTypeName,
        long    quantity,       // 정정수량
        long    price,          // 정정가격(단가)
        String  status,         // RECEIVED | AMENDED
        String  statusName,     // 접수 | 정정완료
        Instant orderedAt
) {
    public static AmendResponse from(AmendResult r) {
        return new AmendResponse(
                r.accountNo(), r.orderNo(), r.originalOrderNo(), r.symbol(),
                r.orderType().code(), r.orderType().label(),
                r.quantity(), r.price(),
                r.status().code(), r.status().label(), r.orderedAt());
    }
}

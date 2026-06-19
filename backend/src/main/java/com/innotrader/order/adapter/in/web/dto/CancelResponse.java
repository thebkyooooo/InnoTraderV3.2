package com.innotrader.order.adapter.in.web.dto;

import com.innotrader.order.domain.port.in.OrderUseCase.CancelResult;

import java.time.Instant;

/**
 * 취소 주문 응답.
 */
public record CancelResponse(
        String  accountNo,
        String  orderNo,
        String  originalOrderNo,
        String  symbol,
        long    cancelQuantity, // 취소수량
        String  status,         // RECEIVED | CANCEL_DONE
        String  statusName,     // 접수 | 취소완료
        Instant orderedAt
) {
    public static CancelResponse from(CancelResult r) {
        return new CancelResponse(
                r.accountNo(), r.orderNo(), r.originalOrderNo(), r.symbol(),
                r.cancelQuantity(), r.status().code(), r.status().label(), r.orderedAt());
    }
}

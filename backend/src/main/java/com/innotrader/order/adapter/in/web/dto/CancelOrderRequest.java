package com.innotrader.order.adapter.in.web.dto;

import com.innotrader.order.domain.port.in.OrderUseCase.CancelOrderCommand;

import java.util.UUID;

/**
 * 취소 주문 요청.
 */
public record CancelOrderRequest(
        String accountNo,
        String symbol,
        String originalOrderNo
) {
    public CancelOrderCommand toCommand(UUID userId) {
        return new CancelOrderCommand(userId, accountNo, symbol, originalOrderNo);
    }
}

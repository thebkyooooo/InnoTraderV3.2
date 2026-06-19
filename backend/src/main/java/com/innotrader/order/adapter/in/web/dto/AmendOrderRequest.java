package com.innotrader.order.adapter.in.web.dto;

import com.innotrader.order.domain.model.OrderType;
import com.innotrader.order.domain.port.in.OrderUseCase.AmendOrderCommand;

import java.util.UUID;

/**
 * 정정 주문 요청. {@code quantity}=정정수량, {@code price}=정정가격.
 */
public record AmendOrderRequest(
        String accountNo,
        String symbol,
        String originalOrderNo,
        String orderType,   // MARKET | LIMIT
        long   quantity,
        long   price
) {
    public AmendOrderCommand toCommand(UUID userId) {
        return new AmendOrderCommand(userId, accountNo, symbol, originalOrderNo, OrderType.from(orderType), quantity, price);
    }
}

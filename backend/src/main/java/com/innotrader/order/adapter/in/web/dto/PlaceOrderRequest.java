package com.innotrader.order.adapter.in.web.dto;

import com.innotrader.order.domain.model.OrderSide;
import com.innotrader.order.domain.model.OrderType;
import com.innotrader.order.domain.port.in.OrderUseCase.PlaceOrderCommand;

import java.util.UUID;

/**
 * 매수/매도 주문 요청.
 *
 * <p>주문구분(side)은 엔드포인트(/buy, /sell)로 결정되며, 사용자ID는 인증 주체에서 전달된다.
 */
public record PlaceOrderRequest(
        String accountNo,
        String symbol,
        String orderType,   // MARKET | LIMIT (시장가 | 지정가)
        long   quantity,
        long   price
) {
    public PlaceOrderCommand toCommand(UUID userId, OrderSide side) {
        return new PlaceOrderCommand(userId, accountNo, symbol, side, OrderType.from(orderType), quantity, price);
    }
}

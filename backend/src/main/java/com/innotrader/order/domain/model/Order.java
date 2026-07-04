package com.innotrader.order.domain.model;

import java.time.Instant;
import java.util.UUID;

/**
 * 주문 도메인 모델.
 *
 * <p>매수/매도 주문은 물론, 정정/취소 접수증(AMENDED/CANCEL_DONE)도 동일 모델로 표현한다.
 * 접수증 행은 {@code originalOrderNo}로 원주문을 가리키며 주문내역 조회에서는 제외된다.
 */
public record Order(
        UUID        id,
        UUID        userId,
        String      accountNo,
        String      orderNo,          // 주문번호
        String      originalOrderNo,  // 원주문번호 (정정/취소 시), 일반 주문은 null
        String      symbol,
        OrderSide   side,             // 주문구분 (buy/sell)
        OrderType   orderType,        // 주문유형 (시장가/지정가)
        long        quantity,         // 주문수량
        long        price,            // 주문가격(단가)
        OrderStatus status,           // 주문상태
        long        filledQuantity,   // 체결수량
        long        filledPrice,      // 체결가격(단가)
        Instant     orderedAt         // 주문일시
) {
    /** 미체결수량 (취소분 제외). */
    public long unfilledQuantity() {
        return Math.max(0, quantity - filledQuantity);
    }

    /** 신규 주문 생성. */
    public static Order place(UUID userId, String accountNo, String orderNo,
                              String symbol, OrderSide side, OrderType orderType,
                              long quantity, long price,
                              OrderStatus status, long filledQuantity, long filledPrice,
                              Instant orderedAt) {
        return new Order(UUID.randomUUID(), userId, accountNo, orderNo, null,
                symbol, side, orderType, quantity, price,
                status, filledQuantity, filledPrice, orderedAt);
    }

    /** 정정/취소 접수증 생성. */
    public static Order receipt(UUID userId, String accountNo, String orderNo, String originalOrderNo,
                                String symbol, OrderSide side, OrderType orderType,
                                long quantity, long price, OrderStatus status, Instant orderedAt) {
        return new Order(UUID.randomUUID(), userId, accountNo, orderNo, originalOrderNo,
                symbol, side, orderType, quantity, price, status, 0, 0, orderedAt);
    }

    /** 정정: 수량/가격/유형 갱신 (상태는 접수로 되돌림). */
    public Order amended(OrderType newType, long newQuantity, long newPrice) {
        return new Order(id, userId, accountNo, orderNo, originalOrderNo,
                symbol, side, newType, newQuantity, newPrice,
                OrderStatus.RECEIVED, filledQuantity, filledPrice, orderedAt);
    }

    /** 취소: 상태를 취소로 전환. */
    public Order canceled() {
        return new Order(id, userId, accountNo, orderNo, originalOrderNo,
                symbol, side, orderType, quantity, price,
                OrderStatus.CANCELED, filledQuantity, filledPrice, orderedAt);
    }

    /** 체결(전체/부분): 체결수량을 누적하고, 잔량이 남으면 부분체결·모두 소진되면 전체체결로 전환. */
    public Order filled(long fillQuantity, long fillPrice) {
        long newFilledQuantity = filledQuantity + fillQuantity;
        OrderStatus newStatus = newFilledQuantity >= quantity ? OrderStatus.FILLED : OrderStatus.PARTIAL;
        return new Order(id, userId, accountNo, orderNo, originalOrderNo,
                symbol, side, orderType, quantity, price,
                newStatus, newFilledQuantity, fillPrice, orderedAt);
    }
}

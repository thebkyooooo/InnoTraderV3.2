package com.innotrader.order.application.task;

/**
 * 지정가 주문이 미체결(RECEIVED/PARTIAL) 상태로 새로 생기거나 되돌아갔음을 알리는 이벤트.
 *
 * <p>{@link OrderFillEngine}이 이 이벤트를 받으면 다음 tick부터 다시 DB를 폴링하도록
 * 깨어난다 — 미체결 주문이 하나도 없을 때 매초 불필요한 조회를 반복하지 않기 위함.
 */
public record OrderActivatedEvent() {
}

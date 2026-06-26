package com.innotrader.order.domain.port.in;

import com.innotrader.order.domain.model.OrderSide;
import com.innotrader.order.domain.model.OrderStatus;
import com.innotrader.order.domain.model.OrderType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Inbound port: 계좌주문 유스케이스 (매수/매도, 정정, 취소, 주문내역 조회).
 *
 * <p>사용자ID는 인증 주체(JWT)에서 전달된다.
 */
public interface OrderUseCase {

    // ── 주문구분 필터 (주문내역 조회) ──────────────────────────────────────────
    enum SideFilter { ALL, BUY, SELL }

    // ── 체결구분 필터 (주문내역 조회) ──────────────────────────────────────────
    enum FillFilter { ALL, FILLED, UNFILLED }

    // ── Commands ───────────────────────────────────────────────────────────────
    /** 매수/매도 주문. */
    record PlaceOrderCommand(
            UUID userId, String accountNo, String symbol,
            OrderSide side, OrderType orderType, long quantity, long price
    ) {}

    /** 정정 주문. */
    record AmendOrderCommand(
            UUID userId, String accountNo, String symbol, String originalOrderNo,
            OrderType orderType, long quantity, long price
    ) {}

    /** 취소 주문. */
    record CancelOrderCommand(
            UUID userId, String accountNo, String symbol, String originalOrderNo
    ) {}

    /**
     * 주문내역 조회 조건. {@code symbol}이 null/blank면 전체 종목.
     * {@code startDate}/{@code endDate}는 주문일자(Asia/Seoul 기준) inclusive 필터이며 null이면 해당 경계 무시.
     */
    record HistoryQuery(
            UUID userId, String accountNo, SideFilter sideFilter, FillFilter fillFilter, String symbol,
            LocalDate startDate, LocalDate endDate
    ) {}

    // ── Results ──────────────────────────────────────────────────────────────
    /** 매수/매도 주문 결과. */
    record OrderResult(
            String accountNo, String orderNo, String symbol,
            OrderSide side, OrderType orderType, long quantity, long price,
            OrderStatus status, long filledQuantity, Instant orderedAt
    ) {}

    /** 정정 주문 결과. */
    record AmendResult(
            String accountNo, String orderNo, String originalOrderNo, String symbol,
            OrderType orderType, long quantity, long price, OrderStatus status, Instant orderedAt
    ) {}

    /** 취소 주문 결과. */
    record CancelResult(
            String accountNo, String orderNo, String originalOrderNo, String symbol,
            long cancelQuantity, OrderStatus status, Instant orderedAt
    ) {}

    /** 주문내역 항목. */
    record HistoryItem(
            String name, String symbol,
            long quantity, long price, long orderAmount, long filledQuantity, long filledPrice,
            OrderSide side, OrderType orderType, OrderStatus status,
            String orderNo, Instant orderedAt
    ) {}

    /** 주문내역 요약. */
    record HistorySummary(
            long totalQuantity,          // 총주문수량
            long totalFilledQuantity,    // 총체결수량
            long totalUnfilledQuantity,  // 총미체결수량
            long totalCanceledQuantity,  // 총취소수량
            long totalFilledAmount       // 총체결금액
    ) {}

    /** 주문내역 조회 결과 (요약 + 목록). */
    record HistoryResult(HistorySummary summary, List<HistoryItem> items) {}

    // ── Operations ──────────────────────────────────────────────────────────
    OrderResult placeOrder(PlaceOrderCommand command);

    AmendResult amendOrder(AmendOrderCommand command);

    CancelResult cancelOrder(CancelOrderCommand command);

    HistoryResult getHistory(HistoryQuery query);

    /** 계좌별 주문내역 시드 (계좌 단위 멱등, 빈 경우만). */
    void seedDefaults(UUID userId);

    /** 계좌별 주문내역 초기화 후 재시드 (기존 시드 계좌 삭제 → 재생성). */
    void resetAndSeed(UUID userId);
}

package com.innotrader.order.adapter.in.web.dto;

import com.innotrader.order.domain.port.in.OrderUseCase.HistoryItem;
import com.innotrader.order.domain.port.in.OrderUseCase.HistoryResult;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 주문내역 조회 응답 (요약 + 목록).
 */
public record OrderHistoryResponse(
        Summary summary,
        List<Item> items
) {
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm:ss");

    /** 주문내역 요약. */
    public record Summary(
            long totalQuantity,          // 총주문수량
            long totalFilledQuantity,    // 총체결수량
            long totalUnfilledQuantity,  // 총미체결수량
            long totalCanceledQuantity,  // 총취소수량
            long totalFilledAmount       // 총체결금액
    ) {}

    /** 주문내역 항목. */
    public record Item(
            String  orderDate,      // 주문일자 (yyyy-MM-dd)
            String  orderTime,      // 주문시간 (HH:mm:ss)
            String  name,           // 종목명
            String  symbol,         // 종목코드
            long    quantity,       // 주문수량
            long    price,          // 주문단가
            long    orderAmount,    // 주문금액
            long    filledQuantity, // 체결수량
            long    filledPrice,    // 체결단가
            String  side,           // buy | sell
            String  sideName,       // 매수 | 매도
            String  orderType,      // MARKET | LIMIT
            String  orderTypeName,  // 시장가 | 지정가
            String  status,         // 주문상태 코드
            String  statusName,     // 주문상태명
            String  orderNo,        // 주문번호
            Instant orderedAt
    ) {
        static Item from(HistoryItem i) {
            LocalDateTime dt = LocalDateTime.ofInstant(i.orderedAt(), ZONE);
            return new Item(
                    dt.format(DATE), dt.format(TIME),
                    i.name(), i.symbol(),
                    i.quantity(), i.price(), i.orderAmount(), i.filledQuantity(), i.filledPrice(),
                    i.side().code(), i.side().label(),
                    i.orderType().code(), i.orderType().label(),
                    i.status().code(), i.status().label(),
                    i.orderNo(), i.orderedAt());
        }
    }

    public static OrderHistoryResponse from(HistoryResult r) {
        Summary summary = new Summary(
                r.summary().totalQuantity(),
                r.summary().totalFilledQuantity(),
                r.summary().totalUnfilledQuantity(),
                r.summary().totalCanceledQuantity(),
                r.summary().totalFilledAmount());
        List<Item> items = r.items().stream().map(Item::from).toList();
        return new OrderHistoryResponse(summary, items);
    }
}

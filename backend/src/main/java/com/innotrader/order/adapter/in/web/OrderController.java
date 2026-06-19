package com.innotrader.order.adapter.in.web;

import com.innotrader.common.security.JwtUserDetails;
import com.innotrader.order.adapter.in.web.dto.AmendOrderRequest;
import com.innotrader.order.adapter.in.web.dto.AmendResponse;
import com.innotrader.order.adapter.in.web.dto.CancelOrderRequest;
import com.innotrader.order.adapter.in.web.dto.CancelResponse;
import com.innotrader.order.adapter.in.web.dto.OrderHistoryResponse;
import com.innotrader.order.adapter.in.web.dto.OrderResponse;
import com.innotrader.order.adapter.in.web.dto.PlaceOrderRequest;
import com.innotrader.order.domain.model.OrderSide;
import com.innotrader.order.domain.port.in.OrderUseCase;
import com.innotrader.order.domain.port.in.OrderUseCase.FillFilter;
import com.innotrader.order.domain.port.in.OrderUseCase.HistoryQuery;
import com.innotrader.order.domain.port.in.OrderUseCase.SideFilter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST inbound adapter for 계좌주문 — 인증 필요 ({@code /api/private/order}).
 *
 * <ul>
 *   <li>{@code POST /buy}     — 매수 주문</li>
 *   <li>{@code POST /sell}    — 매도 주문</li>
 *   <li>{@code POST /amend}   — 정정 주문</li>
 *   <li>{@code POST /cancel}  — 취소 주문</li>
 *   <li>{@code GET  /history} — 주문내역 조회 (요약 + 목록)</li>
 *   <li>{@code POST /seed}    — 계좌별 주문내역 시드</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/private/order")
public class OrderController {

    private final OrderUseCase orderUseCase;

    public OrderController(OrderUseCase orderUseCase) {
        this.orderUseCase = orderUseCase;
    }

    /** 매수 주문 */
    @PostMapping("/buy")
    public ResponseEntity<OrderResponse> buy(@AuthenticationPrincipal JwtUserDetails principal,
                                             @RequestBody PlaceOrderRequest request) {
        return ResponseEntity.ok(OrderResponse.from(
                orderUseCase.placeOrder(request.toCommand(userId(principal), OrderSide.BUY))));
    }

    /** 매도 주문 */
    @PostMapping("/sell")
    public ResponseEntity<OrderResponse> sell(@AuthenticationPrincipal JwtUserDetails principal,
                                              @RequestBody PlaceOrderRequest request) {
        return ResponseEntity.ok(OrderResponse.from(
                orderUseCase.placeOrder(request.toCommand(userId(principal), OrderSide.SELL))));
    }

    /** 정정 주문 */
    @PostMapping("/amend")
    public ResponseEntity<AmendResponse> amend(@AuthenticationPrincipal JwtUserDetails principal,
                                               @RequestBody AmendOrderRequest request) {
        return ResponseEntity.ok(AmendResponse.from(
                orderUseCase.amendOrder(request.toCommand(userId(principal)))));
    }

    /** 취소 주문 */
    @PostMapping("/cancel")
    public ResponseEntity<CancelResponse> cancel(@AuthenticationPrincipal JwtUserDetails principal,
                                                 @RequestBody CancelOrderRequest request) {
        return ResponseEntity.ok(CancelResponse.from(
                orderUseCase.cancelOrder(request.toCommand(userId(principal)))));
    }

    /** 주문내역 조회 */
    @GetMapping("/history")
    public ResponseEntity<OrderHistoryResponse> history(
            @AuthenticationPrincipal JwtUserDetails principal,
            @RequestParam String accountNo,
            @RequestParam(defaultValue = "ALL") String side,
            @RequestParam(defaultValue = "ALL") String fill,
            @RequestParam(required = false) String symbol) {
        HistoryQuery query = new HistoryQuery(
                userId(principal), accountNo,
                SideFilter.valueOf(side.toUpperCase()),
                FillFilter.valueOf(fill.toUpperCase()),
                symbol);
        return ResponseEntity.ok(OrderHistoryResponse.from(orderUseCase.getHistory(query)));
    }

    /** 계좌별 주문내역 초기화 후 재시드 (기존 데이터 삭제 → 재생성) */
    @PostMapping("/seed")
    public ResponseEntity<Void> seed(@AuthenticationPrincipal JwtUserDetails principal) {
        orderUseCase.resetAndSeed(userId(principal));
        return ResponseEntity.ok().build();
    }

    private UUID userId(JwtUserDetails principal) {
        return UUID.fromString(principal.getUserId());
    }
}

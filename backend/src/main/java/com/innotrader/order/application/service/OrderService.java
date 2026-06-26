package com.innotrader.order.application.service;

import com.innotrader.common.annotation.UseCase;
import com.innotrader.common.error.BusinessException;
import com.innotrader.common.error.ErrorCode;
import com.innotrader.order.domain.model.Order;
import com.innotrader.order.domain.model.OrderSide;
import com.innotrader.order.domain.model.OrderStatus;
import com.innotrader.order.domain.model.OrderType;
import com.innotrader.order.domain.port.in.OrderUseCase;
import com.innotrader.order.domain.port.out.OrderPort;
import com.innotrader.stock.domain.model.StockMaster;
import com.innotrader.stock.domain.port.in.GetStockMasterUseCase;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.UUID;

/**
 * 계좌주문 애플리케이션 서비스.
 *
 * <ul>
 *   <li>매수/매도: 시장가는 즉시 전체체결, 지정가는 접수(미체결)로 처리</li>
 *   <li>정정: 원주문 수량/가격/유형 갱신 + 정정완료 접수증 발행</li>
 *   <li>취소: 원주문 취소 + 취소완료 접수증 발행 (취소수량 = 미체결수량)</li>
 *   <li>주문내역: 접수증(정정완료/취소완료)을 제외한 실주문을 요약/목록으로 조회</li>
 *   <li>계좌별 주문 시드 (-01: 10건, -02: 3건, -71: 없음), 계좌 단위 멱등</li>
 * </ul>
 */
@UseCase
@Transactional
public class OrderService implements OrderUseCase {

    /** 주문내역에서 제외할 접수증 상태. */
    private static final Set<OrderStatus> RECEIPT_STATUSES = EnumSet.of(OrderStatus.AMENDED, OrderStatus.CANCEL_DONE);

    private record Seed(String accountNo, int todayCount) {}

    private static final List<Seed> SEEDS = List.of(
            new Seed("123-456789-01", 10),
            new Seed("123-456789-02", 3),
            new Seed("123-456789-71", 0)
    );

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private static final OrderStatus[] STATUS_POOL = {
            OrderStatus.FILLED, OrderStatus.FILLED, OrderStatus.RECEIVED,
            OrderStatus.PARTIAL, OrderStatus.FILLED, OrderStatus.CANCELED
    };

    private final OrderPort orderPort;
    private final GetStockMasterUseCase getStockMasterUseCase;

    public OrderService(OrderPort orderPort, GetStockMasterUseCase getStockMasterUseCase) {
        this.orderPort = orderPort;
        this.getStockMasterUseCase = getStockMasterUseCase;
    }

    // ── 매수/매도 ──────────────────────────────────────────────────────────────
    @Override
    public OrderResult placeOrder(PlaceOrderCommand cmd) {
        if (cmd.quantity() <= 0) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "주문수량은 1 이상이어야 합니다.");
        }
        long marketPrice = currentPrice(cmd.symbol(), cmd.price());

        OrderStatus status;
        long filledQty, filledPrice;
        if (cmd.orderType() == OrderType.MARKET) {
            // 시장가: 즉시 전체체결 (현재가로 체결)
            status = OrderStatus.FILLED;
            filledQty = cmd.quantity();
            filledPrice = marketPrice;
        } else {
            // 지정가: 접수 (미체결)
            status = OrderStatus.RECEIVED;
            filledQty = 0;
            filledPrice = 0;
        }

        long price = cmd.orderType() == OrderType.MARKET ? marketPrice : cmd.price();
        Order saved = orderPort.save(Order.place(
                cmd.userId(), cmd.accountNo(), orderPort.nextOrderNo(),
                cmd.symbol(), cmd.side(), cmd.orderType(),
                cmd.quantity(), price, status, filledQty, filledPrice, Instant.now()));

        return new OrderResult(
                saved.accountNo(), saved.orderNo(), saved.symbol(),
                saved.side(), saved.orderType(), saved.quantity(), saved.price(),
                saved.status(), saved.filledQuantity(), saved.orderedAt());
    }

    // ── 정정 ──────────────────────────────────────────────────────────────────
    @Override
    public AmendResult amendOrder(AmendOrderCommand cmd) {
        Order original = requireOrder(cmd.userId(), cmd.accountNo(), cmd.originalOrderNo());

        // 원주문 갱신 (수량/가격/유형, 상태=접수)
        orderPort.save(original.amended(cmd.orderType(), cmd.quantity(), cmd.price()));

        // 정정완료 접수증 발행
        Order receipt = orderPort.save(Order.receipt(
                cmd.userId(), cmd.accountNo(), orderPort.nextOrderNo(), original.orderNo(),
                cmd.symbol(), original.side(), cmd.orderType(),
                cmd.quantity(), cmd.price(), OrderStatus.AMENDED, Instant.now()));

        return new AmendResult(
                receipt.accountNo(), receipt.orderNo(), receipt.originalOrderNo(), receipt.symbol(),
                receipt.orderType(), receipt.quantity(), receipt.price(), receipt.status(), receipt.orderedAt());
    }

    // ── 취소 ──────────────────────────────────────────────────────────────────
    @Override
    public CancelResult cancelOrder(CancelOrderCommand cmd) {
        Order original = requireOrder(cmd.userId(), cmd.accountNo(), cmd.originalOrderNo());

        long cancelQty = original.unfilledQuantity();

        // 원주문 취소 처리
        orderPort.save(original.canceled());

        // 취소완료 접수증 발행
        Order receipt = orderPort.save(Order.receipt(
                cmd.userId(), cmd.accountNo(), orderPort.nextOrderNo(), original.orderNo(),
                cmd.symbol(), original.side(), original.orderType(),
                cancelQty, original.price(), OrderStatus.CANCEL_DONE, Instant.now()));

        return new CancelResult(
                receipt.accountNo(), receipt.orderNo(), receipt.originalOrderNo(), receipt.symbol(),
                cancelQty, receipt.status(), receipt.orderedAt());
    }

    // ── 주문내역 조회 ──────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public HistoryResult getHistory(HistoryQuery q) {
        String symbolFilter = (q.symbol() == null || q.symbol().isBlank()) ? null : q.symbol();

        List<Order> orders = orderPort.findByAccount(q.userId(), q.accountNo()).stream()
                .filter(o -> !RECEIPT_STATUSES.contains(o.status()))          // 접수증 제외
                .filter(o -> symbolFilter == null || symbolFilter.equals(o.symbol()))
                .filter(o -> matchesSide(o, q.sideFilter()))
                .filter(o -> matchesFill(o, q.fillFilter()))
                .filter(o -> matchesDate(o, q.startDate(), q.endDate()))       // 주문일자(KST) 범위 필터
                .toList();

        List<HistoryItem> items = new ArrayList<>(orders.size());
        long totalQty = 0, totalFilled = 0, totalUnfilled = 0, totalCanceled = 0, totalFilledAmount = 0;
        for (Order o : orders) {
            String name = getStockMasterUseCase.getBySymbol(o.symbol()).map(StockMaster::name).orElse(o.symbol());
            long orderAmount = o.quantity() * o.price();
            items.add(new HistoryItem(
                    name, o.symbol(), o.quantity(), o.price(), orderAmount,
                    o.filledQuantity(), o.filledPrice(), o.side(), o.orderType(), o.status(),
                    o.orderNo(), o.orderedAt()));

            totalQty += o.quantity();
            totalFilled += o.filledQuantity();
            totalFilledAmount += o.filledQuantity() * o.filledPrice();
            if (o.status() == OrderStatus.CANCELED) {
                totalCanceled += o.unfilledQuantity();
            } else {
                totalUnfilled += o.unfilledQuantity();
            }
        }

        return new HistoryResult(
                new HistorySummary(totalQty, totalFilled, totalUnfilled, totalCanceled, totalFilledAmount),
                items);
    }

    // ── 시드 ──────────────────────────────────────────────────────────────────
    @Override
    public void seedDefaults(UUID userId) {
        List<StockMaster> universe = getStockMasterUseCase.getByMarket("ALL");
        if (universe.isEmpty()) return;
        for (Seed seed : SEEDS) {
            if (seed.todayCount() == 0) continue;
            if (orderPort.existsByAccount(userId, seed.accountNo())) continue;
            seedAccount(userId, seed, universe);
        }
    }

    @Override
    public void resetAndSeed(UUID userId) {
        for (Seed seed : SEEDS) {
            orderPort.deleteByAccount(userId, seed.accountNo());
        }
        List<StockMaster> universe = getStockMasterUseCase.getByMarket("ALL");
        if (universe.isEmpty()) return;
        for (Seed seed : SEEDS) {
            if (seed.todayCount() == 0) continue;
            seedAccount(userId, seed, universe);
        }
    }

    /** 계좌별: 당일 {@code todayCount}건 + 이전 최근 1개월 랜덤(1~10건). */
    private void seedAccount(UUID userId, Seed seed, List<StockMaster> universe) {
        Random rng = new Random(seed.accountNo().hashCode());
        LocalDate today = LocalDate.now(KST);

        // 당일
        for (int i = 0; i < seed.todayCount(); i++) {
            orderPort.save(makeOrder(userId, seed.accountNo(), universe, rng, today));
        }
        // 이전 최근 1개월 랜덤 (1~10건)
        int pastCount = 1 + rng.nextInt(10);
        for (int i = 0; i < pastCount; i++) {
            LocalDate date = today.minusDays(1 + rng.nextInt(30));
            orderPort.save(makeOrder(userId, seed.accountNo(), universe, rng, date));
        }
    }

    private Order makeOrder(UUID userId, String accountNo, List<StockMaster> universe, Random rng, LocalDate date) {
        StockMaster stock = universe.get(rng.nextInt(universe.size()));
        OrderSide side = rng.nextBoolean() ? OrderSide.BUY : OrderSide.SELL;
        OrderStatus status = STATUS_POOL[rng.nextInt(STATUS_POOL.length)];
        OrderType type = status == OrderStatus.FILLED && rng.nextBoolean() ? OrderType.MARKET : OrderType.LIMIT;

        long qty = (1 + rng.nextInt(50)) * 10L;
        long price = Math.max(1L, Math.round(stock.price() * (0.95 + rng.nextDouble() * 0.1)));
        long filledQty = switch (status) {
            case FILLED -> qty;
            case PARTIAL -> Math.max(1, qty / 2);
            default -> 0;     // RECEIVED, CANCELED
        };
        long filledPrice = filledQty > 0 ? price : 0;
        // 장중 시간(09:00~15:29) 내 랜덤 시각
        Instant orderedAt = date.atStartOfDay(KST).plusHours(9).plusMinutes(rng.nextInt(390)).toInstant();

        return Order.place(userId, accountNo, orderPort.nextOrderNo(),
                stock.symbol(), side, type, qty, price, status, filledQty, filledPrice, orderedAt);
    }

    // ── helpers ─────────────────────────────────────────────────────────────
    private Order requireOrder(UUID userId, String accountNo, String orderNo) {
        return orderPort.findByOrderNo(userId, accountNo, orderNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
    }

    private long currentPrice(String symbol, long fallback) {
        return getStockMasterUseCase.getBySymbol(symbol).map(StockMaster::price).orElse(fallback);
    }

    private boolean matchesSide(Order o, SideFilter f) {
        return switch (f) {
            case ALL  -> true;
            case BUY  -> o.side() == OrderSide.BUY;
            case SELL -> o.side() == OrderSide.SELL;
        };
    }

    private boolean matchesFill(Order o, FillFilter f) {
        return switch (f) {
            case ALL      -> true;
            case FILLED   -> o.filledQuantity() > 0;                                   // 체결분 존재
            case UNFILLED -> o.status() != OrderStatus.CANCELED && o.unfilledQuantity() > 0; // 미체결 잔량 존재
        };
    }

    /** 주문일자(Asia/Seoul 기준)가 [startDate, endDate] inclusive 범위에 드는지. null 경계는 무시. */
    private boolean matchesDate(Order o, LocalDate startDate, LocalDate endDate) {
        LocalDate orderDate = o.orderedAt().atZone(KST).toLocalDate();
        if (startDate != null && orderDate.isBefore(startDate)) return false;
        if (endDate != null && orderDate.isAfter(endDate)) return false;
        return true;
    }
}

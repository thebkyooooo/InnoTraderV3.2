package com.innotrader.order.application.task;

import com.innotrader.common.support.PriceTick;
import com.innotrader.holding.domain.port.in.HoldingUseCase;
import com.innotrader.order.adapter.in.web.dto.AccountActivityMessage;
import com.innotrader.order.domain.model.Order;
import com.innotrader.order.domain.model.OrderSide;
import com.innotrader.order.domain.port.out.OrderPort;
import com.innotrader.quote.domain.port.out.FindStockBasePort;
import com.innotrader.quote.domain.port.out.FindStockBasePort.StockBase;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 지정가 주문 자동 체결 매칭 엔진.
 *
 * <p>시세({@link com.innotrader.quote.application.task.StockPriceBroadcaster}와 동일한
 * 평균회귀 랜덤워크 공식이지만, 구독 여부와 무관하게 미체결 지정가 주문이 걸린 모든 종목에
 * 대해 독립적으로 시뮬레이션한다 — 화면에 보이는 실시간가와 완전히 같은 값은 아니지만
 * 통계적으로 동일한 분포를 따르므로 모의투자 목적상 충분하다.
 *
 * <p>매 틱마다 미체결(RECEIVED/PARTIAL) 지정가 주문을 스캔해 시뮬레이션 시세가 지정가를
 * 통과하면 체결 처리한다: 매수는 시세 ≤ 지정가, 매도는 시세 ≥ 지정가일 때 체결 조건 충족.
 * 체결은 전량 또는 확률적 부분체결로 나뉘며, 체결분은 보유종목에 즉시 반영하고
 * {@code /topic/account/activity/{accountNo}} 로 갱신 신호를 push한다.
 */
@Component
public class OrderFillEngine {

    private static final String TOPIC_ACTIVITY = "/topic/account/activity/";

    @Value("${app.broadcast-ms:1000}")
    private volatile long broadcastMs;

    private final OrderPort orderPort;
    private final HoldingUseCase holdingUseCase;
    private final FindStockBasePort findStockBasePort;
    private final SimpMessagingTemplate messaging;
    private final TaskScheduler taskScheduler;
    private final Random rng = new Random();

    /** symbol → 이 엔진 전용 연속 워크 상태(현재가 시뮬레이션). StockPriceBroadcaster와는 독립적인 상태. */
    private final Map<String, Long> lastWalk = new ConcurrentHashMap<>();

    public OrderFillEngine(OrderPort orderPort,
                            HoldingUseCase holdingUseCase,
                            FindStockBasePort findStockBasePort,
                            SimpMessagingTemplate messaging,
                            @Qualifier("broadcastTaskScheduler") TaskScheduler taskScheduler) {
        this.orderPort         = orderPort;
        this.holdingUseCase    = holdingUseCase;
        this.findStockBasePort = findStockBasePort;
        this.messaging         = messaging;
        this.taskScheduler     = taskScheduler;
    }

    @PostConstruct
    public void init() {
        taskScheduler.scheduleAtFixedRate(this::tick, Duration.ofMillis(broadcastMs));
    }

    @Transactional
    public void tick() {
        List<Order> openOrders = orderPort.findActiveLimitOrders();
        if (openOrders.isEmpty()) return;

        long nowTick = System.currentTimeMillis() / broadcastMs;
        Map<String, List<Order>> bySymbol = openOrders.stream()
                .collect(Collectors.groupingBy(Order::symbol));

        for (Map.Entry<String, List<Order>> entry : bySymbol.entrySet()) {
            findStockBasePort.findBySymbol(entry.getKey()).ifPresent(base -> {
                long marketPrice = simulatePrice(base, nowTick);
                for (Order order : entry.getValue()) {
                    tryFill(order, marketPrice);
                }
            });
        }
    }

    private void tryFill(Order order, long marketPrice) {
        boolean crossed = order.side() == OrderSide.BUY
                ? marketPrice <= order.price()
                : marketPrice >= order.price();
        if (!crossed) return;

        long remaining = order.unfilledQuantity();
        if (remaining <= 0) return;

        // 소량 잔량이거나 55% 확률로 전량체결, 그 외엔 잔량의 25~75%만 부분체결
        boolean fullFill = remaining <= 10 || rng.nextDouble() < 0.55;
        long fillQty = fullFill ? remaining
                : Math.max(1, Math.min(remaining, Math.round(remaining * (0.25 + rng.nextDouble() * 0.5))));

        Order updated = order.filled(fillQty, order.price());
        orderPort.save(updated);
        holdingUseCase.applyFill(order.userId(), order.accountNo(), order.symbol(),
                order.side() == OrderSide.BUY, fillQty, order.price());

        messaging.convertAndSend(TOPIC_ACTIVITY + order.accountNo(),
                new AccountActivityMessage(order.accountNo(), order.orderNo(), order.symbol(), "ORDER_FILLED", Instant.now()));
    }

    /** StockPriceBroadcaster.simulate() 의 가격 워크 부분과 동일한 공식(평균회귀 + 상하한 clamp). */
    private long simulatePrice(StockBase base, long nowTick) {
        long prevClose  = PriceTick.round(base.price() - base.prevDiff());
        long upperLimit = PriceTick.round(Math.round(prevClose * 1.3));
        long lowerLimit = Math.max(100L, PriceTick.round(Math.round(prevClose * 0.7)));

        long tick = PriceTick.tickSize(base.price());
        int seed  = (int) (((base.price() * 53L + nowTick * 2654435761L)) & 0xFFFFFFFFL);
        int s1    = lcg(seed);

        long prevWalk = lastWalk.getOrDefault(base.symbol(), base.price());
        double amp    = Math.max(base.price() * 0.0004, tick * 0.8);
        double step   = (rand(s1) - 0.5) * 2.0 * amp;
        double revert = (base.price() - prevWalk) * 0.4;
        double delta  = step + revert;

        long walk  = clamp(lowerLimit, upperLimit, Math.round(prevWalk + delta));
        lastWalk.put(base.symbol(), walk);
        return clamp(lowerLimit, upperLimit, PriceTick.round(walk));
    }

    private static long clamp(long min, long max, long v) {
        return Math.max(min, Math.min(max, v));
    }

    private static int lcg(int s) {
        return (int) ((s * 1664525L + 1013904223L) & 0xFFFFFFFFL);
    }

    private static double rand(int s) {
        return (s & 0xFFFFFFFFL) / (double) 0xFFFFFFFFL;
    }
}

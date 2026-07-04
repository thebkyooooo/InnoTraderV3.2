package com.innotrader.market.application.task;

import com.innotrader.market.domain.model.ExchangeRate;
import com.innotrader.market.domain.model.IndexInfo;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.IntStream;

/**
 * 글로벌 지수/환율 실시간 WebSocket 브로드캐스터.
 *
 * <p>지수 8개·환율 5개는 모든 클라이언트에 공통 노출되는 소수의 공개 데이터라,
 * 종목 시세({@link com.innotrader.quote.application.task.StockPriceBroadcaster})와
 * 달리 구독 추적 없이 고정 주기로 전체를 {@code /topic/market/index},
 * {@code /topic/market/exchange} 에 push한다.
 *
 * <p>{@link com.innotrader.market.application.service.MarketService#getIndexInfo()} /
 * {@code getExchangeRates()} 의 REST 스냅샷과 동일한 base·고정시드 오프셋에서 워크를
 * 시작해, 최초 REST 조회 값과 이후 WS push 값이 자연스럽게 이어지도록 한다.
 */
@Component
public class MarketDataBroadcaster {

    private static final String TOPIC_INDEX    = "/topic/market/index";
    private static final String TOPIC_EXCHANGE = "/topic/market/exchange";

    @Value("${app.broadcast-ms:1000}")
    private volatile long broadcastMs;

    private record IndexSpec(String code, String name, double base) {}
    private record RateSpec(String pair, String name, double base) {}

    // MarketService.getIndexInfo() / getExchangeRates() 와 동일한 spec (base·고정시드 offset 재현용)
    private static final List<IndexSpec> INDEX_SPECS = List.of(
            new IndexSpec("KS11",   "코스피",       8713.42),
            new IndexSpec("KQ11",   "코스닥",          845.24),
            new IndexSpec("DJI",    "DOW",          50866.78),
            new IndexSpec("COMP",   "NASDAQ",       22881.38),
            new IndexSpec("INX",    "S&P 500",       7383.74),
            new IndexSpec("N225",   "니케이 225",   69212.26),
            new IndexSpec("000001", "상하이 종합",   4096.47),
            new IndexSpec("HSI",    "항셍",         24961.95)
    );

    private static final List<RateSpec> RATE_SPECS = List.of(
            new RateSpec("USD/KRW", "미국 달러/원",      1548.80),
            new RateSpec("JPY/KRW", "일본 엔/원",           9.57),
            new RateSpec("EUR/KRW", "유로/원",            1758.8),
            new RateSpec("GBP/KRW", "영국 파운드/원",     2039.2),
            new RateSpec("CNY/KRW", "중국 위안(RMB)/원",   227.6)
    );

    /** key(idx:CODE / rate:PAIR) → 연속 워크 상태(현재가) */
    private final Map<String, Double> lastWalk = new ConcurrentHashMap<>();

    private final SimpMessagingTemplate messaging;
    private final TaskScheduler taskScheduler;

    public MarketDataBroadcaster(SimpMessagingTemplate messaging,
                                  @Qualifier("broadcastTaskScheduler") TaskScheduler taskScheduler) {
        this.messaging     = messaging;
        this.taskScheduler = taskScheduler;
    }

    @PostConstruct
    public void init() {
        taskScheduler.scheduleAtFixedRate(this::broadcast, Duration.ofMillis(broadcastMs));
    }

    private void broadcast() {
        long nowTick = System.currentTimeMillis() / broadcastMs;

        List<IndexInfo> indexes = IntStream.range(0, INDEX_SPECS.size())
                .mapToObj(i -> {
                    IndexSpec s = INDEX_SPECS.get(i);
                    double[] r = simulate("idx:" + s.code(), s.base(), 42L + i, nowTick, i);
                    return new IndexInfo(s.code(), s.name(), r[0], r[1], r[2]);
                })
                .toList();

        List<ExchangeRate> rates = IntStream.range(0, RATE_SPECS.size())
                .mapToObj(i -> {
                    RateSpec s = RATE_SPECS.get(i);
                    double[] r = simulate("rate:" + s.pair(), s.base(), 99L + i, nowTick, i);
                    return new ExchangeRate(s.pair(), s.name(), r[0], r[1], r[2]);
                })
                .toList();

        messaging.convertAndSend(TOPIC_INDEX, indexes);
        messaging.convertAndSend(TOPIC_EXCHANGE, rates);
    }

    /**
     * 평균회귀 랜덤워크 한 스텝. base(전일종가 취급)에서 fixedSeed로 결정되는 고정 오프셋을
     * 최초 상태로 삼아 REST 스냅샷과 이어지게 하고, 이후 매 틱 소폭 변동시킨다.
     *
     * @return {price, prevDiff, change}
     */
    private double[] simulate(String key, double base, long fixedSeed, long nowTick, int seedIndex) {
        double prevWalk = lastWalk.computeIfAbsent(key, k -> base + fixedOffset(base, fixedSeed));

        int seed = (int) ((Double.doubleToLongBits(base) ^ (nowTick * 2654435761L) ^ (seedIndex * 97L)) & 0xFFFFFFFFL);
        int s1   = lcg(seed);
        double amp    = Math.abs(base) * 0.0006;
        double step   = (rand(s1) - 0.5) * 2.0 * amp;
        double revert = (base - prevWalk) * 0.1;   // base(전일종가) 쪽으로 약하게 회귀
        double nextWalk = prevWalk + step + revert;
        lastWalk.put(key, nextWalk);

        double price    = round2(nextWalk);
        double prevDiff = round2(price - base);
        double change   = base == 0 ? 0.0 : round1(prevDiff / base * 100);
        return new double[]{ price, prevDiff, change };
    }

    /** MarketService의 고정시드 offset과 동일한 공식 — 최초 REST 스냅샷과 연속되도록. */
    private static double fixedOffset(double base, long fixedSeed) {
        Random rng = new Random(fixedSeed);
        return round2(base * (rng.nextDouble() - 0.5) * 0.04);
    }

    private static int lcg(int s) {
        return (int) ((s * 1664525L + 1013904223L) & 0xFFFFFFFFL);
    }

    private static double rand(int s) {
        return (s & 0xFFFFFFFFL) / (double) 0xFFFFFFFFL;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}

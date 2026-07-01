package com.innotrader.quote.application.task;

import com.innotrader.common.support.PriceTick;
import com.innotrader.quote.adapter.in.web.dto.FilledMessage;
import com.innotrader.quote.adapter.in.web.dto.HogaMessage;
import com.innotrader.quote.adapter.in.web.dto.InvestmentTrendMessage;
import com.innotrader.quote.adapter.in.web.dto.StockPriceMessage;
import com.innotrader.quote.domain.model.HogaEntry;
import com.innotrader.quote.domain.port.out.FindStockBasePort;
import com.innotrader.quote.domain.port.out.FindStockBasePort.StockBase;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

/**
 * 실시간 종목 시세 WebSocket 브로드캐스터.
 *
 * <p>클라이언트가 {@code /topic/quote/price/{symbol}} 을 구독하면
 * 2초마다({@link #broadcastMs}) 시뮬레이션 현재가를 해당 채널로 push한다.
 *
 * <ul>
 *   <li>구독 추적: {@link SessionSubscribeEvent} / {@link SessionUnsubscribeEvent} / {@link SessionDisconnectEvent}</li>
 *   <li>가격 시뮬레이션: LCG(seed=price*53+nowTick) 평균회귀 랜덤워크 — 매 푸시마다 최소 1틱 이상 이동</li>
 * </ul>
 */
@Component
public class StockPriceBroadcaster {

    private static final String TOPIC_PRICE  = "/topic/quote/price/";
    private static final String TOPIC_FILLED = "/topic/quote/filled/";
    private static final String TOPIC_TREND  = "/topic/quote/trend/";
    private static final String TOPIC_HOGA   = "/topic/quote/hoga/";
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HHmmss");
    /** 브로드캐스트 주기(ms). 런타임에 reschedule() 로 변경 가능. */
    @org.springframework.beans.factory.annotation.Value("${app.broadcast-ms:1000}")
    private volatile long broadcastMs;

    private final TaskScheduler taskScheduler;
    private ScheduledFuture<?> scheduledFuture;

    /** symbol → (sessionId → 해당 symbol 활성 구독 수). 한 세션이 price/filled/trend 를
     *  동시에 구독할 수 있으므로(공유 연결) 카운트로 관리한다. 카운트가 0이 되면 세션을 뺀다. */
    private final Map<String, Map<String, Integer>> symbolSubs = new ConcurrentHashMap<>();
    /** "sessionId:subscriptionId" → symbol. UNSUBSCRIBE 는 subscriptionId 만 오므로 역추적용. */
    private final Map<String, String> subKeyToSymbol = new ConcurrentHashMap<>();
    /** symbol → 직전 현재가 (평균회귀 랜덤워크 상태) */
    private final Map<String, Long> lastPrice = new ConcurrentHashMap<>();
    /** symbol → 일중 고가 (현재가의 누적 max — 종가가 도달할 때만 갱신) */
    private final Map<String, Long> dayHigh = new ConcurrentHashMap<>();
    /** symbol → 일중 저가 (현재가의 누적 min) */
    private final Map<String, Long> dayLow = new ConcurrentHashMap<>();
    /** symbol → 누적 기준 거래일 (yyyy-MM-dd) — 날짜가 바뀌면 고가/저가·체결누적 리셋 */
    private final Map<String, String> dayKey = new ConcurrentHashMap<>();
    /** symbol → 당일 누적 매수 체결량 (체결강도 계산용) */
    private final Map<String, Long> dayBuyVol = new ConcurrentHashMap<>();
    /** symbol → 당일 누적 매도 체결량 (체결강도 계산용) */
    private final Map<String, Long> daySellVol = new ConcurrentHashMap<>();
    /** symbol → 당일 외국인 순매수 누적 (투자동향) */
    private final Map<String, Long> dayForeign = new ConcurrentHashMap<>();
    /** symbol → 당일 개인 순매수 누적 (투자동향) */
    private final Map<String, Long> dayIndividual = new ConcurrentHashMap<>();
    /** symbol → 호가 레벨별 잔량 상태 (매도1~10=0~9, 매수1~10=10~19). 연속 변동용. */
    private final Map<String, long[]> hogaVols = new ConcurrentHashMap<>();

    private final SimpMessagingTemplate messaging;
    private final FindStockBasePort findStockBase;

    public StockPriceBroadcaster(SimpMessagingTemplate messaging,
                                 FindStockBasePort findStockBase,
                                 @Qualifier("broadcastTaskScheduler") TaskScheduler taskScheduler) {
        this.messaging      = messaging;
        this.findStockBase  = findStockBase;
        this.taskScheduler  = taskScheduler;
    }

    @PostConstruct
    public void init() {
        reschedule(broadcastMs);
    }

    /** 현재 브로드캐스트 주기(ms) 반환. */
    public long getCurrentIntervalMs() {
        return broadcastMs;
    }

    /**
     * 브로드캐스트 주기를 런타임에 변경한다.
     * 기존 스케줄을 취소하고 새 주기로 재스케줄링한다.
     *
     * @param ms 새 주기 (100~60000ms)
     */
    public synchronized void reschedule(long ms) {
        if (scheduledFuture != null) {
            scheduledFuture.cancel(false);
        }
        broadcastMs = ms;
        scheduledFuture = taskScheduler.scheduleAtFixedRate(this::broadcast, Duration.ofMillis(ms));
    }

    // ─── 구독 이벤트 추적 ─────────────────────────────────────────────────────

    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String dest      = accessor.getDestination();
        String sessionId = accessor.getSessionId();
        String subId     = accessor.getSubscriptionId();
        if (dest == null || sessionId == null || subId == null) return;
        String symbol = extractSymbol(dest);   // price/filled/trend 중 하나만 추적
        if (symbol == null) return;
        // 한 세션이 같은 symbol 의 여러 토픽을 구독할 수 있으므로 구독 단위로 카운트한다.
        subKeyToSymbol.put(sessionId + ':' + subId, symbol);
        symbolSubs.computeIfAbsent(symbol, k -> new ConcurrentHashMap<>()).merge(sessionId, 1, Integer::sum);
    }

    @EventListener
    public void onUnsubscribe(SessionUnsubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        String subId     = accessor.getSubscriptionId();
        if (sessionId == null || subId == null) return;
        // UNSUBSCRIBE 는 해당 구독 하나만 해제 — 같은 세션의 다른 토픽 구독은 그대로 둔다.
        String symbol = subKeyToSymbol.remove(sessionId + ':' + subId);
        if (symbol != null) removeOne(symbol, sessionId);
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        if (sessionId == null) return;
        // 연결 종료: 이 세션의 모든 구독을 정리한다.
        subKeyToSymbol.keySet().removeIf(k -> k.startsWith(sessionId + ":"));
        symbolSubs.forEach((sym, subs) -> subs.remove(sessionId));
        symbolSubs.entrySet().removeIf(e -> e.getValue().isEmpty());
    }

    private void removeOne(String symbol, String sessionId) {
        Map<String, Integer> subs = symbolSubs.get(symbol);
        if (subs == null) return;
        subs.merge(sessionId, -1, (cur, d) -> cur + d <= 0 ? null : cur + d);
        if (subs.isEmpty()) symbolSubs.remove(symbol);
    }

    private static String extractSymbol(String dest) {
        if (dest.startsWith(TOPIC_PRICE))  return dest.substring(TOPIC_PRICE.length());
        if (dest.startsWith(TOPIC_FILLED)) return dest.substring(TOPIC_FILLED.length());
        if (dest.startsWith(TOPIC_TREND))  return dest.substring(TOPIC_TREND.length());
        if (dest.startsWith(TOPIC_HOGA))   return dest.substring(TOPIC_HOGA.length());
        return null;
    }

    // ─── 주기마다 구독 종목 브로드캐스트 (broadcastMs) ──────────────────────

    /** 한 번의 시세 시뮬레이션 결과 — 현재가/체결/투자동향/호가 메시지(같은 시점). */
    private record Snapshot(StockPriceMessage price, FilledMessage filled,
                            InvestmentTrendMessage trend, HogaMessage hoga) {}

    public void broadcast() {
        symbolSubs.forEach((symbol, subs) -> {
            if (!subs.isEmpty()) {
                findStockBase.findBySymbol(symbol).ifPresent(base -> {
                    Snapshot snap = simulate(base);
                    messaging.convertAndSend(TOPIC_PRICE  + symbol, snap.price());
                    messaging.convertAndSend(TOPIC_FILLED + symbol, snap.filled());
                    messaging.convertAndSend(TOPIC_TREND  + symbol, snap.trend());
                    messaging.convertAndSend(TOPIC_HOGA   + symbol, snap.hoga());
                });
            }
        });
    }

    // ─── 시세 시뮬레이션 (MSW LCG와 동일 알고리즘) ───────────────────────────

    /** JS rng(seed) LCG 한 스텝 */
    private static int lcg(int s) {
        return (int) ((s * 1664525L + 1013904223L) & 0xFFFFFFFFL);
    }

    /** [0, 1) 부동소수 — JS (s >>> 0) / 0xffffffff 와 동일 */
    private static double rand(int s) {
        return (s & 0xFFFFFFFFL) / (double) 0xFFFFFFFFL;
    }

    private static long clamp(long min, long max, long v) {
        return Math.max(min, Math.min(max, v));
    }

    // ─── 호가 잔량 (레벨별 연속 변동) ────────────────────────────────────────────

    /** 레벨별 기준 잔량(평균회귀 목표) — symbol+level 로 당일 고정. */
    private static long refHogaVol(String symbol, int level) {
        return 3_000 + Math.abs(((long) symbol.hashCode() + level * 31L) * 2654435761L) % 30_000;
    }

    /** 초기 잔량 = 기준 잔량. */
    private static long[] initHogaVols(String symbol) {
        long[] v = new long[20];
        for (int j = 0; j < 20; j++) v[j] = refHogaVol(symbol, j);
        return v;
    }

    /** 한 스텝 변동: 기준값으로 약하게 끌어당기며(평균회귀) ±12% 흔든다. */
    private static long stepHogaVol(long cur, long ref, Random hr) {
        double delta = (hr.nextDouble() - 0.5) * 2.0 * ref * 0.12;
        long v = cur + Math.round(delta) + Math.round((ref - cur) * 0.12);
        return Math.max(100L, v);
    }

    private Snapshot simulate(StockBase base) {
        long nowTick  = System.currentTimeMillis() / broadcastMs;
        long prevClose  = PriceTick.round(base.price() - base.prevDiff());
        long upperLimit = PriceTick.round(Math.round(prevClose * 1.3));
        long lowerLimit = Math.max(100L, PriceTick.round(Math.round(prevClose * 0.7)));

        // 시가·기준 고가/저가: 날짜+가격 시드로 당일 결정적 산출.
        // 서버가 재시작돼 dayHigh/dayLow 누적 맵이 비어도 동일 값으로 복원되므로,
        // 고가/저가가 리셋되며 역행(고가↓·저가↑)하는 일이 없다.
        LocalDate today   = LocalDate.now(KST);
        int daySeed = (int) ((base.price() * 53L
                + (long) today.getYear() * 10_000
                + today.getMonthValue() * 100L
                + today.getDayOfMonth()) & 0xFFFFFFFFL);
        Random dayRng = new Random(daySeed);
        long open = clamp(lowerLimit, upperLimit,
                Math.max(100L, PriceTick.round(Math.round(prevClose * (1 + (dayRng.nextDouble() - 0.5) * 0.01)))));
        long baseHigh = clamp(lowerLimit, upperLimit,
                PriceTick.round(Math.max(base.price(), open) + Math.abs(dayRng.nextLong() % (base.price() / 200 + 1))));
        long baseLow = clamp(lowerLimit, upperLimit,
                Math.max(100L, PriceTick.round(Math.min(base.price(), open) - Math.abs(dayRng.nextLong() % (base.price() / 200 + 1)))));

        // 현재가: 평균회귀 랜덤워크(연속) → 출력은 호가 단위로 스냅.
        // 연속 워크를 상태로 보존하고 표시값만 틱 그리드로 반올림하므로, 워크가 틱 경계를
        // 넘을 때만 현재가가 1틱씩 움직인다(= 가격 변동이 호가 단위로 발생).
        // 스텝 진폭은 최소 1틱 이상 — 고가 종목(틱이 큰)도 워크가 틱 경계를 넘어 현재가가 갱신되도록.
        long tick = PriceTick.tickSize(base.price());
        // nowTick은 broadcastMs마다 1씩만 증가 → 연속 정수에 LCG를 한 번만 쓰면 출력이 거의 선형(상관)이라
        // 매 틱 난수가 미미하게만 변해 가격이 멈춘다. 큰 상수로 곱해 잘 섞은 뒤 시드한다.
        int seed = (int) (((base.price() * 53L + nowTick * 2654435761L)) & 0xFFFFFFFFL);
        int s1 = lcg(seed), s2 = lcg(s1), s3 = lcg(s2), s4 = lcg(s3), s5 = lcg(s4), s6 = lcg(s5), s7 = lcg(s6);
        long prevWalk = lastPrice.getOrDefault(base.symbol(), base.price());
        double amp    = Math.max(base.price() * 0.0004, tick * 0.8);  // 분봉 진폭 과대 방지 (기존: 0.0015, tick*2)
        double step   = (rand(s1) - 0.5) * 2.0 * amp;
        // 약한 평균회귀 — base에서 너무 멀리 벗어나지 않게만 끌어당기되, 한 방향 추세도 허용해
        // 매 푸시마다 가격이 눈에 띄게 움직이도록 한다.
        double revert = (base.price() - prevWalk) * 0.4;   // 기존: 0.15 → API 기준가와의 갭 최소화
        double delta  = step + revert;
        // 25% 확률로만 최소 1틱 이동 강제 — 분봉 현재 봉이 인접 봉 대비 비정상적으로 커지는 현상 방지.
        // s7 로 방향 결정해 s2 의 확률 판정과 분리.
        if (Math.abs(delta) < tick && rand(s2) < 0.25) {
            delta = (rand(s7) < 0.5 ? -tick : tick);
        }
        long walk  = clamp(lowerLimit, upperLimit, Math.round(prevWalk + delta));
        lastPrice.put(base.symbol(), walk);                         // 연속 워크 보존
        long price = clamp(lowerLimit, upperLimit, PriceTick.round(walk));  // 호가 단위 스냅
        long prevDiff = price - prevClose;
        double change = prevClose == 0 ? 0.0
                : Math.round(prevDiff * 1000.0 / prevClose) / 10.0;

        // 고가/저가: 당일 결정적 기준값(baseHigh/baseLow)을 시작점으로, 라이브 현재가가 돌파할 때만 확장.
        // - 누적 max/min 이므로 한 번 올라간 고가는 안 내려가고, 내려간 저가는 안 올라간다.
        // - baseHigh/baseLow 를 절대 하/상한으로 박아두어 누적 맵이 비어도(재시작) 역행하지 않는다.
        String todayKey = today.toString();
        boolean newDay = !todayKey.equals(dayKey.get(base.symbol()));
        long high, low;
        if (newDay) {
            // 새 거래일: 결정적 기준값/현재가로 초기화
            high = Math.max(baseHigh, price);
            low  = Math.min(baseLow, price);
            dayKey.put(base.symbol(), todayKey);
        } else {
            high = Math.max(dayHigh.getOrDefault(base.symbol(), baseHigh), price);
            low  = Math.min(dayLow.getOrDefault(base.symbol(),  baseLow), price);
        }
        high = Math.min(upperLimit, Math.max(high, baseHigh));   // baseHigh 하한 보장 → 고가는 절대 안 내려감
        low  = Math.max(lowerLimit, Math.min(low, baseLow));     // baseLow 상한 보장 → 저가는 절대 안 올라감
        // 실시간 화면에서 고가/저가가 눈에 띄게 갱신되도록 매 푸시마다 1틱 확률적 확장.
        // 고가는 오르기만 하고 저가는 내리기만 하므로 단조성 보장은 유지된다.
        long drift = PriceTick.tickSize(price);
        if (rand(s5) < 0.5) high = Math.min(upperLimit, high + drift);
        if (rand(s6) < 0.5) low  = Math.max(lowerLimit, low  - drift);
        dayHigh.put(base.symbol(), high);
        dayLow.put(base.symbol(), low);

        // KST 장 진행 비율(9:00~15:30) — 장중 진입 시 누적 시작값 추정용
        LocalTime nowKst  = LocalTime.now(KST);
        LocalTime openT   = LocalTime.of(9, 0);
        LocalTime closeT  = LocalTime.of(15, 30);
        double tradePct;
        if (nowKst.isBefore(openT))       tradePct = 0.05;
        else if (nowKst.isAfter(closeT))  tradePct = 1.0;
        else                               tradePct = Duration.between(openT, nowKst).toMinutes() / 390.0;

        // 체결방향: 직전 워크 대비 (상승=매수, 하락=매도)
        boolean buy = walk >= prevWalk;
        // 체결수량: 하루 거래량을 장중 2초 푸시 횟수로 분배 + 변동(×0.3~1.7)으로 독립 생성.
        double pushesPerDay = 390.0 * 60_000.0 / broadcastMs;   // 장중(390분) 푸시 횟수 ≈ 11,700
        long filledVolume = Math.max(1L, Math.round(base.volume() / pushesPerDay * (0.3 + rand(s3) * 1.4)));
        // 당일 누적 매수/매도 체결량. 거래일이 바뀌면(=장중 첫 진입) 진행률 기반으로 시작값을 추정해
        // 페이지 진입 즉시 현실적인 누적거래량을 보이게 하고, 이후 매 푸시 체결량을 누적한다.
        long buyVol, sellVol;
        if (newDay) {
            long seedVol = Math.round(base.volume() * tradePct);
            buyVol  = seedVol / 2;
            sellVol = seedVol - buyVol;
        } else {
            buyVol  = dayBuyVol.getOrDefault(base.symbol(), 0L);
            sellVol = daySellVol.getOrDefault(base.symbol(), 0L);
        }
        if (buy) buyVol += filledVolume; else sellVol += filledVolume;
        dayBuyVol.put(base.symbol(), buyVol);
        daySellVol.put(base.symbol(), sellVol);
        long volume        = buyVol + sellVol;                  // 누적거래량 = 당일 체결량 합
        long tradingAmount = volume * price / 10_000L;
        double fillStrength = sellVol == 0 ? 200.0 : Math.min(500.0, buyVol * 100.0 / sellVol);

        String date = today.format(DateTimeFormatter.BASIC_ISO_DATE);   // yyyyMMdd
        String time = nowKst.format(TIME_FMT);                          // HHmmss

        StockPriceMessage priceMsg = new StockPriceMessage(
                base.symbol(), base.name(), base.market(), date, time,
                price, prevDiff, change, volume,
                open, high, low, prevClose,
                upperLimit, lowerLimit, tradingAmount
        );
        long fillTick = PriceTick.tickSize(price);
        FilledMessage filledMsg = new FilledMessage(
                base.symbol(), time, price, prevDiff, change,
                price + fillTick, price - fillTick,
                filledVolume, fillStrength, volume
        );

        // 투자동향: 당일 외국인/개인 순매수 누적. 장중 첫 진입(newDay) 시 진행률 기반 시작값을 결정적으로
        // 추정하고, 이후 가격 방향에 따라 외국인은 추세추종(상승=매수)·개인은 역추세로 누적. 기관 = -(외국인+개인) 제로섬.
        long foreign, individual;
        if (newDay) {
            Random tr = new Random((long) base.symbol().hashCode() * 43);
            long vol = base.volume();
            foreign    = Math.round((tr.nextDouble() - 0.5) * vol * 0.4 * tradePct);
            individual = Math.round((tr.nextDouble() - 0.5) * vol * 0.6 * tradePct);
        } else {
            foreign    = dayForeign.getOrDefault(base.symbol(), 0L);
            individual = dayIndividual.getOrDefault(base.symbol(), 0L);
        }
        int  flowDir = buy ? 1 : -1;
        long flow    = Math.round(filledVolume * (0.2 + rand(s4) * 0.6));
        foreign    += flowDir * flow;         // 외국인 추세추종
        individual -= flowDir * (flow / 2);   // 개인 역추세(절반 규모)
        dayForeign.put(base.symbol(), foreign);
        dayIndividual.put(base.symbol(), individual);
        long institution = -(foreign + individual);   // 제로섬: 외국인+개인+기관 = 0
        InvestmentTrendMessage trendMsg = new InvestmentTrendMessage(
                base.symbol(), date, price, prevDiff, change,
                foreign, individual, institution, volume
        );

        // 호가: 현재가가 최우선호가에 포함되도록 생성(스프레드 1틱). 매수 우위(상승)면 현재가=매도1,
        // 매도 우위(하락)면 현재가=매수1. 잔량은 레벨별 상태를 보존하며 소폭 변동(평균회귀)해 부드럽게 변한다.
        long hogaTick = PriceTick.tickSize(price);
        long[] vols = hogaVols.computeIfAbsent(base.symbol(), StockPriceBroadcaster::initHogaVols);
        Random hr = new Random(base.price() * 41L + nowTick);
        int askBase = buy ? 0 : 1;   // 매도1 오프셋: 0이면 매도1=현재가
        int bidBase = buy ? 1 : 0;   // 매수1 오프셋: 0이면 매수1=현재가
        List<HogaEntry> asks = new ArrayList<>(10);
        List<HogaEntry> bids = new ArrayList<>(10);
        for (int i = 1; i <= 10; i++) {
            int ai = i - 1, bi = 9 + i;   // 매도1~10 = 0~9, 매수1~10 = 10~19
            vols[ai] = stepHogaVol(vols[ai], refHogaVol(base.symbol(), ai), hr);
            vols[bi] = stepHogaVol(vols[bi], refHogaVol(base.symbol(), bi), hr);
            asks.add(new HogaEntry(price + hogaTick * (askBase + i - 1), vols[ai]));
            bids.add(new HogaEntry(Math.max(hogaTick, price - hogaTick * (bidBase + i - 1)), vols[bi]));
        }
        HogaMessage hogaMsg = new HogaMessage(base.symbol(), time, asks, bids);
        return new Snapshot(priceMsg, filledMsg, trendMsg, hogaMsg);
    }
}

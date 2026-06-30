package com.innotrader.common.support;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

/**
 * 장중(분봉/체결) 합성 시세 생성기.
 *
 * <p>각 거래일의 분봉/체결은 그 날 일봉({@link MockDailySeries})의 시가→종가를 잇는
 * 브라우니안 브리지로 생성되어 일봉과 일관되며, 가장 최근 값(분봉 최신 봉 종가 · 최근 체결가)은
 * 현재가(basePrice)에 앵커된다. 반환 index 0 = 가장 최근.
 */
public final class MockIntradaySeries {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    // ZonedDateTime에 BASIC_ISO_DATE를 쓰면 "+0900" 오프셋이 붙으므로 패턴으로 명시
    private static final DateTimeFormatter D_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter T_FMT = DateTimeFormatter.ofPattern("HHmmss");

    private MockIntradaySeries() {}

    /** 분봉 한 칸. TimeChart(date, time, price, prevDiff, change, open, high, low, filledVolume, volume)로 매핑. */
    public record IntraBar(String date, String time, long close, long prevDiff, double change,
                           long open, long high, long low, long filledVolume, long cumVolume) {}

    /** 체결 한 건. FilledQuote(time, price, prevDiff, change, askPrice, bidPrice, filledVolume, fillStrength, volume)로 매핑. */
    public record Tick(String time, long price, long prevDiff, double change, long ask, long bid,
                       long filledVolume, double strength, long cumVolume) {}

    // ─── 분봉 ──────────────────────────────────────────────────────────────────

    public static List<IntraBar> minuteCandles(String symbol, long basePrice, long prevDiff, long baseVolume,
                                               int intervalMinutes, int count) {
        if (count <= 0) return List.of();
        final int OPEN_MIN  = 9 * 60;        // 09:00
        final int CLOSE_MIN = 15 * 60 + 30;  // 15:30
        int candlesPerDay = Math.max(1, 390 / intervalMinutes);
        int daysNeeded = count / candlesPerDay + 2;
        List<DailyBar> daily = MockDailySeries.generate(symbol, basePrice, prevDiff, baseVolume, daysNeeded);

        Random r = new Random((long) symbol.hashCode() * 83 + intervalMinutes);
        List<IntraBar> result = new ArrayList<>(count);

        ZonedDateTime nowKst    = ZonedDateTime.now(KST);
        int           nowMin    = nowKst.getHour() * 60 + nowKst.getMinute();
        LocalDate     todayDate = nowKst.toLocalDate();

        for (int d = 0; d < daily.size() && result.size() < count; d++) {
            DailyBar db = daily.get(d);
            long dayOpen      = db.open();
            long prevDayClose = db.close() - db.prevDiff();

            // 이 날 마지막 봉의 분(min)과 끝점 가격:
            //  - 오늘(d=0)은 현재 시각까지만 생성하고 끝점=현재가 → 미래봉 제거 + 현재가 앵커
            //  - 과거 날은 09:00~15:30 전체, 끝점=그날 종가
            int  lastMin;
            long endPrice = db.close();
            if (d == 0) {
                if (nowMin < OPEN_MIN) continue;   // 장 시작 전: 오늘 봉 없음 → 과거 날로
                lastMin = Math.min(CLOSE_MIN, nowMin) / intervalMinutes * intervalMinutes;
            } else {
                lastMin = CLOSE_MIN / intervalMinutes * intervalMinutes;
            }
            int K = (lastMin - OPEN_MIN) / intervalMinutes;   // 봉 구간 수
            if (K < 1) continue;

            // 일중 경로: 시가→끝점 연속 워크(브라우니안 브리지). 진폭은 호가단위(tick)의 2배를
            // 하한으로 보장 → 고가 종목도 봉마다 round() 에 뭉개지지 않고 틱을 가로지르며 지글거린다.
            // (sqrt(K) 정규화만으로는 봉 많은 1분봉에서 amp 가 틱보다 작아져 직선으로 눌린다.)
            long tick = PriceTick.tickSize(endPrice);
            long amp = Math.max(tick * 2, Math.round(endPrice * 0.015 / Math.sqrt(K)));
            double[] w = new double[K + 1];
            for (int k = 1; k <= K; k++) w[k] = w[k - 1] + (r.nextDouble() - 0.5);
            long[] p = new long[K + 1];
            for (int k = 0; k <= K; k++) {
                double bridge = w[k] - w[K] * ((double) k / K);
                double lin = dayOpen + (double) (endPrice - dayOpen) * k / K;
                p[k] = Math.max(100L, Math.round(lin + bridge * amp));
            }
            p[0] = dayOpen;
            p[K] = endPrice;

            // 누적 거래량 (chronological 09:00 → lastMin). 분모는 하루 전체 봉 수로 고정해
            // 장중(부분 봉)일수록 누적 거래량이 작게 나오도록 한다.
            long[] fvol = new long[K];
            long[] cumPerC = new long[K];
            long cum = 0;
            for (int c = 0; c < K; c++) {
                long fv = Math.max(1L, Math.round(baseVolume / (double) candlesPerDay * (0.5 + r.nextDouble())));
                fvol[c] = fv;
                cum += fv;
                cumPerC[c] = cum;
            }

            // 캔들: 최신(c=K-1, lastMin 봉)부터 과거로. d=0,c=K-1 → 종가 = 현재가(basePrice)
            for (int c = K - 1; c >= 0 && result.size() < count; c--) {
                long open  = PriceTick.round(p[c]);
                long close = PriceTick.round(p[c + 1]);
                // 고가/저가 = 봉 내 가격 경로의 극값. wick 진폭을 몸통 크기에 비례시켜
                // 납작한 봉(몸통 0)은 wick이 생기지 않게 한다(틱 절반짜리 고정 진폭은 무작위 ±1틱 스파이크 유발).
                long wickAmp = Math.round(Math.abs(close - open) * 0.6);
                long[] hl  = pathExtremes(open, close, wickAmp, r);
                long high  = PriceTick.round(hl[0]);
                long low   = PriceTick.round(hl[1]);
                // 봉 시작 시각 = 해당 날짜의 09:00 + c*interval
                int barMin = OPEN_MIN + c * intervalMinutes;
                ZonedDateTime t = todayDate.minusDays(d).atStartOfDay(KST).plusMinutes(barMin);
                String date = t.format(D_FMT);
                String time = t.format(T_FMT);
                long diff = close - prevDayClose;
                double chg = prevDayClose == 0 ? 0 : Math.round(diff * 1000.0 / prevDayClose) / 10.0;
                result.add(new IntraBar(date, time, close, diff, chg, open, high, low, fvol[c], cumPerC[c]));
            }
        }
        return result;
    }

    /**
     * 봉 내 가격 경로(시가→종가 서브 브리지)의 극값으로 고가/저가 산출.
     * 시가·종가를 양 끝에 고정한 브라운 브리지를 몇 점 샘플링해, 그 경로가 실제 도달한
     * 최대/최소를 고가/저가로 한다(임의 wick 가산 없음). high ≥ max(open,close), low ≤ min(open,close).
     */
    private static long[] pathExtremes(long open, long close, long amp, Random r) {
        long hi = Math.max(open, close);
        long lo = Math.min(open, close);
        final int SUB = 5;
        double[] w = new double[SUB + 1];
        for (int s = 1; s <= SUB; s++) w[s] = w[s - 1] + (r.nextDouble() - 0.5);
        for (int s = 1; s < SUB; s++) {
            double bridge = w[s] - w[SUB] * ((double) s / SUB);
            long v = Math.round(open + (double) (close - open) * s / SUB + bridge * amp);
            hi = Math.max(hi, v);
            lo = Math.min(lo, v);
        }
        return new long[]{ hi, Math.max(100L, lo) };
    }

    // ─── 체결 ──────────────────────────────────────────────────────────────────

    public static List<Tick> filledTicks(String symbol, long basePrice, long prevDiff, long baseVolume,
                                         int totalMinutes, int count, long tickUnit) {
        if (count <= 0) return List.of();
        long dayOpen = MockDailySeries.generate(symbol, basePrice, prevDiff, baseVolume, 1).get(0).open();
        long prevDayClose = basePrice - prevDiff;
        Random r = new Random((long) symbol.hashCode() * 37);

        int T = count;
        long amp = Math.max(1L, Math.round(basePrice * 0.0006));
        double[] w = new double[T];
        for (int k = 1; k < T; k++) w[k] = w[k - 1] + (r.nextDouble() - 0.5);

        // 가격: 시가 → 현재가(basePrice) 브리지. 마지막 틱 = basePrice
        long[] price = new long[T];
        for (int k = 0; k < T; k++) {
            double frac = T > 1 ? (double) k / (T - 1) : 1.0;
            double bridge = w[k] - (T > 1 ? w[T - 1] * frac : 0);
            double lin = dayOpen + (double) (basePrice - dayOpen) * frac;
            price[k] = Math.max(100L, Math.round(lin + bridge * amp));
        }
        price[0] = dayOpen;
        price[T - 1] = basePrice;

        // chronological 09:00 → 현재. 체결강도 = 누적 매수/매도 체결량 비율(%).
        // 방향은 직전 체결가 대비 up=매수/down=매도로 내부 판정(화면 비표시). 출력은 최신부터(reverse).
        List<Tick> chron = new ArrayList<>(T);
        long cum = 0, buyVol = 0, sellVol = 0;
        boolean prevBuy = true;
        for (int k = 0; k < T; k++) {
            long pr = price[k];
            long fv = Math.max(1L, Math.round(r.nextDouble() * 1000));
            cum += fv;
            boolean buy;
            if (k == 0)                  buy = pr >= dayOpen;
            else if (pr > price[k - 1])  buy = true;
            else if (pr < price[k - 1])  buy = false;
            else                          buy = prevBuy;   // 보합은 직전 방향 유지
            prevBuy = buy;
            if (buy) buyVol += fv; else sellVol += fv;
            double strength = sellVol == 0 ? 200.0 : Math.min(500.0, buyVol * 100.0 / sellVol);
            int minuteOffset = T > 1 ? (int) ((long) k * totalMinutes / (T - 1)) : 0;
            int second = r.nextInt(60);
            int mm = 9 * 60 + minuteOffset;
            String time = String.format("%02d%02d%02d", mm / 60, mm % 60, second);
            long diff = pr - prevDayClose;
            double chg = Math.round(diff * 1000.0 / (prevDayClose + 1)) / 10.0;
            chron.add(new Tick(time, pr, diff, chg, pr + tickUnit, pr - tickUnit, fv, strength, cum));
        }
        Collections.reverse(chron);
        return chron;
    }
}

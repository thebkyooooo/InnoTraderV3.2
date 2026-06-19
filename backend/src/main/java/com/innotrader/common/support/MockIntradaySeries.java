package com.innotrader.common.support;

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

    private MockIntradaySeries() {}

    /** 분봉 한 칸. TimeChart(time, price, prevDiff, change, open, high, low, filledVolume, volume)로 매핑. */
    public record IntraBar(String time, long close, long prevDiff, double change,
                           long open, long high, long low, long filledVolume, long cumVolume) {}

    /** 체결 한 건. FilledQuote(time, price, prevDiff, change, askPrice, bidPrice, filledVolume, fillStrength, volume)로 매핑. */
    public record Tick(String time, long price, long prevDiff, double change, long ask, long bid,
                       long filledVolume, double strength, long cumVolume) {}

    // ─── 분봉 ──────────────────────────────────────────────────────────────────

    public static List<IntraBar> minuteCandles(String symbol, long basePrice, long prevDiff, long baseVolume,
                                               int intervalMinutes, int count) {
        if (count <= 0) return List.of();
        int candlesPerDay = Math.max(1, 390 / intervalMinutes);
        int daysNeeded = count / candlesPerDay + 2;
        List<DailyBar> daily = MockDailySeries.generate(symbol, basePrice, prevDiff, baseVolume, daysNeeded);

        Random r = new Random((long) symbol.hashCode() * 83 + intervalMinutes);
        List<IntraBar> result = new ArrayList<>(count);

        for (int d = 0; d < daily.size() && result.size() < count; d++) {
            DailyBar db = daily.get(d);
            long dayOpen  = db.open();
            long dayClose = db.close();
            long prevDayClose = db.close() - db.prevDiff();
            long amp = Math.max(1L, Math.round(dayClose * 0.0006));
            int K = candlesPerDay;

            // 브라우니안 브리지: p[0]=시가, p[K]=종가
            double[] w = new double[K + 1];
            for (int k = 1; k <= K; k++) w[k] = w[k - 1] + (r.nextDouble() - 0.5);
            long[] p = new long[K + 1];
            for (int k = 0; k <= K; k++) {
                double bridge = w[k] - w[K] * ((double) k / K);
                double lin = dayOpen + (double) (dayClose - dayOpen) * k / K;
                p[k] = Math.max(100L, Math.round(lin + bridge * amp));
            }
            p[0] = dayOpen;
            p[K] = dayClose;

            // 누적 거래량 (chronological 09:00 → 장마감)
            long[] fvol = new long[K];
            long[] cumPerC = new long[K];
            long cum = 0;
            for (int c = 0; c < K; c++) {
                long fv = Math.max(1L, Math.round(baseVolume / (double) K * (0.5 + r.nextDouble())));
                fvol[c] = fv;
                cum += fv;
                cumPerC[c] = cum;
            }

            // 캔들: 최신(c=K-1, 장마감)부터 출력. d=0,c=K-1 → 종가 = basePrice
            for (int c = K - 1; c >= 0 && result.size() < count; c--) {
                long open  = p[c];
                long close = p[c + 1];
                long noise = Math.max(1L, Math.round(dayClose * 0.0004 * r.nextDouble()));
                long high  = Math.max(open, close) + noise;
                long low   = Math.max(100L, Math.min(open, close) - noise);
                int minFromOpen = c * intervalMinutes;
                String time = String.format("%02d%02d00", 9 + minFromOpen / 60, minFromOpen % 60);
                long diff = close - prevDayClose;
                double chg = prevDayClose == 0 ? 0 : Math.round(diff * 1000.0 / prevDayClose) / 10.0;
                result.add(new IntraBar(time, close, diff, chg, open, high, low, fvol[c], cumPerC[c]));
            }
        }
        return result;
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

        // chronological 09:00 → 현재. 출력은 최신부터 (reverse)
        List<Tick> chron = new ArrayList<>(T);
        long cum = 0;
        for (int k = 0; k < T; k++) {
            long pr = price[k];
            long fv = Math.max(1L, Math.round(r.nextDouble() * 1000));
            cum += fv;
            double strength = Math.max(0, Math.min(200, 50 + (r.nextDouble() - 0.5) * 60));
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

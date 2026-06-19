package com.innotrader.common.support;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * 일자별(일봉) 합성 시세 생성기 및 기간(주/월/년) 집계기.
 *
 * <p>일별 시세 그리드 · 차트 일봉(D) · 투자동향이 같은 종목/같은 날짜에 동일한 값을 갖도록
 * 결정적(deterministic)으로 생성한다. 주/월/년봉은 이 일봉 시리즈를 집계하여 만들므로
 * 일봉과 완전히 일관되며, 가장 최근 봉의 종가는 현재가에 앵커된다.
 *
 * <ul>
 *   <li>오늘(index 0) 종가 = 현재가(basePrice)</li>
 *   <li>어제(index 1) 종가 = 전일종가(basePrice - prevDiff) → 현재가의 전일대비와 정합</li>
 *   <li>그 이전은 랜덤워크</li>
 * </ul>
 *
 * <p>난수는 <b>단일 스트림 2개</b>(종가 체인용·바 속성용)를 한 번만 시드하고 순차적으로 뽑는다.
 * 인덱스마다 PRNG를 재시드하면 연속 seed의 첫 출력이 상관되어 추이가 매끈한 곡선이 되므로
 * 사용하지 않는다.
 */
public final class MockDailySeries {

    private MockDailySeries() {}

    /** 집계 기간. */
    public enum Period { W, M, Y }

    // ─── 일봉 ──────────────────────────────────────────────────────────────────

    public static List<DailyBar> generate(String symbol, long basePrice, long prevDiff, long baseVolume, int count) {
        if (count <= 0) return List.of();
        int h = symbol.hashCode();
        LocalDate today = LocalDate.now();

        // 종가 체인 (단일 스트림): 오늘=basePrice, 어제=전일종가, 그 이전은 랜덤워크
        Random rc = new Random((long) h * 53 + 1);
        long[] closes = new long[count + 1];
        closes[0] = basePrice;
        closes[1] = Math.max(100L, basePrice - prevDiff);
        for (int i = 2; i <= count; i++) {
            double dc = (rc.nextDouble() - 0.5) * 0.04;
            closes[i] = Math.max(100L, Math.round(closes[i - 1] * (1 + dc)));
        }

        // 바 속성 (별도 단일 스트림): 시가/고가/저가/거래량
        Random rb = new Random((long) h * 59 + 7);
        List<DailyBar> result = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            long close     = closes[i];
            long prevClose = closes[i + 1];
            long open = Math.max(100L, Math.round(prevClose * (1 + (rb.nextDouble() - 0.5) * 0.01)));
            long high = Math.max(close, open) + Math.abs(rb.nextLong() % (close / 100 + 1));
            long low  = Math.max(100L, Math.min(close, open) - Math.abs(rb.nextLong() % (close / 100 + 1)));
            long vol  = Math.max(1000L, Math.round(baseVolume * (0.5 + rb.nextDouble())));
            long diff = close - prevClose;
            double chg = prevClose == 0 ? 0 : Math.round(diff * 1000.0 / prevClose) / 10.0;
            String date = today.minusDays(i).format(DateTimeFormatter.BASIC_ISO_DATE);
            result.add(new DailyBar(date, close, diff, chg, open, high, low, vol, vol * close / 10_000L));
        }
        return result;
    }

    // ─── 주/월/년봉 (일봉 집계) ─────────────────────────────────────────────────

    private static final int MAX_DAYS = 20_000;

    public static List<DailyBar> generatePeriod(String symbol, long basePrice, long prevDiff, long baseVolume,
                                                Period period, int count) {
        if (count <= 0) return List.of();
        int daysPer = switch (period) { case W -> 7; case M -> 31; case Y -> 366; };
        int neededDays = Math.min(count * daysPer + daysPer, MAX_DAYS);
        List<DailyBar> daily = generate(symbol, basePrice, prevDiff, baseVolume, neededDays);

        // 1) 기간별 OHLCV 집계 (daily는 최신→과거 순)
        List<long[]> buckets = new ArrayList<>(); // {close, open, high, low, volume}
        List<String> dates   = new ArrayList<>();
        int i = 0, n = daily.size();
        while (i < n && buckets.size() < count) {
            String key = periodKey(daily.get(i).date(), period);
            DailyBar newest = daily.get(i);
            long close = newest.close();   // 기간 내 최신일 종가 = 기간 종가
            long high  = newest.high();
            long low   = newest.low();
            long open  = newest.open();
            long vol   = 0;
            String bucketDate = newest.date();
            int j = i;
            while (j < n && periodKey(daily.get(j).date(), period).equals(key)) {
                DailyBar d = daily.get(j);
                high = Math.max(high, d.high());
                low  = Math.min(low, d.low());
                vol += d.volume();
                open = d.open();           // 가장 과거일 시가로 수렴 = 기간 시가
                j++;
            }
            buckets.add(new long[]{close, open, high, low, vol});
            dates.add(bucketDate);
            i = j;
        }

        // 2) 전일대비/등락률 (이전=과거 버킷 종가 대비) 후 DailyBar 구성
        List<DailyBar> result = new ArrayList<>(buckets.size());
        for (int k = 0; k < buckets.size(); k++) {
            long close     = buckets.get(k)[0];
            long prevClose = (k + 1 < buckets.size()) ? buckets.get(k + 1)[0] : close;
            long open = buckets.get(k)[1], high = buckets.get(k)[2], low = buckets.get(k)[3], vol = buckets.get(k)[4];
            long diff = close - prevClose;
            double chg = prevClose == 0 ? 0 : Math.round(diff * 1000.0 / prevClose) / 10.0;
            result.add(new DailyBar(dates.get(k), close, diff, chg, open, high, low, vol, vol * close / 10_000L));
        }
        return result;
    }

    private static String periodKey(String yyyymmdd, Period p) {
        int y = Integer.parseInt(yyyymmdd.substring(0, 4));
        int m = Integer.parseInt(yyyymmdd.substring(4, 6));
        int d = Integer.parseInt(yyyymmdd.substring(6, 8));
        return switch (p) {
            case Y -> String.valueOf(y);
            case M -> y + "-" + m;
            case W -> {
                LocalDate date = LocalDate.of(y, m, d);
                WeekFields wf = WeekFields.ISO;
                yield date.get(wf.weekBasedYear()) + "-W" + date.get(wf.weekOfWeekBasedYear());
            }
        };
    }
}

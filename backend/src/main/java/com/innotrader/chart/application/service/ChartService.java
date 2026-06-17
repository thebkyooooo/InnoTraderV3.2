package com.innotrader.chart.application.service;

import com.innotrader.chart.domain.model.DailyChart;
import com.innotrader.chart.domain.model.TimeChart;
import com.innotrader.chart.domain.port.in.GetChartUseCase;
import com.innotrader.chart.domain.port.out.FindStockBasePort;
import com.innotrader.chart.domain.port.out.FindStockBasePort.StockBase;
import com.innotrader.common.annotation.UseCase;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@UseCase
public class ChartService implements GetChartUseCase {

    private static final int MAX_SIZE   = 9999;
    private static final int DAILY_POOL = 9999;
    private static final int TIME_POOL  = 9999;

    private final FindStockBasePort findStockBasePort;

    public ChartService(FindStockBasePort findStockBasePort) {
        this.findStockBasePort = findStockBasePort;
    }

    // ─── 일별 차트 ─────────────────────────────────────────────────────────────

    @Override
    public ChartPage<DailyChart> getDailyChart(String symbol, DailyType type, int size, String cursor) {
        Optional<StockBase> opt = findStockBasePort.findBySymbol(symbol);
        if (opt.isEmpty()) return new ChartPage<>(List.of(), null, false);

        int clampedSize = Math.min(size, MAX_SIZE);
        int offset      = decodeCursor(cursor);
        int pool        = poolSize(type);

        List<DailyChart> all  = buildDailyItems(opt.get(), type, pool);
        List<DailyChart> page = slice(all, offset, clampedSize);
        boolean hasNext       = offset + clampedSize < all.size();

        return new ChartPage<>(page, hasNext ? encodeCursor(offset + clampedSize) : null, hasNext);
    }

    // ─── 분별 차트 ─────────────────────────────────────────────────────────────

    @Override
    public ChartPage<TimeChart> getTimeChart(String symbol, TimeType type, int size, String cursor) {
        Optional<StockBase> opt = findStockBasePort.findBySymbol(symbol);
        if (opt.isEmpty()) return new ChartPage<>(List.of(), null, false);

        int clampedSize = Math.min(size, MAX_SIZE);
        int offset      = decodeCursor(cursor);

        List<TimeChart> all  = buildTimeItems(opt.get(), type);
        List<TimeChart> page = slice(all, offset, clampedSize);
        boolean hasNext      = offset + clampedSize < all.size();

        return new ChartPage<>(page, hasNext ? encodeCursor(offset + clampedSize) : null, hasNext);
    }

    // ─── 일별 데이터 생성 ───────────────────────────────────────────────────────

    private List<DailyChart> buildDailyItems(StockBase base, DailyType type, int count) {
        Random rng = new Random((long) base.symbol().hashCode() * 53 + type.ordinal());
        LocalDate today = LocalDate.now();
        List<DailyChart> result = new ArrayList<>(count);

        long prevClose = base.price() - base.prevDiff();

        for (int i = 0; i < count; i++) {
            String date = dateStr(today, type, i);
            long price  = Math.max(100, Math.round(prevClose * (1 + (rng.nextDouble() - 0.5) * volatility(type))));
            long open   = Math.max(100, Math.round(prevClose * (1 + (rng.nextDouble() - 0.5) * 0.01)));
            long high   = Math.max(price, open) + Math.round(price * 0.005);
            long low    = Math.max(100, Math.min(price, open) - Math.round(price * 0.005));
            long vol    = Math.round(base.volume() * (0.5 + rng.nextDouble()) * volMultiplier(type));
            long diff   = price - prevClose;
            double change = Math.round(diff * 1000.0 / (prevClose + 1)) / 10.0;

            result.add(new DailyChart(date, price, diff, change, open, high, low, vol, vol * price / 10_000L));
            prevClose = price;
        }
        return result;
    }

    private String dateStr(LocalDate today, DailyType type, int i) {
        LocalDate d = switch (type) {
            case D -> today.minusDays(i);
            case W -> today.minusWeeks(i);
            case M -> today.minusMonths(i).withDayOfMonth(1);
            case Y -> today.minusYears(i).withDayOfYear(1);
        };
        return d.toString().replace("-", "");
    }

    private double volatility(DailyType type) {
        return switch (type) {
            case D -> 0.03;
            case W -> 0.07;
            case M -> 0.15;
            case Y -> 0.30;
        };
    }

    private double volMultiplier(DailyType type) {
        return switch (type) {
            case D -> 1.0;
            case W -> 5.0;
            case M -> 22.0;
            case Y -> 252.0;
        };
    }

    private int poolSize(DailyType type) {
        return switch (type) {
            case D -> DAILY_POOL;
            case W -> 2600;
            case M -> 600;
            case Y -> 47;
        };
    }

    // ─── 분별 데이터 생성 ───────────────────────────────────────────────────────

    private List<TimeChart> buildTimeItems(StockBase base, TimeType type) {
        Random rng = new Random((long) base.symbol().hashCode() * 59 + type.minutes);
        int candlesPerDay  = 390 / type.minutes;
        long prevDayClose  = base.price() - base.prevDiff();
        long cumVol        = 0;
        List<TimeChart> result = new ArrayList<>(TIME_POOL);

        for (int i = 0; i < TIME_POOL; i++) {
            int candleInDay    = i % candlesPerDay;
            // 가장 최근 캔들(i=0)이 15:30에 가장 가까운 캔들 → 역순 배치
            int minFromOpen    = (candlesPerDay - 1 - candleInDay) * type.minutes;
            String time        = String.format("%02d%02d00", 9 + minFromOpen / 60, minFromOpen % 60);

            long price       = Math.max(100, Math.round(base.price() * (1 + (rng.nextDouble() - 0.5) * 0.004)));
            long open        = Math.max(100, Math.round(price * (1 + (rng.nextDouble() - 0.5) * 0.002)));
            long high        = Math.max(price, open) + Math.round(price * 0.002);
            long low         = Math.max(100, Math.min(price, open) - Math.round(price * 0.002));
            long filledVol   = Math.max(1, Math.round(rng.nextDouble() * base.volume() / candlesPerDay * 2));
            if (candleInDay == 0) cumVol = 0;
            cumVol += filledVol;

            long diff     = price - prevDayClose;
            double change = Math.round(diff * 1000.0 / (prevDayClose + 1)) / 10.0;

            result.add(new TimeChart(time, price, diff, change, open, high, low, filledVol, cumVol));
        }
        return result;
    }

    // ─── 유틸 ──────────────────────────────────────────────────────────────────

    private static <T> List<T> slice(List<T> list, int offset, int size) {
        int from = Math.min(offset, list.size());
        int to   = Math.min(offset + size, list.size());
        return list.subList(from, to);
    }

    private static int decodeCursor(String cursor) {
        if (cursor == null) return 0;
        try { return Integer.parseInt(new String(Base64.getDecoder().decode(cursor))); }
        catch (Exception e) { return 0; }
    }

    private static String encodeCursor(int offset) {
        return Base64.getEncoder().encodeToString(String.valueOf(offset).getBytes());
    }
}

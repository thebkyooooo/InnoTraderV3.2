package com.innotrader.chart.application.service;

import com.innotrader.chart.domain.model.DailyChart;
import com.innotrader.chart.domain.model.TimeChart;
import com.innotrader.common.support.DailyBar;
import com.innotrader.common.support.MockDailySeries;
import com.innotrader.common.support.MockIntradaySeries;
import com.innotrader.chart.domain.port.in.GetChartUseCase;
import com.innotrader.chart.domain.port.out.FindStockBasePort;
import com.innotrader.chart.domain.port.out.FindStockBasePort.StockBase;
import com.innotrader.common.annotation.UseCase;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

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
        // 일봉(D)은 공통 시리즈를, 주/월/년봉은 그 일봉을 집계해 사용한다.
        List<DailyBar> bars = (type == DailyType.D)
                ? MockDailySeries.generate(base.symbol(), base.price(), base.prevDiff(), base.volume(), count)
                : MockDailySeries.generatePeriod(base.symbol(), base.price(), base.prevDiff(), base.volume(),
                                                 toPeriod(type), count);
        List<DailyChart> result = new ArrayList<>(bars.size());
        for (DailyBar b : bars) {
            result.add(new DailyChart(
                    b.date(), b.close(), b.prevDiff(), b.change(),
                    b.open(), b.high(), b.low(), b.volume(), b.turnoverMan()
            ));
        }
        return result;
    }

    private MockDailySeries.Period toPeriod(DailyType type) {
        return switch (type) {
            case W -> MockDailySeries.Period.W;
            case M -> MockDailySeries.Period.M;
            case Y -> MockDailySeries.Period.Y;
            case D -> throw new IllegalArgumentException("D는 일봉 생성기를 사용");
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
        // 분봉은 일봉(시가→종가) 브리지로 생성되어 일봉과 일관되며 최신 봉 종가 = 현재가
        List<MockIntradaySeries.IntraBar> bars = MockIntradaySeries.minuteCandles(
                base.symbol(), base.price(), base.prevDiff(), base.volume(), type.minutes, TIME_POOL);
        List<TimeChart> result = new ArrayList<>(bars.size());
        for (MockIntradaySeries.IntraBar b : bars) {
            result.add(new TimeChart(
                    b.time(), b.close(), b.prevDiff(), b.change(),
                    b.open(), b.high(), b.low(), b.filledVolume(), b.cumVolume()
            ));
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

package com.innotrader.chart.domain.port.in;

import com.innotrader.chart.domain.model.DailyChart;
import com.innotrader.chart.domain.model.TimeChart;

import java.util.List;
import java.util.function.Function;

public interface GetChartUseCase {

    enum DailyType { D, W, M, Y }

    enum TimeType {
        MIN1(1), MIN5(5), MIN10(10), MIN30(30), MIN60(60);

        public final int minutes;
        TimeType(int minutes) { this.minutes = minutes; }

        public static TimeType of(int minutes) {
            for (TimeType t : values()) if (t.minutes == minutes) return t;
            return MIN1;
        }
    }

    record ChartPage<T>(List<T> items, String nextCursor, boolean hasNext) {
        public <R> ChartPage<R> map(Function<T, R> fn) {
            return new ChartPage<>(items.stream().map(fn).toList(), nextCursor, hasNext);
        }
    }

    ChartPage<DailyChart> getDailyChart(String symbol, DailyType type, int size, String cursor);
    ChartPage<TimeChart>  getTimeChart(String symbol, TimeType type, int size, String cursor);
}
